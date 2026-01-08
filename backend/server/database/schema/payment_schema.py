from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timezone
import uuid
from enum import Enum


class UserPlan(str, Enum):
    standard = "standard"
    premium = "premium"


class Plan(SQLModel, table=True):
    __tablename__ = "plans"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    plan_name: UserPlan = Field(unique=True, index=True)
    price: float = Field(ge=0)
    currency: str = Field(default="NPR")
    valid_for: int = Field()  # Validity period in days
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc).replace(tzinfo=None)},
    )


class TransactionStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class PaymentTransaction(SQLModel, table=True):
    """
    Schema for tracking payment transactions.
    Stores all payment attempts and their status.
    """
    __tablename__ = "payment_transactions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    transaction_uuid: str = Field(unique=True, index=True)  # Unique transaction ID
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    plan_id: uuid.UUID = Field(foreign_key="plans.id", index=True)
    amount: float = Field(ge=0)
    status: TransactionStatus = Field(default=TransactionStatus.pending, index=True)
    esewa_ref_id: Optional[str] = Field(None, index=True)  # eSewa reference ID
    product_id: Optional[str] = None  # Product ID sent to eSewa
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc).replace(tzinfo=None)},
    )
    completed_at: Optional[datetime] = None


class UserSubscription(SQLModel, table=True):
    """
    Schema for tracking user's active plan subscriptions.
    Tracks when a plan was purchased, when it expires, and its status.
    """
    __tablename__ = "user_subscriptions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    plan_id: uuid.UUID = Field(foreign_key="plans.id", index=True)
    transaction_id: uuid.UUID = Field(foreign_key="payment_transactions.id", index=True)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)
    expires_at: datetime = Field(index=True)  # When the subscription expires
    is_active: bool = Field(default=True, index=True)  # Whether subscription is currently active
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc).replace(tzinfo=None)},
    )

