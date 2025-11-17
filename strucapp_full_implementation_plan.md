# StrucApp – End‑to‑End Implementation Plan (MVP Profesional)

**Objetivo:**  
Definir los pasos lógicos, tiempos estimados, requisitos y componentes necesarios para construir un **prototipo funcional a nivel profesional** de StrucApp, integrando:

- Multi‑tenant (individual, equipos, organizaciones con subdominio).
- Proyectos y equipos.
- Inspecciones.
- Dimensionamiento + Cálculos.
- Gestión documental (interno, Google Drive, Dropbox).
- Presupuestos.
- Especificaciones técnicas (ítem, cubicación, método constructivo).
- Análisis estructural 3D con OpenSees.
- Blog técnico.
- Facturación automatizada (Flow.cl).
- Centro de ayuda + asistente IA.
- Dashboard, perfil, integraciones.

Los tiempos son orientativos, suponiendo 1–2 devs dedicados y experiencia previa en FastAPI/React.

---

## 0. Decisiones base y stack tecnológico

### 0.1. Tech stack

- **Frontend**
  - React + TypeScript.
  - Syncfusion React (Grid, Scheduler, Charts, Inputs, Tabs, Layouts).
  - React Router, React Query/Axios o similar.
  - Three.js / React Three Fiber para 3D (más adelante).

- **Backend**
  - FastAPI (Python).
  - SQLAlchemy + Alembic.
  - PostgreSQL (multi‑tenant ready, JSONB).
  - Servicio de análisis separado (Docker + OpenSees clásico).

- **Infraestructura**
  - Docker + docker‑compose (dev).
  - Nginx / Caddy como reverse proxy.
  - Dominio principal: `app.conmuta.cl`.
  - Wildcard DNS para subdominios: `*.conmuta.cl`.

- **Otros servicios**
  - Flow.cl para pagos y suscripciones.
  - LibreDTE (o similar) para boletas/facturas.
  - Google Drive API / Dropbox API.
  - OpenAI API para asistente IA.

### 0.2. Planes de producto

- `plan_type = 'SOLO'` → Individual (1 usuario, sin equipo).
- `plan_type = 'TEAM'` → Equipo (<10 usuarios).
- `plan_type = 'ORG'` → Organización (multiusuario, subdominio `org.conmuta.cl`).

---

## 1. Arquitectura lógica

### 1.1. Módulos backend principales

- `auth` – login, registro, JWT.
- `organizations` – multi‑tenant, planes, subdominios.
- `users` – perfil, notificaciones, integraciones personales.
- `projects` – proyectos, miembros, estados.
- `inspections` – inspecciones, checklist, fotos.
- `dimensioning` – dimensionamiento rápido de elementos.
- `calculations` – cálculos estructurales asociados.
- `documents` – gestión documental + integraciones nube.
- `quotes` – presupuestos.
- `specs` – especificaciones técnicas.
- `analysis3d` – modelos estructurales y jobs (OpenSees).
- `blog` – posts técnicos.
- `billing` – facturación con Flow + LibreDTE.
- `help` – centro de ayuda + asistente IA.

### 1.2. Módulos frontend

- `auth/`
- `dashboard/`
- `projects/`
- `inspections/`
- `dimensioning/`
- `calculations/`
- `documents/`
- `quotes/`
- `specs/`
- `analysis3d/`
- `blog/`
- `profile/`
- `billing/`
- `help/`

---

## 2. Roadmap por fases (con tiempos y dependencias)

> Duraciones estimadas asumiendo 1–2 devs. Muchas tareas pueden solaparse.

### Fase 1 – Infra básica + multi‑tenant + planes (2–3 semanas)

**Objetivo:** Tener login, organizaciones, planes y estructura multi‑tenant funcionando.

**Backend**

1. Configurar proyecto FastAPI + PostgreSQL + Alembic.
2. Crear tablas base:
   - `users`
   - `organizations` (`name`, `plan_type`, `slug`, `created_at`)
   - `organization_members` (`user_id`, `organization_id`, `role`)
3. Implementar autenticación:
   - Registro + login local (email/password).
   - JWT con payload:
     ```json
     {
       "user_id": "...",
       "org_id": "...",
       "org_role": "ORG_ADMIN",
       "org_plan": "SOLO|TEAM|ORG"
     }
     ```
4. Middleware multi‑tenant:
   - Si hay subdominio (`org.conmuta.cl`) → resolver `org_id` por `slug`.
   - Verificación de acceso a recursos por `organization_id`.

**Frontend**

1. Proyecto React + configuración Syncfusion.
2. Páginas:
   - Login / Registro.
   - Selección de organización si el usuario pertenece a varias.
3. Contexto de usuario:
   - Guardar `org_plan`, `org_role` para mostrar/ocultar menús.

**Deliverable:**  
App donde un usuario puede registrarse, crear su organización, loguear y ver un layout base de “app” multi‑tenant.

---

### Fase 2 – Proyectos + equipos + roles (2–3 semanas)

**Objetivo:** Gestionar proyectos y miembros de equipo por organización.

**Backend**

1. Tablas:
   - `projects` (`organization_id`, `name`, `code`, `status`, etc.).
   - `project_members` (`project_id`, `user_id`, `role`).
2. Endpoints:
   - `GET /projects` → filtrado por `org_id` + rol.
   - `POST /projects` (solo `ORG_ADMIN` y `PROJECT_LEAD`).
   - `POST /projects/{id}/members`.
3. Políticas:
   - `ORG_ADMIN` → ve todos los proyectos.
   - Otros → solo proyectos donde son miembros.

**Frontend**

1. Página “Proyectos”:
   - `GridComponent` con lista de proyectos.
   - Formulario para crear/editar proyecto.
2. Gestión de miembros:
   - Panel dentro del proyecto para asignar usuarios y roles.
3. Dashboard inicial (per org):
   - Contar proyectos activos, tareas dummy, etc. (estructura para Fase 4).

**Deliverable:**  
Proyectos multi‑tenant con control de acceso por organización y proyecto, con equipos básicos.

---

### Fase 3 – Facturación base con Flow (planes SaaS) (2–3 semanas, en paralelo con Fase 2)

**Objetivo:** Cobrar planes de StrucApp (SOLO, TEAM, ORG) automáticamente.

**Backend**

1. Configuración Flow API:
   - Variables de entorno: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_COMMERCE_ID`.
2. Tabla `subscriptions`:
   - `organization_id`, `flow_subscription_id`, `plan_type`, `status`, `renew_at`.
3. Endpoints:
   - `POST /billing/subscribe` → crear suscripción Flow según plan elegido.
   - `POST /billing/flow/webhook` → recibir eventos de Flow (pago, fallo, cancelación).
4. Lógica:
   - Al `subscription.pay` exitoso → marcar organización como activa.
   - Al `fail` → enviar aviso, período de gracia.
   - Al `cancel` → degradar a plan gratis o bloquear.

**Frontend**

1. Página “Planes y Facturación”:
   - Mostrar planes SOLO / TEAM / ORG.
   - Botón “Contratar” → redirigir a Flow.
2. Mostrar estado de suscripción en el perfil de la organización.

**Deliverable:**  
StrucApp ya puede cobrar suscripciones y activar/desactivar organizaciones.

---

### Fase 4 – Inspecciones (3–4 semanas)

**Objetivo:** Tener un módulo profesional de inspecciones por proyecto.

**Backend**

1. Tablas:
   - `inspections` (`id`, `project_id`, `organization_id`, `type`, `status`, `inspector`, `date`, `location`, `notes`).
   - `inspection_items` (`inspection_id`, `section`, `description`, `severity`, `status`, `photos`).
2. Endpoints:
   - `GET /projects/{id}/inspections`
   - `POST /projects/{id}/inspections`
   - `GET /inspections/{id}`
   - `POST /inspections/{id}/items`
   - Subida de fotos: `POST /inspections/{id}/photos`.

**Frontend**

1. Página “Inspecciones” por proyecto:
   - `GridComponent` con lista (filtros por estado).
2. Agenda:
   - `ScheduleComponent` mostrando inspecciones por fecha.
3. Diálogo detalle de inspección:
   - Tabs: Resumen, Checklist (`GridComponent`), Fotos (`UploaderComponent`).

**Deliverable:**  
Módulo de inspecciones completo, usable en proyectos reales con reportes básicos.

---

### Fase 5 – Dimensionamiento + Cálculos base (4–5 semanas)

**Objetivo:** Ofrecer dimensionamiento rápido de elementos y vincular a cálculos estructurales.

**Backend**

1. Tablas:
   - `dimensionings` (inputs y outputs básicos – tipo, material, uso, span, cargas, sección resultante, estado).
   - `calc_items` (cálculos asociados, opcionalmente con `dimensioning_id`).
2. Endpoints:
   - `GET /projects/{id}/dimensionings`
   - `POST /projects/{id}/dimensionings/run` (ejecuta motor de dimensionamiento).
   - `POST /dimensionings/{id}/export-to-calcs`.
3. Motor de cálculo:
   - Primera versión: vigas de hormigón armado (flexión + corte) con fórmulas simplificadas, 2D/3D.
   - Implementado en Python en el backend.

**Frontend**

1. Página “Dimensionamiento” por proyecto:
   - Formulario con `DropDownListComponent` (tipo elemento, material, uso).
   - `NumericTextBoxComponent` para luces, cargas.
   - Botón “Dimensionar”.
   - `GridComponent` para historial de dimensionamientos.
2. Página “Cálculos”:
   - Lista de `calc_items`.
   - Posibilidad de ver detalles / fórmulas simplificadas.

**Deliverable:**  
Dimensionamiento rápido profesional (no código final de norma, pero sí muy usable) y enlazado a cálculos.

---

### Fase 6 – Gestión documental + Google Drive + Dropbox (4–5 semanas)

**Objetivo:** Gestionar documentos de proyecto con opción de usar almacenamiento interno o cuentas del cliente.

**Backend**

1. Tablas:
   - `documents` (metadatos cuando sea interno).
   - `storage_connections` (`user_id`, `provider`, `access_token`, `refresh_token`, `expires_at`).
2. Integraciones:
   - Google Drive OAuth2:
     - `GET /auth/google-drive/start`
     - `GET /auth/google-drive/callback`
   - Dropbox OAuth2:
     - Lo mismo.
3. Endpoints:
   - `GET /projects/{id}/documents?source=internal|google-drive|dropbox`
   - `POST /projects/{id}/documents/upload` (interno).
   - Métodos para listar carpetas/archivos via API externas.

**Frontend**

1. Página “Documentos”:
   - Selector de origen: Interno / Drive / Dropbox.
   - `TreeViewComponent` para carpetas.
   - `GridComponent` para archivos.
2. En “Configuración de perfil”:
   - Pestaña “Integraciones” para conectar/desconectar Drive/Dropbox.

**Deliverable:**  
Gestión documental completa, con capacidad de trabajar con los propios repositorios del cliente.

---

### Fase 7 – Presupuestos (4 semanas)

**Objetivo:** Crear, enviar y gestionar presupuestos para proyectos.

**Backend**

1. Tablas:
   - `clients`
   - `quotes`
   - `quote_items`
2. Endpoints:
   - CRUD completo de `clients` y `quotes`.
   - `GET /quotes/{id}/pdf` → genera PDF.
   - Link público de visualización: `/q/{public_hash}`.
3. Integración con Flow:
   - Al aceptar un presupuesto, opción para generar orden de pago o anticipo.

**Frontend**

1. Módulo “Clientes”.
2. Módulo “Presupuestos”:
   - Lista (`GridComponent`).
   - Editor:
     - Encabezado (cliente, proyecto, validez).
     - `GridComponent` editable para items.
3. Vista pública del presupuesto para clientes:
   - Página simple con logo, items, totales y botón “Aceptar”.

**Deliverable:**  
Flujo de presupuestos desde borrador hasta aceptación y, opcionalmente, pago.

---

### Fase 8 – Especificaciones técnicas (4–5 semanas)

**Objetivo:** Generar documentos de especificaciones técnicas con ítems, cubicación y métodos constructivos.

**Backend**

1. Tablas:
   - `spec_documents`
   - `spec_sections`
   - `spec_items`
   - `spec_templates`
2. Endpoints:
   - CRUD de docs ET por proyecto.
   - Crear desde plantilla.
   - Crear desde presupuesto (vinculación `spec_items.budget_item_id`).
   - Exportación a PDF / Markdown.

**Frontend**

1. Página “Especificaciones técnicas” por proyecto:
   - Árbol de capítulos (`TreeViewComponent` o `Accordion`).
   - `GridComponent` con ítems del capítulo.
   - Panel de detalle:
     - `RichTextEditorComponent` para descripción, método constructivo, medición, calidad.
2. Acciones:
   - Crear ET desde plantilla.
   - Crear ET desde presupuesto.

**Deliverable:**  
Módulo profesional de ET integrado con presupuestos y, en el futuro, con cubicaciones de modelo 3D.

---

### Fase 9 – Análisis estructural 3D con OpenSees (6–8 semanas)

**Objetivo:** Integrar un sistema de análisis estructural 3D con OpenSees.

**Backend – Servicio principal**

1. Tablas:
   - `analysis_models` (metadata + JSONB del modelo).
   - `analysis_jobs` (job, estado, tipo, timestamps).
   - `analysis_results` (paths a ficheros/JSON).
2. Endpoints:
   - `POST /projects/{id}/analysis-models`
   - `GET /analysis-models/{id}`
   - `POST /analysis-models/{id}/jobs` (lanzar análisis).
   - `GET /analysis-jobs/{id}` (estado y resultados).

**Servicio de análisis (microservicio)**

1. Docker con:
   - OpenSees clásico.
   - Python para:
     - Leer modelo JSON.
     - Generar `.tcl`.
     - Ejecutar `OpenSees`.
     - Parsear resultados a JSON.
2. Modo de trabajo:
   - Polling desde backend o cola de mensajes simple (ej. Redis).

**Frontend**

1. Editor de modelo 3D (versión inicial simple):
   - Formularios para nodos, elementos, materiales, secciones.
   - Lista de casos de carga.
2. Visualización:
   - Integración con Three.js:
     - Mostrar estructura tipo “wireframe”.
     - Mostrar deformada ampliada.
3. Tablas de resultados:
   - Desplazamientos nodales.
   - Esfuerzos en elementos.

**Deliverable:**  
MVP funcional de análisis 3D lineal elástico con visualización básica, listo para ir mejorando.

---

### Fase 10 – Blog técnico (1–2 semanas)

**Objetivo:** Comunicar metodologías, casos de estudio y novedades.

**Backend**

- Tablas:
  - `blog_posts`
- Endpoints:
  - CRUD de posts (solo admin/org‑admin).
  - Listado público / privado.

**Frontend**

- Página “Blog” pública (en landing o dentro de app).
- Editor de posts:
  - `RichTextEditorComponent`.

**Deliverable:**  
Blog técnico integrado en StrucApp.

---

### Fase 11 – Centro de ayuda + Asistente IA (3–4 semanas)

**Objetivo:** Ayuda contextual y asistente IA para uso de StrucApp.

**Backend**

1. Tabla:
   - `help_articles` (FAQ, guías).
2. Endpoint IA:
   - `POST /help/ask`
     - Recibe: `message`, `route`, opcional `projectId`.
     - Carga:
       - info del usuario y organización.
       - artículos de ayuda relevantes.
     - Llama a OpenAI con contexto.
     - Devuelve `reply`.

**Frontend**

1. Centro de ayuda:
   - Página con FAQ y artículos.
2. Widget flotante de ayuda:
   - Botón `?` → `DialogComponent`.
   - Tabs:
     - “FAQ”
     - “Chat IA” (historial de mensajes).

**Deliverable:**  
Sistema de ayuda y un asistente IA que mejora la experiencia de uso.

---

### Fase 12 – Pulido, QA y hardening (3–4 semanas)

**Objetivo:** Llevar el MVP a nivel profesional.

**Tareas clave**

- Tests:
  - Unitarios en backend (FastAPI).
  - Tests básicos en frontend (form submission, flujos).
- Seguridad:
  - Revisar permisos por `org_id`, `project_id`, roles.
  - Validar datos de webhooks de Flow.
  - CORS, rate limiting básico.
- Observabilidad:
  - Logging estructurado.
  - Monitoreo (Health checks, métricas simples).
- Performance:
  - Indexes en Postgres.
  - Paginación en todos los listados grandes (proyectos, docs, etc.).
- UX:
  - Mensajes de error claros.
  - Spinners y estados de “cargando”.
  - Coherencia visual de temas (colores, tipografías).

**Deliverable:**  
MVP robusto y presentable a clientes reales (oficinas de ingeniería, municipalidades, etc.).

---

## 3. Estimación global de tiempos

> Depende mucho de dedicación y reuso de componentes, pero a modo guía:

- Fase 1–3 (base multi‑tenant + planes + proyectos): **~6–8 semanas**
- Fase 4–6 (inspecciones + dimensionamiento + documentos): **~10–12 semanas**
- Fase 7–8 (presupuestos + ET): **~8–9 semanas**
- Fase 9 (análisis 3D): **~6–8 semanas**
- Fase 10–11 (blog + ayuda/IA): **~4–6 semanas**
- Fase 12 (pulido, QA): **~3–4 semanas**

Total orientativo: **~9–12 meses** de trabajo continuo de 1–2 personas, si se hace con rigor profesional.

---

## 4. Requisitos previos recomendados

- Repositorios separados o monorepo con:
  - `backend/` (FastAPI)
  - `frontend/` (React)
  - `analysis-service/` (OpenSees)
- CI/CD mínimo:
  - Tests de backend en cada push.
  - Build de frontend.
  - Deploy a entorno staging.
- Infra inicial:
  - VPS o servidor dedicado con Docker.
  - Nginx/Caddy para manejar `app.conmuta.cl` y subdominios.
- Cuentas:
  - Flow.cl (sandbox + producción).
  - Google Cloud (OAuth para Drive).
  - Dropbox App.
  - LibreDTE.
  - OpenAI.

---

## 5. Prioridades prácticas para un MVP “vendible”

Si quisieras una versión **más rápida** para mostrar y vender, el camino mínimo (en orden) sería:

1. **Multi‑tenant + planes + proyectos** (Fases 1–2).
2. **Inspecciones + gestión documental interna** (Fase 4 + parte de 6).
3. **Dimensionamiento básico + cálculos simples** (Fase 5).
4. **Presupuestos + ET básicos** (Fases 7–8, en versión recortada).
5. **Flow para cobrar StrucApp** (Fase 3).
6. **Análisis 3D OpenSees** (Fase 9, como feature “Pro”).

Eso ya te da un producto fuertísimo y diferenciado.

---

Este archivo resume e integra **todas las piezas** que discutimos, en un orden lógico con tiempos, requisitos y componentes para alcanzar un **MVP profesional de StrucApp**.
