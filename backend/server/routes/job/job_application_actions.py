"""
Additional job application action routes (accept, reject, delete).
"""
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from database.db import get_session
from database.schema import (
    User,
    Job,
    JobApplication,
    ApplicationStatus,
)
from routes.auth.get_current_user import get_current_user
from utils.cloudinary_utils import delete_resume_from_cloudinary
from utils.email_utils import send_application_accepted_email
from pydantics.application_types import JobApplicationResponse
from routes.job.job_application import application_to_response

router = APIRouter(
    prefix="/api/jobs",
    tags=["Jobs - Applications"]
)


@router.patch("/applications/{application_id}/accept", response_model=JobApplicationResponse)
async def accept_application(
    application_id: str,
    job_id: str = Query(..., description="Job ID to verify ownership"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Accept a job application (change status to 'accepted').
    
    Only the job owner can accept applications for their jobs.
    """
    # Verify user is employer
    if user.role != "both":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can accept applications"
        )
    
    # Parse UUIDs
    try:
        application_uuid = uuid.UUID(application_id)
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify job ownership
    job_stmt = select(Job).where(Job.id == job_uuid, Job.employer_id == user.id)
    job_result = await session.execute(job_stmt)
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to manage applications for this job"
        )
    
    # Get application with applicant details
    from database.schema import User as UserSchema
    app_stmt = (
        select(JobApplication, UserSchema)
        .join(UserSchema, JobApplication.applicant_id == UserSchema.id)
        .where(
            JobApplication.id == application_uuid,
            JobApplication.job_id == job_uuid
        )
    )
    app_result = await session.execute(app_stmt)
    result = app_result.first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    application, applicant = result
    
    # Update status
    application.status = ApplicationStatus.accepted
    application.reviewed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    application.reviewed_by = user.id
    
    session.add(application)
    await session.commit()
    await session.refresh(application)
    
    # Schedule email to be sent in background (non-blocking)
    try:
        background_tasks.add_task(
            send_application_accepted_email,
            applicant_email=applicant.email,
            applicant_name=applicant.name,
            job_title=job.title,
            company_name=job.company_name,
        )
        logger.info(f"Scheduled acceptance email to be sent to {applicant.email} for job {job.title}")
    except Exception as e:
        # Log error but don't fail the request
        logger.error(f"Failed to schedule acceptance email: {str(e)}")
    
    return application_to_response(application)


@router.patch("/applications/{application_id}/reject", response_model=JobApplicationResponse)
async def reject_application(
    application_id: str,
    job_id: str = Query(..., description="Job ID to verify ownership"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Reject a job application (change status to 'rejected').
    
    Only the job owner can reject applications for their jobs.
    """
    # Verify user is employer
    if user.role != "both":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can reject applications"
        )
    
    # Parse UUIDs
    try:
        application_uuid = uuid.UUID(application_id)
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify job ownership
    job_stmt = select(Job).where(Job.id == job_uuid, Job.employer_id == user.id)
    job_result = await session.execute(job_stmt)
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to manage applications for this job"
        )
    
    # Get application
    app_stmt = select(JobApplication).where(
        JobApplication.id == application_uuid,
        JobApplication.job_id == job_uuid
    )
    app_result = await session.execute(app_stmt)
    application = app_result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Update status
    application.status = ApplicationStatus.rejected
    application.reviewed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    application.reviewed_by = user.id
    
    session.add(application)
    await session.commit()
    await session.refresh(application)
    
    return application_to_response(application)


@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: str,
    job_id: str = Query(..., description="Job ID to verify ownership"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Delete a job application and its associated resume from Cloudinary.
    
    Only the job owner can delete applications for their jobs.
    """
    # Verify user is employer
    if user.role != "both":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers can delete applications"
        )
    
    # Parse UUIDs
    try:
        application_uuid = uuid.UUID(application_id)
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format"
        )
    
    # Verify job ownership
    job_stmt = select(Job).where(Job.id == job_uuid, Job.employer_id == user.id)
    job_result = await session.execute(job_stmt)
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to manage applications for this job"
        )
    
    # Get application
    app_stmt = select(JobApplication).where(
        JobApplication.id == application_uuid,
        JobApplication.job_id == job_uuid
    )
    app_result = await session.execute(app_stmt)
    application = app_result.scalar_one_or_none()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Delete resume from Cloudinary if it exists
    if application.resume_url:
        await delete_resume_from_cloudinary(application.resume_url)
    
    # Delete application from database
    await session.delete(application)
    
    # Decrement job application count
    job.application_count = max(0, job.application_count - 1)
    session.add(job)
    
    await session.commit()
    
    return {"message": "Application deleted successfully"}

