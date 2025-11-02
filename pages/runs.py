import streamlit as st
from services.runs_service import list_runs

def render():
    st.header("Historial de cálculos")
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto primero (desde Proyectos).")
        st.stop()
    runs = list_runs(project["id"])
    if not runs:
        st.info("Sin corridas aún.")
        st.stop()
    for r in runs:
        with st.expander(f"{r['element_type']} — {r['created_at']}"):
            st.json({"inputs": r["input_json"], "results": r["result_json"]})
render()