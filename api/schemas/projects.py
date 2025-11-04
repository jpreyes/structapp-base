from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    name: str
    mandante: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default="draft")
    budget: Optional[int] = Field(default=0, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    is_archived: Optional[bool] = None


class ProjectResponse(ProjectBase):
    id: str
    created_by: str
    payment_status: str | None = None
    is_archived: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
