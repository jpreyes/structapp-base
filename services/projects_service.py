from datetime import date, datetime
from typing import Any, Optional

from supa.client import supa


def _to_date_str(value: Any) -> Optional[str]:
    if value in (None, "", "null"):
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def fetch_projects(archived: bool | None = None):
    query = supa().table("projects").select("*").order("updated_at", desc=True)
    if archived is True:
        query = query.eq("is_archived", True)
    elif archived is False:
        query = query.eq("is_archived", False)
    return query.execute().data


def create_project(user_id: str, name: str, extra: dict):
    payload = {
        "name": name,
        "created_by": user_id,
        "status": extra.get("status") or "draft",
        "start_date": _to_date_str(extra.get("start_date")),
        "end_date": _to_date_str(extra.get("end_date")),
        "mandante": extra.get("mandante"),
        "budget": extra.get("budget") or 0,
        "payment_status": extra.get("payment_status") or "not_invoiced",
    }
    return supa().table("projects").insert(payload).execute().data[0]


def update_project(pid: str, patch: dict):
    patch["updated_at"] = datetime.utcnow().isoformat()
    if "start_date" in patch:
        patch["start_date"] = _to_date_str(patch["start_date"])
    if "end_date" in patch:
        patch["end_date"] = _to_date_str(patch["end_date"])
    return supa().table("projects").update(patch).eq("id", pid).execute().data[0]


def delete_project(pid: str):
    supa().table("projects").delete().eq("id", pid).execute()
