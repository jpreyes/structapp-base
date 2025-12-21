from supa.client import supa

from services.subscription_service import get_subscription


def _get_profile_record(user_id: str) -> dict:
    profile_res = (
        supa()
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


def update_profile_metadata(user_id: str, updates: dict) -> None:
    if not updates:
        return
    supa().table("profiles").update(updates).eq("user_id", user_id).execute()
