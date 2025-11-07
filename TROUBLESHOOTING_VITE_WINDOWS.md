# Solución de Problemas: Vite en Windows + Dropbox

## Error Común: EBUSY - Resource Busy or Locked

### Síntomas

```
Error: EBUSY: resource busy or locked, rename
'...\node_modules\.vite\deps_temp_xxxxx' -> '...\node_modules\.vite\deps'
```

### Causa

Este error ocurre en Windows cuando:
1. **Dropbox está sincronizando** archivos mientras Vite intenta modificarlos
2. **Antivirus** está escaneando los archivos de node_modules
3. Múltiples procesos de Node están corriendo simultáneamente

---

## Soluciones (En orden de preferencia)

### ✅ Solución 1: Usar el Script de Limpieza (Más Rápido)

```bash
cd frontend
npm run dev:clean
```

Este script:
1. Limpia la caché de Vite
2. Reinicia con `--force` para reconstruir dependencias

---

### ✅ Solución 2: Pausar Dropbox Temporalmente (Más Efectivo)

**Pasos:**

1. **Pausar Dropbox:**
   - Click derecho en el icono de Dropbox (bandeja del sistema)
   - "Pausar sincronización" → "5 minutos"

2. **Detener procesos de Node:**
   ```bash
   taskkill /F /IM node.exe
   ```

3. **Limpiar caché:**
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   ```

4. **Reiniciar servidor:**
   ```bash
   npm run dev
   ```

5. **Reactivar Dropbox** después de que el servidor inicie

---

### ✅ Solución 3: Excluir Carpeta de Dropbox (Permanente)

**Para evitar el problema completamente:**

1. **Pausar sincronización de node_modules:**
   - Abre Dropbox
   - Ve a Preferencias → Sincronización → Selectiva
   - Deselecciona la carpeta `frontend/node_modules`

2. **O mueve el proyecto fuera de Dropbox:**
   ```bash
   # Mueve solo el código a Dropbox, no node_modules
   C:/
   ├── Proyectos/                    # Fuera de Dropbox
   │   └── structapp-base/
   │       └── frontend/
   │           └── node_modules/     # No sincronizado
   └── Dropbox/
       └── structapp-code/           # Solo código fuente
   ```

---

### ✅ Solución 4: Manual (Si las anteriores fallan)

```bash
# 1. Detener TODO
taskkill /F /IM node.exe
taskkill /F /IM vite.exe

# 2. Esperar 5 segundos
timeout /t 5

# 3. Limpiar manualmente
cd frontend
rmdir /s /q node_modules\.vite

# 4. Reiniciar
npm run dev -- --force
```

---

## Configuración Preventiva

### 1. Configuración de Vite (Ya aplicada)

El archivo `vite.config.ts` tiene configuración optimizada para Windows:

```typescript
export default defineConfig({
  server: {
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@mui/material", "@mui/x-data-grid"],
    force: false,
  },
  cacheDir: "node_modules/.vite",
});
```

### 2. Scripts Disponibles

```json
{
  "scripts": {
    "dev": "vite",                          // Inicio normal
    "dev:clean": "npm run clean:cache && vite --force",  // Con limpieza
    "clean:cache": "rm -rf node_modules/.vite"  // Solo limpieza
  }
}
```

---

## Mejores Prácticas

### ✅ Hacer

1. **Usar `npm run dev:clean`** cuando cambies dependencias o veas errores
2. **Pausar Dropbox** durante desarrollo intensivo
3. **Cerrar editores** antes de limpiar caché
4. **Esperar 5-10 segundos** entre detener y reiniciar

### ❌ Evitar

1. **No ejecutar múltiples instancias** de `npm run dev`
2. **No editar archivos en node_modules** manualmente
3. **No forzar eliminación** de archivos mientras Vite está corriendo
4. **No tener VSCode** abierto en node_modules durante limpieza

---

## Casos Especiales

### El servidor inicia pero en puerto diferente

**Normal:** Vite busca puertos automáticamente

```
Port 5173 is in use, trying another one...
✓ ready in 264 ms
➜  Local:   http://localhost:5175/
```

**Solución:** Usa el puerto indicado (5174, 5175, etc.)

### Error persiste después de limpiar

**Causa:** Procesos fantasma de Node

**Solución:**
```bash
# Windows Task Manager
1. Ctrl + Shift + Esc
2. Busca "Node.js"
3. Click derecho → "Finalizar tarea"

# O por consola:
wmic process where "name='node.exe'" delete
```

---

## Comandos Rápidos de Referencia

```bash
# Reinicio limpio
cd frontend && npm run dev:clean

# Detener todo
taskkill /F /IM node.exe

# Limpiar caché
cd frontend && rm -rf node_modules/.vite

# Ver procesos Node corriendo
tasklist | findstr node

# Iniciar con puerto específico
npm run dev -- --port 5173

# Forzar reconstrucción
npm run dev -- --force

# Ver logs detallados
npm run dev -- --debug
```

---

## Monitoreo

### Verificar que el servidor está corriendo

```bash
# PowerShell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# CMD
tasklist | findstr node

# Git Bash
ps aux | grep node
```

### Verificar puerto en uso

```bash
netstat -ano | findstr :5173
```

---

## Soporte Adicional

Si ninguna solución funciona:

1. **Revisa los logs:**
   ```bash
   npm run dev -- --debug > vite-debug.log 2>&1
   ```

2. **Reinstala dependencias:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

3. **Verifica versiones:**
   ```bash
   node --version   # Debe ser >= 18
   npm --version    # Debe ser >= 9
   ```

4. **Actualiza Vite:**
   ```bash
   cd frontend
   npm update vite
   ```

---

## FAQ

### ¿Por qué sucede esto?

Windows bloquea archivos que están siendo usados por otros procesos. Dropbox sincroniza constantemente, creando conflictos.

### ¿Es peligroso eliminar node_modules/.vite?

No, es seguro. Es solo caché de Vite que se reconstruye automáticamente.

### ¿Debo excluir node_modules de Dropbox?

**Sí, recomendado.** node_modules es grande y se regenera con `npm install`.

### ¿Cuánto esperar entre comandos?

Espera 5-10 segundos para que:
- Procesos terminen completamente
- Dropbox libere archivos
- Sistema operativo actualice índices

---

**Última actualización:** 2025-11-07
**Versión:** 1.0
