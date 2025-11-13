from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ConditionLiteral = Literal["operativa", "observacion", "critica"]


class InspectionBase(BaseModel):
    project_id: str
    structure_name: str
    location: str
    inspection_date: date
    inspector: str
    overall_condition: ConditionLiteral
    summary: str
    photos: list[str] = Field(default_factory=list)

    model_config = ConfigDict(extra="allow")


class InspectionCreate(InspectionBase):
    pass


class InspectionResponse(InspectionBase):
    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DamageBase(BaseModel):
    project_id: str
    structure: str
    location: str | None = None
    damage_type: str
    damage_cause: str
    severity: Literal["Leve", "Media", "Alta", "Muy Alta"]
    extent: str | None = None
    comments: str | None = None
    damage_photo_url: str | None = None

    model_config = ConfigDict(extra="allow")


class DamageCreate(DamageBase):
    pass


class DamageResponse(DamageBase):
    id: str
    created_at: datetime | None = None


class TestBase(BaseModel):
    project_id: str
    test_type: str
    method: str | None = None
    standard: str | None = None
    executed_at: date
    laboratory: str | None = None
    sample_location: str | None = None
    result_summary: str
    attachment_url: str | None = None

    model_config = ConfigDict(extra="allow")


class TestCreate(TestBase):
    pass


class TestResponse(TestBase):
    id: str
    created_at: datetime | None = None


class DocumentBase(BaseModel):
    project_id: str
    title: str
    category: Literal["informe", "fotografia", "ensayo", "otro"]
    issued_at: date
    issued_by: str | None = None
    url: str | None = None
    notes: str | None = None

    model_config = ConfigDict(extra="allow")


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: str
    created_at: datetime | None = None
