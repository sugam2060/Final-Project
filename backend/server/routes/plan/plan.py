"""
Plan routes for fetching available subscription plans.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from database.db import get_session
from database.schema import Plan
from pydantics.plans import PlanResponse, PlansListResponse


router = APIRouter(
    prefix="/api/plan",
    tags=["Plan"],
)


def plan_to_response(plan: Plan) -> PlanResponse:
    """
    Convert Plan database model to PlanResponse.
    
    Args:
        plan: Plan database model
        
    Returns:
        PlanResponse: Response model
    """
    return PlanResponse(
        plan_name=plan.plan_name,
        price=plan.price,
        currency=plan.currency,
        valid_for=plan.valid_for,
        description=plan.description,
    )


@router.get(
    "/",
    response_model=PlansListResponse,
    summary="Get all active subscription plans",
    description="Returns all active subscription plans that can be purchased, ordered by plan name.",
)
async def get_plans(
    session: AsyncSession = Depends(get_session),
):
    """
    Fetch all active plans from the database and return them to the frontend.
    
    This endpoint:
    1. Queries all active plans from the database
    2. Orders them by plan name for consistent results
    3. Converts them to response models
    4. Returns the list of available plans
    
    Returns:
        PlansListResponse: List of active subscription plans
        
    Raises:
        HTTPException: 404 if no active plans are found
    """
    # Query active plans with ordering for consistent results
    stmt = (
        select(Plan)
        .where(Plan.is_active == True)  # noqa: E712
        .order_by(Plan.plan_name)
    )
    result = await session.execute(stmt)
    plans = result.scalars().all()

    if not plans:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active plans found",
        )

    # Convert to response models using utility function
    return PlansListResponse(
        plans=[plan_to_response(plan) for plan in plans]
    )


