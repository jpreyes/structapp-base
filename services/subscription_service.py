from datetime import datetime, timedelta
from typing import Optional

from supa.client import supa


def _table(name: str):
    return supa().table(name)


def start_trial(user_id: str, days: int = 7) -> dict:
    now = datetime.utcnow()
    expires = now + timedelta(days=days)
    payload = {
        "user_id": user_id,
        "plan": "trial",
        "status": "active",
        "started_at": now.isoformat(),
        "expires_at": expires.isoformat(),
    }
    return _upsert_subscription(payload)


def activate_free(user_id: str) -> dict:
    now = datetime.utcnow()
    payload = {
        "user_id": user_id,
        "plan": "free",
        "status": "active",
        "started_at": now.isoformat(),
        "expires_at": None,
    }
    return _upsert_subscription(payload)


def activate_paid(user_id: str, plan: str) -> dict:
    now = datetime.utcnow()
    if plan == "monthly":
        expires = now + timedelta(days=31)
    elif plan == "annual":
        expires = now + timedelta(days=365)
    else:
        raise ValueError("plan inválido")
    payload = {
        "user_id": user_id,
        "plan": plan,
        "status": "active",
        "started_at": now.isoformat(),
        "expires_at": expires.isoformat(),
    }
    return _upsert_subscription(payload)


def _upsert_subscription(payload: dict) -> dict:
    # upsert por user_id (requiere índice único en user_id en la tabla user_subscriptions)
    resp = (
        _table("user_subscriptions")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    if not resp.data:
        raise RuntimeError("No se pudo guardar la suscripción")
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
