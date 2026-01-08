from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from datetime import datetime, timedelta
import uuid

from config import settings


def create_access_token(user_id: uuid.UUID) -> str:
    """
    Creates a JWT access token for the given user ID.
    
    Args:
        user_id: The UUID of the user
        
    Returns:
        str: The encoded JWT token
    """
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
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
        HTTPException: If token is invalid, expired, or malformed
    """
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

    user_id = payload.get("sub")

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
        HTTPException: If no access token is found in cookies
    """
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - no access token found",
        )

    return token

