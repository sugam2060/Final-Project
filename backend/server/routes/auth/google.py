from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from authlib.integrations.starlette_client import OAuth
from jose import jwt
from datetime import datetime, timedelta
import uuid

from config import settings
from database.db import get_session
from database.schema import User, OAuthIdentity

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
# JWT Helper
# -----------------------------
def create_access_token(user_id: uuid.UUID) -> str:
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
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get("userinfo")
    except Exception:
        raise HTTPException(status_code=400, detail="Google authentication failed")

    if not userinfo:
        raise HTTPException(status_code=400, detail="Failed to fetch user info")

    google_sub = userinfo["sub"]
    email = userinfo.get("email")
    name = userinfo.get("name")
    avatar_url = userinfo.get("picture")
    email_verified = userinfo.get("email_verified", False)

    # -----------------------------
    # 1. Find OAuth Identity
    # -----------------------------
    stmt = select(OAuthIdentity).where(
        OAuthIdentity.provider == "google",
        OAuthIdentity.provider_user_id == google_sub,
    )
    result = await session.execute(stmt)
    identity = result.scalar_one_or_none()

    # -----------------------------
    # 2. Resolve User
    # -----------------------------
    if identity:
        stmt = select(User).where(User.id == identity.user_id)
        result = await session.execute(stmt)
        user = result.scalar_one()
    else:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                email=email,
                email_verified=email_verified,
                name=name,
                avatar_url=avatar_url,
            )
            session.add(user)
            await session.flush()  # ensures user.id exists

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
