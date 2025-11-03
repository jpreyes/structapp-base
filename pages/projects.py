from datetime import date, datetime, timedelta
from typing import List, Optional

import pandas as pd
import streamlit as st

from core.feature_gates import max_projects
from services.projects_service import create_project, fetch_projects, update_project
from utils.format import clp, to_int

try:
    from streamlit_calendar import calendar
except ImportError:  # pragma: no cover - optional dependency
    calendar = None

STATUS_CHOICES = [
    ("Planificacion", "draft"),
    ("Diseno en curso", "in_design"),
    ("En revision", "in_review"),
    ("Entregado", "delivered"),
]
LABEL_TO_STATUS = {label: status for label, status in STATUS_CHOICES}
STATUS_TO_LABEL = {status: label for label, status in STATUS_CHOICES}

STATUS_COLORS = {
    "draft": "#64748B",
    "in_design": "#0EA5E9",
    "in_review": "#FACC15",
    "delivered": "#22C55E",
}
DEFAULT_STATUS_COLOR = "#2563EB"
ACTIVE_PROJECT_COLOR = "#F97316"


def _status_index(value: Optional[str]) -> int:
    for idx, (_, status) in enumerate(STATUS_CHOICES):
        if status == value:
            return idx
    return 0


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None


def _build_calendar_events(projects: List[dict], active_project: Optional[dict]) -> List[dict]:
    events: List[dict] = []
    active_id = active_project.get("id") if active_project else None
    for project in projects:
        start = _parse_date(project.get("start_date"))
        end = _parse_date(project.get("end_date"))
        if not start or not end:
            continue
        color = STATUS_COLORS.get(project.get("status"), DEFAULT_STATUS_COLOR)
        if project.get("id") == active_id:
            color = ACTIVE_PROJECT_COLOR
        event = {
            "id": project["id"],
            "title": project["name"],
            "start": start.isoformat(),
            "end": (end + timedelta(days=1)).isoformat(),
            "color": color,
            "extendedProps": {
                "estado": STATUS_TO_LABEL.get(project.get("status"), project.get("status") or "-"),
                "mandante": project.get("mandante") or "-",
                "presupuesto": f"CLP {clp(project.get('budget'))}",
            },
        }
        events.append(event)
    return events


def _increment_projects_version() -> None:
    st.session_state["projects_version"] = st.session_state.get("projects_version", 0) + 1


def render():
    st.header("Proyectos")
    user = st.session_state["user"]
    plan = user["plan"]
    st.caption("Crea y gestiona los proyectos activos del estudio.")

    with st.form("create_project"):
        st.subheader("Nuevo proyecto")
        name_col, mand_col = st.columns([2, 1])
        name = name_col.text_input("Nombre", placeholder="Edificio Centro Sur")
        mandante = mand_col.text_input("Mandante / Cliente")

        budget_col, status_col = st.columns([1, 1])
        budget = budget_col.number_input("Presupuesto (CLP)", min_value=0, value=0, step=500000, format="%i")
        status_label = status_col.selectbox(
            "Estado inicial", options=[label for label, _ in STATUS_CHOICES], index=0
        )

        with st.expander("Fechas (opcional)", expanded=False):
            use_dates = st.checkbox("Definir fechas", value=False, key="create_use_dates")
            if use_dates:
                start_date = st.date_input("Inicio", value=date.today(), key="create_start")
                end_date = st.date_input("Termino", value=date.today(), key="create_end")
            else:
                start_date = None
                end_date = None

        submitted = st.form_submit_button("Crear", type="primary", use_container_width=True)
        if submitted:
            errors: list[str] = []
            if not name.strip():
                errors.append("El nombre del proyecto es obligatorio.")
            if use_dates and end_date and start_date and end_date < start_date:
                errors.append("La fecha de termino no puede ser anterior a la de inicio.")

            active_projects = fetch_projects(archived=False)
            limit = max_projects(plan)
            if limit is not None and len([p for p in active_projects if not p.get("is_archived")]) >= limit:
                errors.append("Alcanzaste el limite de proyectos para tu plan.")

            if errors:
                for msg in errors:
                    st.error(msg)
            else:
                extra = {
                    "mandante": mandante.strip() or None,
                    "budget": int(budget),
                    "status": LABEL_TO_STATUS[status_label],
                }
                if use_dates and start_date and end_date:
                    extra["start_date"] = start_date
                    extra["end_date"] = end_date

                new_project = create_project(user["id"], name.strip(), extra)
                st.session_state["project"] = new_project
                _increment_projects_version()
                st.success("Proyecto creado.")
                st.rerun()

    projects = fetch_projects(archived=False)
    archived = fetch_projects(archived=True)

    total_budget = sum(to_int(p.get("budget")) or 0 for p in projects)
    delivered_count = sum(1 for p in projects if p.get("status") == "delivered")

    summary_cols = st.columns(3)
    summary_cols[0].metric("Activos", len(projects))
    summary_cols[1].metric("Presupuesto total CLP", f"CLP {clp(total_budget)}")
    summary_cols[2].metric("Entregados", delivered_count)
    if archived:
        st.caption(f"{len(archived)} proyectos archivados disponibles al final de la pagina.")

    st.subheader("Activos")
    if not projects:
        st.info("Aun no hay proyectos. Crea el primero con el formulario superior.")
    else:
        table_rows = [
            {
                "Proyecto": proj["name"],
                "Estado": STATUS_TO_LABEL.get(proj.get("status"), proj.get("status") or "-"),
                "Inicio": proj.get("start_date") or "-",
                "Termino": proj.get("end_date") or "-",
                "Presupuesto CLP": clp(proj.get("budget")),
                "Mandante": proj.get("mandante") or "-",
            }
            for proj in projects
        ]
        st.dataframe(
            pd.DataFrame(table_rows).set_index("Proyecto"),
            use_container_width=True,
            hide_index=False,
        )

        for project in projects:
            expanded = st.session_state.get("project", {}).get("id") == project["id"]
            header_label = f"{project['name']} - CLP {clp(project.get('budget'))}"
            with st.expander(header_label, expanded=expanded):
                with st.form(f"project_edit_form_{project['id']}"):
                    name_col, mand_col, budget_col = st.columns([2, 1, 1])
                    new_name = name_col.text_input(
                        "Nombre",
                        value=project["name"],
                        key=f"name_{project['id']}",
                    )
                    new_mandante = mand_col.text_input(
                        "Mandante / Cliente",
                        value=project.get("mandante") or "",
                        key=f"mand_{project['id']}",
                    )
                    new_budget = budget_col.number_input(
                        "Presupuesto (CLP)",
                        min_value=0,
                        value=to_int(project.get("budget")) or 0,
                        step=500000,
                        format="%i",
                        key=f"budget_{project['id']}",
                    )

                    status_idx = _status_index(project.get("status"))
                    status_label = st.selectbox(
                        "Estado",
                        options=[label for label, _ in STATUS_CHOICES],
                        index=status_idx,
                        key=f"status_{project['id']}",
                    )

                    start_default = _parse_date(project.get("start_date")) or date.today()
                    end_default = _parse_date(project.get("end_date")) or start_default
                    new_start = st.date_input(
                        "Inicio",
                        value=start_default,
                        key=f"start_{project['id']}",
                    )
                    new_end = st.date_input(
                        "Termino",
                        value=end_default,
                        key=f"end_{project['id']}",
                    )
                    clear_dates = st.checkbox(
                        "Sin fechas definidas",
                        value=project.get("start_date") is None and project.get("end_date") is None,
                        key=f"clear_dates_{project['id']}",
                    )

                    submitted = st.form_submit_button("Guardar cambios")

                if submitted:
                    if not clear_dates and new_end < new_start:
                        st.error("La fecha de termino no puede ser anterior a la de inicio.")
                    else:
                        patch = {
                            "name": new_name.strip(),
                            "mandante": new_mandante.strip() or None,
                            "budget": int(new_budget),
                            "status": LABEL_TO_STATUS[status_label],
                        }
                        if clear_dates:
                            patch["start_date"] = None
                            patch["end_date"] = None
                        else:
                            patch["start_date"] = new_start.isoformat()
                            patch["end_date"] = new_end.isoformat()

                        updated = update_project(project["id"], patch)
                        st.session_state["project"] = updated
                        _increment_projects_version()
                        st.success("Proyecto actualizado.")
                        st.rerun()

                action_cols = st.columns([1, 1, 1])
                if action_cols[0].button("Seleccionar", key=f"select_{project['id']}"):
                    st.session_state["project"] = project
                    st.success("Proyecto marcado como activo.")
                    st.rerun()

                if action_cols[1].button("Archivar", key=f"archive_{project['id']}"):
                    update_project(
                        project["id"],
                        {"is_archived": True, "archived_at": datetime.utcnow().isoformat()},
                    )
                    if (
                        st.session_state.get("project", {}).get("id")
                        and st.session_state["project"]["id"] == project["id"]
                    ):
                        st.session_state.pop("project", None)
                    _increment_projects_version()
                    st.success("Proyecto archivado.")
                    st.rerun()

                nav_cols = st.columns(3)
                if nav_cols[0].button("RC Beam", key=f"beam_{project['id']}"):
                    st.session_state["project"] = project
                    st.switch_page("pages/rc_beam.py")
                if nav_cols[1].button("Kanban", key=f"kanban_{project['id']}"):
                    st.session_state["project"] = project
                    st.switch_page("pages/kanban.py")
                if nav_cols[2].button("Gantt", key=f"gantt_{project['id']}"):
                    st.session_state["project"] = project
                    st.switch_page("pages/gantt.py")

    st.subheader("Calendario de proyectos")
    if calendar is None:
        st.info(
            "Para ver el calendario instala el componente streamlit-calendar (pip install streamlit-calendar)."
        )
    else:
        events = _build_calendar_events(projects, st.session_state.get("project"))
        if not events:
            st.caption("Asigna fechas de inicio y termino a tus proyectos para poblar el calendario.")
        else:
            options = {
                "initialView": "dayGridMonth",
                "height": 650,
                "locale": "es",
                "headerToolbar": {
                    "left": "prev,next today",
                    "center": "title",
                    "right": "dayGridMonth,timeGridWeek,listWeek",
                },
            }
            calendar(events=events, options=options, key="projects_calendar")

    st.subheader("Archivados")
    if not archived:
        st.caption("Todavia no hay proyectos archivados.")
    else:
        for project in archived:
            cols = st.columns([3, 1, 1])
            cols[0].write(f"**{project['name']}** - {STATUS_TO_LABEL.get(project.get('status'), '-')}")
            cols[1].write(f"CLP {clp(project.get('budget'))}")
            if cols[2].button("Restaurar", key=f"restore_{project['id']}"):
                update_project(project["id"], {"is_archived": False, "archived_at": None})
                _increment_projects_version()
                st.success("Proyecto restaurado.")
                st.rerun()


render()
