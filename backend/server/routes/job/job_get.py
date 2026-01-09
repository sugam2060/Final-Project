from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from routes.auth.get_current_user import get_current_user
from database.db import get_session
from database.schema import (
    User,
    Job,
    UserRole,
    JobStatus,
)
from .job_models import JobResponse, JobsListResponse
from .job_utils import job_to_response


router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs - Fetch"]
)


# Public routes must come before parameterized routes to avoid route matching conflicts
@router.get("/public", response_model=JobsListResponse)
async def get_public_jobs(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    category: Optional[str] = Query(None, description="Filter by job category"),
    employment_type: Optional[str] = Query(None, description="Filter by employment type"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    work_mode: Optional[str] = Query(None, description="Filter by work mode"),
    location: Optional[str] = Query(None, description="Filter by location (partial match)"),
    session: AsyncSession = Depends(get_session),
):
    """
    Get all published jobs available for public viewing.
    
    This endpoint is publicly accessible (no authentication required).
    Only returns jobs with status "published" that are active and not expired.
    
    Args:
        page: Page number (default: 1)
        page_size: Number of items per page (default: 10, max: 100)
        category: Optional filter by job category
        employment_type: Optional filter by employment type
        experience_level: Optional filter by experience level
        work_mode: Optional filter by work mode
        location: Optional filter by location (partial match)
        session: Database session
        
    Returns:
        JobsListResponse: Paginated list of published jobs with metadata
    """
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Build base query for published, active jobs
    conditions = [
        Job.status == JobStatus.published,
        Job.is_active == True,
    ]
    
    # Filter out expired jobs
    conditions.append(
        (Job.expires_at.is_(None)) | (Job.expires_at > current_time)
    )
    
    # Apply optional filters
    if category:
        conditions.append(Job.category.ilike(f"%{category}%"))
    if employment_type:
        conditions.append(Job.employment_type == employment_type)
    if experience_level:
        conditions.append(Job.experience_level == experience_level)
    if work_mode:
        conditions.append(Job.work_mode == work_mode)
    if location:
        conditions.append(Job.location.ilike(f"%{location}%"))
    
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Get total count
    count_stmt = select(func.count(Job.id)).where(*conditions)
    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()
    
    # Get jobs with pagination
    # Order by: featured first, then by published_at (newest first)
    stmt = (
        select(Job)
        .where(*conditions)
        .order_by(Job.is_featured.desc(), Job.published_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await session.execute(stmt)
    jobs = result.scalars().all()
    
    # Increment view count for each job (async update)
    for job in jobs:
        job.view_count += 1
    await session.commit()
    
    # Convert to response models
    job_responses = [job_to_response(job) for job in jobs]
    
    # Calculate if there's a next page
    has_next = offset + page_size < total
    
    return JobsListResponse(
        jobs=job_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_next=has_next,
    )


@router.get("/public/{job_id}", response_model=JobResponse)
async def get_public_job(
    job_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get a single published job by ID for public viewing.
    
    This endpoint is publicly accessible (no authentication required).
    Only returns jobs with status "published" that are active and not expired.
    
    Args:
        job_id: Job UUID
        session: Database session
        
    Returns:
        JobResponse: Job details
        
    Raises:
        HTTPException: 404 if job not found or not publicly available
    """
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )
    
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Get job - must be published, active, and not expired
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
            detail="Job not found or not available for viewing"
        )
    
    # Increment view count
    job.view_count += 1
    await session.commit()
    await session.refresh(job)
    
    return job_to_response(job)


@router.get("/my-jobs", response_model=JobsListResponse)
async def get_my_jobs(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get all jobs posted by the current user with pagination.
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    
    Args:
        page: Page number (default: 1)
        page_size: Number of items per page (default: 10, max: 100)
        user: Current authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobsListResponse: Paginated list of jobs with metadata
        
    Raises:
        HTTPException: 403 if user doesn't have 'both' role
    """
    # Check user role
    if user.role != UserRole.both:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with 'both' role (employer and employee) can view their jobs."
        )
    
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Get total count
    count_stmt = select(func.count(Job.id)).where(Job.employer_id == user.id)
    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()
    
    # Get jobs with pagination
    stmt = (
        select(Job)
        .where(Job.employer_id == user.id)
        .order_by(Job.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await session.execute(stmt)
    jobs = result.scalars().all()
    
    # Convert to response models
    job_responses = [job_to_response(job) for job in jobs]
    
    # Calculate if there's a next page
    has_next = offset + page_size < total
    
    return JobsListResponse(
        jobs=job_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_next=has_next,
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a single job by ID.
    
    Requirements:
    - User must be authenticated
    - User role must be "both" (employer and employee)
    - User must be the owner of the job
    
    Args:
        job_id: Job UUID
        user: Current authenticated user (from dependency)
        session: Database session
        
    Returns:
        JobResponse: Job details
        
    Raises:
        HTTPException: 403 if user doesn't have 'both' role or doesn't own the job
        HTTPException: 404 if job not found
    """
    # Check user role
    if user.role != UserRole.both:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with 'both' role (employer and employee) can view jobs."
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
            detail="You don't have permission to access this job"
        )
    
    return job_to_response(job)

