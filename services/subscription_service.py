from datetime import datetime, timedelta
from typing import Optional, Literal

from supa.client import supa
from services.flow_client import (
    create_flow_customer,
    create_flow_subscription,
    get_flow_plan_id,
)

PlanType = Literal["monthly", "annual"]

TRIAL_DAYS_DEFAULT = 60
PLAN_PERIOD_DAYS = {
    "monthly": 31,
    "annual": 365,
}


def _table(name: str):
    return supa().table(name)


def _iso(dt: datetime) -> str:
    # Supabase maneja mejor ISO8601 sin microsegundos
    return dt.replace(microsecond=0).isoformat()


def _now() -> datetime:
    return datetime.utcnow()


def _parse_flow_datetime(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = value.strip()
    if not value:
        return None
    formats = ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"]
    for fmt in formats:
        try:
            dt = datetime.strptime(value, fmt)
            return _iso(dt)
        except ValueError:
            continue
    try:
        dt = datetime.fromisoformat(value)
        return _iso(dt)
    except ValueError:
        return None


def start_trial(user_id: str, days: int = TRIAL_DAYS_DEFAULT) -> dict:
    now = _now()
    expires = now + timedelta(days=days)
    payload = {
        "user_id": user_id,
        "plan": "trial",
        "status": "active",
        "started_at": _iso(now),
        "expires_at": _iso(expires),
        "trial_started_at": _iso(now),
        "trial_expires_at": _iso(expires),
        "flow_subscription_id": None,
        "flow_customer_id": None,
        "provider_plan_id": None,
        "updated_at": _iso(now),
    }
    return _upsert_subscription(payload)


def activate_free(user_id: str) -> dict:
    existing = ensure_subscription_record(user_id)
    now = _now()
    payload = {
        "user_id": user_id,
        "plan": "free",
        "status": "active",
        "started_at": _iso(now),
        "expires_at": None,
        "trial_started_at": existing.get("trial_started_at"),
        "trial_expires_at": existing.get("trial_expires_at"),
        "flow_subscription_id": existing.get("flow_subscription_id"),
        "flow_customer_id": existing.get("flow_customer_id"),
        "provider_plan_id": existing.get("provider_plan_id"),
        "updated_at": _iso(now),
    }
    return _upsert_subscription(payload)


def activate_paid(
    user_id: str,
    plan: PlanType,
    *,
    flow_subscription_id: Optional[str] = None,
    provider_plan_id: Optional[str] = None,
    flow_customer_id: Optional[str] = None,
    started_at_override: Optional[str] = None,
    expires_at_override: Optional[str] = None,
    trial_started_override: Optional[str] = None,
    trial_expires_override: Optional[str] = None,
) -> dict:
    if plan not in PLAN_PERIOD_DAYS:
        raise ValueError("plan invalido")

    now = _now()
    period_days = PLAN_PERIOD_DAYS[plan]
    expires = now + timedelta(days=period_days)
    existing = ensure_subscription_record(user_id)

    payload = {
        "user_id": user_id,
        "plan": plan,
        "status": "active",
        "started_at": started_at_override or _iso(now),
        "expires_at": expires_at_override or _iso(expires),
        "trial_started_at": trial_started_override or existing.get("trial_started_at"),
        "trial_expires_at": trial_expires_override or existing.get("trial_expires_at"),
        "flow_subscription_id": flow_subscription_id or existing.get("flow_subscription_id"),
        "flow_customer_id": flow_customer_id or existing.get("flow_customer_id"),
        "provider_plan_id": provider_plan_id or existing.get("provider_plan_id"),
        "updated_at": _iso(now),
    }
    return _upsert_subscription(payload)


def ensure_subscription_record(user_id: str) -> dict:
    sub = get_subscription(user_id)
    if sub:
        return sub
    return start_trial(user_id)


def ensure_flow_customer(user_id: str, email: str, full_name: Optional[str] = None) -> str:
    sub = ensure_subscription_record(user_id)
    if sub.get("flow_customer_id"):
        return sub["flow_customer_id"]

    payload = create_flow_customer(
        email=email,
        name=full_name or email,
        external_id=user_id,
    )
    flow_customer_id = _extract_flow_id(payload, "customerId", "id")
    if not flow_customer_id:
        raise RuntimeError("Flow no devolvio customerId")
    updated = _update_subscription(user_id, {"flow_customer_id": flow_customer_id})
    return updated["flow_customer_id"]


def create_flow_subscription_for_user(
    user_id: str,
    plan: PlanType,
    *,
    email: str,
    full_name: Optional[str] = None,
) -> dict:
    existing = ensure_subscription_record(user_id)
    if existing.get("flow_subscription_id"):
        return existing
    customer_id = ensure_flow_customer(user_id, email, full_name)
    plan_id = get_flow_plan_id(plan)
    response = create_flow_subscription(plan_id=plan_id, customer_id=customer_id)
    flow_subscription_id = _extract_flow_id(response, "subscriptionId", "id")
    if not flow_subscription_id:
        raise RuntimeError("Flow no devolvio subscriptionId")
    trial_start = _parse_flow_datetime(response.get("trial_start"))
    trial_end = _parse_flow_datetime(response.get("trial_end"))
    period_start = _parse_flow_datetime(response.get("period_start"))
    period_end = _parse_flow_datetime(response.get("period_end"))
    activate_paid(
        user_id,
        plan,
        flow_subscription_id=flow_subscription_id,
        provider_plan_id=plan_id,
        flow_customer_id=customer_id,
        started_at_override=period_start,
        expires_at_override=period_end,
        trial_started_override=trial_start or period_start,
        trial_expires_override=trial_end or period_end,
    )
    return response


def _update_subscription(user_id: str, fields: dict) -> dict:
    fields = {**fields, "updated_at": _iso(_now())}
    resp = (
        _table("user_subscriptions")
        .update(fields)
        .eq("user_id", user_id)
        .execute()
    )
    if not resp.data:
        raise RuntimeError("No se pudo actualizar la suscripcion")
    return resp.data[0]


def _upsert_subscription(payload: dict) -> dict:
    resp = (
        _table("user_subscriptions")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    if not resp.data:
        raise RuntimeError("No se pudo guardar la suscripcion")
    return resp.data[0]


def get_subscription(user_id: str) -> Optional[dict]:
    resp = (
        _table("user_subscriptions")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]
    return None


def _extract_flow_id(data: dict, *keys: str) -> Optional[str]:
    for key in keys:
        value = data.get(key)
        if value:
            return str(value)
    return None
