import hashlib
import hmac
import base64
import httpx
import uuid
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from fastapi import Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlmodel import select

from config import settings
from database.schema import (
    User,
    Plan,
    UserRole,
    PaymentTransaction,
    TransactionStatus,
    UserSubscription
)

# Configure logging
logger = logging.getLogger(__name__)


def generate_esewa_signature(
    total_amount: str,
    transaction_uuid: str,
    product_code: str
) -> str:
    """
    Generate HMAC SHA256 signature for eSewa payment (v2 API).
    
    According to eSewa documentation:
    - Input: total_amount,transaction_uuid,product_code (in this exact order)
    - Algorithm: HMAC SHA256
    - Output: Base64 encoded
    
    Args:
        total_amount: Total payment amount as string
        transaction_uuid: Transaction UUID
        product_code: Product code (e.g., EPAYTEST)
        
    Returns:
        str: Base64 encoded HMAC SHA256 signature
    """
    # Create the message string in the exact order specified by eSewa
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    
    # Get secret key as string
    secret_key = str(settings.ESEWA_SECRET_KEY)
    
    # Generate HMAC SHA256
    hmac_sha256 = hmac.new(
        secret_key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    )
    
    # Get digest and encode to base64
    digest = hmac_sha256.digest()
    signature = base64.b64encode(digest).decode('utf-8')
    
    return signature


def verify_esewa_response_signature(
    response_data: Dict[str, Any]
) -> bool:
    """
    Verify eSewa response signature using HMAC SHA256.
    
    According to eSewa v2 API documentation, the response contains:
    - signed_field_names: Comma-separated list of fields used in signature
    - signature: The signature to verify
    
    The signed fields are in the format: field1=value1,field2=value2,...
    
    Args:
        response_data: Response data from eSewa containing signed fields and signature
        
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        signed_field_names = response_data.get("signed_field_names", "")
        received_signature = response_data.get("signature", "")
        
        if not signed_field_names or not received_signature:
            logger.warning("Missing signed_field_names or signature in response")
            return False
        
        # Parse signed field names (comma-separated)
        field_list = [field.strip() for field in signed_field_names.split(",") if field.strip()]
        
        if not field_list:
            logger.warning("No signed fields found")
            return False
        
        # Build message from signed fields in the order specified
        # Format: field1=value1,field2=value2,...
        message_parts = []
        for field in field_list:
            value = str(response_data.get(field, ""))
            message_parts.append(f"{field}={value}")
        
        message = ",".join(message_parts)
        
        # Generate expected signature using HMAC SHA256
        secret_key = str(settings.ESEWA_SECRET_KEY)
        hmac_sha256 = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        )
        digest = hmac_sha256.digest()
        expected_signature = base64.b64encode(digest).decode('utf-8')
        
        # Compare signatures (use constant-time comparison to prevent timing attacks)
        is_valid = hmac.compare_digest(received_signature, expected_signature)
        
        if not is_valid:
            logger.warning(f"Signature verification failed. Expected: {expected_signature[:20]}..., Received: {received_signature[:20]}...")
            logger.debug(f"Message used: {message}")
        
        return is_valid
        
    except Exception as e:
        logger.error(f"Error verifying eSewa signature: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def verify_esewa_payment(
    response_data: Dict[str, Any]
) -> bool:
    """
    Verify eSewa payment by checking the response signature.
    
    Args:
        response_data: Response data from eSewa containing transaction details and signature
        
    Returns:
        bool: True if payment is verified (signature is valid), False otherwise
    """
    # Verify the signature in the response
    return verify_esewa_response_signature(response_data)


async def check_esewa_transaction_status(
    transaction_uuid: str,
    total_amount: float,
    product_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Check transaction status from eSewa API.
    
    This API is used when a transaction is initiated but no response is received
    from eSewa or by the Merchant.
    
    Args:
        transaction_uuid: Transaction UUID
        total_amount: Total transaction amount
        product_code: Product code (defaults to merchant code)
        
    Returns:
        dict: Response from eSewa containing status and reference_id if successful
        
    Raises:
        Exception: If the API call fails or returns an error
    """
    product_code = product_code or settings.ESEWA_MERCHANT_CODE
    
    # Build query parameters
    params = {
        "product_code": product_code,
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid
    }
    
    # Make async HTTP request to eSewa status API
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                settings.ESEWA_STATUS_URL,
                params=params
            )
            response.raise_for_status()
            
            # eSewa returns XML or JSON response
            # Try to parse as JSON first, fallback to XML parsing if needed
            try:
                data = response.json()
            except Exception:
                # If JSON parsing fails, try to extract from XML or text
                text = response.text
                # Parse XML response (eSewa might return XML)
                # For now, return the text and let the endpoint handle parsing
                data = {"raw_response": text}
            
            return data
            
        except httpx.HTTPStatusError as e:
            raise Exception(f"eSewa API returned error: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            raise Exception(f"Failed to connect to eSewa API: {str(e)}")
        except Exception as e:
            raise Exception(f"Error checking transaction status: {str(e)}")


# -----------------------------
# Payment Callback Utility Functions
# -----------------------------

def build_error_redirect(error: str) -> str:
    """Helper to build error redirect URL"""
    return f"{settings.FRONTEND_URL}/?error={error}"


async def parse_esewa_response(request: Request, data: Optional[str]) -> dict:
    """Parse eSewa response from various sources"""
    
    # Try query parameter first (base64 encoded JSON)
    if data:
        try:
            decoded_data = base64.b64decode(data).decode('utf-8')
            response_data = json.loads(decoded_data)
            logger.info(f"Parsed data from query parameter")
            return response_data
        except Exception as e:
            logger.error(f"Error decoding eSewa data parameter: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid data format")
    
    # Try request body
    if request.method == "POST":
        try:
            response_data = await request.json()
            if response_data:
                logger.info(f"Parsed data from JSON body")
                return response_data
        except Exception:
            try:
                form_data = await request.form()
                response_data = dict(form_data)
                if response_data:
                    logger.info(f"Parsed data from form data")
                    return response_data
            except Exception as e:
                logger.error(f"Error parsing request data: {str(e)}")
                raise HTTPException(status_code=400, detail="Unable to parse request data")
    
    # No data found
    logger.error("No response data received from eSewa")
    raise HTTPException(status_code=400, detail="No data received")


async def get_or_create_transaction(
    session: AsyncSession,
    transaction_uuid: str,
    user_uuid: uuid.UUID,
    plan: Plan,
    ref_id: str,
    total_amount: Optional[float] = None
) -> PaymentTransaction:
    """Get existing transaction or create new one"""
    
    # Try to find existing transaction
    stmt = select(PaymentTransaction).where(
        PaymentTransaction.transaction_uuid == transaction_uuid
    )
    result = await session.execute(stmt)
    payment_transaction = result.scalar_one_or_none()
    
    if payment_transaction:
        logger.info(f"Found existing transaction: {payment_transaction.id}, status: {payment_transaction.status}, user_id: {payment_transaction.user_id}")
        # Ensure the object is in the session and tracked
        # Refresh to ensure we have the latest state
        await session.refresh(payment_transaction)
        logger.info(f"Transaction refreshed: status={payment_transaction.status}")
        return payment_transaction
    
    # Validate and convert total_amount
    try:
        amount = float(total_amount) if total_amount is not None else plan.price
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid total_amount value: {total_amount}, error: {str(e)}")
        amount = plan.price
    
    # Create new transaction
    logger.info(f"Creating new transaction for UUID: {transaction_uuid}")
    payment_transaction = PaymentTransaction(
        transaction_uuid=transaction_uuid,
        user_id=user_uuid,
        plan_id=plan.id,
        amount=amount,
        status=TransactionStatus.completed,
        esewa_ref_id=ref_id,
        completed_at=datetime.now(timezone.utc),
        product_id=f"PLAN_{user_uuid}_{transaction_uuid[:8]}"
    )
    session.add(payment_transaction)
    await session.flush()  # Get the ID without committing
    logger.info(f"Created new transaction: {payment_transaction.id}")
    
    return payment_transaction


async def update_user_role(session: AsyncSession, user_uuid: uuid.UUID) -> bool:
    """Update user role to 'both'"""
    
    logger.info(f"Updating user {user_uuid} role to 'both'")
    
    # First verify user exists
    stmt_check = select(User).where(User.id == user_uuid)
    result_check = await session.execute(stmt_check)
    user = result_check.scalar_one_or_none()
    
    if not user:
        logger.error(f"User {user_uuid} not found - cannot update role")
        return False
    
    # Use UPDATE statement for atomic operation
    stmt = (
        update(User)
        .where(User.id == user_uuid)
        .values(role=UserRole.both)
    )
    
    result = await session.execute(stmt)
    await session.flush()  # Flush to ensure update is in session
    
    if result.rowcount == 0:
        logger.error(f"Failed to update user {user_uuid} - no rows affected")
        return False
    
    logger.info(f"Successfully updated user {user_uuid} role (rows: {result.rowcount})")
    return True


async def create_user_subscription(
    session: AsyncSession,
    user_uuid: uuid.UUID,
    plan: Plan,
    transaction_id: uuid.UUID
) -> UserSubscription:
    """Create or update user subscription"""
    
    logger.info(f"Creating subscription for user {user_uuid}, plan {plan.plan_name.value}, transaction {transaction_id}")
    
    # Check if subscription already exists for this transaction (idempotency)
    stmt_existing = select(UserSubscription).where(
        UserSubscription.transaction_id == transaction_id
    )
    result_existing = await session.execute(stmt_existing)
    existing_sub = result_existing.scalar_one_or_none()
    
    if existing_sub:
        logger.info(f"Subscription already exists for transaction {transaction_id}: {existing_sub.id}")
        return existing_sub
    
    # Deactivate existing active subscriptions for this user
    stmt_deactivate = (
        update(UserSubscription)
        .where(
            UserSubscription.user_id == user_uuid,
            UserSubscription.is_active == True
        )
        .values(is_active=False)
    )
    result = await session.execute(stmt_deactivate)
    logger.info(f"Deactivated {result.rowcount} existing subscriptions")
    
    # Calculate expiration
    expires_at = datetime.now(timezone.utc) + timedelta(days=plan.valid_for)
    logger.info(f"Subscription will expire at: {expires_at}")
    
    # Create new subscription
    try:
        subscription = UserSubscription(
            user_id=user_uuid,
            plan_id=plan.id,
            transaction_id=transaction_id,
            expires_at=expires_at,
            is_active=True
        )
        session.add(subscription)
        await session.flush()  # Flush to ensure subscription is in session and get ID
        logger.info(f"Added subscription: id={subscription.id}, expires_at={expires_at}")
        return subscription
    except Exception as e:
        logger.error(f"Error creating subscription: {str(e)}")
        logger.error(f"User UUID: {user_uuid}, Plan ID: {plan.id}, Transaction ID: {transaction_id}")
        raise

