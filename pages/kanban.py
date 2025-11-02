import streamlit as st
from services.kanban_service import (
    list_columns, create_column, delete_column, rename_column,
    list_cards_by_column, create_card, update_card, delete_card, move_card
)

def render():
    st.header("Kanban del proyecto")
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto primero (desde Proyectos).")
        st.stop()

    with st.expander("Columnas"):
        c1,c2,c3 = st.columns([2,1,1])
        new_name = c1.text_input("Nueva columna")
        if c2.button("Agregar", disabled=not new_name.strip()):
            create_column(project["id"], new_name, position=1000.0)
            st.rerun()

    cols = list_columns(project["id"])
    if not cols:
        st.warning("No hay columnas aún. Crea al menos una.")
        st.stop()

    holders = st.columns(len(cols))
    for i, col in enumerate(cols):
        with holders[i]:
            st.subheader(col["name"])
            with st.form(f"new_card_{col['id']}"):
                t = st.text_input("Título")
                ok = st.form_submit_button("Agregar")
                if ok and t.strip():
                    cards = list_cards_by_column(col["id"])
                    last_pos = cards[-1]["position"] if cards else 0
                    create_card(project["id"], col["id"], title=t.strip(), position=last_pos + 100)
                    st.rerun()

            cards = list_cards_by_column(col["id"])
            if not cards:
                st.caption("—")
            for card in cards:
                with st.container():
                    st.markdown(f"**{card['title']}**")
                    target = st.selectbox("Mover a", options=[c["name"] for c in cols],
                                          index=i, key=f"mv_{card['id']}")
                    if st.button("Mover", key=f"btn_mv_{card['id']}"):
                        target_col = [c for c in cols if c["name"] == target][0]
                        tcards = list_cards_by_column(target_col["id"])
                        last_pos = tcards[-1]["position"] if tcards else 0
                        move_card(card["id"], target_col["id"], last_pos + 100)
                        st.rerun()
                    if st.button("Borrar", key=f"del_{card['id']}"):
                        delete_card(card["id"])
                        st.rerun()
render()
