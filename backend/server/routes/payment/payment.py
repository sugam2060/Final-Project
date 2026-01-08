from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid
import logging
from typing import Optional

from config import settings
from database.db import get_session
from database.schema import (
    User, 
    Plan, 
    PaymentTransaction,
    TransactionStatus,
    UserSubscription
)
from routes.auth.get_current_user import get_current_user
from pydantics.paymentTypes import (
    PaymentInitiateRequest, 
    PaymentInitiateResponse,
    TransactionStatusRequest,
    TransactionStatusResponse
)
from utils.payment_utils import (
    generate_esewa_signature,
    check_esewa_transaction_status
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"]
)


# -----------------------------
# Payment Initiation
# -----------------------------
@router.post("/esewa/initiate", response_model=PaymentInitiateResponse)
async def initiate_esewa_payment(
    request: PaymentInitiateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Initiate eSewa payment for subscription plan upgrade.
    
    This endpoint:
    1. Fetches plan details from the database
    2. Validates requested amount against plan price
    3. Creates a payment transaction
    4. Generates payment URL with eSewa
    5. Returns payment URL for frontend redirect
    """
    # 1. Load plan from database
    stmt = select(Plan).where(Plan.plan_name == request.plan, Plan.is_active == True)
    result = await session.execute(stmt)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected plan is invalid or inactive",
        )

    # 2. Validate amount against plan price (server is source of truth)
    plan_amount = float(plan.price)
    if abs(request.amount - plan_amount) > 1e-6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount for selected plan",
        )

    # 3. Check if user already has an active subscription
    stmt_existing_sub = select(UserSubscription).where(
        UserSubscription.user_id == user.id,
        UserSubscription.is_active == True
    )
    result_existing_sub = await session.execute(stmt_existing_sub)
    existing_subscription = result_existing_sub.scalar_one_or_none()
    
    if existing_subscription:
        logger.warning(f"User {user.id} already has an active subscription")
        # Optionally: Allow upgrade or return error
        # For now, we'll allow creating a new payment (will deactivate old one in callback)
    
    # 4. Generate unique transaction UUID
    transaction_uuid = str(uuid.uuid4())
    
    # Calculate amounts (eSewa v2 API expects string values)
    tax_amount = 0.0  # Tax amount (can be 0)
    product_service_charge = 0.0  # Product service charge (can be 0)
    product_delivery_charge = 0.0  # Product delivery charge (can be 0)
    total_amount = plan_amount + tax_amount + product_service_charge + product_delivery_charge
    
    # Format all amounts as strings with 2 decimal places
    amount_str = f"{plan_amount:.2f}"
    tax_amount_str = f"{tax_amount:.2f}"
    product_service_charge_str = f"{product_service_charge:.2f}"
    product_delivery_charge_str = f"{product_delivery_charge:.2f}"
    total_amount_str = f"{total_amount:.2f}"
    
    # Include plan and user_id in success URL for callback
    # eSewa redirects to backend, then backend redirects to frontend
    # We include user_id because eSewa won't have session cookies
    success_url = f"{settings.BACKEND_URL}/api/payment/esewa/success?transaction_uuid={transaction_uuid}&plan={request.plan.value}&user_id={user.id}"
    failure_url = f"{settings.BACKEND_URL}/api/payment/esewa/failure?transaction_uuid={transaction_uuid}"
    
    # Product code (merchant code)
    product_code = settings.ESEWA_MERCHANT_CODE
    
    # Validate payment URL is configured
    if not settings.ESEWA_PAYMENT_URL:
        logger.error("ESEWA_PAYMENT_URL is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment gateway URL not configured"
        )
    
    # Generate HMAC SHA256 signature
    # Signed fields: total_amount,transaction_uuid,product_code (in this exact order)
    signature = generate_esewa_signature(
        total_amount=total_amount_str,
        transaction_uuid=transaction_uuid,
        product_code=product_code
    )
    
    if not signature:
        logger.error("Failed to generate payment signature")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate payment signature"
    )
    
    # Build form data according to eSewa v2 API documentation
    # Reference: https://developer.esewa.com.np/pages/Epay
    # Ensure all values are strings as required by eSewa
    form_data = {
        "amount": str(amount_str),
        "tax_amount": str(tax_amount_str),
        "total_amount": str(total_amount_str),
        "transaction_uuid": str(transaction_uuid),
        "product_code": str(product_code),
        "product_service_charge": str(product_service_charge_str),
        "product_delivery_charge": str(product_delivery_charge_str),
        "success_url": str(success_url),
        "failure_url": str(failure_url),
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": str(signature)
    }
    
    # Validate form_data
    if not all(form_data.values()):
        logger.error(f"Form data validation failed. Empty values found in: {[k for k, v in form_data.items() if not v]}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid form data generated"
        )
    
    # Log form data for debugging (remove sensitive data in production)
    logger.info(f"Generated eSewa payment form data for transaction: {transaction_uuid}")
    logger.debug(f"Total amount: {total_amount_str}, Product code: {product_code}")
    logger.info(f"Payment URL: {settings.ESEWA_PAYMENT_URL}")
    
    # Create payment transaction record in database
    try:
        product_id = f"PLAN_{user.id}_{transaction_uuid[:8]}"
        payment_transaction = PaymentTransaction(
            transaction_uuid=transaction_uuid,
            user_id=user.id,
            plan_id=plan.id,
            amount=plan_amount,
            status=TransactionStatus.pending,
            product_id=product_id
        )
        session.add(payment_transaction)
        await session.commit()
        await session.refresh(payment_transaction)
        logger.info(f"Created payment transaction {payment_transaction.id} for user {user.id}")
    except Exception as e:
        logger.error(f"Failed to create payment transaction: {str(e)}")
        import traceback
        traceback.print_exc()
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment transaction"
        )
    
    # Prepare response
    try:
        response = PaymentInitiateResponse(
            payment_url=settings.ESEWA_PAYMENT_URL,
            transaction_uuid=transaction_uuid,
            form_data=form_data
        )
        logger.info(f"Prepared payment response: payment_url={response.payment_url}, transaction_uuid={response.transaction_uuid}")
        logger.info(f"Form data keys: {list(form_data.keys())}")
        return response
    except Exception as e:
        logger.error(f"Failed to create payment response: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to prepare payment response"
        )


# -----------------------------
# Check Transaction Status (eSewa API)
# -----------------------------
@router.post("/esewa/status", response_model=TransactionStatusResponse)
async def check_transaction_status(
    request: TransactionStatusRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Check transaction status from eSewa API.
    
    This endpoint is used when a transaction is initiated but no response
    is received from eSewa or by the Merchant. It queries eSewa's status API
    to get the current transaction status.
    
    Parameters:
    - product_code: Merchant/product code (defaults to configured merchant code)
    - transaction_uuid: Transaction UUID from payment initiation
    - total_amount: Total transaction amount
    
    Returns:
    - status: Transaction status (SUCCESS, FAILED, PENDING)
    - reference_id: eSewa reference ID if transaction is successful
    - message: Status message from eSewa
    """
    try:
        # Call eSewa status API
        esewa_response = await check_esewa_transaction_status(
            transaction_uuid=request.transaction_uuid,
            total_amount=request.total_amount,
            product_code=request.product_code
        )
        
        # Parse eSewa response
        # eSewa typically returns XML or JSON with status information
        # Response format may vary, so we handle different cases
        
        status_value = "PENDING"
        reference_id = None
        message = None
        
        # Handle JSON response
        if isinstance(esewa_response, dict):
            # Check for common eSewa response fields
            if "status" in esewa_response:
                status_value = esewa_response["status"].upper()
            elif "response_code" in esewa_response:
                # eSewa might use response_code (e.g., "SUCCESS", "FAILED")
                code = esewa_response.get("response_code", "").upper()
                if code == "SUCCESS" or code == "100":
                    status_value = "SUCCESS"
                elif code == "FAILED" or code.startswith("4") or code.startswith("5"):
                    status_value = "FAILED"
                else:
                    status_value = "PENDING"
            
            # Extract reference_id if available
            reference_id = esewa_response.get("reference_id") or esewa_response.get("refId") or esewa_response.get("ref_id")
            
            # Extract message
            message = esewa_response.get("message") or esewa_response.get("status_message")
            
            # If raw_response exists, try to parse it
            if "raw_response" in esewa_response:
                raw_text = esewa_response["raw_response"]
                # Try to extract status from XML/text response
                if "SUCCESS" in raw_text.upper() or "COMPLETED" in raw_text.upper():
                    status_value = "SUCCESS"
                elif "FAILED" in raw_text.upper() or "ERROR" in raw_text.upper():
                    status_value = "FAILED"
                message = raw_text
        
        # If status is SUCCESS and we have reference_id, update user plan
        if status_value == "SUCCESS" and reference_id:
            # Optionally: Update user plan here if not already updated
            # This handles cases where the success callback wasn't received
            # For now, we just return the status
            pass
        
        return TransactionStatusResponse(
            transaction_uuid=request.transaction_uuid,
            status=status_value,
            reference_id=reference_id,
            message=message or f"Transaction status: {status_value}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking transaction status: {str(e)}"
        )


# -----------------------------
# Verify Payment Status (Legacy endpoint - for backward compatibility)
# -----------------------------
@router.get("/esewa/verify/{transaction_uuid}")
async def verify_payment_status(
    transaction_uuid: str,
    total_amount: float = Query(..., description="Total transaction amount"),
    product_code: Optional[str] = Query(None, description="Product code"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Verify payment status for a given transaction UUID (GET endpoint).
    
    This is a convenience GET endpoint that wraps the POST status check.
    Use the POST /esewa/status endpoint for better type safety.
    """
    try:
        request = TransactionStatusRequest(
            transaction_uuid=transaction_uuid,
            total_amount=total_amount,
            product_code=product_code
        )
        return await check_transaction_status(request, user, session)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying payment: {str(e)}"
        )

