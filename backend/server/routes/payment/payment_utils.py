"""
Shared utilities for payment routes.
"""
import uuid
import json
import base64
import logging
from typing import Optional, Tuple
from urllib.parse import urlencode

from database.schema import UserPlan
from config import settings

logger = logging.getLogger(__name__)


def parse_payment_data(
    data: Optional[str],
    transaction_uuid: Optional[str],
    user_id: Optional[str]
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Parse payment response data from eSewa callback.
    
    Args:
        data: Base64 encoded JSON data from eSewa
        transaction_uuid: Transaction UUID from URL
        user_id: User ID from URL
        
    Returns:
        Tuple of (transaction_uuid, total_amount, ref_id)
    """
    ref_id = None
    total_amount = None
    parsed_transaction_uuid = transaction_uuid
    
    if data:
        try:
            decoded_bytes = base64.b64decode(data)
            decoded_json = json.loads(decoded_bytes.decode('utf-8'))
            parsed_transaction_uuid = decoded_json.get('transaction_uuid') or transaction_uuid
            total_amount = decoded_json.get('total_amount')
            ref_id = decoded_json.get('ref_id')
        except Exception as e:
            logger.error(f"Error decoding base64 response: {str(e)}")
            raise ValueError("Invalid payment response data")
    
    return parsed_transaction_uuid, total_amount, ref_id


def extract_user_uuid(
    transaction_uuid: Optional[str],
    user_id: Optional[str]
) -> uuid.UUID:
    """
    Extract user UUID from transaction_uuid or user_id parameter.
    
    Args:
        transaction_uuid: Transaction UUID (format: user_id_uuid)
        user_id: User ID from query parameter
        
    Returns:
        UUID: User UUID
        
    Raises:
        ValueError: If user UUID cannot be extracted or is invalid
    """
    if transaction_uuid:
        try:
            user_uuid_str = transaction_uuid.split('_')[0]
            return uuid.UUID(user_uuid_str)
        except (IndexError, ValueError):
            pass
    
    if user_id:
        try:
            return uuid.UUID(user_id)
        except ValueError:
            raise ValueError(f"Invalid user_id format: {user_id}")
    
    raise ValueError("Cannot extract user_id from transaction_uuid and no user_id provided")


def validate_plan(plan: Optional[str]) -> UserPlan:
    """
    Validate and convert plan string to UserPlan enum.
    
    Args:
        plan: Plan name string
        
    Returns:
        UserPlan: Validated plan enum
        
    Raises:
        ValueError: If plan is invalid
    """
    if not plan:
        raise ValueError("Plan not specified")
    
    try:
        return UserPlan(plan)
    except ValueError:
        raise ValueError(f"Invalid plan name: {plan}")


def build_callback_urls(transaction_uuid: str, plan: str, user_id: uuid.UUID) -> Tuple[str, str]:
    """
    Build success and failure callback URLs for payment.
    
    Args:
        transaction_uuid: Transaction UUID
        plan: Plan name
        user_id: User UUID
        
    Returns:
        Tuple of (success_url, failure_url)
    """
    callback_params = urlencode({
        "transaction_uuid": transaction_uuid,
        "plan": plan,
        "user_id": str(user_id)
    })
    
    success_url = f"{settings.BACKEND_URL}/api/payment/callback?{callback_params}"
    failure_url = f"{settings.BACKEND_URL}/api/payment/failure?{callback_params}"
    
    return success_url, failure_url


def build_frontend_redirect_url(
    status: str,
    ref_id: Optional[str] = None,
    error: Optional[str] = None,
    reason: Optional[str] = None
) -> str:
    """
    Build frontend redirect URL with payment status parameters.
    
    Args:
        status: Payment status (success/failed)
        ref_id: Reference ID from payment gateway
        error: Error code
        reason: Failure reason
        
    Returns:
        str: Frontend redirect URL
    """
    params = {"payment": status}
    
    if ref_id:
        params["refId"] = ref_id
    if error:
        params["error"] = error
    if reason:
        params["reason"] = reason
    
    query_string = urlencode(params)
    return f"{settings.FRONTEND_URL}/?{query_string}"

