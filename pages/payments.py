import streamlit as st
from supa.client import supa
from datetime import date

def render():
    st.header("Estados de pago (por proyecto)")
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto primero (desde Proyectos).")
        st.stop()

    with st.form("payform"):
        c1,c2,c3,c4,c5 = st.columns([1,1,1,1,2])
        kind = c1.selectbox("Tipo", ["invoice","payment","advance","credit_note","refund"])
        amount = c2.number_input("Monto (CLP)", min_value=0, step=10000, value=500000)
        event_date = c3.date_input("Fecha", value=date.today())
        reference = c4.text_input("Referencia")
        note = c5.text_input("Nota")
        ok = st.form_submit_button("Agregar")
        if ok:
            supa().table("project_payments").insert({
                "project_id": project["id"],
                "kind": kind, "amount": amount, "event_date": str(event_date),
                "reference": reference, "note": note
            }).execute()
            st.success("Agregado.")

    st.subheader("Histórico")
    data = supa().table("project_payments").select("*").eq("project_id", project["id"]).order("created_at", desc=True).execute().data
    if not data:
        st.caption("—")
    else:
        for row in data:
            st.write(f"- {row['event_date']} · {row['kind']} · CLP {int(row['amount']):,}".replace(',', '.'))
render()
