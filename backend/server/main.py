from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from sqlmodel import SQLModel
from starlette.middleware.sessions import SessionMiddleware
from routes.auth.verify_user import router as verify_user_router
from routes.auth.logout import router as logout_router
from routes.plan.plan import router as plan_router
from routes.payment.payment_initialize import router as payment_router
from routes.payment.payment_callback import router as payment_callback_router
from routes.job.job_get import router as job_get_router
from routes.job.job_post import router as job_post_router
from routes.job.job_application import router as job_application_router
from routes.job.job_application_actions import router as job_application_actions_router


from config import settings
from database.db import engine
from routes.auth.google import router as google_auth_router

# Import all schemas to ensure they're registered with SQLModel.metadata
from database.schema import (
    User,
    OAuthIdentity,
    Plan,
    UserSubscription,
    Job,
    JobApplication,
)


# -----------------------------
# Lifespan (Startup / Shutdown)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield

    # Shutdown
    await engine.dispose()


# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)


# -----------------------------
# Middleware
# -----------------------------

app.add_middleware(
    SessionMiddleware,
    secret_key=str(settings.JWT_SECRET_KEY),  # reuse existing secret
    same_site="lax",
    https_only=settings.ENV == "production",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,  # REQUIRED for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Routes
# -----------------------------
app.include_router(google_auth_router)
app.include_router(verify_user_router)
app.include_router(logout_router)
app.include_router(plan_router)
app.include_router(payment_router)
app.include_router(payment_callback_router)
app.include_router(job_get_router)
app.include_router(job_post_router)
app.include_router(job_application_router)
app.include_router(job_application_actions_router)


# -----------------------------
# Health Check
# -----------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}




if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
