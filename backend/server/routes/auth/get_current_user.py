from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid
from typing import Optional

from database.db import get_session
from database.schema import User, Plan
from utils.jwt_utils import decode_token, get_access_token_from_cookie


# -----------------------------
# Decode & Validate JWT from Request
# -----------------------------
def decode_access_token(request: Request) -> uuid.UUID:
    """
    Decodes and validates the JWT access token from the request.
    
    This is a convenience function that extracts the token from cookies
    and then decodes it using the utils function.
    
    Args:
        request: FastAPI Request object
        
    Returns:
        uuid.UUID: The user ID extracted from the token
        
    Raises:
        HTTPException: If token is invalid, expired, or malformed
    """
    token = get_access_token_from_cookie(request)
    return decode_token(token)


# -----------------------------
# Main Dependency
# -----------------------------
async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> User:
    """
    FastAPI dependency that retrieves the current authenticated user.
    
    This function:
    1. Extracts and validates the JWT token from cookies
    2. Fetches the user from the database with plan join
    3. Verifies the user is active
    
    Args:
        request: FastAPI Request object
        session: Database session dependency
        
    Returns:
        User: The authenticated user object (with plan relationship loaded)
        
    Raises:
        HTTPException: If user is not authenticated, not found, or inactive
    """
    user_id = decode_access_token(request)

    # Fetch user from database
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user: Optional[User] = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user
