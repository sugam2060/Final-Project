"""
JWT utility functions for token creation and validation.
"""
from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from config import settings


def create_access_token(user_id: uuid.UUID) -> str:
    """
    Creates a JWT access token for the given user ID.
    
    Uses UTC timezone-aware datetime (replaces deprecated datetime.utcnow()).
    
    Args:
        user_id: The UUID of the user
        
    Returns:
        str: The encoded JWT token
        
    Raises:
        Exception: If token encoding fails
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
    }

    return jwt.encode(
        payload,
        str(settings.JWT_SECRET_KEY),
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> uuid.UUID:
    """
    Decodes and validates a JWT token string.
    
    Args:
        token: The JWT token string to decode
        
    Returns:
        uuid.UUID: The user ID extracted from the token
        
    Raises:
        HTTPException: 401 if token is invalid, expired, or malformed
    """
    if not token or not isinstance(token, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token - token is required and must be a string",
        )
    
    try:
        payload = jwt.decode(
            token,
            str(settings.JWT_SECRET_KEY),
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        )

    user_id: Optional[str] = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload - missing user identifier",
        )

    try:
        return uuid.UUID(user_id)
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid user identifier format: {str(e)}",
        )


def get_access_token_from_cookie(request: Request) -> str:
    """
    Extracts the access token from the request cookies.
    
    Args:
        request: FastAPI Request object
        
    Returns:
        str: The access token
        
    Raises:
        HTTPException: 401 if no access token is found in cookies
    """
    token: Optional[str] = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - no access token found in cookies",
        )

    return token

