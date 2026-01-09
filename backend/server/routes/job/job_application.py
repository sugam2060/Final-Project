"""
Job application routes for handling job applications with resume uploads.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from typing import Optional
from datetime import datetime, timezone

from database.db import get_session
from database.schema import (
    User,
    Job,
    JobApplication,
    ApplicationStatus,
    JobStatus,
)
from routes.auth.get_current_user import get_current_user
from utils.cloudinary_utils import upload_resume_to_cloudinary, delete_resume_from_cloudinary
from pydantics.application_types import (
    JobApplicationCreateRequest,
    JobApplicationResponse,
    JobApplicationListResponse,
)

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs - Applications"]
)


def application_to_response(application: JobApplication) -> JobApplicationResponse:
    """Convert JobApplication model to JobApplicationResponse."""
    return JobApplicationResponse(
        id=str(application.id),
        job_id=str(application.job_id),
        applicant_id=str(application.applicant_id),
        cover_letter=application.cover_letter,
        resume_url=application.resume_url,
        portfolio_url=application.portfolio_url,
        linkedin_url=application.linkedin_url,
        github_url=application.github_url,
        expected_salary=application.expected_salary,
        availability_date=application.availability_date,
        additional_notes=application.additional_notes,
        status=application.status.value,
        reviewed_at=application.reviewed_at,
        reviewed_by=str(application.reviewed_by) if application.reviewed_by else None,
        review_notes=application.review_notes,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.post("/{job_id}/apply", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    job_id: str,
    resume: Optional[UploadFile] = File(None, description="Resume PDF file"),
    cover_letter: Optional[str] = Form(None, description="Cover letter text"),
    portfolio_url: Optional[str] = Form(None, description="Portfolio URL"),
    linkedin_url: Optional[str] = Form(None, description="LinkedIn profile URL"),
    github_url: Optional[str] = Form(None, description="GitHub profile URL"),
    expected_salary: Optional[float] = Form(None, description="Expected salary"),
    availability_date: Optional[str] = Form(None, description="Availability date (ISO format)"),
    additional_notes: Optional[str] = Form(None, description="Additional notes"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Apply for a job posting.
    
    This endpoint allows authenticated users to apply for a job by:
    1. Uploading a resume PDF (uploaded to Cloudinary)
    2. Providing optional application details (cover letter, portfolio, etc.)
    
    Args:
        job_id: Job UUID
        resume: Optional PDF resume file
        cover_letter: Optional cover letter text
        portfolio_url: Optional portfolio URL
        linkedin_url: Optional LinkedIn profile URL
        github_url: Optional GitHub profile URL
        expected_salary: Optional expected salary
        availability_date: Optional availability date (ISO format)
        additional_notes: Optional additional notes
        user: Authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobApplicationResponse: Created application details
        
    Raises:
        HTTPException: 400 if job not found, not published, or already applied
        HTTPException: 400 if resume is required but not provided
        HTTPException: 500 if file upload fails
    """
    # Parse and validate job UUID
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Check if job exists and is available for applications
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    stmt = select(Job).where(
        Job.id == job_uuid,
        Job.status == JobStatus.published,
        Job.is_active == True,
        (Job.expires_at.is_(None)) | (Job.expires_at > current_time)
    )
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not available for applications"
        )
    
    # Check if user has already applied for this job
    existing_application_stmt = select(JobApplication).where(
        JobApplication.job_id == job_uuid,
        JobApplication.applicant_id == user.id
    )
    existing_result = await session.execute(existing_application_stmt)
    existing_application = existing_result.scalar_one_or_none()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this job"
        )
    
    # Validate resume is provided
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume file is required"
        )
    
    # Upload resume to Cloudinary
    resume_url = await upload_resume_to_cloudinary(
        file=resume,
        user_id=str(user.id),
        job_id=job_id,
    )
    
    # Parse availability_date if provided
    parsed_availability_date = None
    if availability_date:
        try:
            parsed_availability_date = datetime.fromisoformat(availability_date.replace('Z', '+00:00'))
            if parsed_availability_date.tzinfo:
                parsed_availability_date = parsed_availability_date.astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid availability_date format. Use ISO format (e.g., 2024-02-01T00:00:00Z)"
            )
    
    # Create job application
    new_application = JobApplication(
        job_id=job_uuid,
        applicant_id=user.id,
        cover_letter=cover_letter,
        resume_url=resume_url,
        portfolio_url=portfolio_url,
        linkedin_url=linkedin_url,
        github_url=github_url,
        expected_salary=expected_salary,
        availability_date=parsed_availability_date,
        additional_notes=additional_notes,
        status=ApplicationStatus.pending,
    )
    
    session.add(new_application)
    
    # Increment application count on the job
    job.application_count += 1
    
    await session.commit()
    await session.refresh(new_application)
    
    return application_to_response(new_application)


@router.get("/{job_id}/applications", response_model=JobApplicationListResponse)
async def get_job_applications(
    job_id: str,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get all applications for a specific job (employer only).
    
    Only the job owner can view applications for their job.
    
    Args:
        job_id: Job UUID
        page: Page number (default: 1)
        page_size: Items per page (default: 10, max: 100)
        user: Authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobApplicationListResponse: Paginated list of applications
        
    Raises:
        HTTPException: 403 if user is not the job owner
        HTTPException: 404 if job not found
    """
    # Parse and validate job UUID
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Get job and verify ownership
    stmt = select(Job).where(Job.id == job_uuid)
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.employer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view applications for this job"
        )
    
    offset = (page - 1) * page_size
    
    # Get total count
    count_stmt = select(func.count(JobApplication.id)).where(JobApplication.job_id == job_uuid)
    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()
    
    # Get applications with pagination
    applications_stmt = (
        select(JobApplication)
        .where(JobApplication.job_id == job_uuid)
        .order_by(JobApplication.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    applications_result = await session.execute(applications_stmt)
    applications = applications_result.scalars().all()
    
    # Convert to response models
    application_responses = [application_to_response(app) for app in applications]
    
    has_next = offset + page_size < total
    
    return JobApplicationListResponse(
        applications=application_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_next=has_next,
    )


@router.get("/my-applications", response_model=JobApplicationListResponse)
async def get_my_applications(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get all job applications submitted by the current user.
    
    Args:
        page: Page number (default: 1)
        page_size: Items per page (default: 10, max: 100)
        user: Authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobApplicationListResponse: Paginated list of user's applications
    """
    offset = (page - 1) * page_size
    
    # Get total count
    count_stmt = select(func.count(JobApplication.id)).where(JobApplication.applicant_id == user.id)
    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()
    
    # Get applications with pagination
    applications_stmt = (
        select(JobApplication)
        .where(JobApplication.applicant_id == user.id)
        .order_by(JobApplication.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    applications_result = await session.execute(applications_stmt)
    applications = applications_result.scalars().all()
    
    # Convert to response models
    application_responses = [application_to_response(app) for app in applications]
    
    has_next = offset + page_size < total
    
    return JobApplicationListResponse(
        applications=application_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_next=has_next,
    )

