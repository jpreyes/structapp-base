# StrucApp – Implementation Checklist (Safe, Incremental Updates)

> Objetivo: Tener una **lista de chequeo ejecutable** para ir agregando funcionalidades a StrucApp **sin romper nada**, siguiendo una secuencia lógica y segura (DB primero, luego backend, luego frontend, luego activar en UI).

---

## 0. Reglas generales para no romper producción

- [ ] Usar **ramas de feature** (`feature/...`) y hacer merge a `dev` → luego a `main`.
- [ ] Tener al menos 2 entornos:
  - [ ] `staging` (o `dev`) con la misma estructura que producción.
  - [ ] `production`.
- [ ] Todas las actualizaciones siguen este orden:
  1. [ ] **Migraciones DB** compatibles hacia adelante (no borrar columnas aún).
  2. [ ] **Backend**: nuevos endpoints / campos → siempre opcionales al principio.
  3. [ ] **Frontend**: consumir nuevos endpoints/campos, manteniendo compatibilidad con los antiguos si aplica.
  4. [ ] **Feature flag / toggle** para activar en UI (por plan u organización).
  5. [ ] Monitorizar errores (logs) después de desplegar.
  6. [ ] Solo cuando esté estable: limpiar código/DB viejo (migración de limpieza).
- [ ] Para cada cambio de DB:
  - [ ] Crear migración **idempotente** (Alembic).
  - [ ] Probar migración hacia adelante en `staging` con copia de datos reales si es posible.
  - [ ] Documentar qué versiones de backend/frontend esperan estos cambios.

---

## 1. Base multi-tenant + auth + planes (Fase 1)

### 1.1. Backend – estructura base

- [ ] Crear proyecto FastAPI + configuración inicial (Docker, settings).
- [ ] Crear modelo y migración para:
  - [ ] `users`
  - [ ] `organizations` (incluye `plan_type`, `slug`)
  - [ ] `organization_members` (incluye `role`)
- [ ] Implementar autenticación:
  - [ ] Registro de usuario.
  - [ ] Login con JWT.
  - [ ] Incluir en el token: `user_id`, `org_id`, `org_role`, `org_plan`.
- [ ] Implementar middleware multi-tenant:
  - [ ] Resolver `org_id` por `slug` (subdominio) cuando aplique.
  - [ ] Asegurar que todos los queries filtran por `organization_id`.

### 1.2. Frontend – layout inicial

- [ ] Crear proyecto React + TypeScript + Syncfusion.
- [ ] Implementar páginas:
  - [ ] Login / registro.
  - [ ] Layout base de la app (sidebar, topbar).
- [ ] Contexto de usuario:
  - [ ] Guardar `org_plan` y `org_role`.
  - [ ] Ocultar menús no aplicables según plan/rol (simple, sin lógica compleja todavía).

---

## 2. Proyectos + equipos (Fase 2)

### 2.1. Backend

- [ ] Crear tablas y migraciones:
  - [ ] `projects` (con `organization_id`).
  - [ ] `project_members`.
- [ ] Endpoints:
  - [ ] `GET /projects` (filtrado por `org_id` y permisos).
  - [ ] `POST /projects` (solo `ORG_ADMIN`, `PROJECT_LEAD`).
  - [ ] `GET /projects/{id}`.
  - [ ] `POST /projects/{id}/members`.
- [ ] Middleware de permisos:
  - [ ] `ORG_ADMIN` ve todos los proyectos.
  - [ ] Otros solo ven proyectos donde son miembros.

### 2.2. Frontend

- [ ] Página “Proyectos”:
  - [ ] `GridComponent` con listado de proyectos.
  - [ ] Formulario de creación/edición de proyecto.
- [ ] Panel de miembros por proyecto:
  - [ ] Listar miembros y roles.
  - [ ] Agregar/eliminar miembros (según permisos).

### 2.3. Seguridad y despliegue

- [ ] Probar flujo completo en `staging`.
- [ ] Desplegar backend primero, luego frontend.
- [ ] Verificar que usuarios existentes siguen funcionando (si los hubiera).

---

## 3. Planes y facturación con Flow para StrucApp (Fase 3)

### 3.1. Backend – integración Flow

- [ ] Crear cuenta Flow y obtener credenciales.
- [ ] Variables de entorno: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_COMMERCE_ID`.
- [ ] Tabla `subscriptions`:
  - [ ] `organization_id`, `flow_subscription_id`, `plan_type`, `status`, `renew_at`.
- [ ] Endpoints:
  - [ ] `POST /billing/subscribe` (crea suscripción en Flow para el plan elegido).
  - [ ] `POST /billing/flow/webhook` (recibe eventos).

### 3.2. Lógica de negocio

- [ ] Al `subscription.pay`:
  - [ ] Marcar organización como activa.
  - [ ] Guardar/actualizar `plan_type` si corresponde.
- [ ] Al `subscription.fail`:
  - [ ] Registrar en logs / tabla de eventos.
  - [ ] Marcar período de gracia.
- [ ] Al `subscription.cancel`:
  - [ ] Degradar a plan básico o marcar para suspensión.

### 3.3. Frontend

- [ ] Página “Planes y facturación”:
  - [ ] Mostrar 3 planes: SOLO, TEAM, ORG con características.
  - [ ] Botón “Contratar” → llama a backend y redirige a página de Flow.
- [ ] Mostrar estado actual de suscripción y plan en el perfil de la organización.

---

## 4. Inspecciones (Fase 4)

### 4.1. Backend

- [ ] Migraciones para:
  - [ ] `inspections`
  - [ ] `inspection_items`
- [ ] Endpoints:
  - [ ] `GET /projects/{id}/inspections`
  - [ ] `POST /projects/{id}/inspections`
  - [ ] `GET /inspections/{id}`
  - [ ] `POST /inspections/{id}/items`
  - [ ] `POST /inspections/{id}/photos` (o ruta similar).

### 4.2. Frontend

- [ ] En vista de proyecto, pestaña “Inspecciones”:
  - [ ] `GridComponent` con inspecciones.
  - [ ] Botón “Nueva inspección”.
- [ ] Scheduler:
  - [ ] `ScheduleComponent` mostrando inspecciones por fecha.
- [ ] Formulario/detalle de inspección:
  - [ ] Datos generales (tipo, fecha, inspector, ubicación).
  - [ ] Checklist en `GridComponent`.
  - [ ] Subida de fotos (`UploaderComponent`).

### 4.3. Checklist de despliegue seguro

- [ ] Agregar migraciones de DB primero.
- [ ] Desplegar backend con endpoints nuevos (no rompe nada existente).
- [ ] Desplegar frontend con nuevo módulo de inspecciones.
- [ ] Verificar permisos (organización y proyecto).

---

## 5. Dimensionamiento + Cálculos base (Fase 5)

### 5.1. Backend

- [ ] Tablas:
  - [ ] `dimensionings`
  - [ ] `calc_items`
- [ ] Endpoints:
  - [ ] `GET /projects/{id}/dimensionings`
  - [ ] `POST /projects/{id}/dimensionings/run`
  - [ ] `POST /dimensionings/{id}/export-to-calcs`
- [ ] Implementar primer motor de dimensionamiento:
  - [ ] Vigas de hormigón armado (flexión + corte) con fórmulas simplificadas.
  - [ ] Envolver en una función clara (`run_beam_rc_dimensioning` o similar).

### 5.2. Frontend

- [ ] Pestaña “Dimensionamiento” en proyecto:
  - [ ] Formulario (tipo elemento, material, uso, luz, cargas).
  - [ ] Botón “Dimensionar”.
  - [ ] `GridComponent` con historial de dimensionamientos.
- [ ] Pestaña “Cálculos”:
  - [ ] Lista de `calc_items` (vinculados o no a dimensionamiento).

### 5.3. Despliegue seguro

- [ ] DB → backend → frontend (en ese orden).
- [ ] Testear con varios casos de ejemplo.
- [ ] Revisar errores de validación antes de exponer la funcionalidad a todos (usar feature flag si se desea).

---

## 6. Gestión documental + integraciones nube (Fase 6)

### 6.1. Backend

- [ ] Tablas:
  - [ ] `documents` (para almacenamiento interno).
  - [ ] `storage_connections` (integraciones Drive/Dropbox).
- [ ] Integraciones OAuth:
  - [ ] Google Drive (rutas start/callback).
  - [ ] Dropbox (rutas start/callback).
- [ ] Endpoints:
  - [ ] `GET /projects/{id}/documents` (parámetro `source`).
  - [ ] `POST /projects/{id}/documents/upload` (interno).
  - [ ] Endpoints para listar carpetas/archivos en Drive/Dropbox.

### 6.2. Frontend

- [ ] Pestaña “Documentos” en proyecto:
  - [ ] Selector de fuente: Interno / Drive / Dropbox.
  - [ ] `TreeViewComponent` + `GridComponent`.
- [ ] En perfil/configuración de usuario:
  - [ ] Sección “Integraciones” con botones “Conectar Google Drive” / “Conectar Dropbox”.

### 6.3. Checklist de seguridad

- [ ] No guardar tokens en claro (encriptar/guardar seguros).
- [ ] Respetar permisos de organización/usuario al mostrar documentos.
- [ ] Limitar alcance de scopes de las APIs externas.

---

## 7. Presupuestos (Fase 7)

### 7.1. Backend

- [ ] Tablas:
  - [ ] `clients`
  - [ ] `quotes`
  - [ ] `quote_items`
- [ ] Endpoints:
  - [ ] CRUD de `clients`.
  - [ ] CRUD de `quotes` y `quote_items`.
  - [ ] Endpoint para exportar a PDF/HTML.
  - [ ] Endpoint de link público `/q/{hash}`.
- [ ] Integración con Flow (opcional en esta fase):
  - [ ] Crear orden de pago desde un `quote` aceptado.

### 7.2. Frontend

- [ ] Módulo “Clientes”.
- [ ] Módulo “Presupuestos”:
  - [ ] Lista (`GridComponent`) con filtros.
  - [ ] Editor:
    - [ ] Encabezado (cliente, proyecto, validez, moneda).
    - [ ] Items (concepto, unidad, cantidad, precio, total).

---

## 8. Especificaciones técnicas (Fase 8)

### 8.1. Backend

- [ ] Tablas:
  - [ ] `spec_documents`
  - [ ] `spec_sections`
  - [ ] `spec_items`
  - [ ] `spec_templates`
- [ ] Endpoints:
  - [ ] CRUD de documentos ET por proyecto.
  - [ ] Crear desde plantilla.
  - [ ] Crear desde presupuesto (mapear `quote_items` a `spec_items`).
  - [ ] Exportar a PDF/Markdown.

### 8.2. Frontend

- [ ] Pestaña “Especificaciones técnicas”:
  - [ ] Árbol de capítulos.
  - [ ] `GridComponent` con items del capítulo.
  - [ ] Panel de detalle con `RichTextEditorComponent` para:
    - Descripción técnica.
    - Método constructivo.
    - Método de medición.
    - Criterios de calidad.
- [ ] Opciones:
  - [ ] “Generar ET desde presupuesto”.
  - [ ] “Guardar como plantilla para este tipo de proyecto”.

---

## 9. Análisis estructural 3D con OpenSees (Fase 9)

### 9.1. Backend – core

- [ ] Tablas:
  - [ ] `analysis_models` (JSONB para definición de nodos/elementos/etc.).
  - [ ] `analysis_jobs` (estado del job).
  - [ ] `analysis_results` (paths a resultados).
- [ ] Endpoints:
  - [ ] `POST /projects/{id}/analysis-models`.
  - [ ] `GET /analysis-models/{id}`.
  - [ ] `POST /analysis-models/{id}/jobs`.
  - [ ] `GET /analysis-jobs/{id}`.

### 9.2. Servicio de análisis (microservicio)

- [ ] Crear contenedor Docker con:
  - [ ] OpenSees.
  - [ ] Python y scripts para:
    - Leer JSON del modelo.
    - Generar `.tcl`.
    - Ejecutar OpenSees.
    - Parsear resultados a JSON.
- [ ] Definir protocolo simple con backend:
  - [ ] Polling o cola de trabajos (ej. Redis).

### 9.3. Frontend

- [ ] Editor básico de modelo estructural:
  - [ ] Formularios para nodos, elementos, materiales, secciones.
- [ ] Visualización (MVP):
  - [ ] Usar Three.js para estructura en alambre.
  - [ ] Mostrar deformada para una combinación de carga.
- [ ] Tablas:
  - [ ] Desplazamientos nodales.
  - [ ] Esfuerzos en elementos.

---

## 10. Blog técnico (Fase 10)

- [ ] Backend:
  - [ ] Tabla `blog_posts`.
  - [ ] Endpoints CRUD (solo admin/org-admin).
- [ ] Frontend:
  - [ ] Página pública “Blog”.
  - [ ] Editor de posts con `RichTextEditorComponent`.

---

## 11. Centro de ayuda + Asistente IA (Fase 11)

### 11.1. Backend

- [ ] Tabla `help_articles`.
- [ ] Endpoints:
  - [ ] CRUD de artículos de ayuda.
  - [ ] `POST /help/ask` → integra con OpenAI:
    - [ ] Recibir `message`, `route`, `projectId`.
    - [ ] Añadir contexto (plan, rol, docs relevantes).
    - [ ] Llamar a OpenAI y devolver `reply`.

### 11.2. Frontend

- [ ] Página “Centro de ayuda”:
  - [ ] Listado de artículos FAQ.
- [ ] Widget flotante de ayuda (`HelpWidget`):
  - [ ] Botón flotante `?`.
  - [ ] `DialogComponent` con Tabs:
    - [ ] FAQ.
    - [ ] Chat IA (lista de mensajes + input).

---

## 12. Pulido final, QA y hardening (Fase 12)

- [ ] Implementar logging estructurado y revisar logs en producción.
- [ ] Añadir health-checks (`/health`) para backend y servicios.
- [ ] Revisar:
  - [ ] Permisos y filtrado por `organization_id` y `project_id` en todos los endpoints.
  - [ ] Manejo de errores en frontend (toasts/mensajes claros).
- [ ] Añadir tests:
  - [ ] Unitarios en backend para módulos críticos (auth, billing, projects).
  - [ ] Pruebas de integración básicas (crear proyecto, añadir inspección, generar presupuesto).
- [ ] Realizar una **ronda de pruebas con un proyecto real**, anotando:
  - [ ] Bloqueos de flujo.
  - [ ] Campos faltantes.
  - [ ] Bugs.
- [ ] Priorizar correcciones y volver a desplegar.

---

## 13. Resumen de orden recomendado (muy corto)

1. [ ] Multi-tenant + auth + planes (base).
2. [ ] Proyectos + equipos.
3. [ ] Facturación con Flow para planes.
4. [ ] Inspecciones.
5. [ ] Dimensionamiento + cálculos simples.
6. [ ] Gestión documental (interno + integraciones).
7. [ ] Presupuestos.
8. [ ] Especificaciones técnicas.
9. [ ] Análisis estructural 3D (OpenSees).
10. [ ] Blog técnico.
11. [ ] Centro de ayuda + asistente IA.
12. [ ] QA, seguridad y pulido final.

Este checklist está pensado para que puedas ir **tachando bloques** sin romper lo que ya existe y manteniendo siempre una versión deployable y coherente de StrucApp.
