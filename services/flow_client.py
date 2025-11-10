import os
import time
import hmac
import hashlib
from typing import Literal, Dict, Optional

import requests
from dotenv import load_dotenv

load_dotenv(override=True)

FLOW_BASE_URL = os.getenv("FLOW_BASE_URL", "")
FLOW_API_KEY = os.getenv("FLOW_API_KEY", "")
FLOW_SECRET_KEY = os.getenv("FLOW_SECRET_KEY", "")
FLOW_COMMERCE_CODE = os.getenv("FLOW_COMMERCE_CODE")
FLOW_PAYMENT_METHOD = os.getenv("FLOW_PAYMENT_METHOD", "9")
FLOW_CURRENCY = os.getenv("FLOW_CURRENCY", "CLP")
FLOW_RETURN_URL = os.getenv("FLOW_RETURN_URL", "")
FLOW_CONFIRM_URL = os.getenv("FLOW_CONFIRM_URL", "")
FLOW_PLAN_MONTHLY_ID = os.getenv("FLOW_PLAN_MONTHLY_ID", "")
FLOW_PLAN_ANNUAL_ID = os.getenv("FLOW_PLAN_ANNUAL_ID", "")

Plan = Literal["monthly", "annual"]

PLAN_PRICES_CLP = {
    "monthly": 12000,
    "annual": 100000,
}

PLAN_ID_MAP: Dict[str, str] = {
    "monthly": FLOW_PLAN_MONTHLY_ID,
    "annual": FLOW_PLAN_ANNUAL_ID,
}

FORM_HEADERS = {"Content-Type": "application/x-www-form-urlencoded"}


def _is_configured() -> bool:
    return all([FLOW_BASE_URL, FLOW_API_KEY, FLOW_SECRET_KEY, FLOW_CONFIRM_URL])


def _sign(payload: dict, secret: str) -> str:
    keys = sorted(k for k in payload.keys() if payload[k] is not None and k != "s")
    to_sign = "".join(f"{k}{payload[k]}" for k in keys)
    return hmac.new(secret.encode(), to_sign.encode(), hashlib.sha256).hexdigest()


def _flow_post(path: str, payload: dict) -> dict:
    if not _is_configured():
        raise RuntimeError("Flow no esta configurado")
    url = FLOW_BASE_URL.rstrip("/") + path
    body = {k: v for k, v in payload.items() if v is not None}
    body["apiKey"] = FLOW_API_KEY
    body["s"] = _sign(body, FLOW_SECRET_KEY)
    resp = requests.post(url, data=body, headers=FORM_HEADERS, timeout=15)
    if not resp.ok:
        raise RuntimeError(f"Flow error {resp.status_code}: {resp.text}")
    return resp.json()


def _build_payload(user_id: str, plan: Plan, amount: int, *, email: Optional[str] = None, full_name: Optional[str] = None) -> dict:
    order_id = f"sub-{user_id}-{int(time.time())}"
    payload = {
        "commerceOrder": order_id,
        "subject": f"Suscripcion{plan}",
        "amount": str(amount),
        "email": email or f"user-{user_id}@example.com",
        "urlConfirmation": FLOW_CONFIRM_URL,
        "urlReturn": FLOW_RETURN_URL or FLOW_CONFIRM_URL,
        "paymentMethod": FLOW_PAYMENT_METHOD,
        "optional": plan,
        "currency": FLOW_CURRENCY,
    }
    if FLOW_COMMERCE_CODE:
        payload["commerceCode"] = FLOW_COMMERCE_CODE
    return payload


def create_checkout_link(user_id: str, plan: Plan, *, email: Optional[str] = None, full_name: Optional[str] = None) -> str:
    amount = PLAN_PRICES_CLP[plan]
    if not _is_configured():
        return f"https://flow.local/checkout?plan={plan}&amount={amount}&user_id={user_id}"

    endpoint = FLOW_BASE_URL.rstrip("/") + "/payment/create"
    payload = _build_payload(user_id, plan, amount, email=email, full_name=full_name)
    payload["apiKey"] = FLOW_API_KEY
    payload["s"] = _sign(payload, FLOW_SECRET_KEY)

    resp = requests.post(endpoint, data=payload, headers=FORM_HEADERS, timeout=15)
    if not resp.ok:
        raise RuntimeError(f"Flow error {resp.status_code}: {resp.text}")

    data = resp.json()
    checkout_url = data.get("url") or data.get("redirect") or data.get("checkoutUrl")
    if not checkout_url:
        raise RuntimeError(f"Respuesta de Flow sin URL: {data}")
    return checkout_url


def get_flow_plan_id(plan: Plan) -> str:
    plan_id = PLAN_ID_MAP.get(plan)
    if not plan_id:
        raise RuntimeError(f"Falta FLOW_PLAN_{plan.upper()}_ID en la configuracion")
    return plan_id


def create_flow_customer(*, email: str, name: str, external_id: Optional[str] = None) -> dict:
    payload = {
        "email": email,
        "name": name,
        "externalId": external_id,
    }
    return _flow_post("/customer/create", payload)


def create_flow_subscription(*, plan_id: str, customer_id: str) -> dict:
    payload = {
        "planId": plan_id,
        "customerId": customer_id,
    }
    return _flow_post("/subscription/create", payload)
