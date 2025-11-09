from datetime import date, timedelta
from typing import Optional

import pandas as pd
import plotly.express as px
import streamlit as st

from services.tasks_service import create_task, delete_task, list_tasks, update_task

STATUS_OPTIONS = ["todo", "doing", "blocked", "done"]
STATUS_LABELS = {
    "todo": "Por iniciar",
    "doing": "En curso",
    "blocked": "Bloqueada",
    "done": "Completada",
}
STATUS_COLORS = {
    "todo": "#64748B",
    "doing": "#00D4FF",
    "blocked": "#EF4444",
    "done": "#22C55E",
}


def _status_index(value: str) -> int:
    try:
        return STATUS_OPTIONS.index(value)
    except ValueError:
        return 0


def _parse_date(value: Optional[str]) -> date:
    if isinstance(value, date):
        return value
    if not value:
        return date.today()
    return pd.to_datetime(value).date()


def render():
    st.header("Timeline (Gantt) del proyecto")
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto primero (desde Proyectos).")
        st.stop()

    st.caption(f"Proyecto: **{project['name']}**")

    with st.form("new_task"):
        st.subheader("Nueva tarea")
        c1, c2 = st.columns([2, 1])
        title = c1.text_input("Titulo")
        start = c2.date_input("Inicio", value=date.today())
        end = st.date_input("Termino", value=date.today() + timedelta(days=7))
        c3, c4 = st.columns([1, 1])
        status = c3.selectbox("Estado", options=STATUS_OPTIONS, index=0, format_func=lambda x: STATUS_LABELS[x])
        progress = c4.slider("Progreso (%)", 0, 100, 0, step=5)
        c5, c6 = st.columns([1, 1])
        assignee = c5.text_input("Responsable")
        notes = c6.text_area("Notas", height=100)
        submitted = st.form_submit_button("Agregar", type="primary", use_container_width=True)
        if submitted:
            if not title.strip():
                st.error("La tarea debe tener un titulo.")
            elif end < start:
                st.error("La fecha de termino no puede ser anterior al inicio.")
            else:
                create_task(
                    project["id"],
                    title.strip(),
                    str(start),
                    str(end),
                    progress=progress,
                    status=status,
                    assignee=assignee.strip() or "",
                    notes=notes.strip() or "",
                )
                st.success("Tarea creada.")
                st.rerun()

    st.divider()

    data = list_tasks(project["id"])
    if not data:
        st.info("Aun no hay tareas. Agrega la primera con el formulario superior.")
        st.stop()

    df = pd.DataFrame(data)
    df["start_date"] = pd.to_datetime(df["start_date"])
    df["end_date"] = pd.to_datetime(df["end_date"])
    df["progress"] = pd.to_numeric(df["progress"], errors="coerce").fillna(0)
    df["assignee"] = df["assignee"].fillna("")
    df["notes"] = df["notes"].fillna("")

    total_tasks = len(df)
    done_tasks = int((df["status"] == "done").sum())
    overdue_tasks = int(((df["status"] != "done") & (df["end_date"].dt.date < date.today())).sum())
    avg_progress = round(df["progress"].mean(), 1) if total_tasks else 0

    metrics = st.columns(4)
    metrics[0].metric("Tareas totales", total_tasks)
    metrics[1].metric("Completadas", done_tasks)
    metrics[2].metric("Atrasadas", overdue_tasks)
    metrics[3].metric("Avance promedio", f"{avg_progress}%")

    default_status = STATUS_OPTIONS.copy()
    status_filter = st.multiselect(
        "Filtrar por estado",
        options=STATUS_OPTIONS,
        default=default_status,
        format_func=lambda x: STATUS_LABELS[x],
    )
    assignees = sorted([a for a in df["assignee"].unique() if a])
    assignee_filter = st.multiselect("Filtrar por responsable", options=assignees, default=[])

    filtered_df = df[df["status"].isin(status_filter)] if status_filter else df.copy()
    if assignee_filter:
        filtered_df = filtered_df[filtered_df["assignee"].isin(assignee_filter)]

    chart_df = filtered_df.copy()
    chart_df["Recurso"] = chart_df["assignee"].replace({"": "Sin asignar"})
    chart_df["Estado"] = chart_df["status"].map(STATUS_LABELS).fillna(chart_df["status"])

    fig = px.timeline(
        chart_df,
        x_start="start_date",
        x_end="end_date",
        y="Recurso",
        color="Estado",
        hover_name="title",
        hover_data={
            "title": False,
            "progress": True,
            "notes": True,
            "start_date": True,
            "end_date": True,
        },
        color_discrete_map={
            STATUS_LABELS[key]: value for key, value in STATUS_COLORS.items()
        },
    )
    fig.add_vline(x=pd.Timestamp(date.today()), line_width=2, line_dash="dash", line_color="#F97316")
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(
        legend_title_text="Estado",
        hoverlabel=dict(bgcolor="#111827"),
        margin=dict(l=0, r=0, t=40, b=20),
    )
    st.plotly_chart(fig, use_container_width=True)

    table_df = filtered_df.copy()
    table_df["Estado"] = table_df["status"].map(STATUS_LABELS).fillna(table_df["status"])
    table_df["Inicio"] = table_df["start_date"].dt.date
    table_df["Termino"] = table_df["end_date"].dt.date
    table_df["Responsable"] = table_df["assignee"].replace({"": "-"})
    table_df["Avance %"] = table_df["progress"].astype(int)
    table_df = table_df.rename(columns={"title": "Tarea", "notes": "Notas"})
    st.subheader("Listado de tareas")
    st.dataframe(
        table_df[["Tarea", "Estado", "Inicio", "Termino", "Responsable", "Avance %", "Notas"]],
        use_container_width=True,
        hide_index=True,
    )

    st.subheader("Edicion rapida")
    for task in data:
        exp_label = f"{task['title']} - {STATUS_LABELS.get(task['status'], task['status'])}"
        with st.expander(exp_label):
            with st.form(f"edit_task_{task['id']}"):
                cols = st.columns([1, 1])
                new_start = cols[0].date_input("Inicio", value=_parse_date(task.get("start_date")))
                new_end = cols[1].date_input("Termino", value=_parse_date(task.get("end_date")))
                cols2 = st.columns([1, 1])
                new_status = cols2[0].selectbox(
                    "Estado",
                    options=STATUS_OPTIONS,
                    index=_status_index(task.get("status", "todo")),
                    format_func=lambda x: STATUS_LABELS[x],
                )
                new_progress = cols2[1].slider(
                    "Progreso (%)", 0, 100, int(task.get("progress") or 0), step=5
                )
                cols3 = st.columns([1, 1])
                new_assignee = cols3[0].text_input(
                    "Responsable", value=task.get("assignee") or ""
                )
                new_notes = cols3[1].text_area(
                    "Notas", value=task.get("notes") or "", height=120
                )
                saved = st.form_submit_button("Guardar cambios")
                if saved:
                    if new_end < new_start:
                        st.error("La fecha de termino no puede ser anterior al inicio.")
                    else:
                        update_task(
                            task["id"],
                            {
                                "status": new_status,
                                "progress": new_progress,
                                "start_date": str(new_start),
                                "end_date": str(new_end),
                                "assignee": new_assignee.strip(),
                                "notes": new_notes.strip(),
                            },
                        )
                        st.success("Tarea actualizada.")
                        st.rerun()

            if st.button("Eliminar tarea", key=f"delete_{task['id']}"):
                delete_task(task["id"])
                st.rerun()


render()
