from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, Field

from api.dependencies import UserIdDep
from api.schemas.calculations import CalculationResponse, CalculationRun, RCBeamPayload
from calculations.rc_beam import run as run_rc_beam
from services.design_bases_service import (
    calculate_live_load_reduction,
    calculate_roof_snow_load,
    calculate_seismic_base,
    calculate_wind_pressure,
    get_live_load,
)
from services.docs_service import export_rc_beam_pdf
from services.runs_service import fetch_run, get_critical_elements, list_runs, save_run, set_critical_element, unset_critical_element
from supa.client import supa

router = APIRouter()

def _ensure_user_can_modify(run: dict, user_id: str):
    owner = run.get("created_by")
    if owner and owner != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para modificar este cálculo.")


class UpdateLiveLoadPayload(BaseModel):
    building_type: str = Field(..., alias="buildingType")
    usage: str


class UpdateBuildingDescriptionPayload(BaseModel):
    text: str | None = None
    location: str | None = None
    area: str | None = None
    height: str | None = None


class UpdateWindPayload(BaseModel):
    environment: str
    height: float = Field(..., gt=0)


class UpdateSnowPayload(BaseModel):
    latitude_band: str = Field(..., alias="latitudeBand")
    altitude_band: str = Field(..., alias="altitudeBand")
    thermal_condition: str = Field(..., alias="thermalCondition")
    importance_category: str = Field(..., alias="importanceCategory")
    exposure_category: str = Field(..., alias="exposureCategory")
    exposure_condition: str = Field(..., alias="exposureCondition")
    surface_type: str = Field(..., alias="surfaceType")
    roof_pitch: float = Field(..., alias="roofPitch", ge=0, le=90)


class UpdateSeismicStory(BaseModel):
    height: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)


class UpdateSeismicPayload(BaseModel):
    category: str
    zone: str
    soil: str
    rs: float = Field(..., gt=0)
    ps: float = Field(..., gt=0)
    tx: float = Field(..., gt=0)
    ty: float = Field(..., gt=0)
    r0: float = Field(..., gt=0)
    stories: List[UpdateSeismicStory] = Field(..., min_items=1)


class UpdateReductionPayload(BaseModel):
    element_type: str = Field(..., alias="elementType")
    tributary_area: float = Field(..., alias="tributaryArea", gt=0)
    base_load: float = Field(..., alias="baseLoad", gt=0)



@router.post("/rc-beam", response_model=CalculationResponse)
async def calculate_rc_beam(payload: RCBeamPayload):
    inputs = {
        "b_mm": payload.b_mm,
        "h_mm": payload.h_mm,
        "L_m": payload.L_m,
        "wl_kN_m": payload.wl_kN_m,
    }
    try:
        results = run_rc_beam(inputs)
        record = save_run(payload.project_id, payload.user_id, "rc_beam", inputs, results)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return {"results": results, "run_id": record["id"]}


@router.get("/rc-beam/{run_id}/report")
async def download_rc_beam_report(run_id: str):
    try:
        response = (
            supa()
            .table("calc_runs")
            .select("*")
            .eq("id", run_id)
            .single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    run = response.data
    project = supa().table("projects").select("id,name").eq("id", run["project_id"]).single().execute().data
    pdf_bytes = export_rc_beam_pdf(project, run["input_json"], run["result_json"])
    return Response(content=pdf_bytes, media_type="application/pdf")


@router.get("/runs/{project_id}", response_model=list[CalculationRun])
async def list_project_runs(project_id: str):
    try:
        runs = list_runs(project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return runs or []


@router.get("/runs/detail/{run_id}", response_model=CalculationRun)
async def get_run_detail(run_id: str):
    run = fetch_run(run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cálculo no encontrado")
    return run


@router.put("/runs/{run_id}", response_model=CalculationRun)
async def update_calculation_run(run_id: str, payload: dict, user_id: UserIdDep):
    run = fetch_run(run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cálculo no encontrado")
    _ensure_user_can_modify(run, user_id)

    element_type = run["element_type"]
    if element_type == "live_load":
        data = UpdateLiveLoadPayload(**payload)
        try:
            raw = get_live_load(data.building_type, data.usage)
        except KeyError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        inputs = {
            "buildingType": data.building_type,
            "usage": data.usage,
        }
        result = {
            "buildingType": data.building_type,
            "usage": data.usage,
            "uniformLoad": raw["uniform_load"],
            "uniformLoadRaw": raw["uniform_load_raw"],
            "concentratedLoad": raw["concentrated_load"],
            "concentratedLoadRaw": raw["concentrated_load_raw"],
        }
    elif element_type == "building_description":
        data = UpdateBuildingDescriptionPayload(**payload)
        if not any([data.text, data.location, data.area, data.height]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debes ingresar al menos un dato de la descripción del edificio.",
            )
        inputs = {
            "text": data.text,
            "location": data.location,
            "area": data.area,
            "height": data.height,
        }
        result = inputs.copy()
    elif element_type == "wind_load":
        data = UpdateWindPayload(**payload)
        try:
            result = calculate_wind_pressure(data.environment, data.height)
        except (KeyError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        inputs = {"environment": data.environment, "height": data.height}
    elif element_type == "snow_load":
        data = UpdateSnowPayload(**payload)
        try:
            result = calculate_roof_snow_load(
                latitude_band=data.latitude_band,
                altitude_band=data.altitude_band,
                thermal_condition=data.thermal_condition,
                importance_category=data.importance_category,
                exposure_category=data.exposure_category,
                exposure_condition=data.exposure_condition,
                surface_type=data.surface_type,
                roof_pitch_deg=data.roof_pitch,
            )
        except (KeyError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        inputs = {
            "latitudeBand": data.latitude_band,
            "altitudeBand": data.altitude_band,
            "thermalCondition": data.thermal_condition,
            "importanceCategory": data.importance_category,
            "exposureCategory": data.exposure_category,
            "exposureCondition": data.exposure_condition,
            "surfaceType": data.surface_type,
            "roofPitch": data.roof_pitch,
        }
    elif element_type == "seismic":
        data = UpdateSeismicPayload(**payload)
        story_heights = [story.height for story in data.stories]
        story_weights = [story.weight for story in data.stories]
        try:
            result = calculate_seismic_base(
                category=data.category,
                zone=data.zone,
                soil=data.soil,
                rs_value=data.rs,
                ps_value=data.ps,
                tx=data.tx,
                ty=data.ty,
                r0=data.r0,
                story_heights=story_heights,
                story_weights=story_weights,
            )
        except (KeyError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        inputs = {
            "category": data.category,
            "zone": data.zone,
            "soil": data.soil,
            "rs": data.rs,
            "ps": data.ps,
            "tx": data.tx,
            "ty": data.ty,
            "r0": data.r0,
            "stories": [{"height": story.height, "weight": story.weight} for story in data.stories],
        }
    elif element_type in {"reduction", "live_load_reduction"}:
        data = UpdateReductionPayload(**payload)
        try:
            reduced = calculate_live_load_reduction(data.element_type, data.tributary_area, data.base_load)
        except (KeyError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        inputs = {
            "elementType": data.element_type,
            "tributaryArea": data.tributary_area,
            "baseLoad": data.base_load,
        }
        result = {"reducedLoad": reduced}
        element_type = "reduction"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este tipo de cálculo no admite edición desde esta pantalla.")

    try:
        response = (
            supa()
            .table("calc_runs")
            .update({
                "input_json": inputs,
                "result_json": result,
                "element_type": element_type,
            })
            .eq("id", run_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    data_resp = response.data
    if not data_resp:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo actualizar el cálculo")
    return data_resp[0]


@router.delete("/runs/{run_id}")
async def delete_calculation_run(run_id: str, user_id: UserIdDep):
    run = fetch_run(run_id)
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cálculo no encontrado")
    _ensure_user_can_modify(run, user_id)

    try:
        response = supa().table("calc_runs").delete().eq("id", run_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cálculo no encontrado")

    return {"success": True}


@router.post("/runs/{run_id}/set-critical")
async def mark_as_critical(run_id: str):
    """
    Marca un cálculo como elemento crítico.
    Desmarca automáticamente otros elementos del mismo tipo en el proyecto.
    """
    try:
        run = fetch_run(run_id)
        if not run:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cálculo no encontrado")

        updated_run = set_critical_element(run_id, run["project_id"], run["element_type"])
        return {"success": True, "run": updated_run}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/runs/{run_id}/unset-critical")
async def unmark_as_critical(run_id: str):
    """
    Desmarca un cálculo como elemento crítico.
    """
    try:
        updated_run = unset_critical_element(run_id)
        return {"success": True, "run": updated_run}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/critical-elements/{project_id}")
async def get_project_critical_elements(project_id: str):
    """
    Obtiene todos los elementos críticos de un proyecto, agrupados por tipo.
    Útil para generar tablas y reportes.
    """
    try:
        critical_elements = get_critical_elements(project_id)
        return {"success": True, "critical_elements": critical_elements}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


