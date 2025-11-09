from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.dependencies import UserIdDep
from services.flow_client import create_checkout_link
from services.subscription_service import start_trial, activate_free

router = APIRouter()


class CheckoutRequest(BaseModel):
    plan: str = Field(pattern="^(monthly|annual)$")


@router.post("/flow/checkout")
async def flow_checkout(payload: CheckoutRequest, user_id: UserIdDep):
    try:
        url = create_checkout_link(user_id, payload.plan)  # type: ignore[arg-type]
        return {"checkoutUrl": url}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/start-trial")
async def start_trial_endpoint(user_id: UserIdDep):
    try:
        sub = start_trial(user_id, days=7)
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
