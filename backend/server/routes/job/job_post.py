from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Optional
from datetime import datetime, timezone

from database.db import get_session
from database.schema import (
    User,
    Job,
    JobStatus,
    UserPlan,
)
from pydantics.job_types import (
    JobCreateRequest,
    JobUpdateRequest,
    JobStatusUpdateRequest,
    JobResponse,
)
from .job_utils import (
    get_user_active_plan,
    normalize_datetime,
    job_to_response,
    validate_salary_range,
    validate_deadline_dates,
)
from .job_dependencies import require_employer_role, require_job_ownership


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs - Post"]
)


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreateRequest,
    user: User = Depends(require_employer_role),
    session: AsyncSession = Depends(get_session),
):
    """
    Create a new job posting.
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    - User must have an active subscription (standard or premium plan)
    
    Args:
        job_data: Job posting details
        user: Current authenticated user (from dependency, already validated for role)
        session: Database session
        
    Returns:
        JobResponse: Created job posting
        
    Raises:
        HTTPException: 403 if user doesn't have active subscription
        HTTPException: 400 if validation fails
    """
    # Check user's active plan
    user_plan = await get_user_active_plan(session, user.id)
    
    if not user_plan:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You need an active subscription (standard or premium plan) to post jobs."
        )
    
    if user_plan not in [UserPlan.standard.value, UserPlan.premium.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid plan '{user_plan}'. You need a standard or premium plan to post jobs."
        )
    
    # Validate salary range
    validate_salary_range(job_data.salary_min, job_data.salary_max)
    
    # Validate deadline dates
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    normalized_deadline = normalize_datetime(job_data.application_deadline)
    normalized_expires_at = normalize_datetime(job_data.expires_at)
    
    validate_deadline_dates(normalized_deadline, normalized_expires_at, current_time)
    
    # Set published_at if status is published
    published_at = current_time if job_data.status == JobStatus.published else None
    
    # Create job instance
    new_job = Job(
        title=job_data.title,
        company_name=job_data.company_name,
        location=job_data.location,
        work_mode=job_data.work_mode,
        description=job_data.description,
        employment_type=job_data.employment_type,
        experience_level=job_data.experience_level,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
        salary_currency=job_data.salary_currency,
        salary_period=job_data.salary_period,
        is_salary_negotiable=job_data.is_salary_negotiable,
        category=job_data.category,
        industry=job_data.industry,
        application_deadline=normalized_deadline,
        expires_at=normalized_expires_at,
        published_at=published_at,
        status=job_data.status,
        is_featured=job_data.is_featured,
        employer_id=user.id,
    )
    
    session.add(new_job)
    await session.commit()
    await session.refresh(new_job)
    
    return job_to_response(new_job)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_data: JobUpdateRequest,
    job_user: tuple[Job, User] = Depends(require_job_ownership),
    session: AsyncSession = Depends(get_session),
):
    """
    Update a job posting.
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    - User must be the owner of the job
    
    Args:
        job_data: Job posting details to update
        job_user: Tuple of (Job, User) from dependency (already validated)
        session: Database session
        
    Returns:
        JobResponse: Updated job posting
        
    Raises:
        HTTPException: 400 if validation fails
    """
    job, _ = job_user
    
    # Validate salary range - use provided values or existing values
    salary_min = job_data.salary_min if job_data.salary_min is not None else job.salary_min
    salary_max = job_data.salary_max if job_data.salary_max is not None else job.salary_max
    validate_salary_range(salary_min, salary_max)
    
    # Validate deadline dates
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Normalize datetime fields if provided
    normalized_deadline = normalize_datetime(job_data.application_deadline) if job_data.application_deadline is not None else None
    normalized_expires_at = normalize_datetime(job_data.expires_at) if job_data.expires_at is not None else None
    
    # Use normalized values or keep existing values
    final_deadline = normalized_deadline if normalized_deadline is not None else job.application_deadline
    final_expires_at = normalized_expires_at if normalized_expires_at is not None else job.expires_at
    
    validate_deadline_dates(final_deadline, final_expires_at, current_time)
    
    # Update job fields
    update_data = job_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            # Skip datetime fields - we'll set them separately with normalized values
            if field in ['application_deadline', 'expires_at', 'status']:
                continue
            setattr(job, field, value)
    
    # Set normalized datetime fields explicitly
    if normalized_deadline is not None:
        job.application_deadline = normalized_deadline
    if normalized_expires_at is not None:
        job.expires_at = normalized_expires_at
    
    # Handle status update
    if job_data.status is not None:
        job.status = job_data.status
        # Set published_at if status is published and not already set
        if job_data.status == JobStatus.published and job.published_at is None:
            job.published_at = current_time
    
    await session.commit()
    await session.refresh(job)
    
    return job_to_response(job)


@router.patch("/{job_id}/status", response_model=JobResponse)
async def update_job_status(
    status_data: JobStatusUpdateRequest,
    job_user: tuple[Job, User] = Depends(require_job_ownership),
    session: AsyncSession = Depends(get_session),
):
    """
    Update job status (publish/draft).
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    - User must be the owner of the job
    
    Args:
        status_data: New status (draft or published)
        job_user: Tuple of (Job, User) from dependency (already validated)
        session: Database session
        
    Returns:
        JobResponse: Updated job posting
    """
    job, _ = job_user
    
    # Update status
    job.status = status_data.status
    
    # Set published_at if status is published and not already set
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    if status_data.status == JobStatus.published and job.published_at is None:
        job.published_at = current_time
    
    await session.commit()
    await session.refresh(job)
    
    return job_to_response(job)


@router.delete("/{job_id}")
async def delete_job(
    job_user: tuple[Job, User] = Depends(require_job_ownership),
    session: AsyncSession = Depends(get_session),
):
    """
    Delete a job posting and all its associated applications.
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    - User must be the owner of the job
    
    This will:
    - Delete all job applications associated with this job
    - Delete all resume files from Cloudinary for these applications
    - Delete the job posting itself
    
    Args:
        job_user: Tuple of (Job, User) from dependency (already validated)
        session: Database session
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 403 if user doesn't own the job
        HTTPException: 404 if job not found
    """
    job, _ = job_user
    
    # Get all applications for this job to delete resumes from Cloudinary
    from database.schema import JobApplication
    from utils.cloudinary_utils import delete_resume_from_cloudinary
    import logging
    
    logger = logging.getLogger(__name__)
    
    applications_stmt = select(JobApplication).where(JobApplication.job_id == job.id)
    applications_result = await session.execute(applications_stmt)
    applications = applications_result.scalars().all()
    
    # Delete resumes from Cloudinary for all applications
    for application in applications:
        if application.resume_url:
            try:
                await delete_resume_from_cloudinary(application.resume_url)
            except Exception as e:
                # Log error but continue with deletion
                logger.warning(f"Failed to delete resume from Cloudinary: {str(e)}")
    
    # Delete the job (cascade will delete applications automatically)
    await session.delete(job)
    await session.commit()
    
    return {"message": "Job deleted successfully"}

