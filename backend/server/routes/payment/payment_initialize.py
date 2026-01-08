import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from routes.auth.get_current_user import get_current_user
from utils.payment_utils import generate_esewa_signature
from database.schema import User, Plan, UserPlan
from database.db import get_session
from config import settings

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"]
)


class PaymentInitRequest(BaseModel):
    plan: UserPlan  # Plan name (standard or premium)


@router.post("/initiate")
async def initiate_payment(
    payload: PaymentInitRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Initiate eSewa payment for a subscription plan.
    
    Fetches plan details from database and prepares payment form data.
    """
    # Fetch plan from database
    stmt = select(Plan).where(
        Plan.plan_name == payload.plan,
        Plan.is_active == True
    )
    result = await session.execute(stmt)
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{payload.plan.value}' not found or inactive"
        )
    
    # Prepare payment details
    total_amount = str(plan.price)
    transaction_uuid = f"{user.id}_{uuid.uuid4()}"  # User ID included for tracking
    
    # Generate signature
    signature = generate_esewa_signature(
        str(settings.ESEWA_SECRET_KEY),
        total_amount,
        transaction_uuid,
        settings.ESEWA_PRODUCT_CODE
    )
    
    # Build callback URLs
    callback_params = f"transaction_uuid={transaction_uuid}&plan={payload.plan.value}&user_id={user.id}"
    success_url = f"{settings.BACKEND_URL}/api/payment/callback?{callback_params}"
    failure_url = f"{settings.BACKEND_URL}/api/payment/failure?{callback_params}"

    # Return payment form data
    return {
        "url": settings.ESEWA_INITIATE_URL,
        "parameters": {
            "amount": total_amount,
            "tax_amount": "0",
            "total_amount": total_amount,
            "transaction_uuid": transaction_uuid,
            "product_code": settings.ESEWA_PRODUCT_CODE,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": success_url,
            "failure_url": failure_url,
            "signed_field_names": "total_amount,transaction_uuid,product_code",
            "signature": signature
        }
    }