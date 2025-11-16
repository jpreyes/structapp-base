from datetime import datetime, timezone

import httpx

from core.config import SUPABASE_ANON_KEY, SUPABASE_URL
from supa.client import supa


def register(email: str, password: str) -> dict:
    res = supa().auth.sign_up({"email": email, "password": password})
    if res.user is None:
        raise ValueError("No se pudo crear la cuenta (activa email/password en Supabase).")

    return {
        "id": res.user.id,
        "email": res.user.email,
        "plan": "basic",
        "session_token": None,
        "approved": False,
    }


def login(email: str, password: str) -> dict:
    res = supa().auth.sign_in_with_password({"email": email, "password": password})
    if not res.user:
        raise ValueError("Credenciales invalidas")

    prof = supa().table("profiles").select("*").eq("user_id", res.user.id).single().execute().data
    if prof is None:
        raise ValueError("No se encontró el perfil del usuario")
    if not prof.get("approved"):
        email_confirmed_at = getattr(res.user, "email_confirmed_at", None)
        if email_confirmed_at:
            supa().table("profiles").update(
                {
                    "approved": True,
                    "approved_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("user_id", res.user.id).execute()
            prof["approved"] = True
        else:
            raise ValueError("Cuenta pendiente de confirmación. Revisa tu correo.")

    token = res.session.access_token if res.session else None
    return {
        "id": res.user.id,
        "email": res.user.email,
        "plan": prof.get("plan", "basic"),
        "session_token": token,
        "approved": True,
    }


def delete_user_account(user_id: str, user_token: str) -> None:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_ANON_KEY")

    _call_authenticated_user_endpoint(user_token, "delete")

    supa().table("profiles").delete().eq("user_id", user_id).execute()


def update_user_credentials(user_token: str, updates: dict) -> dict:
    return _call_authenticated_user_endpoint(user_token, "patch", payload=updates).json()


def _call_authenticated_user_endpoint(user_token: str, method: str, payload: dict | None = None) -> httpx.Response:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_ANON_KEY")

    url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {user_token}",
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=10.0) as client:
        request = getattr(client, method)
        if payload is not None:
            response = request(url, headers=headers, json=payload)
        else:
            response = request(url, headers=headers)
    response.raise_for_status()
    return response
