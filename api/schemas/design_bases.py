from typing import List, Optional

from pydantic import BaseModel, Field, validator
from api.schemas.structural_calcs import (
    ConcreteBeamResponse,
    ConcreteColumnResponse,
    FootingResponse,
    SteelBeamResponse,
    SteelColumnResponse,
    WoodBeamResponse,
    WoodColumnResponse,
)


class LiveLoadUsage(BaseModel):
    usage: str
    uniform_load: Optional[float] = None
    uniform_load_raw: str
    concentrated_load: Optional[float] = None
    concentrated_load_raw: str


class LiveLoadCatalogResponse(BaseModel):
    categories: dict[str, List[LiveLoadUsage]]


class LiveLoadRequest(BaseModel):
    project_id: Optional[str] = Field(None, alias="projectId", description="ID del proyecto (opcional para historial)")
    user_id: Optional[str] = Field(None, alias="userId", description="ID del usuario (opcional para historial)")
    building_type: str = Field(..., alias="buildingType")
    usage: str


class LiveLoadResponse(BaseModel):
    building_type: str = Field(..., alias="buildingType")
    usage: str
    uniform_load: Optional[float] = Field(None, alias="uniformLoad")
    uniform_load_raw: str = Field(..., alias="uniformLoadRaw")
    concentrated_load: Optional[float] = Field(None, alias="concentratedLoad")
    concentrated_load_raw: str = Field(..., alias="concentratedLoadRaw")


class LiveLoadReductionRequest(BaseModel):
    project_id: Optional[str] = Field(None, alias="projectId", description="ID del proyecto (opcional para historial)")
    user_id: Optional[str] = Field(None, alias="userId", description="ID del usuario (opcional para historial)")
    element_type: str = Field(..., alias="elementType")
    tributary_area: float = Field(..., alias="tributaryArea", gt=0)
    base_load: float = Field(..., alias="baseLoad", gt=0)


class LiveLoadReductionResponse(BaseModel):
    reduced_load: float = Field(..., alias="reducedLoad")


class WindRequest(BaseModel):
    project_id: Optional[str] = Field(None, alias="projectId", description="ID del proyecto (opcional para historial)")
    user_id: Optional[str] = Field(None, alias="userId", description="ID del usuario (opcional para historial)")
    environment: str
    height: float = Field(..., gt=0)


class WindResponse(BaseModel):
    q: Optional[float]
    message: Optional[str]


class SnowRequest(BaseModel):
    project_id: Optional[str] = Field(None, alias="projectId", description="ID del proyecto (opcional para historial)")
    user_id: Optional[str] = Field(None, alias="userId", description="ID del usuario (opcional para historial)")
    latitude_band: str = Field(..., alias="latitudeBand")
    altitude_band: str = Field(..., alias="altitudeBand")
    thermal_condition: str = Field(..., alias="thermalCondition")
    importance_category: str = Field(..., alias="importanceCategory")
    exposure_category: str = Field(..., alias="exposureCategory")
    exposure_condition: str = Field(..., alias="exposureCondition")
    surface_type: str = Field(..., alias="surfaceType")
    roof_pitch: float = Field(..., alias="roofPitch", ge=0, le=90)


class SnowResponse(BaseModel):
    pg: float
    ct: float
    ce: float
    I: float
    cs: float
    pf: float


class SeismicStory(BaseModel):
    height: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)


class SeismicRequest(BaseModel):
    project_id: Optional[str] = Field(None, alias="projectId", description="ID del proyecto (opcional para historial)")
    user_id: Optional[str] = Field(None, alias="userId", description="ID del usuario (opcional para historial)")
    category: str
    zone: str
    soil: str
    rs: float = Field(..., gt=0)
    ps: float = Field(..., gt=0)
    tx: float = Field(..., gt=0)
    ty: float = Field(..., gt=0)
    r0: float = Field(..., gt=0)
    stories: List[SeismicStory]

    @validator("stories")
    def validate_stories(cls, value: List[SeismicStory]) -> List[SeismicStory]:
        if not value:
            raise ValueError("Debe indicar al menos un nivel.")
        return value


class SeismicSpectrumPoint(BaseModel):
    period: float
    Sa_x: float = Field(..., alias="SaX")
    Sa_y: float = Field(..., alias="SaY")


class SeismicFloorForce(BaseModel):
    level: int
    Fkx: float
    Fky: float


class SeismicResponse(BaseModel):
    model_config = {"populate_by_name": True}

    intensity_factor: float = Field(..., alias="intensityFactor")
    zone_factor: float = Field(..., alias="zoneFactor")
    soil: dict
    C_max: float = Field(..., alias="CMax")
    C_min: float = Field(..., alias="CMin")
    Q0x: float
    Q0y: float
    Q0_min: float = Field(..., alias="Q0Min")
    Q0_max: float = Field(..., alias="Q0Max")
    Qbasx: float
    Qbasy: float
    spectrum: List[SeismicSpectrumPoint]
    floor_forces: List[SeismicFloorForce] = Field(..., alias="floorForces")


class LiveLoadExport(BaseModel):
    building_type: str = Field(..., alias="buildingType")
    usage: str
    uniform_load: Optional[float] = Field(None, alias="uniformLoad")
    uniform_load_raw: str = Field(..., alias="uniformLoadRaw")
    concentrated_load: Optional[float] = Field(None, alias="concentratedLoad")
    concentrated_load_raw: str = Field(..., alias="concentratedLoadRaw")


class LiveLoadReductionExport(BaseModel):
    element_type: str = Field(..., alias="elementType")
    tributary_area: float = Field(..., alias="tributaryArea")
    base_load: float = Field(..., alias="baseLoad")
    reduced_load: float = Field(..., alias="reducedLoad")


class WindExport(BaseModel):
    environment: str
    height: float
    q: Optional[float] = None
    message: Optional[str] = None


class SnowExport(BaseModel):
    latitude_band: str = Field(..., alias="latitudeBand")
    altitude_band: str = Field(..., alias="altitudeBand")
    thermal_condition: str = Field(..., alias="thermalCondition")
    importance_category: str = Field(..., alias="importanceCategory")
    exposure_category: str = Field(..., alias="exposureCategory")
    exposure_condition: str = Field(..., alias="exposureCondition")
    surface_type: str = Field(..., alias="surfaceType")
    roof_pitch: float = Field(..., alias="roofPitch")
    pg: float
    ct: float
    ce: float
    I: float
    cs: float
    pf: float


class SeismicExport(BaseModel):
    params: SeismicRequest
    result: SeismicResponse


class BuildingDescription(BaseModel):
    text: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    height: Optional[str] = None


class BuildingDescriptionRequest(BaseModel):
    """Request para guardar descripción de edificio en historial."""
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")
    text: Optional[str] = None
    location: Optional[str] = None
    area: Optional[str] = None
    height: Optional[str] = None


class StructuralCalculations(BaseModel):
    """Resultados de cálculos estructurales."""

    concrete_column: Optional[ConcreteColumnResponse] = Field(None, alias="concreteColumn")
    concrete_beam: Optional[ConcreteBeamResponse] = Field(None, alias="concreteBeam")
    steel_column: Optional[SteelColumnResponse] = Field(None, alias="steelColumn")
    steel_beam: Optional[SteelBeamResponse] = Field(None, alias="steelBeam")
    wood_column: Optional[WoodColumnResponse] = Field(None, alias="woodColumn")
    wood_beam: Optional[WoodBeamResponse] = Field(None, alias="woodBeam")
    footing: Optional[FootingResponse] = None


class DesignBaseExportPayload(BaseModel):
    building_description: Optional[BuildingDescription] = Field(None, alias="buildingDescription")
    live_load: Optional[LiveLoadExport] = Field(None, alias="liveLoad")
    reduction: Optional[LiveLoadReductionExport] = None
    wind: Optional[WindExport] = None
    snow: Optional[SnowExport] = None
    seismic: Optional[SeismicExport] = None
    structural: Optional[StructuralCalculations] = None


class SaveDesignBaseRequest(BaseModel):
    project_id: str = Field(..., alias="projectId")
    name: str
    data: DesignBaseExportPayload
    design_base_id: Optional[str] = Field(None, alias="designBaseId")


class DesignBaseSummary(BaseModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    name: str
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class DesignBaseDetail(BaseModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    name: str
    data: dict
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")


class CreateDesignBaseRunRequest(BaseModel):
    project_id: str = Field(..., alias="projectId")
    name: str
    data: DesignBaseExportPayload
    design_base_id: Optional[str] = Field(None, alias="designBaseId")
    project_name: Optional[str] = Field(None, alias="projectName")


class DesignBaseRunSummary(BaseModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    design_base_id: Optional[str] = Field(None, alias="designBaseId")
    name: str
    document_url: Optional[str] = Field(None, alias="documentUrl")
    created_at: str = Field(..., alias="createdAt")


class DesignBaseRunDetail(BaseModel):
    id: str
    project_id: str = Field(..., alias="projectId")
    design_base_id: Optional[str] = Field(None, alias="designBaseId")
    name: str
    data: dict
    document_url: Optional[str] = Field(None, alias="documentUrl")
    created_at: str = Field(..., alias="createdAt")
