from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Optional
from datetime import datetime, timezone
import uuid

from routes.auth.get_current_user import get_current_user
from database.db import get_session
from database.schema import (
    User,
    Job,
    JobStatus,
    UserRole,
    UserPlan,
)
from .job_models import (
    JobCreateRequest,
    JobUpdateRequest,
    JobStatusUpdateRequest,
    JobResponse,
)
from .job_utils import (
    get_user_active_plan,
    normalize_datetime,
    job_to_response,
)


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs - Post"]
)


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreateRequest,
    user: User = Depends(get_current_user),
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
        user: Current authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobResponse: Created job posting
        
    Raises:
        HTTPException: 403 if user doesn't meet requirements
        HTTPException: 400 if validation fails
    """
    # Check user role
    if user.role != UserRole.both:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with 'both' role (employer and employee) can post jobs. Please upgrade your account."
        )
    
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
    
    # Validate salary range if both are provided
    if job_data.salary_min is not None and job_data.salary_max is not None:
        if job_data.salary_min > job_data.salary_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="salary_min cannot be greater than salary_max"
            )
    
    # Validate deadline dates
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    normalized_deadline = normalize_datetime(job_data.application_deadline)
    normalized_expires_at = normalize_datetime(job_data.expires_at)
    
    if normalized_deadline and normalized_deadline < current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="application_deadline cannot be in the past"
        )
    
    if normalized_expires_at and normalized_expires_at < current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expires_at cannot be in the past"
        )
    
    if normalized_deadline and normalized_expires_at:
        if normalized_deadline > normalized_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="application_deadline cannot be after expires_at"
            )
    
    # Set published_at if status is published
    published_at = None
    if job_data.status == JobStatus.published:
        published_at = current_time
    
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
    job_id: str,
    job_data: JobUpdateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Update a job posting.
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    - User must be the owner of the job
    
    Args:
        job_id: Job UUID
        job_data: Job posting details to update
        user: Current authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobResponse: Updated job posting
        
    Raises:
        HTTPException: 403 if user doesn't meet requirements
        HTTPException: 404 if job not found
        HTTPException: 400 if validation fails
    """
    # Check user role
    if user.role != UserRole.both:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with 'both' role (employer and employee) can update jobs."
        )
    
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Get job
    stmt = select(Job).where(Job.id == job_uuid)
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if user owns the job
    if job.employer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this job"
        )
    
    # Validate salary range if both are provided
    salary_min = job_data.salary_min if job_data.salary_min is not None else job.salary_min
    salary_max = job_data.salary_max if job_data.salary_max is not None else job.salary_max
    
    if salary_min is not None and salary_max is not None:
        if salary_min > salary_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="salary_min cannot be greater than salary_max"
            )
    
    # Validate deadline dates
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Normalize datetime fields if provided
    normalized_deadline = normalize_datetime(job_data.application_deadline) if job_data.application_deadline is not None else None
    normalized_expires_at = normalize_datetime(job_data.expires_at) if job_data.expires_at is not None else None
    
    # Use normalized values or keep existing values
    final_deadline = normalized_deadline if normalized_deadline is not None else job.application_deadline
    final_expires_at = normalized_expires_at if normalized_expires_at is not None else job.expires_at
    
    if final_deadline and final_deadline < current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="application_deadline cannot be in the past"
        )
    
    if final_expires_at and final_expires_at < current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expires_at cannot be in the past"
        )
    
    if final_deadline and final_expires_at:
        if final_deadline > final_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="application_deadline cannot be after expires_at"
            )
    
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
    job_id: str,
    status_data: JobStatusUpdateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Update job status (publish/draft).
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    - User must be the owner of the job
    
    Args:
        job_id: Job UUID
        status_data: New status (draft or published)
        user: Current authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobResponse: Updated job posting
        
    Raises:
        HTTPException: 403 if user doesn't meet requirements
        HTTPException: 404 if job not found
    """
    # Check user role
    if user.role != UserRole.both:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with 'both' role (employer and employee) can update job status."
        )
    
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    # Get job
    stmt = select(Job).where(Job.id == job_uuid)
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if user owns the job
    if job.employer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this job"
        )
    
    # Update status
    job.status = status_data.status
    
    # Set published_at if status is published and not already set
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    if status_data.status == JobStatus.published and job.published_at is None:
        job.published_at = current_time
    
    await session.commit()
    await session.refresh(job)
    
    return job_to_response(job)

