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


class PhotoUploadResponse(BaseModel):
    url: str


class DamageBase(BaseModel):
    project_id: str
    inspection_id: str
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
    inspection_id: str | None = None
    created_at: datetime | None = None


class DamagePhotoResponse(BaseModel):
    id: str
    damage_id: str
    photo_url: str
    created_at: datetime | None = None

    model_config = ConfigDict(extra="allow")


class DamageUpdate(BaseModel):
    structure: str | None = None
    location: str | None = None
    damage_type: str | None = None
    damage_cause: str | None = None
    severity: Literal["Leve", "Media", "Alta", "Muy Alta"] | None = None
    extent: str | None = None
    comments: str | None = None
    damage_photo_url: str | None = None

    model_config = ConfigDict(extra="allow")


class TestBase(BaseModel):
    project_id: str
    inspection_id: str
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
    inspection_id: str | None = None
    created_at: datetime | None = None


class TestUpdate(BaseModel):
    test_type: str | None = None
    method: str | None = None
    standard: str | None = None
    executed_at: date | None = None
    laboratory: str | None = None
    sample_location: str | None = None
    result_summary: str | None = None
    attachment_url: str | None = None

    model_config = ConfigDict(extra="allow")


class DocumentBase(BaseModel):
    project_id: str
    inspection_id: str
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
    inspection_id: str | None = None
    created_at: datetime | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    category: Literal["informe", "fotografia", "ensayo", "otro"] | None = None
    issued_at: date | None = None
    issued_by: str | None = None
    url: str | None = None
    notes: str | None = None

    model_config = ConfigDict(extra="allow")
