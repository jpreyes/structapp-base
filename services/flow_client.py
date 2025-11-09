import os
import time
import hmac
import hashlib
import requests
from typing import Literal, Optional

FLOW_BASE_URL = os.getenv("FLOW_BASE_URL", "")
FLOW_API_KEY = os.getenv("FLOW_API_KEY", "")
FLOW_COMMERCE_CODE = os.getenv("FLOW_COMMERCE_CODE", "")
FLOW_RETURN_URL = os.getenv("FLOW_RETURN_URL", "")  # URL en tu app para retornar después del pago
FLOW_CONFIRM_URL = os.getenv("FLOW_CONFIRM_URL", "")  # Webhook expuesto por tu backend

Plan = Literal["monthly", "annual"]

PLAN_PRICES_CLP = {
    "monthly": 9990,
    "annual": 100000,
}


def _is_configured() -> bool:
    return all([FLOW_BASE_URL, FLOW_API_KEY, FLOW_COMMERCE_CODE, FLOW_CONFIRM_URL])


def _sign(payload: dict, secret: str) -> str:
    # Placeholder para firma. Algunos planes de Flow usan apikey en header sin firma HMAC.
    # Si Flow requiere HMAC, ajusta aquí según su documentación.
    msg = "&".join(f"{k}={payload[k]}" for k in sorted(payload.keys()))
    return hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()


def create_checkout_link(user_id: str, plan: Plan) -> str:
    amount = PLAN_PRICES_CLP[plan]
    if not _is_configured():
        # Modo desarrollo: URL mock para continuar flujo sin credenciales
        return f"https://flow.local/checkout?plan={plan}&amount={amount}&user_id={user_id}"

    # Ejemplo genérico: ajusta endpoint y nombres de campos según Flow
    endpoint = FLOW_BASE_URL.rstrip("/") + "/payment/create"
    order_id = f"sub-{user_id}-{int(time.time())}"
    payload = {
        "commerceOrder": order_id,
        "subject": f"Suscripción {plan}",
        "amount": amount,
        "email": f"user-{user_id}@example.com",
        "urlConfirmation": FLOW_CONFIRM_URL,
        "urlReturn": FLOW_RETURN_URL or FLOW_CONFIRM_URL,
        "optional": plan,
        "currency": "CLP",
    }

    headers = {
        "Content-Type": "application/json",
        "apikey": FLOW_API_KEY,
        "commercecode": FLOW_COMMERCE_CODE,
    }

    # Si necesitan firma, descomentar y enviar en header o query según corresponda
    # signature = _sign(payload, FLOW_API_KEY)
    # headers["X-Signature"] = signature

    resp = requests.post(endpoint, json=payload, headers=headers, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    # Ajusta el nombre del campo según la respuesta real de Flow
    checkout_url = data.get("url", data.get("redirect", data.get("checkoutUrl")))
    if not checkout_url:
        raise RuntimeError(f"Respuesta de Flow sin URL: {data}")
    return checkout_url
