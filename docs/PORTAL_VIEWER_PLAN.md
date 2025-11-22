# Portal seguro y documentación (proyectos e inspecciones)

## Objetivo
Entregar a mandantes/arquitectos un portal de solo lectura con acceso seguro a proyectos, inspecciones, memorias de cálculo, planos y exports PDF/DOCX.

## Fase 1: Documentación y plantillas
- Estructura de storage:  
  - proyectos/{proyectoId}/memorias/{fecha}_{version}.pdf|docx  
  - proyectos/{proyectoId}/planos/{disciplina}/{nombreArchivo}  
  - proyectos/{proyectoId}/inspecciones/{inspeccionId}/exports/{hashPlantilla}.pdf|docx  
  - Thumbnails: photos/thumbs/{photoId}.jpg (≤1028px).
- Plantillas: una única fuente (HTML→PDF y DOCX o Syncfusion PDF/DocIO) con estilos corporativos. Hash de plantilla/version en metadatos para cache.
- Generación: endpoint interno POST /internal/exports (body: inspectionId|projectId, ormat) que crea DOCX/PDF, guarda en storage y opcionalmente sube copia a Dropbox API (/proyectos/{proyectoId}/).
- Metadatos: tabla exports_cache (id, recurso_id, tipo: inspection|project, formato, hash_plantilla, url_storage, expires_at).

## Fase 2: Portal seguro (read-only)
- Token JWT ud: "viewer", sub: client_id, scope: projectIds[]/inspectionIds[], exp. Tabla iewer_tokens (scope, expires_at, revoked_at, issued_by).
- API read-only:
  - GET /api/viewer/projects → lista filtrada por scope.
  - GET /api/viewer/projects/:id → detalle + links a memorias/planos (URLs firmadas o proxied).
  - GET /api/viewer/projects/:id/inspections → lista básica (fecha, estado, criticidad).
  - GET /api/viewer/inspections/:id → detalle + fotos (signed URLs cortas).
  - GET /api/viewer/inspections/:id/export?format=pdf|docx → sirve cache o encola generación; devuelve URL firmada o streaming.
  - GET /api/viewer/projects/:id/documents/:docId → proxya/ firma link a Dropbox/Storage (no expone claves).
- Frontend (SPA liviana):
  - Vista proyecto: resumen, estado, memorias, planos, descargas.
  - Vista inspección: hallazgos con criticidad, miniaturas; modal foto; botones PDF/DOCX.
  - Indicador de versión/fecha de cada documento; filtros por fecha/estado/criticidad.
  - Token solo en memoria; llamadas con Authorization Bearer.
- Seguridad:
  - Middleware valida JWT + scope + revocación. Rate limit, CORS restringido, headers de seguridad.
  - Signed URLs de fotos/documentos con expiración corta (5–15 min).
  - Auditoría mínima: (token_id, recurso, timestamp, ip).
- Imágenes:
  - Preprocesado en API: resize max 1028px, calidad 75–85% JPEG. Thumbs para listados.
- Operación:
  - Cola de jobs (ej. BullMQ) para generación pesada; worker separado.
  - Limpieza de cache expirado; health checks.
  - Monitor de tiempos de export y tamaño de archivos.

## Integración Dropbox (planos/memorias grandes)
- Guardar en tabla project_documents (id, project_id, tipo: memoria|plano|modelo, nombre, size, last_modified, source: dropbox|storage, path, signed_url_cache, expires_at).
- Endpoint interno para refrescar signed URL desde Dropbox API y exponerla vía GET /api/viewer/projects/:id/documents/:docId.
- Opcional: cron para refrescar metadatos de Dropbox (size/mtime) y purgar caches vencidos.

## Pendientes/configuración
- Elegir stack de generación (Syncfusion vs HTML→PDF + docx).
- Definir paleta/tipografía y portada/índice estándar.
- Configurar bucket externo (Supabase Storage/MinIO) y acceso a Dropbox API (app key/secret, refresh token).
- Definir expiraciones: tokens (ej. 7 días), signed URLs (5–15 min), cache de exports (ej. 30 días o hasta que cambie hash_plantilla).
