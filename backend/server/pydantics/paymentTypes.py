from pydantic import BaseModel, Field
from typing import Optional
from database.schema import UserPlan


# -----------------------------
# Payment Request/Response Models
# -----------------------------
class PaymentInitiateRequest(BaseModel):
    """Request model for initiating eSewa payment."""
    amount: float = Field(..., gt=0, description="Payment amount")
    plan: UserPlan = Field(..., description="Subscription plan (standard or premium)")
    product_name: Optional[str] = Field(None, description="Product name/description")


class PaymentInitiateResponse(BaseModel):
    """Response model for payment initiation."""
    payment_url: str  # eSewa form submission URL
    transaction_uuid: str
    form_data: dict  # Form fields to submit to eSewa


# -----------------------------
# Transaction Status Check Models
# -----------------------------
class TransactionStatusRequest(BaseModel):
    """Request model for checking transaction status."""
    transaction_uuid: str = Field(..., description="Transaction UUID")
    total_amount: float = Field(..., gt=0, description="Total transaction amount")
    product_code: Optional[str] = Field(None, description="Product code (defaults to merchant code)")


class TransactionStatusResponse(BaseModel):
    """Response model for transaction status check."""
    transaction_uuid: str
    status: str = Field(..., description="Transaction status (SUCCESS, FAILED, PENDING)")
    reference_id: Optional[str] = Field(None, description="eSewa reference ID if successful")
    message: Optional[str] = Field(None, description="Status message from eSewa")

