from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Optional
from datetime import datetime, timezone
import uuid

from database.schema import (
    UserSubscription,
    Plan,
    Job,
)
from .job_models import JobResponse


async def get_user_active_plan(
    session: AsyncSession,
    user_id: uuid.UUID
) -> Optional[str]:
    """
    Get the active plan name for a user from their active subscription.
    
    Returns:
        Optional[str]: Plan name ("standard" or "premium") or None if no active subscription
    """
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    stmt = (
        select(UserSubscription, Plan)
        .join(Plan, UserSubscription.plan_id == Plan.id)
        .where(
            UserSubscription.user_id == user_id,
            UserSubscription.is_active == True,
            UserSubscription.expires_at > current_time
        )
        .order_by(UserSubscription.expires_at.desc())
    )
    result = await session.execute(stmt)
    subscription_row = result.first()
    
    if subscription_row:
        subscription, plan = subscription_row
        return plan.plan_name.value  # Returns "standard" or "premium"
    
    return None


def normalize_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert timezone-aware datetime to naive UTC datetime."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to UTC and remove timezone info
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


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

