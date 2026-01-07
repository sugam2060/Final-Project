from sys import prefix
from fastapi import APIRouter, Depends , Response
from routes.auth.get_current_user import get_current_user,get_access_token_from_cookie
from database.schema import User

router = APIRouter(
    prefix="/api/auth"
)

@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "email_verified": user.email_verified,
        "role":user.role,
        "plan":user.plan
    }


@router.get("/get-current-user")
async def get_current_user(
    token: str = Depends(get_access_token_from_cookie),
):
    if token:
        return Response(status_code=200)
