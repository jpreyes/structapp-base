import io

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from api.dependencies import UserIdDep
from api.schemas.design_bases import (
    DesignBaseDetail,
    DesignBaseExportPayload,
    DesignBaseSummary,
    LiveLoadCatalogResponse,
    LiveLoadReductionRequest,
    LiveLoadReductionResponse,
    LiveLoadRequest,
    LiveLoadResponse,
    SaveDesignBaseRequest,
    SeismicRequest,
    SeismicResponse,
    SnowRequest,
    SnowResponse,
    WindRequest,
    WindResponse,
)
from services.design_bases_service import (
    calculate_live_load_reduction,
    calculate_roof_snow_load,
    calculate_seismic_base,
    calculate_wind_pressure,
    get_live_load,
    get_design_base_options,
    export_design_bases,
    list_live_load_categories,
)
from services.design_bases_storage_service import (
    delete_design_base,
    get_design_base,
    list_design_bases,
    save_design_base,
)

router = APIRouter()


@router.get("/live-loads", response_model=LiveLoadCatalogResponse)
async def live_load_catalog():
    return {"categories": list_live_load_categories()}


@router.get("/options")
async def design_base_options():
    return get_design_base_options()


@router.post("/live-load", response_model=LiveLoadResponse)
async def live_load_lookup(payload: LiveLoadRequest):
    try:
        data = get_live_load(payload.building_type, payload.usage)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return {
        "buildingType": payload.building_type,
        "usage": payload.usage,
        "uniformLoad": data["uniform_load"],
        "uniformLoadRaw": data["uniform_load_raw"],
        "concentratedLoad": data["concentrated_load"],
        "concentratedLoadRaw": data["concentrated_load_raw"],
    }


@router.post("/live-load/reduction", response_model=LiveLoadReductionResponse)
async def live_load_reduction(payload: LiveLoadReductionRequest):
    try:
        reduced = calculate_live_load_reduction(payload.element_type, payload.tributary_area, payload.base_load)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"reducedLoad": reduced}


@router.post("/wind", response_model=WindResponse)
async def wind_pressure(payload: WindRequest):
    try:
        data = calculate_wind_pressure(payload.environment, payload.height)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return data


@router.post("/snow", response_model=SnowResponse)
async def snow_load(payload: SnowRequest):
    try:
        data = calculate_roof_snow_load(
            latitude_band=payload.latitude_band,
            altitude_band=payload.altitude_band,
            thermal_condition=payload.thermal_condition,
            importance_category=payload.importance_category,
            exposure_category=payload.exposure_category,
            exposure_condition=payload.exposure_condition,
            surface_type=payload.surface_type,
            roof_pitch_deg=payload.roof_pitch,
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return data


@router.post("/seismic", response_model=SeismicResponse)
async def seismic_base(payload: SeismicRequest):
    try:
        result = calculate_seismic_base(
            category=payload.category,
            zone=payload.zone,
            soil=payload.soil,
            rs_value=payload.rs,
            ps_value=payload.ps,
            tx=payload.tx,
            ty=payload.ty,
            r0=payload.r0,
            story_heights=[story.height for story in payload.stories],
            story_weights=[story.weight for story in payload.stories],
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return result


@router.post("/export/{file_format}")
async def export_design_base(file_format: str, payload: DesignBaseExportPayload):
    try:
        content, content_type, filename = export_design_bases(payload, file_format)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return StreamingResponse(io.BytesIO(content), media_type=content_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/save", response_model=DesignBaseSummary)
async def save_design_base_endpoint(payload: SaveDesignBaseRequest, user_id: UserIdDep):
    """Guarda una base de cálculo en Supabase."""
    try:
        result = save_design_base(
            project_id=payload.project_id,
            user_id=user_id,
            name=payload.name,
            data=payload.data.dict(by_alias=True, exclude_none=True),
            design_base_id=payload.design_base_id,
        )
        return DesignBaseSummary(
            id=result["id"],
            projectId=result["project_id"],
            name=result["name"],
            createdAt=result["created_at"],
            updatedAt=result["updated_at"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/list/{project_id}", response_model=list[DesignBaseSummary])
async def list_design_bases_endpoint(project_id: str, user_id: UserIdDep):
    """Lista todas las bases de cálculo de un proyecto."""
    bases = list_design_bases(project_id=project_id, user_id=user_id)
    return [
        DesignBaseSummary(
            id=base["id"],
            projectId=base["project_id"],
            name=base["name"],
            createdAt=base["created_at"],
            updatedAt=base["updated_at"],
        )
        for base in bases
    ]


@router.get("/load/{design_base_id}", response_model=DesignBaseDetail)
async def load_design_base_endpoint(design_base_id: str, user_id: UserIdDep):
    """Carga una base de cálculo específica."""
    try:
        base = get_design_base(design_base_id=design_base_id, user_id=user_id)
        return DesignBaseDetail(
            id=base["id"],
            projectId=base["project_id"],
            name=base["name"],
            data=base["data"],
            createdAt=base["created_at"],
            updatedAt=base["updated_at"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/delete/{design_base_id}")
async def delete_design_base_endpoint(design_base_id: str, user_id: UserIdDep):
    """Elimina una base de cálculo."""
    success = delete_design_base(design_base_id=design_base_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Base de cálculo no encontrada")
    return {"success": True}
