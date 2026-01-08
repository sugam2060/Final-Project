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


@router.get(
    "/",
    response_model=PlansListResponse,
    summary="Get all active subscription plans",
    description="Returns all active subscription plans that can be purchased.",
)
async def get_plans(
    session: AsyncSession = Depends(get_session),
):
    """
    Fetch all active plans from the database and return them to the frontend.
    """
    try:
        stmt = select(Plan).where(Plan.is_active == True)  # noqa: E712
        result = await session.execute(stmt)
        plans = result.scalars().all()

        if not plans:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active plans found",
            )

        return PlansListResponse(
            plans=[
                PlanResponse(
                    plan_name=p.plan_name,
                    price=p.price,
                    currency=p.currency,
                    valid_for=p.valid_for,
                    description=p.description,
                )
                for p in plans
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching plans: {str(e)}",
        )


