import streamlit as st
from calculations.rc_beam import run
from services.runs_service import save_run

def render():
    st.header("RC Beam")
    user = st.session_state["user"]; project = st.session_state.get("project")
    if not project: st.info("Selecciona un proyecto en la página de Proyectos."); st.stop()
    st.caption(f"Proyecto: **{project['name']}**")
    c1,c2,c3,c4 = st.columns(4)
    b = c1.number_input("b (mm)", 100, value=200); h = c2.number_input("h (mm)", 100, value=300); L = c3.number_input("L (m)", 1.0, value=4.0); w = c4.number_input("w (kN/m)", 1.0, value=20.0)
    if st.button("Calcular", type="primary"):
        inputs = {"b_mm": b, "h_mm": h, "L_m": L, "wl_kN_m": w}; res = run(inputs)
        save_run(project["id"], user["id"], "rc_beam", inputs, res); st.success("Cálculo guardado."); st.json({"inputs":inputs, "results":res})
render()