import streamlit as st
st.header("Dashboard")
c1,c2,c3 = st.columns(3)
with c1: st.markdown('<div class="card kpi"><div class="label">Proyectos</div><div class="value">—</div></div>', unsafe_allow_html=True)
with c2: st.markdown('<div class="card kpi"><div class="label">Cálculos</div><div class="value">—</div></div>', unsafe_allow_html=True)
with c3: st.markdown('<div class="card kpi"><div class="label">MRR</div><div class="value">—</div></div>', unsafe_allow_html=True)
