import streamlit as st

from calculations.rc_beam import run
from services.docs_service import export_rc_beam_pdf
from services.runs_service import list_runs, save_run


def render():
    st.header("RC Beam")
    user = st.session_state["user"]
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto en la pagina de Proyectos.")
        st.stop()

    st.caption(f"Proyecto: **{project['name']}**")

    with st.form("rc_beam_form"):
        c1, c2, c3, c4 = st.columns(4)
        b = c1.number_input("Ancho b (mm)", min_value=100, value=200, step=10)
        h = c2.number_input("Altura h (mm)", min_value=100, value=300, step=10)
        L = c3.number_input("Luz L (m)", min_value=0.5, value=4.0, step=0.1)
        w = c4.number_input("Carga distribuida w (kN/m)", min_value=0.1, value=20.0, step=0.5)
        submitted = st.form_submit_button("Calcular", type="primary", use_container_width=True)

    if submitted:
        inputs = {"b_mm": b, "h_mm": h, "L_m": L, "wl_kN_m": w}
        results = run(inputs)
        save_run(project["id"], user["id"], "rc_beam", inputs, results)
        st.success("Calculo guardado.")

        m_col, as_col, ok_col = st.columns(3)
        m_col.metric("Momento maximo Mu (kN*m)", f"{results['Mu_kNm']}")
        as_col.metric("As requerida (mm2)", f"{results['As_req_mm2']}")
        ok_col.metric("Revisa cuantia minima", "OK" if results.get("ok") else "Revisar")

        pdf_bytes = export_rc_beam_pdf(project, inputs, results)
        st.download_button(
            "Descargar memoria PDF",
            data=pdf_bytes,
            file_name=f"rc_beam_{project['name']}.pdf",
            mime="application/pdf",
        )

    st.divider()
    st.subheader("Historial reciente")
    runs = list_runs(project["id"])[:5]
    if not runs:
        st.caption("Todavia no hay calculos almacenados para este proyecto.")
    else:
        for calc in runs:
            with st.expander(f"{calc['created_at']} - {calc['element_type']}"):
                st.json({"inputs": calc["input_json"], "results": calc["result_json"]})


render()
