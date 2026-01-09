from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from routes.auth.get_current_user import get_current_user
from database.schema import User
from database.db import get_session
from .auth_utils import get_user_active_plan
from pydantics.auth_types import UserResponse

router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"]
)


# -----------------------------
# Endpoints
# -----------------------------
@router.get("/me", response_model=UserResponse)
async def me(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get current authenticated user information.
    
    Returns:
        UserResponse: User information including id, email, name, avatar_url, 
              email_verified, role, and plan (plan name from active UserSubscription)
    """
    # Get active plan using shared utility
    plan_name = await get_user_active_plan(session, user.id)
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        email_verified=user.email_verified,
        role=user.role.value if user.role else None,
        plan=plan_name
    )


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
        
    Note:
        This endpoint is redundant if you're using get_current_user dependency
        in other endpoints, but it's kept for explicit verification purposes.
    """
    # If we reach here, user is authenticated and active
    # (get_current_user dependency handles validation)
    return Response(status_code=status.HTTP_200_OK)
