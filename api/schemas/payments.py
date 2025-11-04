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


class PaymentUpdate(BaseModel):
    kind: Optional[str] = None
    amount: Optional[int] = Field(default=None, ge=0)
    event_date: Optional[date] = None
    reference: Optional[str] = None
    note: Optional[str] = None
    currency: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
