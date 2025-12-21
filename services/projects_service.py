from datetime import date, datetime
from collections import defaultdict
from typing import Any, Optional

from supa.client import supa
from services.tasks_service import list_tasks


def _require_project(project_id: str, user_id: str) -> dict:
    project = (
        supa()
        .table("projects")
        .select("*")
        .eq("id", project_id)
        .eq("created_by", user_id)
        .single()
        .execute()
        .data
    )
    if not project:
        raise ValueError("Proyecto no encontrado")
    return project


def _get_project_limit(user_id: str) -> Optional[int]:
    profile = (
        supa()
        .table("profiles")
        .select("project_limit")
        .eq("user_id", user_id)
        .single()
        .execute()
        .data
    )
    if not profile:
        return None
    return profile.get("project_limit")


def _count_user_projects(user_id: str) -> int:
    projects = (
        supa()
        .table("projects")
        .select("id")
        .eq("created_by", user_id)
        .execute()
        .data
    )
    return len(projects or [])


def _ensure_project_limit(user_id: str) -> None:
    limit = _get_project_limit(user_id)
    if limit is None or limit <= 0:
        return
    if _count_user_projects(user_id) >= limit:
        raise ValueError("Limite de proyectos alcanzado")


def _to_date_str(value: Any) -> Optional[str]:
    if value in (None, "", "null"):
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def fetch_projects(user_id: str, archived: bool | None = None):
    query = (
        supa()
        .table("projects")
        .select("*")
        .eq("created_by", user_id)
        .order("updated_at", desc=True)
    )
    if archived is True:
        query = query.eq("is_archived", True)
    elif archived is False:
        query = query.eq("is_archived", False)
    projects = query.execute().data
    if not projects:
        return []

    project_ids = [project["id"] for project in projects]
    payments_query = (
        supa()
        .table("project_payments")
        .select("project_id, kind, amount")
        .in_("project_id", project_ids)
    )
    payments = payments_query.execute().data

    payment_totals: dict[str, dict[str, float]] = defaultdict(
        lambda: {"facturado": 0.0, "pagado": 0.0, "saldo": 0.0, "egresos": 0.0}
    )
    if payments:
        grouped: dict[str, dict[str, float]] = defaultdict(
            lambda: {
                "invoice": 0.0,
                "advance": 0.0,
                "payment": 0.0,
                "credit_note": 0.0,
                "refund": 0.0,
                "egreso": 0.0,
            }
        )
        for payment in payments:
            pid = payment["project_id"]
            kind = payment["kind"]
            amount = float(payment.get("amount") or 0)
            grouped[pid][kind] = grouped[pid].get(kind, 0.0) + amount

        for pid, sums in grouped.items():
            invoice = sums.get("invoice", 0.0)
            advance = sums.get("advance", 0.0)
            payment_total = sums.get("payment", 0.0)
            credit = sums.get("credit_note", 0.0)
            refund = sums.get("refund", 0.0)
            egresos = sums.get("egreso", 0.0)
            facturado = max(invoice - credit, 0.0)
            pagado = max(payment_total + advance - refund, 0.0)
            saldo = max(facturado - pagado, 0.0)
            payment_totals[pid] = {
                "facturado": facturado,
                "pagado": pagado,
                "saldo": saldo,
                "egresos": egresos,
            }

    for project in projects:
        totals = payment_totals.get(
            project["id"],
            {"facturado": 0.0, "pagado": 0.0, "saldo": 0.0, "egresos": 0.0},
        )
        project["payments_facturado"] = totals["facturado"]
        project["payments_pagado"] = totals["pagado"]
        project["payments_egresos"] = totals["egresos"]
        project["payments_saldo"] = totals["saldo"]

    return projects


def fetch_project_detail(project_id: str, user_id: str):
    project = _require_project(project_id, user_id)

    payments_res = (
        supa()
        .table("project_payments")
        .select("*")
        .eq("project_id", project_id)
        .order("event_date", desc=True)
        .execute()
    )
    payments = payments_res.data or []

    invoice = sum(float(item.get("amount") or 0) for item in payments if item.get("kind") == "invoice")
    advance = sum(float(item.get("amount") or 0) for item in payments if item.get("kind") == "advance")
    payment_total = sum(float(item.get("amount") or 0) for item in payments if item.get("kind") == "payment")
    credit = sum(float(item.get("amount") or 0) for item in payments if item.get("kind") == "credit_note")
    refund = sum(float(item.get("amount") or 0) for item in payments if item.get("kind") == "refund")
    egresos = sum(float(item.get("amount") or 0) for item in payments if item.get("kind") == "egreso")

    facturado = max(invoice - credit, 0.0)
    pagado = max(payment_total + advance - refund, 0.0)
    saldo = max(facturado - pagado, 0.0)

    project["payments_facturado"] = facturado
    project["payments_pagado"] = pagado
    project["payments_egresos"] = egresos
    project["payments_saldo"] = saldo

    tasks = list_tasks(project_id, user_id)
    tasks = tasks or []
    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.get("status") == "done")

    important_dates = {
        "start_date": project.get("start_date"),
        "end_date": project.get("end_date"),
        "next_task_start": None,
        "next_task_due": None,
    }
    future_tasks = sorted(
        (task for task in tasks if task.get("start_date")),
        key=lambda task: task.get("start_date"),
    )
    future_due = sorted(
        (task for task in tasks if task.get("end_date")),
        key=lambda task: task.get("end_date"),
    )
    if future_tasks:
        important_dates["next_task_start"] = future_tasks[0].get("start_date")
    if future_due:
        important_dates["next_task_due"] = future_due[0].get("end_date")

    return {
        "project": project,
        "payments": payments,
        "tasks": tasks,
        "metrics": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "budget": float(project.get("budget") or 0),
            "payments": {
                "facturado": facturado,
                "pagado": pagado,
                "saldo": saldo,
                "egresos": egresos,
            },
        },
        "important_dates": important_dates,
    }


def create_project(user_id: str, name: str, extra: dict):
    _ensure_project_limit(user_id)
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


def update_project(pid: str, user_id: str, patch: dict):
    _require_project(pid, user_id)
    patch["updated_at"] = datetime.utcnow().isoformat()
    if "start_date" in patch:
        patch["start_date"] = _to_date_str(patch["start_date"])
    if "end_date" in patch:
        patch["end_date"] = _to_date_str(patch["end_date"])
    return supa().table("projects").update(patch).eq("id", pid).execute().data[0]


def delete_project(pid: str, user_id: str):
    _require_project(pid, user_id)
    supa().table("projects").delete().eq("id", pid).execute()
