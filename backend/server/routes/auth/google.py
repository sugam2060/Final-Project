from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from authlib.integrations.starlette_client import OAuth
from typing import Optional

from config import settings
from database.db import get_session
from database.schema import User, OAuthIdentity
from utils.jwt_utils import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# -----------------------------
# OAuth Client Setup
# -----------------------------
oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=str(settings.GOOGLE_CLIENT_SECRET),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# -----------------------------
# 1. Google Login
# -----------------------------
@router.get("/google-login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(
        request,
        settings.GOOGLE_REDIRECT_URI,
    )


# -----------------------------
# 2. Google Callback
# -----------------------------
@router.get("/google-callback")
async def google_callback(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """
    Handle Google OAuth callback.
    
    This endpoint:
    1. Validates the OAuth token from Google
    2. Finds or creates the user account
    3. Links or creates OAuth identity
    4. Issues a JWT access token
    5. Sets an HTTP-only cookie and redirects
    
    Returns:
        RedirectResponse: Redirects to frontend with authentication cookie set
        
    Raises:
        HTTPException: 400 if OAuth authentication fails
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get("userinfo")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )

    if not userinfo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch user info"
        )

    google_sub = userinfo["sub"]
    email = userinfo.get("email")
    name = userinfo.get("name")
    avatar_url = userinfo.get("picture")
    email_verified = userinfo.get("email_verified", False)

    # -----------------------------
    # 1. Find OAuth Identity (with user joined to reduce queries)
    # -----------------------------
    stmt = (
        select(OAuthIdentity, User)
        .join(User, OAuthIdentity.user_id == User.id)
        .where(
            OAuthIdentity.provider == "google",
            OAuthIdentity.provider_user_id == google_sub,
        )
    )
    result = await session.execute(stmt)
    identity_row = result.first()
    
    if identity_row:
        identity, user = identity_row
        # Update user info if it has changed
        if user.email != email or user.name != name or user.avatar_url != avatar_url or user.email_verified != email_verified:
            user.email = email
            user.name = name
            user.avatar_url = avatar_url
            user.email_verified = email_verified
            session.add(user)
        
        # Update identity info if it has changed
        if identity.email != email or identity.name != name or identity.avatar_url != avatar_url:
            identity.email = email
            identity.name = name
            identity.avatar_url = avatar_url
            session.add(identity)
    else:
        # -----------------------------
        # 2. Resolve User by email (if OAuth identity doesn't exist)
        # -----------------------------
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user: Optional[User] = result.scalar_one_or_none()

        if not user:
            # Create new user
            user = User(
                email=email,
                email_verified=email_verified,
                name=name,
                avatar_url=avatar_url,
            )
            session.add(user)
            await session.flush()  # ensures user.id exists

        # Create OAuth identity
        identity = OAuthIdentity(
            user_id=user.id,
            provider="google",
            provider_user_id=google_sub,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        session.add(identity)

    # -----------------------------
    # 3. Persist DB Changes
    # -----------------------------
    await session.commit()

    # -----------------------------
    # 4. Issue JWT Access Token
    # -----------------------------
    access_token = create_access_token(user.id)

    response = RedirectResponse(
        url="http://localhost:5173/",
        status_code=302,
    )

    # -----------------------------
    # 5. Set HTTP-only Cookie
    # -----------------------------
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENV == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    return response
