from pydantic import BaseModel, Field
from typing import List

from database.schema import UserPlan


class PlanResponse(BaseModel):
    """Response model for a single subscription plan."""

    plan_name: UserPlan = Field(..., description="Plan name (standard or premium)")
    price: float = Field(..., gt=0, description="Price of the plan")
    currency: str = Field(..., description="Currency code (e.g., NPR)")
    valid_for: int = Field(..., gt=0, description="Validity period in days")
    description: str | None = Field(None, description="Plan description")


class PlansListResponse(BaseModel):
    """Response model for list of available subscription plans."""

    plans: List[PlanResponse]


