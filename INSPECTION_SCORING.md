# Guia de calificacion de danos e inspecciones

Documento de trabajo para entender como se calcula el puntaje de cada dano y de la inspeccion completa, y donde modificar factores o prompts.

## Flujo general
- Endpoints en `api/routers/inspections.py` crean/actualizan/leen danos, ensayos y documentos.
- Creacion y actualizacion de danos (`create_project_inspection_damage`, `update_project_inspection_damage`) triggerean `_update_damage_and_inspection_scores` en `services/inspections_service.py` para recalcular puntaje del dano y de su inspeccion.
- Creacion de inspecciones llama `_update_inspection_scores` para recalcular puntaje agregado; borrar danos vuelve a llamar ese recalculo.
- Endpoint GET `/inspections/{inspection_id}/scores` ejecuta el calculo en caliente sin escribir en base de datos.

## Datos de entrada
- Dano (`api/schemas/inspections.py`): `project_id`, `inspection_id`, `structure`, `location`, `damage_type`, `damage_cause`, `severity` (Leve/Media/Alta/Muy Alta), `extent` (texto o porcentaje), `comments`, `damage_photo_url`.
- Inspeccion: `project_id`, `structure_name`, `location`, `inspection_date`, `inspector`, `overall_condition`, `summary`, `photos`.

## Puntaje determinista por dano (`services/inspection_scoring.py`)
- Pesos por defecto (`DEFAULT_WEIGHTS`):
  - severity: Leve 1.0, Media 2.0, Alta 3.0, Muy Alta 4.0
  - cause: estructural 1.5, deformacion 1.3, corrosion 1.4, filtracion 1.2, electrico 1.2, estetico 1.0, mantenimiento 1.1
  - damage_type: fisura 1.3, desprendimiento 1.4, asentamiento 1.5, corrosion 1.4, desgaste 1.1, golpes 1.0, otro 1.0
- Factor de extension (`_extent_factor`): si `extent` es numero o texto estilo "35%" se normaliza a 0..1 (se trunca max 100%); si no es interpretable devuelve 0.
- Puntaje por dano crudo (`_score_damage`): severidad * factor_causa * factor_tipo * (1 + factor_extension). Si no hay match se usa 1.0.
- Normalizacion a 0-100: se divide el puntaje crudo entre el maximo teorico (`max(severity)*max(cause)*max(damage_type)*2`) y se multiplica por 100. El `deterministic_score` almacenado para cada dano ya esta normalizado a 0-100 para compararlo con LLM.

### Interpretacion de puntajes por dano
- Rango: 0 a 100 (normalizado).
- Direccion: puntaje mas alto = dano mas critico (peor).
- Guion de lectura sugerido (no hay cortes duros en codigo): 0-30 bajo, 30-60 medio, 60-100 alto/critico.

## Puntaje determinista de inspeccion
- Para todos los danos se calcula el puntaje anterior y se suman en `total_damage_score`.
- Multiplicador por cantidad (`count_multiplier`): 1 + min(0.5, numero_danos/10). Max 1.5 a partir de 5 danos.
- `raw_score = total_damage_score * count_multiplier`.
- `max_possible_per_damage = max(severity)*max(cause)*max(damage_type)*2` (2 es el maximo al usar +100% de extension). Con los pesos actuales es 18.
- `max_score = max_possible_per_damage * numero_danos * count_multiplier`.
- Puntaje final = `(raw_score / max_score) * 100`, redondeado a 2 decimales y limitado a 100. Si no hay danos se devuelve 0.

### Interpretacion de puntaje de inspeccion
- Rango: 0 a 100.
- Direccion: puntaje mas alto = inspeccion mas critica (peor); 0 indica sin danos registrados, 100 es el peor escenario relativo a los pesos definidos.
- Guion de lectura sugerido: 0-30 bajo, 30-60 medio, 60-100 alto/critico. Ajustar segun criterio interno si se calibran pesos.

## Puntaje LLM por dano
- Requiere `OPENAI_API_KEY` y modelo en `LLM_MODEL` (default `gpt-4o-mini`); temperatura 0.2. Si no hay API key responde con `llm_score=None` y razon "OpenAI key not configured".
- Prompt enviado a chat completions:
```
Sistema: Eres un asistente que evalua la critica estructural de danos y responde con JSON. Manten el score entre 0 y 100.
Usuario: Evalua este dano:
- Estructura: {structure}
- Ubicacion: {location}
- Tipo: {damage_type}
- Causa: {damage_cause}
- Gravedad: {severity}
- Extension: {extent}
- Comentarios: {comments}

Devuelve solo JSON con los campos "score" (numero 0-100) y "reason" (explicacion corta).
```
- Respuesta esperada: JSON parseable. `_parse_llm_response` extrae `score` como float y `reason`; si no es JSON se guarda el texto crudo en `reason` y `llm_score=None`.
- Interpretacion: rango 0-100, puntaje mas alto = dano mas critico (peor). No hay cortes duros; usar el mismo guion orientativo que arriba si se necesita clasificar.

## Puntaje LLM por inspeccion
- Payload incluye inspeccion (`id`, `structure_name`, `summary`) y los danos simplificados.
- Prompt:
```
Sistema: Eres un asistente que analiza inspecciones estructurales y responde con JSON. Devuelve un score entre 0 y 100 y una explicacion corta.
Usuario: Inspeccion: {structure_name} ({inspection_id})
Resumen: {summary}
Danos:
- {damage_type} ({severity}) en {location} - Causa: {damage_cause}
...

Responde solo JSON con los campos "score" y "reason".
```
- `_call_llm` envia el mensaje y `_parse_llm_response` procesa la salida igual que en el caso por dano.
- Interpretacion: rango 0-100, puntaje mas alto = inspeccion mas critica (peor). Use tramos 0-30/30-60/60-100 como referencia blanda.

## Persistencia de resultados
- Migracion `migrations/20240711_add_inspection_scores_columns.sql` agrega en `project_inspection_damages` y `project_inspections`: `deterministic_score`, `llm_score`, `llm_reason`, `llm_payload`, `score_updated_at`.
- `_safe_update` en `services/inspections_service.py` escribe usando `SUPABASE_SERVICE_KEY` si existe; de lo contrario usa el cliente anon.

## Archivos y variables para ajustes manuales
- `services/inspection_scoring.py`: ajustar `DEFAULT_WEIGHTS`, prompts, modelo (`LLM_MODEL`) y logica de calculo.
- `services/inspections_service.py`: controla cuando se recalculan puntajes al crear/actualizar/borrar danos o inspecciones.
- `api/routers/inspections.py`: endpoints y ruta de recalculo on-demand `/inspections/{id}/scores`.
- `api/schemas/inspections.py`: tipos y valores permitidos (ej. severidad Literal).
- `migrations/20250112_create_inspections_tables.sql`: estructura base de tablas de inspecciones y catalogos.
- `migrations/20240711_add_inspection_scores_columns.sql`: columnas donde se guardan los puntajes.
- `frontend/src/constants/inspectionCatalog.ts`: catalogos de tipos de dano, causas y severidades usados en UI.
- `.env`: `OPENAI_API_KEY`, `LLM_MODEL`, y credenciales Supabase; cambiar aqui para apuntar a otro modelo o desactivar LLM (dejar la key vacia).
- Referencias del modelo/umbrales: derivan de `DEFAULT_WEIGHTS` y la normalizacion en `services/inspection_scoring.py`; no hay articulo externo. Los tramos sugeridos se basan en la capacidad maxima calculada (puntaje crudo ~0-18 por dano, luego normalizado a 0-100; inspeccion ya en 0-100) y sirven como guia operativa.

## Referencias y fuentes
- Modelo actual: heuristica interna; no se empleo un articulo especifico para definir pesos ni tramos. Se baso en categorizar severidad/causa/tipo para priorizar riesgos.
- Normativa/guia recomendada para contrastar o recalibrar (no usada directamente en el modelo, solo referencia tecnica):
  - ACI 562-21: Code Requirements for Assessment, Repair, and Rehabilitation of Existing Concrete Structures.
  - ASCE/SEI 41-23: Seismic Evaluation and Retrofit of Existing Buildings.
  - FEMA 306/307/308: Evaluation/Repair/Technical Resources for Earthquake Damaged Concrete and Masonry Wall Buildings.
  - EN 1504-9: Products and Systems for the Protection and Repair of Concrete Structures — General Principles for the Use of Products and Systems.
  - fib Bulletin 82: Assessment of existing concrete structures.

## Notas rapidas
- Si se modifica `DEFAULT_WEIGHTS` o las listas de catalogo, reiniciar los workers y recalcular con el endpoint de scores para ver el efecto.
- La salida del LLM se guarda tambien en `llm_payload` para auditoria; si el modelo devuelve texto no JSON, solo se conserva `reason`.
