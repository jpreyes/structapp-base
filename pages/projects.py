from datetime import date, datetime
from typing import Optional

import pandas as pd
import streamlit as st

from core.feature_gates import max_projects
from services.projects_service import create_project, fetch_projects, update_project
from utils.format import clp, to_int

STATUS_CHOICES = [
    ("Planificacion", "draft"),
    ("Diseno en curso", "in_design"),
    ("En revision", "in_review"),
    ("Entregado", "delivered"),
]
LABEL_TO_STATUS = {label: status for label, status in STATUS_CHOICES}
STATUS_TO_LABEL = {status: label for label, status in STATUS_CHOICES}


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

                dates_container = st.container()
                update_dates = dates_container.checkbox(
                    "Actualizar fechas",
                    value=bool(project.get("start_date") or project.get("end_date")),
                    key=f"dates_toggle_{project['id']}",
                )
                clear_dates = False
                new_start = project.get("start_date")
                new_end = project.get("end_date")
                if update_dates:
                    start_default = _parse_date(project.get("start_date")) or date.today()
                    end_default = _parse_date(project.get("end_date")) or start_default
                    new_start = dates_container.date_input(
                        "Inicio",
                        value=start_default,
                        key=f"start_{project['id']}",
                    )
                    new_end = dates_container.date_input(
                        "Termino",
                        value=end_default,
                        key=f"end_{project['id']}",
                    )
                    clear_dates = dates_container.checkbox(
                        "Limpiar fechas",
                        value=False,
                        key=f"clear_dates_{project['id']}",
                    )

                actions = st.columns([1, 1, 1])
                if actions[0].button("Guardar cambios", key=f"save_{project['id']}"):
                    if update_dates and not clear_dates and isinstance(new_start, date) and isinstance(new_end, date):
                        if new_end < new_start:
                            st.error("La fecha de termino no puede ser anterior a la de inicio.")
                            st.stop()
                    patch = {
                        "name": new_name.strip(),
                        "mandante": new_mandante.strip() or None,
                        "budget": int(new_budget),
                        "status": LABEL_TO_STATUS[status_label],
                    }
                    if update_dates:
                        if clear_dates:
                            patch["start_date"] = None
                            patch["end_date"] = None
                        else:
                            patch["start_date"] = new_start
                            patch["end_date"] = new_end

                    updated = update_project(project["id"], patch)
                    st.session_state["project"] = updated
                    _increment_projects_version()
                    st.success("Proyecto actualizado.")
                    st.rerun()

                if actions[1].button("Seleccionar", key=f"select_{project['id']}"):
                    st.session_state["project"] = project
                    st.success("Proyecto marcado como activo.")
                    st.rerun()

                if actions[2].button("Archivar", key=f"archive_{project['id']}"):
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

                links = st.columns(3)
                if links[0].button("RC Beam", key=f"beam_{project['id']}"):
                    st.session_state["project"] = project
                    st.switch_page("pages/rc_beam.py")
                if links[1].button("Kanban", key=f"kanban_{project['id']}"):
                    st.session_state["project"] = project
                    st.switch_page("pages/kanban.py")
                if links[2].button("Gantt", key=f"gantt_{project['id']}"):
                    st.session_state["project"] = project
                    st.switch_page("pages/gantt.py")

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
