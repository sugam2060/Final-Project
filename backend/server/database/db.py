from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator
import ssl

from config import settings


# -----------------------------
# SSL Context (Neon requires SSL)
# -----------------------------
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = True
ssl_context.verify_mode = ssl.CERT_REQUIRED


# -----------------------------
# Async Engine (Neon-safe)
# -----------------------------
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL.replace("?sslmode=require", ""),
    echo=True,

    connect_args={
        "ssl": ssl_context,
    },

    # --- Pool settings (Neon-friendly) ---
    pool_size=5,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,

    future=True,
)


# -----------------------------
# Async Session Factory
# -----------------------------
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# -----------------------------
# Dependency
# -----------------------------
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
