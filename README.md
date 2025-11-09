# StructApp Web Platform

## Backend (FastAPI + Supabase)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # completa SUPABASE_URL / SUPABASE_ANON_KEY

uvicorn api.main:app --reload --port 8000
```

Endpoints principales:
- `POST /auth/login`, `POST /auth/register`
- `GET|POST|PATCH /projects`
- `GET|POST|PATCH|DELETE /tasks`
- `GET|POST|DELETE /payments`
- `POST /calculations/rc-beam` y `GET /calculations/rc-beam/{run_id}/report`

## Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Configura un `.env` en `frontend/` si quieres URLs específicas:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...
```

El servidor de desarrollo corre en `http://localhost:5173` con proxy hacia la API (`/api`).

## Migración progresiva
- El frontend React consume el nuevo backend FastAPI y convive con la app Streamlit mientras se realiza la transición.
- Los módulos existentes en `services/` y `supa/` siguen siendo la fuente de verdad para Supabase y lógica de negocio.
- Puedes mover gradualmente los módulos de Streamlit hacia React reutilizando las rutas ya expuestas.

## Features actuales
- Autenticación con Supabase (token expuesto al cliente).
- Gestión de proyectos, tareas, pagos y cálculos estructurales (RC Beam).
- Dashboard con métricas, calendario (FullCalendar) y tablas reactivas.
- Arquitectura lista para extender a Kanban drag-and-drop, Gantt avanzado y reportes adicionales.
