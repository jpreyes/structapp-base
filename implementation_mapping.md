# Implementation mapping – plan vs `structapp-base`

Este repositorio ya contiene una base FastAPI + Supabase + React/Vite que cubre parte de los módulos del plan completo (ver `strucapp_full_implementation_plan.md:23-200`), por lo que hay punto de partida claro. El siguiente resumen mapea los módulos del plan con lo que ya existe, identifica huecos y propone pasos inmediatos siguiendo la regla "DB → backend → frontend → feature flag" del checklist (`strucapp_checklist_plan.md:13-23`).

## 1. Backend

### 1.1 Funcionalidades ya expuestas
- **Autenticación (Fase 1 del plan):** `api/routers/auth.py:1-36` y `services/auth_service.py:1-72` ya validan credenciales con Supabase, devuelven `plan` y tokens y exponen el endpoint `/auth/login` y `/auth/register`, exactamente lo que describe `strucapp_full_implementation_plan.md:101-137`.
- **Proyectos + métricas (Fase 2):** `api/routers/projects.py:1-60` delega en `services/projects_service.py:19-170` para listar, crear, editar y sumar pagos por proyecto; se incluyen cálculos de métricas/tareas. Ese siguiente paso del roadmap (`strucapp_full_implementation_plan.md:141-170`) ya tiene backend funcionando.
- **Inspecciones (Fase 4):** `api/routers/inspections.py` junto con `services/inspections_service.py:29-200` manejan inspecciones, daños, pruebas y documentos, como pide la fase 4 del plan (`strucapp_full_implementation_plan.md:122-154`).
- **Dimensionamiento y cálculos (Fases 5 y 9):** `api/routers/design_bases.py` está listo para cargas vivas, viento, nieve y correcciones (`services/design_bases_service.py` y `services/runs_service.py`), y `api/routers/calculations.py:1-130` conecta con `calculations/rc_beam.py` y genera reportes PDF mediante `services/docs_service.py:1-14`. La plantilla de cálculo ya cubre mucho del módulo dimensionamiento/RC beam del plan (`strucapp_full_implementation_plan.md:156-184`).
- **Pagos/Subscripciones y Flow (Fase 3):** `api/routers/payments.py:1-69`, `api/routers/subscription.py` y los servicios `services/flow_client.py:1-120` más `services/subscription_service.py:1-190` ofrecen registros de pagos, integración con Flow y control de suscripciones. Aunque el plan pide endpoints de billing/Flow (`strucapp_full_implementation_plan.md:173-200`), la capa de Flow ya existe y solo requiere terminar las rutas `POST /billing/subscribe` y `/billing/flow/webhook`.
- **Users/tasks/dashboard:** `api/routers/users.py`, `tasks.py` y `services/kanban_service.py` (si se utiliza) aportan soporte a la gestión de usuarios y tareas referida en los roadmap `Fase 2 y 4`.

### 1.2 Modulos del plan sin router o incompletos
- **Organizaciones/multi-tenant (Fase    1):** No hay router `organizations` ni middleware que filtre por `organization_id`/slug; la autenticación habla solo de usuarios simples. Hay que añadir tablas/migraciones Supabase e implementar filtros multi-tenant (`strucapp_full_implementation_plan.md:25-137`, `strucapp_checklist_plan.md:27-52`).
- **Documents/Quotes/Specs (Fases 6-8):** Solo existe `services/docs_service.py` para exportar RC Beam; no hay rutas ni tablas para gestionar documentos/quotes ni especificaciones técnicas descritas en el roadmap (`strucapp_full_implementation_plan.md:188-268`). Hay que definir esas tablas, endpoints y clientes.
- **Analysis3D (Fase 9) y Blog/Help (Fases 10-11):** No hay ningún router o servicio relacionado con OpenSees, blog técnico ni asistente IA. Esos módulos aún están pendientes y deben planificarse desde la base de datos hacia el frontend.
- **Feature flags/Planes organizacionales:** Aunque `subscription_service` maneja planes (trial/free/paid), el plan exige `plan_type` por organización y feature flags para activar funciones; esa capa aún no está presente y debe añadirse antes de avanzar a fases posteriores.

## 2. Frontend

- El layout React/Vite `frontend/src/components/Layout.tsx`, `RequireAuth.tsx` y el store `frontend/src/store/useSession.tsx` ya entregan sidebar/topbar, control de sesión y redirección al login, alineado con la fase 1 frontend (`strucapp_full_implementation_plan.md:127-135`).
- Las páginas actuales cubren módulos clave:
  - `ProjectsPage.tsx:1-200` (proyectos, creación y métricas).
  - `ProjectInspectionsPage.tsx`, `InspectionDetailPage.tsx` (inspecciones).
  - `PaymentsPage.tsx` y `SubscriptionPage.tsx` (pagos y plan).
  - `ProjectCalculationsPage.tsx` y `ProjectDesignBasesPage.tsx` (cálculos/RC beam/dimensionamiento).
  - `ProjectDocumentationPage.tsx` y `ProjectWorkspacePage.tsx` sugieren contenidos para Fases 4-6.
- La app usa Material UI/Day.js/etc., aunque el plan recomienda Syncfusion (`strucapp_full_implementation_plan.md:25-32`); eso es compatible pero habrá que revisar si se necesita sustituir componentes o mantener el stack actual.
- El cliente Axios `frontend/src/api/client.ts` adjunta el token (guardado en `localStorage`) y maneja 401, lo que permite consumir las rutas del backend ya configuradas.

## 3. Huecos pendientes

- **Organizaciones/multi-tenant y roles:** crear migraciones Supabase para `organizations`, `organization_members` y middleware `org_id`/slug antes de lanzar nuevas tablas (DB primero, `strucapp_checklist_plan.md:13-23`).
- **Quotes/Presupuestos + Especificaciones técnicas:** pensar en nuevas tablas `quotes`, `spec_items`, `spec_chapters` y endpoints que alimenten el frontend actual (grillas, CRUD).
- **Docs + Integraciones (Drive/Dropbox):** definir dónde se almacenan archivos y qué APIs (Supabase Storage, integraciones) se reutilizarán.
- **Análisis estructural 3D / OpenSees:** diseñar microservicio (Docker + cola) y rutas `analysis-models`/`jobs` antes de la UI.
- **Blog técnico / Centro de ayuda + IA:** fijar tablas `blog_posts`, `help_articles`, endpoints `POST /help/ask`/`chat`, y crear el widget flotante.
- **Feature flags y planes multi-tenant:** adicionar un sistema de toggles para habilitar UI por plan (p.ej. `plan_type` en el token y menús condicionales).

## 4. Próximos pasos sugeridos (DB → backend → frontend → feature flag)

1. Diseñar y migrar las tablas `organizations`, `organization_members`, `subscriptions` y `plans` en Supabase; actualizar `supabase.squema` y `services/client` para filtrar por `organization_id` (`strucapp_checklist_plan.md:13-23`, `strucapp_full_implementation_plan.md:97-200`).
2. Añadir routers `api/routers/organizations.py`, `quotes.py`, `specs.py`, `analysis3d.py` y `help.py` con dependencias sobre Supabase (JWT/middleware) y reutilizar los servicios actuales (`services/*`) en la medida de lo posible.
3. Extender el frontend React con nuevas páginas/componentes para quotes, specs, analysis3d view y help widget (React + Syncfusion opcional) y controlar visibilidad según plan (`strucapp_full_implementation_plan.md:173-288`).
4. Usar feature flags o roles (pueden empezar en el store `useSession`) para mostrar/ocultar módulos mientras se despliega gradualmente (`strucapp_checklist_plan.md:13-52`).

Guardar este archivo como referencia y actualizarlo conforme se vayan cerrando las fases, marcando qué routers/servicios se han completado o extendido.
