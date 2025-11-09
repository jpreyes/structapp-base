import streamlit as st

from core.ui import load_css
from supa.client import supa
from services.auth_service import login, register
from services.projects_service import fetch_projects
from utils.format import clp

PROJECT_STATUS_LABELS = {
    "draft": "Planificacion",
    "in_design": "Diseno en curso",
    "in_review": "En revision",
    "delivered": "Entregado",
}

st.set_page_config(page_title="StructApp", layout="wide", page_icon=":building_construction:")
load_css()


def _require_user() -> dict:
    st.sidebar.title("Cuenta")
    user = st.session_state.get("user")
    if user:
        st.sidebar.success(f"{user['email']} ({user['plan']})")
        if st.sidebar.button("Cerrar sesion", use_container_width=True):
            supa().auth.sign_out()
            st.session_state.clear()
            st.rerun()
        return user

    login_tab, signup_tab = st.sidebar.tabs(["Iniciar sesion", "Registrarme"])
    with login_tab:
        with st.form("login_form", clear_on_submit=False):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Entrar", use_container_width=True)
            if submitted:
                try:
                    st.session_state["user"] = login(email, password)
                    st.rerun()
                except Exception as exc:
                    st.error(str(exc))
    with signup_tab:
        with st.form("signup_form", clear_on_submit=False):
            email = st.text_input("Email nuevo")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Crear cuenta", use_container_width=True)
            if submitted:
                try:
                    st.session_state["user"] = register(email, password)
                    st.success("Cuenta creada. Revisa tu correo si requiere verificacion.")
                except Exception as exc:
                    st.error(str(exc))
    st.stop()


@st.cache_data(ttl=45)
def _load_active_projects(user_id: str, version: int):
    return fetch_projects(archived=False)


def _project_selector(user: dict) -> None:
    st.sidebar.divider()
    st.sidebar.subheader("Proyecto activo")

    version = st.session_state.get("projects_version", 0)
    projects = _load_active_projects(user["id"], version)

    if st.sidebar.button("Actualizar lista", use_container_width=True):
        st.session_state["projects_version"] = version + 1
        st.rerun()

    if not projects:
        st.sidebar.caption("Crea tu primer proyecto en la pagina Proyectos.")
        st.session_state.pop("project", None)
        return

    project_ids = [proj["id"] for proj in projects]
    current_id = st.session_state.get("project", {}).get("id")
    try:
        default_index = project_ids.index(current_id)
    except ValueError:
        default_index = 0

    selected_index = st.sidebar.selectbox(
        "Seleccionar proyecto",
        options=range(len(projects)),
        index=default_index,
        format_func=lambda idx: projects[idx]["name"],
        key="active_project_selector",
    )
    st.session_state["project"] = projects[selected_index]
    active_project = st.session_state["project"]

    st.sidebar.metric("Presupuesto CLP", f"CLP {clp(active_project.get('budget'))}")
    status_label = PROJECT_STATUS_LABELS.get(
        active_project.get("status"), active_project.get("status") or "Sin estado"
    )
    st.sidebar.caption(f"Estado: {status_label}")
    if active_project.get("start_date") or active_project.get("end_date"):
        start_text = active_project.get("start_date") or "-"
        end_text = active_project.get("end_date") or "-"
        st.sidebar.caption(f"Inicio: {start_text} | Termino: {end_text}")
    if st.sidebar.button("Administrar proyectos", use_container_width=True, key="sidebar_manage_projects"):
        st.switch_page("pages/projects.py")


current_user = _require_user()
_project_selector(current_user)

st.title("StructApp")
st.caption("Gestion total de proyectos estructurales, calculos y finanzas en un solo lugar.")

navigation = st.navigation(
    {
        "Inicio": [st.Page("pages/dashboard.py", title="Dashboard")],
        "Trabajo": [
            st.Page("pages/projects.py", title="Proyectos"),
            st.Page("pages/rc_beam.py", title="RC Beam"),
            st.Page("pages/runs.py", title="Historial"),
            st.Page("pages/kanban.py", title="Kanban"),
            st.Page("pages/gantt.py", title="Gantt"),
        ],
        "Gestion": [
            st.Page("pages/payments.py", title="Estados de pago"),
            st.Page("pages/billing.py", title="Billing"),
        ],
    }
)
navigation.run()
