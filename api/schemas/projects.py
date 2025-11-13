from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from api.schemas.payments import PaymentResponse
from api.schemas.tasks import TaskResponse


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
    payments_facturado: float = 0
    payments_pagado: float = 0
    payments_saldo: float = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectPaymentTotals(BaseModel):
    facturado: float
    pagado: float
    saldo: float


class ProjectMetrics(BaseModel):
    total_tasks: int
    completed_tasks: int
    budget: float
    payments: ProjectPaymentTotals


class ProjectImportantDates(BaseModel):
    start_date: Optional[str]
    end_date: Optional[str]
    next_task_start: Optional[str] = None
    next_task_due: Optional[str] = None


class ProjectDetailResponse(BaseModel):
    project: ProjectResponse
    tasks: list[TaskResponse]
    payments: list[PaymentResponse]
    metrics: ProjectMetrics
    important_dates: ProjectImportantDates
