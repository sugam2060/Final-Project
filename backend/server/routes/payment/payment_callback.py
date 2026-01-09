"""
Payment callback routes for handling eSewa payment gateway responses.
"""
import asyncio
import logging
from fastapi import APIRouter, Query, HTTPException, Depends, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Optional

from database.db import get_session
from database.schema import User, Plan, UserPlan
from config import settings
from utils.payment_utils import (
    verify_payment_status,
    process_payment_success
)
from .payment_utils import (
    parse_payment_data,
    extract_user_uuid,
    validate_plan,
    build_frontend_redirect_url
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"]
)


@router.get("/callback")
async def payment_callback(
    data: Optional[str] = Query(None, description="Base64 encoded JSON data from eSewa"),
    transaction_uuid: Optional[str] = Query(None, description="Transaction UUID from URL"),
    plan: Optional[str] = Query(None, description="Plan name"),
    user_id: Optional[str] = Query(None, description="User ID from URL"),
    session: AsyncSession = Depends(get_session)
):
    """
    Handle eSewa payment success callback.
    
    eSewa can send payment data in two ways:
    1. Base64 encoded JSON in 'data' query parameter (recommended)
    2. Individual query parameters (fallback)
    
    This endpoint:
    1. Decodes the payment response
    2. Verifies payment status using eSewa Status Check API
    3. Updates user subscription in database
    4. Updates user role if needed
    5. Redirects to frontend success/failure page
    """
    logger.info("Payment callback received")
    
    try:
        # 1. Parse payment response
        try:
            parsed_transaction_uuid, total_amount, ref_id = parse_payment_data(
                data, transaction_uuid, user_id
            )
            transaction_uuid = parsed_transaction_uuid
        except ValueError as e:
            logger.error(f"Error parsing payment data: {str(e)}")
            return RedirectResponse(
                url=build_frontend_redirect_url("failed", error="invalid_response")
            )
        
        # Validate transaction_uuid exists
        if not transaction_uuid:
            logger.error("Missing transaction_uuid in callback")
            return RedirectResponse(
                url=build_frontend_redirect_url("failed", error="missing_transaction")
            )
        
        # 2. Extract user UUID
        try:
            user_uuid = extract_user_uuid(transaction_uuid, user_id)
        except ValueError as e:
            logger.error(f"Error extracting user UUID: {str(e)}")
            return RedirectResponse(
                url=build_frontend_redirect_url("failed", error="user_not_found")
            )
        
        # 3. Validate plan parameter
        try:
            plan_enum = validate_plan(plan)
        except ValueError as e:
            logger.error(f"Error validating plan: {str(e)}")
            return RedirectResponse(
                url=build_frontend_redirect_url("failed", error="invalid_plan")
            )
        
        # 4. Fetch user and plan from database (parallel queries)
        stmt_user = select(User).where(User.id == user_uuid)
        stmt_plan = select(Plan).where(
            Plan.plan_name == plan_enum,
            Plan.is_active == True
        )
        
        # Execute queries in parallel (they're independent)
        result_user, result_plan = await asyncio.gather(
            session.execute(stmt_user),
            session.execute(stmt_plan)
        )
        user = result_user.scalar_one_or_none()
        purchased_plan = result_plan.scalar_one_or_none()
        
        if not user:
            logger.error(f"User not found: {user_uuid}")
            return RedirectResponse(
                url=build_frontend_redirect_url("failed", error="user_not_found")
            )
        
        if not purchased_plan:
            logger.error(f"Plan not found: {plan_enum}")
            return RedirectResponse(
                url=build_frontend_redirect_url("failed", error="plan_not_found")
            )
        
        # 5. Verify payment status with eSewa Status Check API
        # This is the recommended way to verify transactions (per eSewa docs)
        if not total_amount:
            total_amount = str(purchased_plan.price)
        
        verification_data = await verify_payment_status(
            transaction_uuid=transaction_uuid,
            total_amount=total_amount,
            product_code=settings.ESEWA_PRODUCT_CODE
        )
        
        payment_status = verification_data.get("status", "").upper()
        verified_ref_id = verification_data.get("ref_id") or ref_id
        
        # 6. Process payment based on verified status
        if payment_status == "COMPLETE":
            try:
                # Process successful payment: update user role and create subscription
                new_subscription = await process_payment_success(
                    session=session,
                    user_uuid=user_uuid,
                    plan=purchased_plan
                )
                
                logger.info(f"Payment processed: subscription {new_subscription.id} for user {user_uuid}")
                
                # Redirect to success page
                success_url = build_frontend_redirect_url(
                    "success",
                    ref_id=verified_ref_id or 'N/A'
                )
                return RedirectResponse(url=success_url, status_code=302)
                
            except Exception as db_error:
                logger.error(f"Database error processing payment: {str(db_error)}")
                return RedirectResponse(
                    url=build_frontend_redirect_url("failed", error="database_error")
                )
        
        else:
            # Payment not completed
            logger.warning(f"Payment status not COMPLETE: {payment_status}")
            failure_url = build_frontend_redirect_url("failed", error=payment_status)
            return RedirectResponse(url=failure_url, status_code=302)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in payment callback: {str(e)}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(
            url=build_frontend_redirect_url("failed", error="processing_error")
        )


@router.get("/failure")
async def payment_failure(
    transaction_uuid: Optional[str] = Query(None, description="Transaction UUID"),
    user_id: Optional[str] = Query(None, description="User ID"),
    session: AsyncSession = Depends(get_session)
):
    """
    Handle eSewa payment failure callback.
    
    This is called when user cancels payment or payment fails.
    Logs the failure and redirects to frontend with failure status.
    
    Args:
        transaction_uuid: Transaction UUID (optional)
        user_id: User ID (optional)
        session: Database session
        
    Returns:
        RedirectResponse: Redirects to frontend with failure status
    """
    logger.info(f"Payment failure callback - Transaction UUID: {transaction_uuid}, User ID: {user_id}")
    
    failure_url = build_frontend_redirect_url("failed", reason="user_cancelled")
    return RedirectResponse(url=failure_url, status_code=302)