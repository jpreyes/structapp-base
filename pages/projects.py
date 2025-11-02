import streamlit as st
from services.projects_service import fetch_projects, create_project, update_project, delete_project
from core.feature_gates import max_projects

def render():
    st.header("Proyectos")
    user = st.session_state["user"]
    plan = user["plan"]

    with st.expander("Crear proyecto"):
        c1,c2,c3 = st.columns([2,1,1])
        name = c1.text_input("Nombre"); mand = c2.text_input("Mandante"); budget = c3.text_input("Presupuesto (CLP)", value="0")
        if st.button("Guardar", type="primary", disabled=not name.strip()):
            projs = fetch_projects(archived=False); limit = max_projects(plan)
            if limit is not None and len([p for p in projs if not p['is_archived']]) >= limit:
                st.error("Límite de proyectos de tu plan alcanzado.")
            else:
                create_project(user["id"], name, {"mandante":mand, "budget": int((budget or '0').replace('.',''))}); st.success("Proyecto creado."); st.rerun()

    st.subheader("Activos")
    projs = fetch_projects(archived=False)
    if not projs: st.info("Sin proyectos aún.")
    else:
        for p in projs:
            c1,c2,c3,c4,c5,c6 = st.columns([3,2,2,1,1,1])
            c1.write(f"**{p['name']}**")
            c2.write(f"Mandante: {p.get('mandante') or '—'}")
            c3.write(f"Presupuesto: {int(p.get('budget') or 0):,}".replace(',', '.'))
            if c4.button("RC Beam", key=f"beam_{p['id']}"): st.session_state["project"] = p; st.switch_page("pages/rc_beam.py")
            if c5.button("Kanban", key=f"kb_{p['id']}"): st.session_state["project"] = p; st.switch_page("pages/kanban.py")
            if c6.button("Gantt", key=f"gt_{p['id']}"): st.session_state["project"] = p; st.switch_page("pages/gantt.py")

    st.subheader("Archivados")
    arch = fetch_projects(archived=True)
    if not arch: st.caption("—")
    else:
        for p in arch: st.write(p["name"])
render()
