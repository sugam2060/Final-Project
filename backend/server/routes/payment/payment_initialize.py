"""
Payment initialization routes for eSewa payment gateway integration.
"""
"""
Payment initialization routes for eSewa payment gateway integration.
"""
import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from routes.auth.get_current_user import get_current_user
from utils.payment_utils import generate_esewa_signature
from database.schema import User, Plan
from database.db import get_session
from config import settings
from .payment_utils import build_callback_urls
from pydantics.payment_types import PaymentInitRequest, PaymentInitResponse

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"]
)


# -----------------------------
# Endpoints
# -----------------------------
@router.post("/initiate", response_model=PaymentInitResponse)
async def initiate_payment(
    payload: PaymentInitRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Initiate eSewa payment for a subscription plan.
    
    This endpoint:
    1. Validates the requested plan exists and is active
    2. Generates a unique transaction UUID
    3. Creates payment signature for eSewa
    4. Builds callback URLs for success/failure
    5. Returns payment form data for frontend submission
    
    Args:
        payload: Payment initiation request with plan name
        user: Current authenticated user
        session: Database session
        
    Returns:
        PaymentInitResponse: Payment form data including URL and parameters
        
    Raises:
        HTTPException: 404 if plan not found or inactive
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
    
    # Build callback URLs using utility
    success_url, failure_url = build_callback_urls(
        transaction_uuid=transaction_uuid,
        plan=payload.plan.value,
        user_id=user.id
    )

    # Return payment form data
    return PaymentInitResponse(
        url=settings.ESEWA_INITIATE_URL,
        parameters={
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
    )