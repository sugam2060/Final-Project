from pydantic import BaseModel

class PaymentInitRequest(BaseModel):
    item_id: str