# StructApp — Full Web App

## Setup rápido
```bash
pip install -r requirements.txt
cp .env.example .env  # rellena SUPABASE_URL / SUPABASE_ANON_KEY
# En Supabase → SQL Editor → pega supabase/schema.sql
# En Supabase → Auth → activa Email/Password
streamlit run app.py
```
App en `http://localhost:8501`.

## Deploy (Railway/Render)
- Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_URL`.
- Comando: `streamlit run app.py --server.address=0.0.0.0 --server.port=$PORT`

Webhook (servicio aparte):
```bash
uvicorn payments_webhook.main:app --host 0.0.0.0 --port $PORT
```

## Qué incluye
- Auth Supabase + RLS
- Proyectos, RC Beam, Historial
- Kanban por proyecto
- Gantt por proyecto (Plotly)
- Estados de pago
- Billing (placeholder + webhook)
- Tema oscuro + CSS
