"""
Shared utilities for authentication routes.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Optional
from datetime import datetime, timezone
import uuid

from database.schema import UserSubscription, Plan


async def get_user_active_plan(
    session: AsyncSession,
    user_id: uuid.UUID
) -> Optional[str]:
    """
    Get the active plan name for a user from their active subscription.
    
    This is a shared utility used across auth and job routes.
    
    Args:
        session: Database session
        user_id: User UUID
        
    Returns:
        Optional[str]: Plan name ("standard" or "premium") or None if no active subscription
    """
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    stmt = (
        select(UserSubscription, Plan)
        .join(Plan, UserSubscription.plan_id == Plan.id)
        .where(
            UserSubscription.user_id == user_id,
            UserSubscription.is_active == True,
            UserSubscription.expires_at > current_time
        )
        .order_by(UserSubscription.expires_at.desc())
    )
    result = await session.execute(stmt)
    subscription_row = result.first()
    
    if subscription_row:
        subscription, plan = subscription_row
        return plan.plan_name.value  # Returns "standard" or "premium"
    
    return None

