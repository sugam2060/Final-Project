from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy import update

from database.schema import Job
from pydantics.job_types import JobResponse
# Import shared utility from auth module
from routes.auth.auth_utils import get_user_active_plan


def normalize_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert timezone-aware datetime to naive UTC datetime."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC and remove timezone info
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def validate_salary_range(salary_min: Optional[float], salary_max: Optional[float]) -> None:
    """
    Validate that salary_min is not greater than salary_max.
    
    Raises:
        HTTPException: 400 if validation fails
    """
    if salary_min is not None and salary_max is not None:
        if salary_min > salary_max:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="salary_min cannot be greater than salary_max"
            )


def validate_deadline_dates(
    application_deadline: Optional[datetime],
    expires_at: Optional[datetime],
    current_time: datetime,
) -> None:
    """
    Validate deadline dates are not in the past and application_deadline is before expires_at.
    
    Raises:
        HTTPException: 400 if validation fails
    """
    from fastapi import HTTPException, status
    
    if application_deadline and application_deadline < current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="application_deadline cannot be in the past"
        )
    
    if expires_at and expires_at < current_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expires_at cannot be in the past"
        )
    
    if application_deadline and expires_at:
        if application_deadline > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="application_deadline cannot be after expires_at"
            )


async def increment_job_view_counts(
    session: AsyncSession,
    job_ids: list[uuid.UUID],
) -> None:
    """
    Efficiently increment view counts for multiple jobs using a single bulk update.
    
    This is more efficient than updating each job individually.
    """
    if not job_ids:
        return
    
    # Use SQLAlchemy update statement for bulk operation
    stmt = (
        update(Job)
        .where(Job.id.in_(job_ids))
        .values(view_count=Job.view_count + 1)
    )
    await session.execute(stmt)
    await session.commit()


async def increment_single_job_view_count(
    session: AsyncSession,
    job_id: uuid.UUID,
) -> None:
    """
    Increment view count for a single job using database-level increment.
    
    This is more efficient than updating the object directly as it uses
    a single SQL UPDATE statement.
    """
    stmt = (
        update(Job)
        .where(Job.id == job_id)
        .values(view_count=Job.view_count + 1)
    )
    await session.execute(stmt)
    await session.commit()


def job_to_response(job: Job) -> JobResponse:
    """Convert Job model to JobResponse."""
    return JobResponse(
        id=str(job.id),
        title=job.title,
        company_name=job.company_name,
        location=job.location,
        work_mode=job.work_mode.value,
        description=job.description,
        employment_type=job.employment_type.value,
        experience_level=job.experience_level.value,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        salary_period=job.salary_period,
        is_salary_negotiable=job.is_salary_negotiable,
        category=job.category,
        industry=job.industry,
        application_deadline=job.application_deadline,
        expires_at=job.expires_at,
        published_at=job.published_at,
        status=job.status.value,
        is_featured=job.is_featured,
        is_active=job.is_active,
        view_count=job.view_count,
        application_count=job.application_count,
        employer_id=str(job.employer_id),
        created_at=job.created_at,
        updated_at=job.updated_at,
    )

