from fastapi import APIRouter, HTTPException, Response, status

from api.schemas.calculations import CalculationResponse, RCBeamPayload
from calculations.rc_beam import run as run_rc_beam
from services.docs_service import export_rc_beam_pdf
from services.runs_service import save_run
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
