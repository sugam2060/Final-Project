from starlette.config import Config
from starlette.datastructures import Secret
from typing import List

# .env is in the same directory as this file
config = Config(".env")


class Settings:
    # -----------------------------
    # Application
    # -----------------------------
    APP_NAME: str = config("APP_NAME", cast=str, default="JobPortal API")
    ENV: str = config("ENV", cast=str, default="development")
    DEBUG: bool = config("DEBUG", cast=bool, default=False)

    # -----------------------------
    # Database
    # -----------------------------
    DATABASE_URL: str = config(
        "DATABASE_URL",
        cast=str,
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/jobportal",
    )

    # -----------------------------
    # OAuth - Google
    # -----------------------------
    GOOGLE_CLIENT_ID: str = config("GOOGLE_CLIENT_ID", cast=str)
    GOOGLE_CLIENT_SECRET: Secret = config("GOOGLE_CLIENT_SECRET", cast=Secret)
    GOOGLE_REDIRECT_URI: str = config("GOOGLE_REDIRECT_URI", cast=str)

    # -----------------------------
    # OAuth - GitHub
    # -----------------------------
    GITHUB_CLIENT_ID: str = config("GITHUB_CLIENT_ID", cast=str)
    GITHUB_CLIENT_SECRET: Secret = config("GITHUB_CLIENT_SECRET", cast=Secret)
    GITHUB_REDIRECT_URI: str = config("GITHUB_REDIRECT_URI", cast=str)

    # -----------------------------
    # JWT / Security
    # -----------------------------
    JWT_SECRET_KEY: Secret = config("JWT_SECRET_KEY", cast=Secret)
    JWT_ALGORITHM: str = config("JWT_ALGORITHM", cast=str, default="HS256")

    ACCESS_TOKEN_EXPIRE_MINUTES: int = config(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        cast=int,
        default=15,
    )

    # -----------------------------
    # CORS
    # -----------------------------
    CORS_ORIGINS: List[str] = config(
        "CORS_ORIGINS",
        cast=lambda v: [i.strip() for i in v.split(",")],
        default="http://localhost:3000",
    )


# Singleton-style access
settings = Settings()
