from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

try:
    from streamlit_calendar import calendar
except ImportError:  # pragma: no cover - optional dependency
    calendar = None

import pandas as pd
import streamlit as st

from services.projects_service import fetch_projects
from supa.client import supa
from utils.format import clp, to_int

PROJECT_STATUS_LABELS = {
    "draft": "Planificacion",
    "in_design": "Diseno en curso",
    "in_review": "En revision",
    "delivered": "Entregado",
}
TASK_STATUS_LABELS = {
    "todo": "Por iniciar",
    "doing": "En curso",
    "blocked": "Bloqueada",
    "done": "Completada",
}


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None


def _build_task_events(projects: List[dict], tasks: List[dict]) -> List[dict]:
    events: List[dict] = []
    today_iso = date.today().isoformat()
    colors = {
        "todo": "#64748B",
        "doing": "#0EA5E9",
        "blocked": "#F97316",
        "done": "#22C55E",
    }
    project_map = {proj["id"]: proj["name"] for proj in projects}
    for task in tasks:
        start = _parse_date(task.get("start_date"))
        end = _parse_date(task.get("end_date")) or start
        if not start or not end:
            continue
        end_plus = end + timedelta(days=1)
        status = task.get("status", "todo")
        project_name = project_map.get(task["project_id"], "-")
        event = {
            "id": task["id"],
            "title": f"{project_name}: {task['title']}",
            "start": start.isoformat(),
            "end": end_plus.isoformat(),
            "color": colors.get(status, "#64748B"),
            "extendedProps": {
                "estado": TASK_STATUS_LABELS.get(status, status),
                "proyecto": project_name,
                "responsable": task.get("assignee") or "-",
                "avance": f"{int(task.get('progress') or 0)}%",
                "hoy": today_iso,
            },
        }
        events.append(event)
    return events


st.header("Dashboard")
user = st.session_state.get("user")
if not user:
    st.info("Inicia sesion para ver tus indicadores.")
    st.stop()

projects = fetch_projects(archived=False)
project_ids = [p["id"] for p in projects]
total_budget = sum(to_int(p.get("budget")) or 0 for p in projects)

payments_data = (
    supa()
    .table("project_payments")
    .select("project_id, kind, amount")
    .execute()
    .data
)
payments_by_project: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
for row in payments_data:
    payments_by_project[row["project_id"]][row["kind"]] += to_int(row.get("amount")) or 0

global_totals = defaultdict(int)
for proj_totals in payments_by_project.values():
    for kind, amount in proj_totals.items():
        global_totals[kind] += amount

total_invoiced = global_totals["invoice"] + global_totals["advance"] - global_totals["credit_note"]
total_paid = global_totals["payment"] - global_totals["refund"]

calc_response = supa().table("calc_runs").select("id", count="exact").execute()
calc_count = calc_response.count or 0

tasks_response = (
    supa()
    .table("project_tasks")
    .select("project_id, title, end_date, status")
    .order("end_date")
    .limit(200)
    .execute()
    .data
)

today = date.today()
pending_tasks = [t for t in tasks_response if t.get("status") != "done"]
overdue_tasks = [
    t for t in pending_tasks
    if _parse_date(t.get("end_date")) and _parse_date(t.get("end_date")) < today
]
upcoming_tasks = [
    {
        "Proyecto": next((p["name"] for p in projects if p["id"] == task["project_id"]), "-"),
        "Tarea": task["title"],
        "Estado": TASK_STATUS_LABELS.get(task.get("status"), task.get("status") or "-"),
        "Entrega": task.get("end_date") or "-",
    }
    for task in pending_tasks
    if _parse_date(task.get("end_date")) and _parse_date(task.get("end_date")) >= today
][:10]

metrics = st.columns(4)
metrics[0].metric("Proyectos activos", len(projects))
metrics[1].metric("Presupuesto total (CLP)", f"CLP {clp(total_budget)}")
metrics[2].metric("Facturado (CLP)", f"CLP {clp(total_invoiced)}")
metrics[3].metric("Pagado (CLP)", f"CLP {clp(total_paid)}")

secondary_metrics = st.columns(3)
secondary_metrics[0].metric("Calculos guardados", calc_count)
secondary_metrics[1].metric("Tareas pendientes", len(pending_tasks))
secondary_metrics[2].metric("Tareas atrasadas", len(overdue_tasks))

st.divider()

if not projects:
    st.info("Aun no hay proyectos activos.")
else:
    project_rows = []
    for project in projects:
        totals = payments_by_project[project["id"]]
        invoiced = totals["invoice"] + totals["advance"] - totals["credit_note"]
        paid = totals["payment"] - totals["refund"]
        budget = to_int(project.get("budget")) or 0
        balance = budget - paid
        project_rows.append(
            {
                "Proyecto": project["name"],
                "Estado": PROJECT_STATUS_LABELS.get(project.get("status"), project.get("status") or "-"),
                "Inicio": project.get("start_date") or "-",
                "Termino": project.get("end_date") or "-",
                "Presupuesto CLP": clp(budget),
                "Facturado CLP": clp(invoiced),
                "Pagado CLP": clp(paid),
                "Saldo CLP": clp(balance),
            }
        )

    st.subheader("Estado de proyectos")
    st.dataframe(
        pd.DataFrame(project_rows).set_index("Proyecto"),
        use_container_width=True,
        hide_index=False,
    )

st.subheader("Proximas entregas")
if not upcoming_tasks:
    st.caption("Sin tareas proximas. Revisa el Gantt o crea nuevas tareas.")
else:
    st.dataframe(pd.DataFrame(upcoming_tasks), use_container_width=True, hide_index=True)

st.subheader("Tareas atrasadas")
if not overdue_tasks:
    st.caption("No hay tareas atrasadas.")
else:
    overdue_table = pd.DataFrame(
        [
            {
                "Proyecto": next((p["name"] for p in projects if p["id"] == task["project_id"]), "-"),
                "Tarea": task["title"],
                "Entrega": task.get("end_date") or "-",
                "Estado": TASK_STATUS_LABELS.get(task.get("status"), task.get("status") or "-"),
            }
            for task in overdue_tasks
        ]
    )
    st.dataframe(overdue_table, use_container_width=True, hide_index=True)

st.subheader("Calendario de tareas por proyecto")
if calendar is None:
    st.info("Para ver el calendario instala el componente streamlit-calendar (pip install streamlit-calendar).")
else:
    events = _build_task_events(projects, tasks_response)
    if not events:
        st.caption("Carga tareas con fechas de inicio y termino para mostrar el calendario.")
    else:
        options = {
            "initialView": "timeGridWeek",
            "height": 700,
            "locale": "es",
            "headerToolbar": {
                "left": "prev,next today",
                "center": "title",
                "right": "dayGridMonth,timeGridWeek,listWeek",
            },
        }
        calendar(events=events, options=options, key="dashboard_tasks_calendar")
