from supa.client import supa
def list_tasks(project_id: str):
    return supa().table("project_tasks").select("*").eq("project_id", project_id).order("start_date").execute().data
def create_task(project_id: str, title: str, start_date: str, end_date: str, progress: int = 0, status: str = "todo", assignee: str = "", notes: str = ""):
    payload = {"project_id": project_id, "title": title, "start_date": start_date, "end_date": end_date, "progress": progress, "status": status, "assignee": assignee, "notes": notes}
    return supa().table("project_tasks").insert(payload).execute().data[0]
def update_task(task_id: str, patch: dict):
    return supa().table("project_tasks").update(patch).eq("id", task_id).execute().data[0]
def delete_task(task_id: str):
    supa().table("project_tasks").delete().eq("id", task_id).execute()
