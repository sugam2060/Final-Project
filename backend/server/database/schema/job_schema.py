from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
import uuid
from enum import Enum
from sqlalchemy import Column, Text

if TYPE_CHECKING:
    from database.schema.user_schema import User


class JobStatus(str, Enum):
    draft = "draft"
    published = "published"
    closed = "closed"
    expired = "expired"


class EmploymentType(str, Enum):
    full_time = "full-time"
    part_time = "part-time"
    contract = "contract"
    freelance = "freelance"
    internship = "internship"


class ExperienceLevel(str, Enum):
    entry = "entry"
    mid = "mid"
    senior = "senior"
    executive = "executive"


class WorkMode(str, Enum):
    remote = "remote"
    hybrid = "hybrid"
    onsite = "onsite"


class Job(SQLModel, table=True):
    """
    Schema for job postings in the job portal.
    Tracks all job details including title, description, requirements, and status.
    """
    __tablename__ = "jobs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Basic Information
    title: str = Field(index=True)  # Job title
    company_name: str = Field(index=True)  # Company name
    location: str = Field(index=True)  # Work location
    work_mode: WorkMode = Field(default=WorkMode.onsite)  # Remote, Hybrid, or Onsite
    
    # Job Details
    description: str = Field(sa_column=Column(Text))  # Rich text/markdown description
    employment_type: EmploymentType = Field(index=True)  # Full-time, Part-time, etc.
    experience_level: ExperienceLevel = Field(index=True)  # Entry, Mid, Senior, Executive
    
    # Compensation (Optional)
    salary_min: Optional[float] = None  # Minimum salary
    salary_max: Optional[float] = None  # Maximum salary
    salary_currency: str = Field(default="NPR")  # Currency code
    salary_period: Optional[str] = None  # e.g., "per month", "per year", "per hour"
    is_salary_negotiable: bool = Field(default=False)  # Whether salary is negotiable
    
    # Category & Industry
    category: Optional[str] = Field(default=None, index=True)  # Job category (e.g., "Software Development", "Marketing")
    industry: Optional[str] = Field(default=None, index=True)  # Industry sector
    
    # Dates & Deadlines
    application_deadline: Optional[datetime] = Field(default=None, index=True)  # Application deadline
    expires_at: Optional[datetime] = Field(default=None, index=True)  # When job posting expires
    published_at: Optional[datetime] = Field(default=None, index=True)  # When job was published
    
    # Status & Visibility
    status: JobStatus = Field(default=JobStatus.draft, index=True)  # Draft, Published, Closed, Expired
    is_featured: bool = Field(default=False, index=True)  # Featured jobs (premium feature)
    is_active: bool = Field(default=True, index=True)  # Soft delete flag
    
    # Statistics
    view_count: int = Field(default=0)  # Number of views
    application_count: int = Field(default=0)  # Number of applications received
    
    # Foreign Keys
    employer_id: uuid.UUID = Field(foreign_key="users.id", index=True)  # User who posted the job
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc).replace(tzinfo=None)},
    )
    
    # Relationships
    employer: Optional["User"] = Relationship(back_populates="posted_jobs")
    applications: List["JobApplication"] = Relationship(
        back_populates="job",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ApplicationStatus(str, Enum):
    pending = "pending"
    reviewing = "reviewing"
    shortlisted = "shortlisted"
    rejected = "rejected"
    accepted = "accepted"
    withdrawn = "withdrawn"


class JobApplication(SQLModel, table=True):
    """
    Schema for tracking job applications.
    Links applicants (users) to job postings with application details.
    """
    __tablename__ = "job_applications"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    job_id: uuid.UUID = Field(foreign_key="jobs.id", index=True)  # Job being applied to
    applicant_id: uuid.UUID = Field(foreign_key="users.id", index=True)  # User applying for the job
    
    # Application Details
    cover_letter: Optional[str] = Field(default=None, sa_column=Column(Text))  # Cover letter text
    resume_url: Optional[str] = None  # URL to resume/CV file
    portfolio_url: Optional[str] = None  # Portfolio or portfolio URL
    linkedin_url: Optional[str] = None  # LinkedIn profile URL
    github_url: Optional[str] = None  # GitHub profile URL (for tech jobs)
    
    # Additional Information
    expected_salary: Optional[float] = None  # Expected salary from applicant
    availability_date: Optional[datetime] = None  # When applicant can start
    additional_notes: Optional[str] = Field(default=None, sa_column=Column(Text))  # Additional notes from applicant
    
    # Status Tracking
    status: ApplicationStatus = Field(default=ApplicationStatus.pending, index=True)  # Application status
    reviewed_at: Optional[datetime] = None  # When application was reviewed
    reviewed_by: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")  # Who reviewed the application
    review_notes: Optional[str] = Field(default=None, sa_column=Column(Text))  # Internal review notes
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc).replace(tzinfo=None)},
    )
    
    # Relationships
    job: Optional[Job] = Relationship(back_populates="applications")
    # Note: applicant relationship removed to avoid ambiguous foreign key error
    # JobApplication has two FKs to User (applicant_id and reviewed_by)
    # To access applicant, use: select(User).join(JobApplication, User.id == JobApplication.applicant_id)

