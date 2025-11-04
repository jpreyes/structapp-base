from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    project_id: str
    kind: str
    amount: int = Field(ge=0)
    event_date: date
    reference: Optional[str] = None
    note: Optional[str] = None
    currency: str = Field(default="CLP")


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
