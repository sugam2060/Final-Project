"""
Pydantic models for payment-related API requests and responses.
"""
from pydantic import BaseModel, Field

from database.schema import UserPlan


class PaymentInitRequest(BaseModel):
    """Request model for payment initiation."""
    plan: UserPlan = Field(..., description="Plan name (standard or premium)")


class PaymentInitResponse(BaseModel):
    """Response model for payment initiation."""
    url: str = Field(..., description="eSewa payment initiation URL")
    parameters: dict = Field(..., description="Payment form parameters including signature")

