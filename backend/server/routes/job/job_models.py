"""
Legacy import file - models have been moved to pydantics.job_types.
This file is kept for backward compatibility.
"""
# Import from the new location
from pydantics.job_types import (
    JobCreateRequest,
    JobUpdateRequest,
    JobStatusUpdateRequest,
    JobResponse,
    JobsListResponse,
)

# Re-export for backward compatibility
__all__ = [
    "JobCreateRequest",
    "JobUpdateRequest",
    "JobStatusUpdateRequest",
    "JobResponse",
    "JobsListResponse",
]

