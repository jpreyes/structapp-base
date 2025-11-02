import streamlit as st
from pathlib import Path
def load_css():
    css = Path("ui/theme.css")
    if css.exists():
        st.markdown(f"<style>{css.read_text(encoding='utf-8')}</style>", unsafe_allow_html=True)
