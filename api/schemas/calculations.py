from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class RCBeamPayload(BaseModel):
    project_id: str
    user_id: str
    b_mm: float
    h_mm: float
    L_m: float
    wl_kN_m: float


class CalculationResponse(BaseModel):
    results: Dict[str, Any]
    run_id: str


class CalculationRun(BaseModel):
    id: str
    project_id: str
    element_type: str
    created_at: Optional[datetime] = None
    input_json: Dict[str, Any]
    result_json: Dict[str, Any]
