"""
Payment utility functions for eSewa payment gateway integration.
"""
import hmac
import hashlib
import base64
import httpx
import logging
import uuid
from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlmodel import select

from database.schema import User, Plan, UserPlan, UserSubscription, UserRole
from config import settings

logger = logging.getLogger(__name__)


def generate_esewa_signature(
    secret_key: str,
    total_amount: str,
    transaction_uuid: str,
    product_code: str
) -> str:
    """
    Generate HMAC SHA256 signature for eSewa payment (v2 API).
    
    Args:
        secret_key: eSewa merchant secret key
        total_amount: Total payment amount as string
        transaction_uuid: Unique transaction identifier
        product_code: Product code (e.g., "EPAYTEST")
    
    Returns:
        str: Base64 encoded signature
        
    Raises:
        ValueError: If any required parameter is empty
    """
    # Validate inputs
    if not all([secret_key, total_amount, transaction_uuid, product_code]):
        raise ValueError("All signature parameters are required")
    
    # eSewa v2 requires fields in this specific order for signing
    data = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    
    # Generate HMAC-SHA256
    hash_val = hmac.new(
        secret_key.encode('utf-8'),
        msg=data.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    
    # Return Base64 encoded string
    return base64.b64encode(hash_val).decode('utf-8')


async def verify_payment_status(
    transaction_uuid: str,
    total_amount: str,
    product_code: Optional[str] = None
) -> dict:
    """
    Verify payment status using eSewa Status Check API.
    
    According to eSewa documentation, this is the recommended way to verify
    transactions and filter potential fraudulent transactions.
    
    Args:
        transaction_uuid: Transaction UUID to verify
        total_amount: Total amount of the transaction
        product_code: Product code (default: from settings)
    
    Returns:
        dict: Status check response from eSewa API
    
    Raises:
        HTTPException: 503 if service unavailable, 500 if verification fails
    """
    if product_code is None:
        product_code = settings.ESEWA_PRODUCT_CODE
    
    # Validate inputs
    if not transaction_uuid or not total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction UUID and total amount are required"
        )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            status_params = {
                "product_code": product_code,
                "total_amount": total_amount,
                "transaction_uuid": transaction_uuid
            }
            response = await client.get(settings.ESEWA_STATUS_CHECK_URL, params=status_params)
            response.raise_for_status()
            verification_data = response.json()
            
            logger.info(f"Payment status check response for {transaction_uuid}: {verification_data.get('status', 'unknown')}")
            return verification_data
            
    except httpx.TimeoutException:
        logger.error(f"Timeout calling eSewa status check API for transaction {transaction_uuid}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment verification service timeout"
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error calling eSewa status check API: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment verification service returned an error"
        )
    except httpx.HTTPError as e:
        logger.error(f"HTTP error calling eSewa status check API: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment verification service unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error during payment verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment verification failed"
        )


async def update_user_role(
    session: AsyncSession,
    user_uuid: uuid.UUID
) -> bool:
    """
    Update user role to 'both' if not already set.
    
    Optimized: Only updates if role is not already 'both', avoiding unnecessary updates.
    Removed redundant database query - if update affects 0 rows, we assume user already has 'both' role.
    
    Args:
        session: Database session
        user_uuid: User UUID to update
        
    Returns:
        bool: True if role was updated, False if already 'both'
    """
    # Update only if role is not 'both' - more efficient than fetch then update
    update_stmt = (
        update(User)
        .where(
            User.id == user_uuid,
            User.role != UserRole.both
        )
        .values(role=UserRole.both)
    )
    result = await session.execute(update_stmt)
    await session.flush()
    
    if result.rowcount > 0:
        logger.info(f"Updated user {user_uuid} role to 'both'")
        return True
    else:
        # If no rows affected, user either doesn't exist or already has 'both' role
        # We skip the redundant check query for better performance
        logger.debug(f"User {user_uuid} role not updated (likely already 'both' or user not found)")
        return False


async def deactivate_existing_subscriptions(
    session: AsyncSession,
    user_uuid: uuid.UUID
) -> int:
    """
    Deactivate all existing active subscriptions for a user.
    
    Args:
        session: Database session
        user_uuid: User UUID
    
    Returns:
        int: Number of subscriptions deactivated
    """
    stmt_deactivate = (
        update(UserSubscription)
        .where(
            UserSubscription.user_id == user_uuid,
            UserSubscription.is_active == True
        )
        .values(is_active=False)
    )
    result = await session.execute(stmt_deactivate)
    await session.flush()
    
    deactivated_count = result.rowcount
    logger.info(f"Deactivated {deactivated_count} existing subscription(s) for user {user_uuid}")
    
    return deactivated_count


async def create_user_subscription(
    session: AsyncSession,
    user_uuid: uuid.UUID,
    plan: Plan
) -> UserSubscription:
    """
    Create a new user subscription and link it to the User table.
    
    The user_id foreign key automatically creates the relationship with User table.
    
    Args:
        session: Database session
        user_uuid: User UUID to create subscription for
        plan: Plan object to subscribe to
    
    Returns:
        UserSubscription: The created subscription object
    
    Raises:
        Exception: If subscription creation fails
    """
    # Cache current time to avoid multiple calls
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Create new UserSubscription and link it to User table
    # The user_id foreign key automatically creates the relationship
    new_subscription = UserSubscription(
        user_id=user_uuid,  # Links to User table via foreign key
        plan_id=plan.id,  # Links to Plan table via foreign key
        started_at=now,
        expires_at=now + timedelta(days=plan.valid_for),
        is_active=True
    )
    session.add(new_subscription)
    await session.flush()  # Flush to get the ID
    logger.info(f"Created UserSubscription {new_subscription.id} for user {user_uuid}, plan {plan.plan_name.value}")
    
    return new_subscription


async def verify_subscription_created(
    session: AsyncSession,
    subscription_id: uuid.UUID,
    user_uuid: uuid.UUID
) -> Optional[UserSubscription]:
    """
    Verify that a subscription was created and is linked to the user.
    
    Note: This is a lightweight verification. If commit succeeded, the subscription exists.
    
    Args:
        session: Database session
        subscription_id: Subscription ID to verify
        user_uuid: User UUID to verify link
    
    Returns:
        Optional[UserSubscription]: The verified subscription or None if not found
    """
    stmt_verify = select(UserSubscription).where(
        UserSubscription.id == subscription_id,
        UserSubscription.user_id == user_uuid
    )
    result_verify = await session.execute(stmt_verify)
    verified_subscription = result_verify.scalar_one_or_none()
    
    if verified_subscription:
        logger.debug(f"Verified subscription {subscription_id} linked to user {user_uuid}")
    else:
        logger.error(f"Verification failed: Subscription {subscription_id} not found for user {user_uuid}")
    
    return verified_subscription


async def process_payment_success(
    session: AsyncSession,
    user_uuid: uuid.UUID,
    plan: Plan
) -> UserSubscription:
    """
    Process successful payment by updating user role and creating subscription.
    
    Optimized: Executes all database operations in a single transaction with minimal round trips.
    
    This function orchestrates:
    1. Updating user role to 'both' (if needed)
    2. Deactivating existing subscriptions
    3. Creating new subscription
    4. Committing all changes atomically
    
    Args:
        session: Database session
        user_uuid: User UUID
        plan: Plan object to subscribe to
    
    Returns:
        UserSubscription: The created subscription
    
    Raises:
        Exception: If processing fails
    """
    try:
        # Execute all operations before commit to minimize round trips
        # 1. Update user role (only if needed)
        await update_user_role(session, user_uuid)
        
        # 2. Deactivate existing subscriptions
        await deactivate_existing_subscriptions(session, user_uuid)
        
        # 3. Create new subscription
        new_subscription = await create_user_subscription(session, user_uuid, plan)
        
        # 4. Commit all changes atomically (single transaction)
        await session.commit()
        logger.info(f"Payment processed: subscription {new_subscription.id} created for user {user_uuid}")
        
        return new_subscription
        
    except Exception as e:
        logger.error(f"Error processing payment success: {str(e)}")
        await session.rollback()
        raise