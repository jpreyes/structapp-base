from datetime import date
from typing import List, Optional

import streamlit as st

from services.tasks_service import create_task, delete_task, list_tasks, update_task

STATUS_COLUMNS: List[dict] = [
    {"key": "todo", "label": "Por iniciar"},
    {"key": "doing", "label": "En curso"},
    {"key": "blocked", "label": "Bloqueada"},
    {"key": "done", "label": "Completada"},
]
STATUS_INDEX = {item["key"]: idx for idx, item in enumerate(STATUS_COLUMNS)}


def _status_label(value: str) -> str:
    return next((item["label"] for item in STATUS_COLUMNS if item["key"] == value), value)


def _status_options() -> List[str]:
    return [item["key"] for item in STATUS_COLUMNS]


def _parse_date(value: Optional[str]) -> date:
    if isinstance(value, date):
        return value
    if not value:
        return date.today()
    value_str = str(value)
    if "T" in value_str:
        value_str = value_str.split("T", 1)[0]
    return date.fromisoformat(value_str)


def render():
    st.header("Kanban del proyecto")
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto primero (desde Proyectos).")
        st.stop()

    st.caption(f"Proyecto: **{project['name']}**")

    tasks = list_tasks(project["id"])

    with st.form("create_task_kanban"):
        c1, c2, c3 = st.columns([2, 1, 1])
        title = c1.text_input("Titulo de la tarea")
        assignee = c2.text_input("Responsable")
        status = c3.selectbox(
            "Estado inicial",
            options=_status_options(),
            index=0,
            format_func=_status_label,
        )
        c4, c5 = st.columns([1, 1])
        start_date = c4.date_input("Inicio", value=date.today())
        end_date = c5.date_input("Termino", value=date.today())
        notes = st.text_input("Notas (opcional)")
        progress = st.slider("Progreso (%)", 0, 100, 0, step=5)
        submitted = st.form_submit_button("Agregar tarea", type="primary", use_container_width=True)
        if submitted:
            if not title.strip():
                st.error("La tarea debe tener un titulo.")
            elif end_date < start_date:
                st.error("La fecha de termino no puede ser anterior a la de inicio.")
            else:
                create_task(
                    project["id"],
                    title.strip(),
                    str(start_date),
                    str(end_date),
                    progress=progress,
                    status=status,
                    assignee=assignee.strip(),
                    notes=notes.strip(),
                )
                st.success("Tarea creada.")
                st.rerun()

    st.divider()

    columns = st.columns(len(STATUS_COLUMNS))
    for col_idx, column_info in enumerate(STATUS_COLUMNS):
        column_tasks = [task for task in tasks if task.get("status") == column_info["key"]]
        with columns[col_idx]:
            st.markdown(f"### {column_info['label']} ({len(column_tasks)})")
            if not column_tasks:
                st.caption("Sin tareas en esta columna.")
            for task in column_tasks:
                title = task["title"]
                progress = int(task.get("progress") or 0)
                due = task.get("end_date") or "-"
                assignee = task.get("assignee") or "-"
                expander_label = f"{title} | {progress}% | Fin: {due}"
                with st.expander(expander_label, expanded=False):
                    c1, c2 = st.columns([2, 1])
                    new_title = c1.text_input(
                        "Titulo",
                        value=task["title"],
                        key=f"title_{task['id']}",
                    )
                    new_assignee = c2.text_input(
                        "Responsable",
                        value=task.get("assignee") or "",
                        key=f"assignee_{task['id']}",
                    )
                    c3, c4 = st.columns([1, 1])
                    new_start = c3.date_input(
                        "Inicio",
                        value=_parse_date(task.get("start_date")),
                        key=f"start_{task['id']}",
                    )
                    new_end = c4.date_input(
                        "Termino",
                        value=_parse_date(task.get("end_date")),
                        key=f"end_{task['id']}",
                    )
                    new_progress = st.slider(
                        "Progreso (%)",
                        0,
                        100,
                        progress,
                        step=5,
                        key=f"progress_{task['id']}",
                    )
                    new_status = st.selectbox(
                        "Estado",
                        options=_status_options(),
                        index=STATUS_INDEX.get(task.get("status"), 0),
                        format_func=_status_label,
                        key=f"status_{task['id']}",
                    )
                    new_notes = st.text_area(
                        "Notas",
                        value=task.get("notes") or "",
                        height=100,
                        key=f"notes_{task['id']}",
                    )
                    save = st.button("Guardar cambios", key=f"save_{task['id']}")
                    if save:
                        if new_end < new_start:
                            st.error("La fecha de termino no puede ser anterior al inicio.")
                        else:
                            update_task(
                                task["id"],
                                {
                                    "title": new_title.strip() or task["title"],
                                    "assignee": new_assignee.strip(),
                                    "start_date": str(new_start),
                                    "end_date": str(new_end),
                                    "progress": new_progress,
                                    "status": new_status,
                                    "notes": new_notes.strip(),
                                },
                            )
                            st.success("Tarea actualizada.")
                            st.rerun()

                    if st.button("Eliminar tarea", key=f"delete_{task['id']}"):
                        delete_task(task["id"])
                        st.success("Tarea eliminada.")
                        st.rerun()


render()
