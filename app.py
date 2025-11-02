import streamlit as st
from core.ui import load_css
from supa.client import supa
from services.auth_service import login, register

st.set_page_config(page_title="StructApp — Full", layout="wide", page_icon="🧱")
load_css()

st.sidebar.title("Cuenta")
user = st.session_state.get("user")
if not user:
    tab1, tab2 = st.sidebar.tabs(["Iniciar sesión","Registrarme"])
    with tab1:
        email = st.text_input("Email"); pw = st.text_input("Password", type="password")
        if st.button("Entrar"):
            try: st.session_state["user"] = login(email, pw); st.rerun()
            except Exception as e: st.error(str(e))
    with tab2:
        email2 = st.text_input("Email nuevo", key="signup_email"); pw2 = st.text_input("Password", type="password", key="signup_pw")
        if st.button("Crear cuenta"):
            try: st.session_state["user"] = register(email2, pw2); st.success("Cuenta creada. Verifica email si aplica.")
            except Exception as e: st.error(str(e))
    st.stop()
else:
    st.sidebar.success(f"{user['email']} ({user['plan']})")
    if st.sidebar.button("Salir"): supa().auth.sign_out(); st.session_state.clear(); st.rerun()

st.title("🧱 StructApp — Supabase Full")
st.caption("Proyectos, cálculos, Kanban y Gantt listos para demos.")

pg = st.navigation({
    "Inicio": [st.Page("pages/dashboard.py", title="Dashboard")],
    "Trabajo": [st.Page("pages/projects.py", title="Proyectos"),
                st.Page("pages/rc_beam.py", title="RC Beam"),
                st.Page("pages/runs.py", title="Historial"),
                st.Page("pages/kanban.py", title="Kanban"),
                st.Page("pages/gantt.py", title="Gantt")],
    "Gestión": [st.Page("pages/payments.py", title="Estados de pago"),
                st.Page("pages/billing.py", title="Billing")],
})
pg.run()
