# StructApp — Explicación del Software y Funciones Principales

Este documento resume la arquitectura del proyecto, el flujo de datos y las funciones clave (backend y frontend) para que puedas ubicar rápidamente dónde está cada responsabilidad y qué hace cada pieza.

## Visión General

- Objetivo: gestionar proyectos y generar memorias de cálculo estructural (DOCX) a partir de plantillas Word con placeholders, integrando cálculos estructurales y tablas de resumen.
- Capas principales:
  - Backend (FastAPI): APIs de proyectos, cálculos, generación DOCX, pagos/finanzas, suscripciones.
  - Servicios (Python): lógica de negocio (generación de DOCX, tablas, suscripciones, integración con Flow).
  - Frontend (React + MUI + Vite): UI para gestionar proyectos, cálculos, documentación y suscripciones.

## Backend (FastAPI)

### api/main.py
- Inicializa FastAPI, CORS y registra routers:
  - `/auth`, `/projects`, `/tasks`, `/payments`, `/calculations`, `/design-bases`, `/structural-calcs`
  - `/subscription` (suscripciones) y `/payments-webhook` (webhook de Flow)
- Endpoint de salud: `/health`

### api/routers/design_bases.py
- Endpoints para bases de cálculo y generación de documentos.
- Funciones relevantes:
  - `create_design_base_run_endpoint(payload)`: crea una ejecución de base de cálculo y genera DOCX.
  - `list_design_base_runs_endpoint(project_id)`: lista ejecuciones previas.
  - `get_design_base_run_endpoint(run_id)`: obtiene detalle de una ejecución.
  - `download_design_base_run_document(run_id)`: regenera y descarga el DOCX.
  - `generate_document_from_calculations(payload)`: recibe ids de cálculos, arma `document_data` agregando:
    - building_description, live_load, wind_load, snow_load, seismic, rc/steel/wood beams/columns, footing
    - reducción de cargas `reduction`
    - tablas generadas con `services.table_generator.generate_all_tables(...)`, inyectadas en `document_data["tables"]`
  - En todos los casos delega en `services.design_bases_docx_service.generate_design_base_document(...)` para construir el documento final.

### api/routers/subscription.py
- Maneja acciones de suscripción (integra con `services/flow_client` y `services/subscription_service`).
- Funciones:
  - `flow_checkout(payload)`: crea un link de checkout Flow para `plan = monthly|annual`.
  - `start_trial_endpoint()`: inicia prueba de 7 días para el usuario.
  - `activate_free_endpoint()`: activa plan Free.

### payments_webhook/flow_webhook.py
- Webhook para confirmación de pagos Flow.
- Función:
  - `flow_webhook(request)`: extrae `user_id` y `plan`, y si el estado es exitoso llama `services.subscription_service.activate_paid(...)`.

## Servicios (Python)

### services/design_bases_docx_service.py
- Construye el documento Word desde plantilla `mc-tipo.docx` con placeholders.
- Constantes:
  - `TEMPLATE_PATH`: ruta de la plantilla DOCX.
- Helpers internos:
  - `_get_nested_value(data, path)`: obtiene un valor anidado por ruta con puntos.
  - `_format_value(value, decimal_places=2)`: formatea números con decimales.
- Contexto de placeholders:
  - `_build_context(data, project_name)`: arma un diccionario plano de placeholders (`context`) para:
    - Información de proyecto y descripciones.
    - Cargas: live, wind, snow, seismic (params y result).
    - Elementos estructurales (RC, acero, madera, zapatas): selecciona valores y añade alias de compatibilidad con la plantilla (p. ej., `steel.beam.mn`, `wood.column.pn`, `footing.length`, etc.).
    - Inyecta tablas si vienen en `data["tables"]` y placeholders extra si se entregan.
- Reemplazo de placeholders preservando formato:
  - `_replace_placeholders_in_text(text, context)`: reemplaza `{{placeholder}}` en un texto plano; si no existe el valor, deja el token original.
  - `_replace_placeholders_in_runs(paragraph, context)`: reemplaza placeholders aun si están divididos en múltiples runs; si no existe valor, deja el token.
  - `_replace_placeholders_in_paragraphs(doc, context)` y `_replace_placeholders_in_tables(doc, context)`: recorren todo el documento y celdas de tablas.
- Gráfico espectral sísmico:
  - `_generate_seismic_spectrum_chart(data)`: crea un PNG en memoria (matplotlib) desde `seismic.result.spectrum`.
  - `_insert_spectrum_chart(doc, data)`: inserta la imagen en el lugar de `{{spectrumChart}}`.
- Tablas DOCX nativas:
  - `_parse_html_table(html)`: parser simple para `<table>` HTML (thead/tbody)
  - `_insert_tables(doc, context)`: detecta placeholders `{{...Table}}` y construye `doc.add_table(...)` con estilo “Table Grid”.
- API principal:
  - `generate_design_base_document(data, project_name)`: carga plantilla, construye contexto, reemplaza placeholders, inserta gráfico/tablas y devuelve los bytes del DOCX.

### services/table_generator.py
- Genera tablas HTML a partir de listas de cálculos (por tipo) y las agrupa.
- Función principal:
  - `generate_all_tables(project_id, runs) -> dict[str, str]`: retorna un dict con claves de placeholders de tablas (p. ej., `steelBeamsTable`) y HTML.

### services/flow_client.py
- Integra con Flow para generar link de checkout.
- Variables de entorno: `FLOW_BASE_URL`, `FLOW_API_KEY`, `FLOW_COMMERCE_CODE`, `FLOW_RETURN_URL`, `FLOW_CONFIRM_URL`.
- Función:
  - `create_checkout_link(user_id, plan) -> str`: devuelve la URL de checkout (o una URL mock si faltan credenciales).

### services/subscription_service.py
- Maneja la persistencia de suscripciones en Supabase (tabla `user_subscriptions`).
- Funciones:
  - `start_trial(user_id, days=7)`: comienza periodo de prueba.
  - `activate_free(user_id)`: activa plan Free.
  - `activate_paid(user_id, plan)`: activa plan pago y calcula expiración (mensual/anual).
  - `get_subscription(user_id)`: consulta estado actual de suscripción.

## Frontend (React + MUI)

### src/main.tsx
- Define tema MUI y render raíz.
- `ThemedRoot`: componente que usa `useThemeStore` para aplicar `ThemeProvider` con el modo `light|dark`.

### src/store/useTheme.ts
- Store Zustand persistente para tema UI.
- API:
  - `useThemeStore((s) => s.mode)`: obtener modo actual.
  - `useThemeStore.getState().toggle()`: alterna entre claro/oscuro.
  - `useThemeStore.getState().set(mode)`: set explícito.

### src/components/Layout.tsx
- Layout general con AppBar, Drawer y navegación.
- Incluye switch de tema (`FormControlLabel` + `Switch`) que llama `useThemeStore.getState().toggle()`.
- Ítems de menú: Dashboard, Proyectos, Cálculos, Bases, Documentación, Tareas, Finanzas, Suscripción, Login.

### src/pages/ProjectDocumentationPage.tsx
- Página para seleccionar cálculos previos y generar la memoria DOCX.
- Claves:
  - Lista tipos de cálculo (incluye “Reducción de Cargas”).
  - Permite marcar/desmarcar por tipo y “Seleccionar todo”.
  - Persiste selección por proyecto en `localStorage`.
  - Botón “Generar documento” llama `/design-bases/runs/generate-from-calculations` y descarga el DOCX.

### src/pages/ProjectDesignBasesPage.tsx
- Página para correr bases de cálculo (se ocultó el formulario específico de Pilar de Hormigón, manteniendo el resto).
- Permite previsualizar y guardar/descargar ejecuciones.

### src/pages/PaymentsPage.tsx
- Gestión de movimientos financieros (ingresos, pagos, etc.).
- Cálculo de métricas simples (facturado/pagado/saldo) y CRUD básico vía `/payments`.

### src/pages/SubscriptionPage.tsx
- Gestión de suscripción:
  - Prueba 7 días (POST `/subscription/start-trial`).
  - Free (POST `/subscription/activate-free`).
  - Suscripción CLP (POST `/subscription/flow/checkout` → abre checkout en nueva pestaña).
- Precios: $9.990 CLP mensual · $100.000 CLP anual.

## Flujo de Generación de Memoria

1) Seleccionas cálculos en “Documentación” y generas.
2) El backend agrupa por tipo, identifica elementos críticos (si aplica), y construye `document_data`.
3) Genera tablas HTML con `services.table_generator.generate_all_tables(...)` y se inyectan al contexto `tables`.
4) `generate_design_base_document(...)` construye el DOCX, reemplaza placeholders (con alias para compatibilidad), inserta gráfico sísmico y convierte tablas HTML a tablas Word.
5) El usuario descarga el DOCX.

## Variables de Entorno Relevantes

- FLOW_BASE_URL, FLOW_API_KEY, FLOW_SECRET_KEY (si se usa firma), FLOW_COMMERCE_CODE
- FLOW_RETURN_URL, FLOW_CONFIRM_URL

## Notas y Buenas Prácticas

- Si un placeholder no tiene valor, quedará visible como `{{placeholder}}` para facilitar depuración.
- Mantén la plantilla Word consistente con los nombres de placeholders listados en `PLACEHOLDERS.md` (actualizado con alias y observaciones).
- Para Flow, ajusta los nombres exactos de campos y firma HMAC según la documentación de tu cuenta y habilita validaciones en el webhook.
