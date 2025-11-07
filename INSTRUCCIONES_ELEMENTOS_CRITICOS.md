# Instrucciones: Elementos Críticos en Documentación

## 🚀 Pasos para Activar la Funcionalidad

### 1. Ejecutar Migración SQL (REQUERIDO)

**IMPORTANTE:** Debes ejecutar esta migración SQL en Supabase **antes** de usar la funcionalidad.

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega este código:

```sql
-- Agregar columna is_critical a la tabla calc_runs
ALTER TABLE calc_runs
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_calc_runs_is_critical
ON calc_runs (project_id, element_type, is_critical)
WHERE is_critical = TRUE;

-- Agregar comentario
COMMENT ON COLUMN calc_runs.is_critical IS 'Flag para marcar este cálculo como el elemento crítico/representativo de su tipo para usar en reportes';
```

4. Click en **Run** o presiona `Ctrl+Enter`
5. Verifica que no haya errores

### 2. Verificar que la Columna Existe

Ejecuta este query para verificar:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'calc_runs' AND column_name = 'is_critical';
```

Deberías ver:
```
column_name  | data_type | column_default
is_critical  | boolean   | false
```

---

## 🧪 Cómo Probar

### Paso 1: Iniciar el Backend

```bash
cd api
python -m uvicorn main:app --reload --port 8000
```

Verifica que veas:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Paso 2: Iniciar el Frontend

```bash
cd frontend
npm run dev
```

Abre: http://localhost:5173/ (o el puerto que indique)

### Paso 3: Crear Cálculos de Prueba

1. **Ir a:** Cálculos Estructurales
2. **Seleccionar:** Un proyecto activo
3. **Calcular:** Al menos 3 elementos del mismo tipo (ejemplo: 3 vigas de acero)
   - Viga 1: W410x149, Momento = 250 kN·m
   - Viga 2: W310x97, Momento = 180 kN·m
   - Viga 3: W360x122, Momento = 220 kN·m

### Paso 4: Marcar Elemento Crítico

1. **Ir a:** Documentación del Proyecto
2. **Seleccionar:** El mismo proyecto
3. **Buscar:** La sección "Vigas de Acero"
4. **Verás una tabla como esta:**

```
┌───┬────┬──────────────┬──────────────────────────────────┐
│ ☐ │ ☆ │ Fecha        │ Resumen                          │
├───┼────┼──────────────┼──────────────────────────────────┤
│ ☐ │ ☆ │ 07/11 10:30  │ Perfil: W410x149 | Ratio: 72.0% │
│ ☐ │ ☆ │ 07/11 10:25  │ Perfil: W310x97 | Ratio: 85.0%  │
│ ☐ │ ☆ │ 07/11 10:20  │ Perfil: W360x122 | Ratio: 65.0% │
└───┴────┴──────────────┴──────────────────────────────────┘
```

5. **Hacer click** en la estrella vacía (☆) de la segunda fila
6. **Debería cambiar a:** ⭐ (estrella llena amarilla)
7. **Las demás estrellas** del mismo tipo deberían quedarse vacías (☆)

### Paso 5: Verificar en la Consola del Navegador

Abre la consola del navegador (F12) y busca estos logs:

```javascript
Toggling critical element: { runId: "uuid...", elementType: "steel_beam", currentIsCritical: false }
Set critical result: { success: true, run: {...} }
Query invalidated, list should refresh
```

### Paso 6: Verificar en la Base de Datos

Ejecuta este query en Supabase:

```sql
SELECT id, element_type, is_critical, created_at
FROM calc_runs
WHERE project_id = 'tu-project-id'
ORDER BY element_type, created_at DESC;
```

Deberías ver que **solo 1 elemento por tipo** tiene `is_critical = true`.

---

## 🐛 Solución de Problemas

### Problema 1: La estrella no se ilumina

**Causa posible:** La columna `is_critical` no existe en la base de datos.

**Solución:**
1. Verifica que ejecutaste la migración SQL (Paso 1)
2. Verifica en Supabase SQL Editor:
   ```sql
   \d calc_runs
   ```
3. Deberías ver `is_critical | boolean` en la lista de columnas

### Problema 2: Error en la consola - "Error al marcar elemento crítico"

Si ves en la UI el error:
```
Error al marcar elemento crítico. Verifica que la base de datos tenga la columna 'is_critical'.
```

Y en la consola del backend ves:
```
'SyncFilterRequestBuilder' object has no attribute 'select'
```

**Causa:** El código del backend intentaba encadenar `.select()` directamente después de `.update()`, lo cual no está soportado en el SDK de Supabase Python.

**Solución:** ✅ Ya corregido en `services/runs_service.py`. El código ahora:
1. Ejecuta el update
2. Luego hace una consulta separada para obtener los datos actualizados

Si el error dice:
```
column "is_critical" of relation "calc_runs" does not exist
```

**Solución:**
1. Ejecuta la migración SQL del Paso 1
2. Refresca la página (F5)

### Problema 3: La página de Cálculos no funciona

Si ves error en ProjectCalculationsPage:

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca el error específico
3. Si dice algo sobre `useSetCriticalElement` o `useUnsetCriticalElement`:
   - Estos hooks fueron removidos de ProjectCalculationsPage
   - Verifica que el archivo no los importe ni use

### Problema 4: El backend no responde

**Verificar:**
```bash
curl http://localhost:8000/docs
```

Si no responde:
```bash
cd api
python -m uvicorn main:app --reload --port 8000
```

### Problema 5: Click en la estrella no hace nada

**Debug:**
1. Abre consola del navegador (F12)
2. Haz click en la estrella
3. Verifica logs:
   - ✅ Si ves logs → Backend está respondiendo
   - ❌ Si ves error de red → Backend no está corriendo
   - ❌ Si ves error 404 → Endpoint no configurado

**Solución:**
- Verifica que el backend esté corriendo
- Verifica que `api/routers/calculations.py` tenga los endpoints `/runs/{run_id}/set-critical` y `/runs/{run_id}/unset-critical`

---

## 📊 Comportamiento Esperado

### ✅ Correcto

1. **Un solo crítico por tipo:**
   - Si marcas viga A como crítica ⭐
   - Luego marcas viga B como crítica ⭐
   - → Viga A se desmarca automáticamente ☆
   - → Viga B queda marcada ⭐

2. **Críticos independientes:**
   - Viga de acero A: ⭐ (crítico)
   - Columna de hormigón B: ⭐ (crítico)
   - → Ambos pueden estar críticos simultáneamente (tipos diferentes)

3. **Desmarcar:**
   - Click en estrella llena ⭐
   - → Se desmarca ☆
   - → Ningún elemento del tipo queda crítico

### ❌ Incorrecto

- ❌ Dos vigas de acero críticas al mismo tiempo
- ❌ Estrella no cambia al hacer click
- ❌ Error en consola al hacer click

---

## 🔍 Verificación Final

Checklist para confirmar que todo funciona:

- [ ] Migración SQL ejecutada exitosamente
- [ ] Columna `is_critical` existe en `calc_runs`
- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo (5173 o similar)
- [ ] Puedes calcular elementos estructurales
- [ ] Ves estrellas (☆) en la página de Documentación
- [ ] Click en estrella la ilumina (⭐)
- [ ] Solo 1 estrella por tipo puede estar iluminada
- [ ] Logs aparecen en consola del navegador
- [ ] Base de datos muestra `is_critical = true` correctamente

---

## 📞 Si Nada Funciona

1. **Pausa Dropbox** temporalmente
2. **Limpia caché:**
   ```bash
   cd frontend
   npm run dev:clean
   ```
3. **Reinicia backend:**
   ```bash
   cd api
   python -m uvicorn main:app --reload --port 8000
   ```
4. **Revisa logs** en ambas consolas (backend y frontend)
5. **Verifica migración SQL** una vez más
6. **Abre consola del navegador (F12)** y busca errores específicos

---

## 📝 Comandos Rápidos

```bash
# Limpiar y reiniciar todo
cd frontend && npm run dev:clean &
cd ../api && python -m uvicorn main:app --reload --port 8000

# Ver logs del backend
cd api && python -m uvicorn main:app --reload --port 8000 --log-level debug

# Verificar endpoint
curl http://localhost:8000/calculations/runs/test-id/set-critical

# Ver base de datos
psql supabase -c "SELECT * FROM calc_runs WHERE is_critical = true;"
```

---

**Última actualización:** 2025-11-07
**Versión:** 1.0
