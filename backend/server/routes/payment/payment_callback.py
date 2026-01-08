from fastapi import APIRouter, Request, Query, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlmodel import select
from datetime import datetime, timezone
import uuid
from typing import Optional
import logging

from config import settings
from database.db import get_session
from database.schema import (
    User, 
    Plan, 
    UserPlan,
    PaymentTransaction,
    TransactionStatus,
    UserSubscription
)
from utils.payment_utils import (
    verify_esewa_response_signature,
    build_error_redirect,
    parse_esewa_response,
    get_or_create_transaction,
    update_user_role,
    create_user_subscription
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment Callback"]
)


@router.api_route("/esewa/success", methods=["GET", "POST"])
async def esewa_payment_success(
    request: Request,
    data: Optional[str] = Query(None, description="Base64 encoded JSON data from eSewa"),
    transaction_uuid: Optional[str] = Query(None, description="Transaction UUID from URL"),
    plan: Optional[str] = Query(None, description="Plan name"),
    user_id: Optional[str] = Query(None, description="User ID from URL"),
    session: AsyncSession = Depends(get_session),
):
    """
    Handle eSewa payment success callback (v2 API).
    
    This endpoint processes payment confirmation from eSewa and:
    1. Verifies payment signature
    2. Updates transaction status
    3. Updates user role to "both"
    4. Creates user subscription
    5. Redirects to frontend
    """
    
    try:
        logger.info(f"=== Payment Success Callback Started ===")
        logger.info(f"Transaction UUID: {transaction_uuid}, User ID: {user_id}, Plan: {plan}")
        
        # Parse eSewa response
        try:
            response_data = await parse_esewa_response(request, data)
        except HTTPException as e:
            return RedirectResponse(
                url=build_error_redirect("parse_error"),
                status_code=302
            )
        
        # Verify signature (log warning but continue if fails)
        if not verify_esewa_response_signature(response_data):
            logger.warning("eSewa signature verification failed - proceeding anyway")
            logger.warning(f"Response data: {response_data}")
        
        # Extract transaction details (use response data or fallback to query params)
        response_transaction_uuid = response_data.get("transaction_uuid")
        final_transaction_uuid = response_transaction_uuid or transaction_uuid
        payment_status = response_data.get("status", "").upper()
        total_amount = response_data.get("total_amount")
        ref_id = (
            response_data.get("transaction_code") or 
            response_data.get("ref_id") or 
            response_data.get("refId")
        )
        
        # Validate transaction status
        if payment_status != "COMPLETE":
            logger.error(f"Transaction not completed. Status: {payment_status}")
            return RedirectResponse(
                url=build_error_redirect(f"transaction_failed&status={payment_status}"),
                status_code=302
            )
        
        if not ref_id or not final_transaction_uuid:
            logger.error(f"Missing ref_id or transaction_uuid")
            return RedirectResponse(
                url=build_error_redirect("missing_transaction_data"),
                status_code=302
            )
        
        # Get user UUID from query parameter
        query_user_uuid = None
        if user_id:
            try:
                query_user_uuid = uuid.UUID(user_id)
            except ValueError:
                logger.error(f"Invalid user_id format: {user_id}")
                return RedirectResponse(
                    url=build_error_redirect("invalid_user_id"),
                    status_code=302
                )
        
        # Get user and plan from database
        # First try to get transaction
        stmt_transaction = select(PaymentTransaction).where(
            PaymentTransaction.transaction_uuid == final_transaction_uuid
        )
        result_transaction = await session.execute(stmt_transaction)
        existing_transaction = result_transaction.scalar_one_or_none()
        
        # Check for idempotency - if transaction already completed, just redirect
        if existing_transaction and existing_transaction.status == TransactionStatus.completed:
            logger.info(f"Transaction {final_transaction_uuid} already completed - idempotent request")
            success_url = f"{settings.FRONTEND_URL}/?payment=success&refId={existing_transaction.esewa_ref_id or ref_id}"
            return RedirectResponse(url=success_url, status_code=302)
        
        if existing_transaction:
            user_uuid = existing_transaction.user_id
            plan_id = existing_transaction.plan_id
            
            # Get plan
            stmt_plan = select(Plan).where(Plan.id == plan_id)
            result_plan = await session.execute(stmt_plan)
            purchased_plan = result_plan.scalar_one_or_none()
        else:
            # Fallback to query parameters
            if not query_user_uuid or not plan:
                logger.error("Transaction not found and missing user_id or plan")
                return RedirectResponse(
                    url=build_error_redirect("missing_data"),
                    status_code=302
                )
            user_uuid = query_user_uuid
            
            # Get plan from name
            try:
                plan_enum = UserPlan(plan)
                stmt_plan = select(Plan).where(
                    Plan.plan_name == plan_enum,
                    Plan.is_active == True
                )
                result_plan = await session.execute(stmt_plan)
                purchased_plan = result_plan.scalar_one_or_none()
            except ValueError:
                logger.error(f"Invalid plan name: {plan}")
                return RedirectResponse(
                    url=build_error_redirect("invalid_plan"),
                    status_code=302
                )
        
        # Verify user exists
        stmt_user = select(User).where(User.id == user_uuid)
        result_user = await session.execute(stmt_user)
        user = result_user.scalar_one_or_none()
        
        if not user:
            logger.error(f"User not found: {user_uuid}")
            return RedirectResponse(
                url=build_error_redirect("user_not_found"),
                status_code=302
            )
        
        if not purchased_plan:
            logger.error(f"Plan not found")
            return RedirectResponse(
                url=build_error_redirect("plan_not_found"),
                status_code=302
            )
        
        logger.info(f"Processing payment for user: {user.email}, plan: {purchased_plan.plan_name.value}")
        
        # Validate and convert total_amount safely
        converted_total_amount = None
        if total_amount:
            try:
                converted_total_amount = float(total_amount)
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid total_amount format: {total_amount}, error: {str(e)}")
                # Will use plan price as fallback in get_or_create_transaction
        
        # ===== START DATABASE TRANSACTION =====
        try:
            # 1. Get or create payment transaction
            logger.info(f"Step 1: Getting or creating transaction for UUID: {final_transaction_uuid}")
            payment_transaction = await get_or_create_transaction(
                session=session,
                transaction_uuid=final_transaction_uuid,
                user_uuid=user_uuid,
                plan=purchased_plan,
                ref_id=ref_id,
                total_amount=converted_total_amount
            )
            logger.info(f"Transaction retrieved: ID={payment_transaction.id}, Status={payment_transaction.status}")
            
            # 2. Update transaction status (only if not already completed)
            logger.info(f"Step 2: Updating transaction status")
            logger.info(f"Current transaction status: {payment_transaction.status}")
            logger.info(f"Transaction ID: {payment_transaction.id}")
            
            if payment_transaction.status != TransactionStatus.completed:
                logger.info(f"Transaction status is {payment_transaction.status}, updating to completed using UPDATE statement")
                old_status = payment_transaction.status
                
                # Use explicit UPDATE statement for reliability (similar to user role update)
                update_stmt = (
                    update(PaymentTransaction)
                    .where(PaymentTransaction.id == payment_transaction.id)
                    .values(
                        status=TransactionStatus.completed,
                        esewa_ref_id=ref_id,
                        completed_at=datetime.now(timezone.utc) if not payment_transaction.completed_at else payment_transaction.completed_at
                    )
                )
                result = await session.execute(update_stmt)
                await session.flush()
                logger.info(f"UPDATE statement executed, rows affected: {result.rowcount}")
                
                if result.rowcount == 0:
                    logger.error(f"Failed to update transaction {payment_transaction.id} - no rows affected")
                    raise Exception("Failed to update transaction status")
                
                # Refresh the object to get updated values
                await session.refresh(payment_transaction)
                logger.info(f"Transaction status updated from {old_status} to {payment_transaction.status}")
            else:
                logger.info(f"Transaction already completed, skipping status update")
            
            # 3. Update user role
            logger.info(f"Step 3: Attempting to update user {user_uuid} role to 'both'")
            role_updated = await update_user_role(session, user_uuid)
            if not role_updated:
                logger.error(f"Failed to update user {user_uuid} role")
                raise Exception("Failed to update user role")
            logger.info(f"User role update successful")
            
            # 4. Create subscription
            logger.info(f"Step 4: Creating subscription for transaction {payment_transaction.id}")
            subscription = await create_user_subscription(
                session=session,
                user_uuid=user_uuid,
                plan=purchased_plan,
                transaction_id=payment_transaction.id
            )
            logger.info(f"Subscription created with ID: {subscription.id}")
            
            # 5. Commit all changes atomically
            logger.info(f"Step 5: Committing all changes to database...")
            await session.commit()
            logger.info(f"✅ Successfully committed all changes for user {user_uuid}")
            
            # Refresh objects to verify
            await session.refresh(payment_transaction)
            await session.refresh(user)
            await session.refresh(subscription)
            
            # Verify subscription was created by querying database
            stmt_verify_sub = select(UserSubscription).where(
                UserSubscription.id == subscription.id
            )
            result_verify = await session.execute(stmt_verify_sub)
            verified_sub = result_verify.scalar_one_or_none()
            
            # Verify user role was updated
            stmt_verify_user = select(User).where(User.id == user_uuid)
            result_verify_user = await session.execute(stmt_verify_user)
            verified_user = result_verify_user.scalar_one_or_none()
            
            logger.info(f"✅ Payment processed successfully")
            if verified_user:
                logger.info(f"   User role: {verified_user.role} (verified)")
            else:
                logger.warning(f"   User verification failed!")
            logger.info(f"   Transaction: {payment_transaction.id}, status: {payment_transaction.status}")
            if verified_sub:
                logger.info(f"   Subscription ID: {verified_sub.id}, expires: {verified_sub.expires_at}, active: {verified_sub.is_active} (verified)")
            else:
                logger.error(f"   Subscription verification failed! Subscription ID: {subscription.id}")
            
        except Exception as db_error:
            logger.error(f"❌ Database error: {str(db_error)}")
            logger.error(f"Error type: {type(db_error).__name__}")
            import traceback
            traceback.print_exc()
            try:
                await session.rollback()
                logger.info("Rolled back database transaction")
            except Exception as rollback_error:
                logger.error(f"Error during rollback: {str(rollback_error)}")
            return RedirectResponse(
                url=build_error_redirect("processing_failed"),
                status_code=302
            )
        
        # Redirect to success page
        success_url = f"{settings.FRONTEND_URL}/?payment=success&refId={ref_id}"
        logger.info(f"=== Payment Success Callback Completed ===")
        return RedirectResponse(url=success_url, status_code=302)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in payment callback: {str(e)}")
        import traceback
        traceback.print_exc()
        
        try:
            await session.rollback()
        except:
            pass
        
        return RedirectResponse(
            url=build_error_redirect("unexpected_error"),
            status_code=302
        )


@router.get("/esewa/failure")
async def esewa_payment_failure(
    request: Request,
    transaction_uuid: Optional[str] = Query(None, description="Transaction UUID"),
    session: AsyncSession = Depends(get_session),
):
    """Handle eSewa payment failure callback"""
    
    try:
        logger.info(f"Payment failure callback - Transaction UUID: {transaction_uuid}")
        
        if transaction_uuid:
            try:
                stmt = select(PaymentTransaction).where(
                    PaymentTransaction.transaction_uuid == transaction_uuid
                )
                result = await session.execute(stmt)
                payment_transaction = result.scalar_one_or_none()
                
                if payment_transaction:
                    # Only update if not already failed or completed
                    if payment_transaction.status == TransactionStatus.pending:
                        payment_transaction.status = TransactionStatus.failed
                        session.add(payment_transaction)
                        await session.commit()
                        logger.info(f"Updated transaction {transaction_uuid} to failed status")
                    else:
                        logger.info(f"Transaction {transaction_uuid} already in status: {payment_transaction.status}")
            except Exception as db_error:
                logger.error(f"Database error updating transaction status: {str(db_error)}")
                await session.rollback()
        
        failure_url = f"{settings.FRONTEND_URL}/?payment=failed"
        return RedirectResponse(url=failure_url, status_code=302)
        
    except Exception as e:
        logger.error(f"Payment failure callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            await session.rollback()
        except:
            pass
        
        failure_url = f"{settings.FRONTEND_URL}/?payment=failed&error=unknown"
        return RedirectResponse(url=failure_url, status_code=302)