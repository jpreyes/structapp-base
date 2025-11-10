from fastapi import APIRouter, Request

from services.subscription_service import activate_paid

router = APIRouter()


@router.post("/flow")
async def flow_webhook(request: Request):
    payload = await request.json()

    commerce_order = payload.get("commerceOrder", "")
    order_parts = commerce_order.split("-")
    inferred_user_id = order_parts[1] if len(order_parts) >= 3 else None

    user_id = payload.get("user_id") or payload.get("optionalUserId") or inferred_user_id
    plan = (payload.get("plan") or payload.get("optional") or "").lower()
    payment_status = str(payload.get("status", "paid")).lower()
    flow_subscription_id = payload.get("subscriptionId") or payload.get("subscription_id")
    flow_customer_id = payload.get("customerId") or payload.get("customer_id")
    provider_plan_id = payload.get("planId") or payload.get("plan_id")

    if not user_id or plan not in ("monthly", "annual"):
        return {"ok": False}

    if payment_status in ("paid", "success", "authorized", "charged"):
        activate_paid(
            user_id,
            plan,  # type: ignore[arg-type]
            flow_subscription_id=flow_subscription_id,
            provider_plan_id=provider_plan_id,
            flow_customer_id=flow_customer_id,
        )

    # Responder 200 siempre para que Flow no reintente indefinidamente
    return {"ok": True}
