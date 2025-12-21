from supa.client import supa


def _require_project(project_id: str, user_id: str) -> None:
    project = (
        supa()
        .table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("created_by", user_id)
        .single()
        .execute()
        .data
    )
    if not project:
        raise ValueError("Proyecto no encontrado")


def _get_task(task_id: str) -> dict:
    task = (
        supa()
        .table("project_tasks")
        .select("*")
        .eq("id", task_id)
        .single()
        .execute()
        .data
    )
    if not task:
        raise ValueError("Tarea no encontrada")
    return task


def list_tasks(project_id: str, user_id: str):
    _require_project(project_id, user_id)
    return (
        supa()
        .table("project_tasks")
        .select("*")
        .eq("project_id", project_id)
        .order("start_date")
        .execute()
        .data
    )


def create_task(
    project_id: str,
    user_id: str,
    title: str,
    start_date: str,
    end_date: str,
    progress: int = 0,
    status: str = "todo",
    assignee: str = "",
    notes: str = "",
):
    _require_project(project_id, user_id)
    payload = {
        "project_id": project_id,
        "title": title,
        "start_date": start_date,
        "end_date": end_date,
        "progress": progress,
        "status": status,
        "assignee": assignee,
        "notes": notes,
    }
    return supa().table("project_tasks").insert(payload).execute().data[0]


def update_task(task_id: str, user_id: str, patch: dict):
    task = _get_task(task_id)
    _require_project(task["project_id"], user_id)
    return supa().table("project_tasks").update(patch).eq("id", task_id).execute().data[0]


def delete_task(task_id: str, user_id: str):
    task = _get_task(task_id)
    _require_project(task["project_id"], user_id)
    supa().table("project_tasks").delete().eq("id", task_id).execute()
