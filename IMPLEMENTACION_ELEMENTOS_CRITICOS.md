# Implementación de Elementos Críticos y Tablas de Resumen

Este documento explica cómo funciona el sistema de elementos críticos y tablas de resumen para la generación de reportes con múltiples cálculos del mismo tipo.

## Tabla de Contenidos

1. [Resumen de Funcionalidad](#resumen-de-funcionalidad)
2. [Migración de Base de Datos](#migración-de-base-de-datos)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Uso en el Frontend](#uso-en-el-frontend)
5. [Generación de Tablas](#generación-de-tablas)
6. [Uso en Placeholders de Word](#uso-en-placeholders-de-word)
7. [Ejemplo Completo](#ejemplo-completo)

---

## Resumen de Funcionalidad

### Problema

Cuando tienes múltiples cálculos del mismo tipo (por ejemplo, 5 vigas de acero), los placeholders individuales como `{{steel.beam.section}}` no sabían cuál usar.

### Solución

**Estrategia Híbrida:**

1. **Placeholders Individuales**: Se llenan con el **elemento crítico** seleccionado manualmente por el usuario (marcado con estrella ⭐ en el historial)

2. **Placeholders de Tabla**: Generan tablas HTML con **TODOS** los cálculos del mismo tipo
   - `{{steelBeamsTable}}` → Tabla con todas las vigas de acero
   - `{{concreteColumnsTable}}` → Tabla con todas las columnas de hormigón
   - `{{footingsTable}}` → Tabla con todas las zapatas
   - etc.

---

## Migración de Base de Datos

### 1. Ejecutar el Script SQL

Ejecuta el script de migración en tu base de datos Supabase:

```bash
# Ubicación del script
migrations/add_is_critical_column.sql
```

O ejecuta manualmente:

```sql
ALTER TABLE calc_runs
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_calc_runs_is_critical
ON calc_runs (project_id, element_type, is_critical)
WHERE is_critical = TRUE;
```

### 2. Verificar la Migración

```sql
-- Verificar que la columna existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'calc_runs' AND column_name = 'is_critical';
```

---

## Arquitectura del Sistema

### Backend (Python/FastAPI)

#### 1. Schema (`api/schemas/calculations.py`)

```python
class CalculationRun(BaseModel):
    id: str
    project_id: str
    element_type: str
    created_at: Optional[datetime] = None
    input_json: Dict[str, Any]
    result_json: Dict[str, Any]
    is_critical: Optional[bool] = False  # ← Nueva columna
```

#### 2. Servicio (`services/runs_service.py`)

```python
def set_critical_element(run_id: str, project_id: str, element_type: str):
    """
    Marca un elemento como crítico.
    Desmarca automáticamente otros del mismo tipo en el proyecto.
    """
    # Desmarcar todos del mismo tipo
    supa().table("calc_runs").update({"is_critical": False})\
        .eq("project_id", project_id)\
        .eq("element_type", element_type)\
        .execute()

    # Marcar el seleccionado
    supa().table("calc_runs").update({"is_critical": True})\
        .eq("id", run_id)\
        .execute()
```

#### 3. Endpoints (`api/routers/calculations.py`)

```python
@router.post("/runs/{run_id}/set-critical")
async def mark_as_critical(run_id: str):
    """Marca un cálculo como crítico"""
    ...

@router.post("/runs/{run_id}/unset-critical")
async def unmark_as_critical(run_id: str):
    """Desmarca un cálculo como crítico"""
    ...

@router.get("/critical-elements/{project_id}")
async def get_project_critical_elements(project_id: str):
    """Obtiene todos los elementos críticos de un proyecto"""
    ...
```

### Frontend (React/TypeScript)

#### 1. Hooks (`hooks/useStructuralCalcs.ts`)

```typescript
export function useSetCriticalElement() {
  return useMutation<{ success: boolean; run: any }, Error, string>({
    mutationFn: async (runId: string) => {
      const response = await apiClient.post(`/calculations/runs/${runId}/set-critical`);
      return response.data;
    },
  });
}
```

#### 2. UI (`pages/ProjectCalculationsPage.tsx`)

La tabla de historial ahora incluye una columna con estrella (⭐):

- **Estrella llena (⭐)**: Elemento crítico
- **Estrella vacía (☆)**: Click para marcar como crítico
- Solo puede haber **1 elemento crítico por tipo** por proyecto

---

## Uso en el Frontend

### Marcar un Elemento como Crítico

1. Ve a la página de **Cálculos Estructurales**
2. En el historial, verás una columna con estrellas
3. Haz click en la estrella vacía (☆) del cálculo que quieres marcar
4. Se marcará como crítico (⭐) y se desmarcarán los demás del mismo tipo

### Verificación Visual

```
┌─────┬────────────┬─────────────────┬────────────────────┐
│ ⭐ │ Fecha      │ Tipo            │ Resumen            │
├─────┼────────────┼─────────────────┼────────────────────┤
│ ☆  │ 07/11/2025 │ Viga de Acero   │ W410x149 | 72%    │
│ ⭐ │ 06/11/2025 │ Viga de Acero   │ W310x97 | 85%     │ ← Crítico
│ ☆  │ 05/11/2025 │ Viga de Acero   │ W410x149 | 65%    │
└─────┴────────────┴─────────────────┴────────────────────┘
```

---

## Generación de Tablas

### Servicio de Generación (`services/table_generator.py`)

Este servicio genera tablas HTML para todos los elementos:

```python
from services.table_generator import generate_all_tables
from services.runs_service import list_runs

# Obtener todos los cálculos del proyecto
runs = list_runs(project_id)

# Generar todas las tablas
tables = generate_all_tables(project_id, runs)

# Resultado:
tables = {
    "concreteColumnsTable": "<table>...</table>",
    "concreteBeamsTable": "<table>...</table>",
    "steelColumnsTable": "<table>...</table>",
    "steelBeamsTable": "<table>...</table>",
    "woodColumnsTable": "<table>...</table>",
    "woodBeamsTable": "<table>...</table>",
    "footingsTable": "<table>...</table>",
}
```

### Integración en el Sistema de Documentos

Cuando generes un documento Word, debes:

1. **Obtener elementos críticos** para placeholders individuales:

```python
from services.runs_service import get_critical_elements

critical = get_critical_elements(project_id)

# Resultado:
critical = {
    "steel_beam": { id: "...", result_json: {...}, ... },
    "rc_column": { id: "...", result_json: {...}, ... },
    ...
}
```

2. **Generar tablas** para placeholders de tabla:

```python
from services.table_generator import generate_all_tables

tables = generate_all_tables(project_id, all_runs)
```

3. **Combinar ambos** para el sistema de placeholders:

```python
# Placeholders individuales (elementos críticos)
placeholders = {
    "steel.beam.section": critical["steel_beam"]["result_json"]["section"],
    "steel.beam.mn": critical["steel_beam"]["result_json"]["mn"],
    ...
}

# Agregar placeholders de tablas
placeholders.update(tables)

# Resultado final:
placeholders = {
    "steel.beam.section": "W410x149",
    "steel.beam.mn": "350.80",
    ...
    "steelBeamsTable": "<table>...</table>",
    "concreteColumnsTable": "<table>...</table>",
    ...
}
```

---

## Uso en Placeholders de Word

### Estructura Recomendada del Documento

```
MEMORIA DE CÁLCULO ESTRUCTURAL

Proyecto: {{projectName}}
Fecha: {{currentDate}}

1. ANÁLISIS SÍSMICO
Cortante basal X: {{seismic.result.Qbasx}} kN
Cortante basal Y: {{seismic.result.Qbasy}} kN

2. DISEÑO DE ELEMENTOS ESTRUCTURALES

2.1 Vigas de Acero

Se diseñaron 5 vigas de acero estructural. La viga crítica (más solicitada)
se encuentra en el eje A entre las columnas 1-2:

Perfil seleccionado: {{steel.beam.section}}
Momento resistente: {{steel.beam.mn}} kN·m
Cortante resistente: {{steel.beam.vn}} kN
Ratio de utilización a flexión: {{steel.beam.flexureRatio}}
Estado de verificación: {{steel.beam.checkStatus}}

El perfil seleccionado cumple con los requisitos de AISC360 para todos
los estados límite considerados.

Para el resumen completo de las 5 vigas calculadas, ver Anexo A.1.

---

ANEXO A: RESUMEN DE CÁLCULOS ESTRUCTURALES

A.1 VIGAS DE ACERO

{{steelBeamsTable}}

A.2 COLUMNAS DE HORMIGÓN

{{concreteColumnsTable}}

A.3 ZAPATAS

{{footingsTable}}
```

### Resultado en Word

La tabla se insertará con formato HTML:

```
A.1 VIGAS DE ACERO

┌──────┬─────────┬────────────┬───────────┬──────────────┬─────────────┬────────┐
│ ID   │ Perfil  │ Mn (kN·m)  │ Vn (kN)   │ Ratio Flex   │ Defl. (cm)  │ Estado │
├──────┼─────────┼────────────┼───────────┼──────────────┼─────────────┼────────┤
│ VA-1 │ W410x149│    350.80  │   450.00  │     72.0%    │    2.50     │   OK   │
│ VA-2 │ W310x97 │    280.50  │   380.00  │     85.0%    │    2.80     │   OK   │
│ VA-3 │ W410x149│    345.20  │   445.00  │     71.0%    │    2.45     │   OK   │
│ VA-4 │ W360x122│    310.00  │   400.00  │     75.0%    │    2.60     │   OK   │
│ VA-5 │ W410x149│    355.00  │   455.00  │     73.0%    │    2.52     │   OK   │
└──────┴─────────┴────────────┴───────────┴──────────────┴─────────────┴────────┘
```

---

## Ejemplo Completo

### Paso 1: Calcular Múltiples Elementos

1. Abre el proyecto en la app
2. Ve a **Cálculos Estructurales**
3. Calcula 5 vigas de acero con diferentes parámetros
4. Todos se guardan en el historial

### Paso 2: Marcar el Elemento Crítico

1. En el historial, identifica la viga con **mayor ratio de utilización**
2. Haz click en su estrella (☆) para marcarla como crítica (⭐)
3. Esta será la viga que aparecerá en los placeholders individuales

### Paso 3: Generar el Documento

1. Ve a la sección de **Documentos/Reportes**
2. Selecciona tu plantilla Word con placeholders
3. Genera el documento

**Resultado:**

- Los placeholders `{{steel.beam.*}}` se llenan con la viga crítica (⭐)
- El placeholder `{{steelBeamsTable}}` muestra TODAS las 5 vigas en una tabla

### Paso 4: Verificar el Documento

Abre el Word generado y verifica:

✅ Sección narrativa muestra la viga crítica
✅ Anexo muestra tabla con las 5 vigas
✅ Formato profesional y completo

---

## Ventajas de esta Estrategia

### 1. Flexibilidad

- Puedes cambiar cuál es el elemento crítico en cualquier momento
- No necesitas recalcular, solo cambiar la estrella

### 2. Trazabilidad Completa

- El cuerpo del documento analiza el elemento más importante
- Los anexos documentan TODOS los cálculos realizados

### 3. Cumplimiento Normativo

- Puedes demostrar que verificaste todos los elementos
- Registro completo para auditorías

### 4. Eficiencia

- No necesitas crear múltiples documentos
- Un solo reporte con toda la información

---

## Troubleshooting

### La estrella no aparece en el historial

**Solución:**
1. Verifica que ejecutaste la migración SQL
2. Refresca la página (F5)
3. Verifica en la consola del navegador si hay errores

### El placeholder de tabla está vacío

**Solución:**
1. Verifica que tienes cálculos del tipo correspondiente
2. Revisa que el nombre del placeholder es correcto: `{{steelBeamsTable}}`
3. Verifica en el backend que `generate_all_tables()` se está llamando

### Solo un tipo puede ser crítico a la vez

**Esto es correcto:** Solo puede haber 1 elemento crítico POR TIPO por proyecto.

Puedes tener simultáneamente:
- 1 viga de acero crítica ⭐
- 1 columna de hormigón crítica ⭐
- 1 zapata crítica ⭐
- etc.

Pero NO puedes tener:
- 2 vigas de acero críticas ❌

---

## Próximos Pasos

1. **Ejecutar la migración** en tu base de datos
2. **Probar en el frontend** marcando elementos como críticos
3. **Integrar la generación de tablas** en tu sistema de documentos
4. **Actualizar tus plantillas Word** con los nuevos placeholders de tabla

---

## Soporte

Si tienes problemas con la implementación:

1. Revisa este documento
2. Verifica la migración SQL
3. Revisa los logs del backend para errores
4. Verifica la consola del navegador

