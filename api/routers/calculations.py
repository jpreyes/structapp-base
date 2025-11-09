from datetime import datetime

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, Field

from api.dependencies import UserIdDep
from api.schemas.calculations import CalculationResponse, CalculationRun, RCBeamPayload
from calculations.rc_beam import run as run_rc_beam
from services.design_bases_service import calculate_live_load_reduction, get_live_load
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
                "updated_at": datetime.utcnow().isoformat(),
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


