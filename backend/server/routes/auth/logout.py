from fastapi.responses import JSONResponse
from config import settings
from fastapi import APIRouter


router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/logout")
async def logout():
    response = JSONResponse(
        status_code=200,
        content={"message": "Logged out successfully"},
    )

    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.ENV == "production",
    )

    return response
