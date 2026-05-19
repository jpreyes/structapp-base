from supabase import ClientOptions, create_client

from core.config import SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL
from supa.client import supa, supa_service

from services.subscription_service import get_subscription


def _profile_client(user_token: str | None = None):
    if SUPABASE_SERVICE_KEY:
        return supa_service()
    if user_token:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_ANON_KEY")
        return create_client(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            ClientOptions(headers={"Authorization": f"Bearer {user_token}"}),
        )
    return supa()


def _get_profile_record(user_id: str) -> dict:
    profile_res = (
        _profile_client()
        .table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return profile_res.data or {}


def _count_user_projects(user_id: str) -> int:
    projects_res = (
        supa()
        .table("projects")
        .select("id")
        .eq("created_by", user_id)
        .execute()
    )
    projects = projects_res.data or []
    return len(projects)


def get_user_profile_summary(user_id: str) -> dict:
    profile = _get_profile_record(user_id)
    subscription = get_subscription(user_id) or {}
    return {
        "full_name": profile.get("full_name"),
        "profession": profile.get("profession"),
        "avatar_url": profile.get("avatar_url"),
        "company_name": profile.get("company_name"),
        "company_role": profile.get("company_role"),
        "plan": subscription.get("plan") or profile.get("plan") or "basic",
        "plan_status": subscription.get("status"),
        "plan_started_at": subscription.get("started_at"),
        "plan_expires_at": subscription.get("expires_at"),
        "project_count": _count_user_projects(user_id),
        "project_limit": profile.get("project_limit"),
        "flow_subscription_id": subscription.get("flow_subscription_id"),
        "flow_customer_id": subscription.get("flow_customer_id"),
    }


def update_profile_metadata(user_id: str, updates: dict, user_token: str | None = None) -> None:
    if not updates:
        return
    response = (
        _profile_client(user_token)
        .table("profiles")
        .update(updates)
        .eq("user_id", user_id)
        .execute()
    )
    error = getattr(response, "error", None)
    if error:
        message = getattr(error, "message", None) or str(error)
        raise RuntimeError(message)
    data = getattr(response, "data", None)
    if isinstance(data, list) and not data:
        raise RuntimeError("No se encontró el perfil para actualizar.")
