import streamlit as st
import plotly.express as px
import pandas as pd
from datetime import date
from services.tasks_service import list_tasks, create_task, update_task, delete_task

def _color_for_status(status: str) -> str:
    return {"todo":"#64748B","doing":"#00D4FF","blocked":"#EF4444","done":"#22C55E"}.get(status, "#64748B")

def render():
    st.header("Timeline (Gantt) del proyecto")
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto primero (desde Proyectos).")
        st.stop()

    st.caption(f"Proyecto: **{project['name']}**")

    with st.form("new_task"):
        c1, c2, c3, c4 = st.columns([2,1,1,1])
        title = c1.text_input("Tarea")
        start = c2.date_input("Inicio", value=date.today())
        end   = c3.date_input("Término", value=date.today())
        status = c4.selectbox("Estado", ["todo","doing","blocked","done"], index=0)
        c5, c6 = st.columns([1,3])
        progress = c5.slider("Progreso (%)", 0, 100, 0, step=5)
        assignee = c6.text_input("Responsable")
        notes = st.text_area("Notas", placeholder="Detalle o entregables")
        ok = st.form_submit_button("Agregar")
        if ok:
            if not title.strip():
                st.error("La tarea debe tener un título.")
            elif end < start:
                st.error("La fecha de término no puede ser anterior al inicio.")
            else:
                create_task(project["id"], title.strip(), str(start), str(end),
                            progress=progress, status=status, assignee=assignee, notes=notes)
                st.success("Tarea creada.")
                st.rerun()

    st.divider()

    data = list_tasks(project["id"])
    if not data:
        st.info("Aún no hay tareas. Agrega una arriba.")
        st.stop()

    df = pd.DataFrame(data)
    df["Inicio"] = pd.to_datetime(df["start_date"])
    df["Termino"] = pd.to_datetime(df["end_date"])
    df["Recurso"] = df["assignee"].fillna("").replace({"": "Sin asignar"})
    df["Estado"] = df["status"]
    fig = px.timeline(
        df, x_start="Inicio", x_end="Termino",
        y="Recurso", color="Estado", hover_name="title",
        hover_data={"title": True, "progress": True, "notes": True, "Inicio": True, "Termino": True},
        color_discrete_map={s: _color_for_status(s) for s in ["todo","doing","blocked","done"]}
    )
    fig.update_yaxes(autorange="reversed")
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("Edición rápida")
    for t in data:
        with st.expander(f"✏️ {t['title']}"):
            c1,c2,c3,c4 = st.columns([1,1,1,1])
            new_status = c1.selectbox("Estado", ["todo","doing","blocked","done"],
                                      index=["todo","doing","blocked","done"].index(t["status"]), key=f"st_{t['id']}")
            new_prog = c2.slider("Progreso (%)", 0, 100, int(t["progress"]), 5, key=f"pg_{t['id']}")
            new_start = c3.date_input("Inicio", value=pd.to_datetime(t["start_date"]).date(), key=f"sd_{t['id']}")
            new_end   = c4.date_input("Término", value=pd.to_datetime(t["end_date"]).date(), key=f"ed_{t['id']}")
            c5, c6 = st.columns([3,1])
            new_assignee = c5.text_input("Responsable", value=t.get("assignee") or "", key=f"as_{t['id']}")
            if c6.button("Guardar", key=f"save_{t['id']}"):
                if new_end < new_start:
                    st.error("Término no puede ser anterior al inicio.")
                else:
                    update_task(t["id"], {
                        "status": new_status, "progress": new_prog,
                        "start_date": str(new_start), "end_date": str(new_end),
                        "assignee": new_assignee
                    })
                    st.success("Actualizado.")
                    st.rerun()
            if st.button("🗑️ Borrar", key=f"del_{t['id']}"):
                delete_task(t["id"])
                st.rerun()
render()
