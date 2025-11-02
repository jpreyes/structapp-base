import streamlit as st
def render():
    st.header("Billing (suscripciones)")
    st.caption("Integraremos Mercado Pago o PayPal con el webhook incluido (servicio separado).")
    c1,c2 = st.columns(2)
    c1.button("Suscribirme / Cambiar plan", type="primary")
    c2.button("Gestionar suscripción")
render()
