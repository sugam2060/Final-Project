from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from database.schema import (
    JobStatus,
    EmploymentType,
    ExperienceLevel,
    WorkMode,
)


# -----------------------------
# Request Models
# -----------------------------
class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, description="Job title")
    company_name: str = Field(..., min_length=2, max_length=100, description="Company name")
    location: str = Field(..., min_length=2, max_length=200, description="Work location")
    work_mode: WorkMode = Field(default=WorkMode.onsite, description="Remote, Hybrid, or Onsite")
    description: str = Field(..., min_length=20, description="Job description (rich text/markdown)")
    employment_type: EmploymentType = Field(..., description="Full-time, Part-time, etc.")
    experience_level: ExperienceLevel = Field(..., description="Entry, Mid, Senior, Executive")
    
    # Optional fields
    salary_min: Optional[float] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[float] = Field(None, ge=0, description="Maximum salary")
    salary_currency: str = Field(default="NPR", description="Currency code")
    salary_period: Optional[str] = Field(None, description="e.g., 'per month', 'per year', 'per hour'")
    is_salary_negotiable: bool = Field(default=False, description="Whether salary is negotiable")
    
    category: Optional[str] = Field(None, description="Job category")
    industry: Optional[str] = Field(None, description="Industry sector")
    
    application_deadline: Optional[datetime] = Field(None, description="Application deadline")
    expires_at: Optional[datetime] = Field(None, description="When job posting expires")
    
    status: JobStatus = Field(default=JobStatus.draft, description="Job status")
    is_featured: bool = Field(default=False, description="Featured jobs (premium feature)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Senior Software Engineer",
                "company_name": "Tech Corp",
                "location": "Kathmandu, Nepal",
                "work_mode": "hybrid",
                "description": "We are looking for an experienced software engineer...",
                "employment_type": "full-time",
                "experience_level": "senior",
                "salary_min": 50000,
                "salary_max": 80000,
                "salary_currency": "NPR",
                "salary_period": "per month",
                "category": "Software Development",
                "industry": "Technology"
            }
        }


class JobUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200, description="Job title")
    company_name: Optional[str] = Field(None, min_length=2, max_length=100, description="Company name")
    location: Optional[str] = Field(None, min_length=2, max_length=200, description="Work location")
    work_mode: Optional[WorkMode] = Field(None, description="Remote, Hybrid, or Onsite")
    description: Optional[str] = Field(None, min_length=20, description="Job description (rich text/markdown)")
    employment_type: Optional[EmploymentType] = Field(None, description="Full-time, Part-time, etc.")
    experience_level: Optional[ExperienceLevel] = Field(None, description="Entry, Mid, Senior, Executive")
    
    # Optional fields
    salary_min: Optional[float] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[float] = Field(None, ge=0, description="Maximum salary")
    salary_currency: Optional[str] = Field(None, description="Currency code")
    salary_period: Optional[str] = Field(None, description="e.g., 'per month', 'per year', 'per hour'")
    is_salary_negotiable: Optional[bool] = Field(None, description="Whether salary is negotiable")
    
    category: Optional[str] = Field(None, description="Job category")
    industry: Optional[str] = Field(None, description="Industry sector")
    
    application_deadline: Optional[datetime] = Field(None, description="Application deadline")
    expires_at: Optional[datetime] = Field(None, description="When job posting expires")
    
    status: Optional[JobStatus] = Field(None, description="Job status (draft, published, etc.)")
    is_featured: Optional[bool] = Field(None, description="Featured jobs (premium feature)")


class JobStatusUpdateRequest(BaseModel):
    status: JobStatus = Field(..., description="New job status")


# -----------------------------
# Response Models
# -----------------------------
class JobResponse(BaseModel):
    id: str
    title: str
    company_name: str
    location: str
    work_mode: str
    description: str
    employment_type: str
    experience_level: str
    salary_min: Optional[float]
    salary_max: Optional[float]
    salary_currency: str
    salary_period: Optional[str]
    is_salary_negotiable: bool
    category: Optional[str]
    industry: Optional[str]
    application_deadline: Optional[datetime]
    expires_at: Optional[datetime]
    published_at: Optional[datetime]
    status: str
    is_featured: bool
    is_active: bool
    view_count: int
    application_count: int
    employer_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobsListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int
    has_next: bool

