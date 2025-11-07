from fastapi import APIRouter, HTTPException, Response, status

from api.schemas.calculations import CalculationResponse, CalculationRun, RCBeamPayload
from calculations.rc_beam import run as run_rc_beam
from services.docs_service import export_rc_beam_pdf
from services.runs_service import fetch_run, get_critical_elements, list_runs, save_run, set_critical_element, unset_critical_element
from supa.client import supa

router = APIRouter()


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
