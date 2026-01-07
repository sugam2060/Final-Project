from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
import uuid
from enum import Enum

from sqlalchemy import Column, UniqueConstraint
from sqlalchemy.dialects.postgresql import ENUM


# -------------------------------------------------
# User Role Enum (values MUST match Postgres exactly)
# -------------------------------------------------
class UserRole(str, Enum):
    employer = "employer"
    employee = "employee"
    both = "both"

class UserPlan(str, Enum):
    standard = "standard"
    premium = "premium"


# -------------------------------------------------
# User Table
# -------------------------------------------------
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
    )

    email: str = Field(
        nullable=False,
        unique=True,
        index=True,
    )

    email_verified: bool = Field(default=False)

    name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)

    role: UserRole = Field(default=UserRole.employee)

    plan: UserPlan = Field(default=None, nullable=True)

    is_active: bool = Field(default=True)

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )

    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
    )

    identities: List["OAuthIdentity"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


# -------------------------------------------------
# OAuth Identity Table
# -------------------------------------------------
class OAuthIdentity(SQLModel, table=True):
    __tablename__ = "oauth_identities"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_user_id",
            name="uq_provider_provider_user_id",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
    )

    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        nullable=False,
        index=True,
    )

    provider: str = Field(nullable=False, index=True)
    provider_user_id: str = Field(nullable=False, index=True)

    email: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
    )

    user: User = Relationship(back_populates="identities")
