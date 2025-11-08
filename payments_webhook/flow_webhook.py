from fastapi import APIRouter, Request

from services.subscription_service import activate_paid

router = APIRouter()


@router.post("/flow")
async def flow_webhook(request: Request):
    # Flow enviará datos del pago. Ajusta los campos según documentación real.
    payload = await request.json()
    # Ejemplos de campos esperados: user_id, plan, status
    user_id = payload.get("user_id") or payload.get("optional") or payload.get("commerceOrder", "").split("-")[1]
    plan = payload.get("plan") or payload.get("optional")
    payment_status = payload.get("status", "paid")

    if not user_id or plan not in ("monthly", "annual"):
        return {"ok": False}

    if str(payment_status).lower() in ("paid", "success", "authorized"):
        activate_paid(user_id, plan)  # Actualiza suscripción en tu BD
    # Responder 200 siempre para que Flow no reintente indefinidamente
    return {"ok": True}
