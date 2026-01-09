"""
Reusable dependencies for job routes to reduce code duplication and improve maintainability.
"""
from fastapi import Depends, HTTPException, status, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Annotated
import uuid

from routes.auth.get_current_user import get_current_user
from database.db import get_session
from database.schema import User, Job, UserRole


# -----------------------------
# Common Dependencies
# -----------------------------

async def require_employer_role(
    user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that ensures the user has 'both' role (employer and employee).
    
    Raises:
        HTTPException: 403 if user doesn't have 'both' role
    """
    if user.role != UserRole.both:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with 'both' role (employer and employee) can perform this action."
        )
    return user


def parse_job_uuid(job_id: str) -> uuid.UUID:
    """
    Parse and validate job UUID from path parameter.
    
    Raises:
        HTTPException: 400 if UUID format is invalid
    """
    try:
        return uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )


async def get_job_by_id(
    job_id: Annotated[str, Path(description="Job UUID")],
    session: AsyncSession = Depends(get_session),
) -> Job:
    """
    Dependency that fetches a job by ID.
    
    Raises:
        HTTPException: 400 if UUID format is invalid
        HTTPException: 404 if job not found
    """
    job_uuid = parse_job_uuid(job_id)
    
    stmt = select(Job).where(Job.id == job_uuid)
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job


async def require_job_ownership(
    job_id: Annotated[str, Path(description="Job UUID")],
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_employer_role),
) -> tuple[Job, User]:
    """
    Dependency that ensures the user owns the job.
    
    Returns:
        tuple[Job, User]: The job and user tuple
        
    Raises:
        HTTPException: 403 if user doesn't own the job
        HTTPException: 404 if job not found
    """
    job = await get_job_by_id(job_id, session)
    
    if job.employer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this job"
        )
    
    return job, user

