from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    project_id: str
    title: str
    start_date: date
    end_date: date
    status: str = Field(default="todo")
    progress: int = Field(default=0, ge=0, le=100)
    assignee: Optional[str] = None
    notes: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    assignee: Optional[str] = None
    notes: Optional[str] = None


class TaskResponse(TaskBase):
    id: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True
