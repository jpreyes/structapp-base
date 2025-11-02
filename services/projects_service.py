from supa.client import supa
from datetime import datetime
def fetch_projects(archived: bool|None=None):
    q = supa().table("projects").select("*").order("updated_at", desc=True)
    if archived is True: q = q.eq("is_archived", True)
    elif archived is False: q = q.eq("is_archived", False)
    return q.execute().data
def create_project(user_id: str, name: str, extra: dict):
    payload = {"name": name, "created_by": user_id, "status": "draft",
               "start_date": extra.get("start_date"), "end_date": extra.get("end_date"),
               "mandante": extra.get("mandante"), "budget": extra.get("budget"),
               "payment_status": "not_invoiced"}
    return supa().table("projects").insert(payload).execute().data[0]
def update_project(pid: str, patch: dict):
    patch["updated_at"] = datetime.utcnow().isoformat()
    return supa().table("projects").update(patch).eq("id", pid).execute().data[0]
def delete_project(pid: str):
    supa().table("projects").delete().eq("id", pid).execute()
