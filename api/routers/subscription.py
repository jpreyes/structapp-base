from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.dependencies import UserIdDep, CurrentUserDep
from services.flow_client import create_checkout_link
from services.subscription_service import (
    TRIAL_DAYS_DEFAULT,
    activate_free,
    create_flow_subscription_for_user,
    start_trial,
)

router = APIRouter()


class PlanSelectionRequest(BaseModel):
    plan: str = Field(pattern="^(monthly|annual)$")


@router.post("/flow/checkout")
async def flow_checkout(payload: PlanSelectionRequest, user_id: UserIdDep):
    try:
        url = create_checkout_link(user_id, payload.plan)  # type: ignore[arg-type]
        return {"checkoutUrl": url}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/flow/subscribe")
async def flow_subscribe(payload: PlanSelectionRequest, user_id: UserIdDep, user: CurrentUserDep):
    email = getattr(user, "email", None) if user else None
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario no tiene email disponible")
    metadata = getattr(user, "user_metadata", {}) or {}
    full_name = metadata.get("full_name") or metadata.get("name")
    try:
        subscription = create_flow_subscription_for_user(
            user_id,
            payload.plan,  # type: ignore[arg-type]
            email=email,
            full_name=full_name,
        )
        return {"subscription": subscription}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/start-trial")
async def start_trial_endpoint(user_id: UserIdDep):
    try:
        sub = start_trial(user_id, days=TRIAL_DAYS_DEFAULT)
        return {"subscription": sub}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/activate-free")
async def activate_free_endpoint(user_id: UserIdDep):
    try:
        sub = activate_free(user_id)
        return {"subscription": sub}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
