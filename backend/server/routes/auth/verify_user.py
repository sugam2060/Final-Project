from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from routes.auth.get_current_user import get_current_user
from database.schema import User, Plan, UserSubscription
from database.db import get_session
from datetime import datetime, timezone

router = APIRouter(
    prefix="/api/auth"
)


@router.get("/me")
async def me(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get current authenticated user information.
    
    Returns:
        dict: User information including id, email, name, avatar_url, 
              email_verified, role, and plan (plan name from active UserSubscription)
    """
    # Get active plan from UserSubscription table
    plan_name = None
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Find active subscription that hasn't expired
    stmt = (
        select(UserSubscription, Plan)
        .join(Plan, UserSubscription.plan_id == Plan.id)
        .where(
            UserSubscription.user_id == user.id,
            UserSubscription.is_active == True,
            UserSubscription.expires_at > current_time
        )
        .order_by(UserSubscription.expires_at.desc())  # Get the most recent active subscription
    )
    result = await session.execute(stmt)
    subscription_row = result.first()
    
    if subscription_row:
        subscription, plan = subscription_row
        plan_name = plan.plan_name.value  # Return enum value (standard/premium)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "email_verified": user.email_verified,
        "role": user.role.value if user.role else None,
        "plan": plan_name  # Return plan name from active UserSubscription
    }


@router.get("/get-current-user")
async def verify_current_user(
    user: User = Depends(get_current_user),
):
    """
    Verify that the current user is authenticated and active.
    
    This endpoint verifies:
    1. Valid JWT token exists in cookies
    2. Token is valid and not expired
    3. User exists in database
    4. User account is active
    
    Returns:
        Response: 200 status if user is authenticated and active
        
    Raises:
        HTTPException: 401 if not authenticated, 403 if inactive
    """
    # If we reach here, user is authenticated and active
    # (get_current_user dependency handles validation)
    return Response(status_code=status.HTTP_200_OK)
