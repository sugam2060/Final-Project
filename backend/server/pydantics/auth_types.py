"""
Pydantic models for authentication-related API responses.
"""
from pydantic import BaseModel, Field
from typing import Optional


class UserResponse(BaseModel):
    """Response model for user information."""
    id: str = Field(..., description="User UUID as string")
    email: str = Field(..., description="User email address")
    name: Optional[str] = Field(None, description="User's full name")
    avatar_url: Optional[str] = Field(None, description="URL to user's avatar image")
    email_verified: bool = Field(..., description="Whether email is verified")
    role: Optional[str] = Field(None, description="User role (employee, employer, or both)")
    plan: Optional[str] = Field(None, description="Active plan name from UserSubscription (standard or premium)")

