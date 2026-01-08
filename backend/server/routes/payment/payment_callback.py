import uuid
import json
import base64
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

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment Callback"]
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
        ref_id = None
        total_amount = None
        
        if data:
            # Decode base64 response (preferred method)
            try:
                decoded_bytes = base64.b64decode(data)
                decoded_json = json.loads(decoded_bytes.decode('utf-8'))
                transaction_uuid = decoded_json.get('transaction_uuid') or transaction_uuid
                total_amount = decoded_json.get('total_amount')
                ref_id = decoded_json.get('ref_id')
            except Exception as e:
                logger.error(f"Error decoding base64 response: {str(e)}")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/?payment=failed&error=invalid_response"
                )
        
        # Validate transaction_uuid exists
        if not transaction_uuid:
            logger.error("Missing transaction_uuid in callback")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/?payment=failed&error=missing_transaction"
            )
        
        # 2. Extract user_id from transaction_uuid (format: user_id_uuid)
        try:
            user_uuid_str = transaction_uuid.split('_')[0]
            user_uuid = uuid.UUID(user_uuid_str)
        except (IndexError, ValueError):
            # Fallback to user_id from query parameter
            if not user_id:
                logger.error("Cannot extract user_id from transaction_uuid and no user_id in query")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/?payment=failed&error=user_not_found"
                )
            try:
                user_uuid = uuid.UUID(user_id)
            except ValueError:
                logger.error(f"Invalid user_id format: {user_id}")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/?payment=failed&error=invalid_user"
                )
        
        # 3. Validate plan parameter
        if not plan:
            logger.error("Plan not specified in callback")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/?payment=failed&error=plan_not_found"
            )
        
        try:
            plan_enum = UserPlan(plan)
        except ValueError:
            logger.error(f"Invalid plan name: {plan}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/?payment=failed&error=invalid_plan"
            )
        
        # 4. Fetch user and plan from database
        stmt_user = select(User).where(User.id == user_uuid)
        stmt_plan = select(Plan).where(
            Plan.plan_name == plan_enum,
            Plan.is_active == True
        )
        
        result_user = await session.execute(stmt_user)
        result_plan = await session.execute(stmt_plan)
        user = result_user.scalar_one_or_none()
        purchased_plan = result_plan.scalar_one_or_none()
        
        if not user:
            logger.error(f"User not found: {user_uuid}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/?payment=failed&error=user_not_found"
            )
        
        if not purchased_plan:
            logger.error(f"Plan not found: {plan_enum}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/?payment=failed&error=plan_not_found"
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
                success_url = f"{settings.FRONTEND_URL}/?payment=success&refId={verified_ref_id or 'N/A'}"
                return RedirectResponse(url=success_url, status_code=302)
                
            except Exception as db_error:
                logger.error(f"Database error processing payment: {str(db_error)}")
                return RedirectResponse(
                    url=f"{settings.FRONTEND_URL}/?payment=failed&error=database_error"
                )
        
        else:
            # Payment not completed
            logger.warning(f"Payment status not COMPLETE: {payment_status}")
            failure_url = f"{settings.FRONTEND_URL}/?payment=failed&status={payment_status}"
            return RedirectResponse(url=failure_url, status_code=302)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in payment callback: {str(e)}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?payment=failed&error=processing_error"
        )


@router.get("/failure")
async def payment_failure(
    transaction_uuid: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session)
):
    """
    Handle eSewa payment failure callback.
    
    This is called when user cancels payment or payment fails.
    """
    logger.info(f"Payment failure callback - Transaction UUID: {transaction_uuid}")
    
    failure_url = f"{settings.FRONTEND_URL}/?payment=failed&reason=user_cancelled"
    return RedirectResponse(url=failure_url, status_code=302)