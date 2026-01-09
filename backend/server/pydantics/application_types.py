"""
Pydantic models for job application requests and responses.
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from datetime import datetime

from database.schema import ApplicationStatus


# -----------------------------
# Request Models
# -----------------------------
class JobApplicationCreateRequest(BaseModel):
    """Request model for creating a job application."""
    cover_letter: Optional[str] = Field(None, description="Cover letter text")
    portfolio_url: Optional[str] = Field(None, description="Portfolio URL")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn profile URL")
    github_url: Optional[str] = Field(None, description="GitHub profile URL")
    expected_salary: Optional[float] = Field(None, ge=0, description="Expected salary")
    availability_date: Optional[datetime] = Field(None, description="When applicant can start")
    additional_notes: Optional[str] = Field(None, description="Additional notes from applicant")
    
    class Config:
        json_schema_extra = {
            "example": {
                "cover_letter": "I am excited to apply for this position...",
                "portfolio_url": "https://example.com/portfolio",
                "linkedin_url": "https://linkedin.com/in/username",
                "github_url": "https://github.com/username",
                "expected_salary": 50000,
                "availability_date": "2024-02-01T00:00:00Z",
                "additional_notes": "I am available for immediate start"
            }
        }


# -----------------------------
# Response Models
# -----------------------------
class JobApplicationResponse(BaseModel):
    """Response model for job application."""
    id: str
    job_id: str
    applicant_id: str
    cover_letter: Optional[str]
    resume_url: Optional[str]
    portfolio_url: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    expected_salary: Optional[float]
    availability_date: Optional[datetime]
    additional_notes: Optional[str]
    status: str
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[str]
    review_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobApplicationListResponse(BaseModel):
    """Response model for list of job applications."""
    applications: list[JobApplicationResponse]
    total: int
    page: int
    page_size: int
    has_next: bool

