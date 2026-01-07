from fastapi import Depends, HTTPException, Request, status
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid

from config import settings
from database.db import get_session
from database.schema import User


# -----------------------------
# Extract JWT from Cookie
# -----------------------------
def get_access_token_from_cookie(request: Request) -> str:
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return token


# -----------------------------
# Decode & Validate JWT
# -----------------------------
def decode_access_token(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(
            token,
            str(settings.JWT_SECRET_KEY),
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        return uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier",
        )


# -----------------------------
# Main Dependency
# -----------------------------
async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> User:
    token = get_access_token_from_cookie(request)
    user_id = decode_access_token(token)

    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user
