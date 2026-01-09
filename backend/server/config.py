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

    # -----------------------------
    # Frontend URL
    # -----------------------------
    FRONTEND_URL: str = config(
        "FRONTEND_URL",
        cast=str,
        default="http://localhost:5173",
    )

    # -----------------------------
    # Backend URL
    # -----------------------------
    BACKEND_URL: str = config(
        "BACKEND_URL",
        cast=str,
        default="http://localhost:8000",
    )

    # -----------------------------
    # eSewa Payment Integration
    # -----------------------------
    ESEWA_SECRET_KEY: Secret = config(
        "ESEWA_SECRET_KEY",
        cast=Secret,
        default="8gBm/:&EnhH.1/q",  # Default UAT key
    )
    
    ESEWA_PRODUCT_CODE: str = config(
        "ESEWA_PRODUCT_CODE",
        cast=str,
        default="EPAYTEST",  # Test product code
    )
    
    ESEWA_INITIATE_URL: str = config(
        "ESEWA_INITIATE_URL",
        cast=str,
        default="https://rc-epay.esewa.com.np/api/epay/main/v2/form",  # Test URL
        # Production: "https://epay.esewa.com.np/api/epay/main/v2/form"
    )
    
    ESEWA_STATUS_CHECK_URL: str = config(
        "ESEWA_STATUS_CHECK_URL",
        cast=str,
        default="https://rc.esewa.com.np/api/epay/transaction/status/",  # Test URL
        # Production: "https://esewa.com.np/api/epay/transaction/status/"
    )

    # -----------------------------
    # Cloudinary Configuration
    # -----------------------------
    # Cloudinary is used for storing resume PDF files uploaded by job applicants.
    # Get your credentials from: https://cloudinary.com/console
    # Required for job application functionality.
    CLOUDINARY_CLOUD_NAME: str = config(
        "CLOUDINARY_CLOUD_NAME",
        cast=str,
        default="",
    )
    CLOUDINARY_API_KEY: str = config(
        "CLOUDINARY_API_KEY",
        cast=str,
        default="",
    )
    CLOUDINARY_API_SECRET: Secret = config(
        "CLOUDINARY_API_SECRET",
        cast=Secret,
        default="",
    )

    # -----------------------------
    # SMTP Email Configuration
    # -----------------------------
    # SMTP settings for sending email notifications.
    # Required for sending application acceptance emails.
    # Example providers: Gmail, SendGrid, AWS SES, etc.
    SMTP_HOST: str = config(
        "SMTP_HOST",
        cast=str,
        default="",
    )
    SMTP_PORT: int = config(
        "SMTP_PORT",
        cast=int,
        default=587,  # Default TLS port (587 for TLS, 465 for SSL)
    )
    SMTP_USER: str = config(
        "SMTP_USER",
        cast=str,
        default="",
    )
    SMTP_PASSWORD: Secret = config(
        "SMTP_PASSWORD",
        cast=Secret,
        default="",
    )
    SMTP_FROM_EMAIL: str = config(
        "SMTP_FROM_EMAIL",
        cast=str,
        default="",
    )
    SMTP_FROM_NAME: str = config(
        "SMTP_FROM_NAME",
        cast=str,
        default="JobPortal",  # Display name for sender
    )
    SMTP_REPLY_TO: str = config(
        "SMTP_REPLY_TO",
        cast=str,
        default="",  # Reply-to email address (optional)
    )
    SMTP_USE_TLS: bool = config(
        "SMTP_USE_TLS",
        cast=bool,
        default=True,  # Use TLS by default (set False for SSL on port 465)
    )
    SMTP_TIMEOUT: int = config(
        "SMTP_TIMEOUT",
        cast=int,
        default=30,  # SMTP connection timeout in seconds
    )
    EMAIL_ENABLED: bool = config(
        "EMAIL_ENABLED",
        cast=bool,
        default=True,  # Enable/disable email sending globally
    )


# Singleton-style access
settings = Settings()
