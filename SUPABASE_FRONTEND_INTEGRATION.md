# Usar el frontend público de Supabase como base de StrucApp

El repo `supabase/supabase` (https://github.com/supabase/supabase) mantiene el dashboard público y su layout React/Next.js. Si te gusta ese frontend, puedes clonarlo y usarlo como punto de partida para StrucApp siguiendo estos pasos:

## 1. Clonar el monorepo oficial (solo una vez)

```bash
cd /c/Users/jprey/Dropbox/Workspace/sistema/structapp-base
git clone --depth 1 https://github.com/supabase/supabase.git supabase-dashboard
```

- `supabase-dashboard/apps/dashboard` es la app principal. Si quieres separar, duplica esa carpeta:

```bash
cp -R supabase-dashboard/apps/dashboard supabase-dashboard/apps/strucapp-dashboard
```

Así comienzas con el layout completo de Supabase sin afectar tus carpetas actuales (`frontend/` sigue intacto).

## 2. Instalar dependencias y lanzar el proyecto

```bash
cd supabase-dashboard
pnpm install   # usan pnpm en el monorepo
cd apps/strucapp-dashboard
pnpm dev
```

Si prefieres npm/yarn, puedes convertir el `package.json` de `apps/strucapp-dashboard` y ejecutar `npm install`.

## 3. Configurar los entornos (auth + API)

Clona `.env.example` dentro de `apps/strucapp-dashboard` como `.env.local` y ajusta:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tok-anon-xxx
NEXT_PUBLIC_STRUCTAPP_API_URL=http://localhost:8000  # tu FastAPI
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://xyz.supabase.co/functions/v1
```

- La app usa `@supabase/auth-helpers-nextjs` para autenticación. Puedes mantener el flujo Supabase para login y usar el token JWT para tus endpoints FastAPI añadiendo un wrapper `fetch` que incluya `Authorization: Bearer <token>`.
- Agrega un archivo `lib/structapp-api.ts` y crea un cliente similar al `frontend/src/api/client.ts`.

```ts
import { createSupabaseClient } from "./supabase-client";
import { getSession } from "@supabase/auth-helpers-nextjs";

export async function structappFetch(input: RequestInfo, init?: RequestInit) {
  const supabase = createSupabaseClient();
  const { data: session } = await supabase.auth.getSession();
  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(`${process.env.NEXT_PUBLIC_STRUCTAPP_API_URL}${input}`, {
    ...init,
    headers,
  });
}
```

Usa `structappFetch` para consumir `/projects`, `/inspections`, `/calculations`, etc.

## 4. Mapear las pantallas de StrucApp

- Duplica o adapta rutas dentro de `apps/strucapp-dashboard/src/pages` y usa los componentes de Supabase (Layout, Sidebar, DataTable) combinándolos con tus módulos actuales (`ProjectsPage`, `ProjectInspectionsPage`, `calculations`).
- Mantén la lógica de `useSession` del dashboard (o reimpleméntala) para guardar `projectId`, `org_plan` y roles. Usa esa info para esconder menús según el plan (a la larga, feature flags).
- Reutiliza las APIs ya creadas en `api/` del backend; supabase UI solo debe manejar la presentación/consumo.

## 5. Pasos finales de integración

1. Apunta el form de login del dashboard a Supabase Auth (lo hace por defecto) y asegura que el token se propague a `structappFetch`.
2. Crea helpers que conviertan tu backend (FastAPI + Supabase) en fuentes de datos (projects, inspections, docs, quotes, etc.).
3. Mantén el orden del checklist: primero aseguras las tablas/roles, luego los endpoints FastAPI y por último la UI (feature flags) para no romper nada.

## 6. Recursos adicionales

- `supabase-dashboard/apps/dashboard/src/lib/supabase-client.ts`: referencia para crear clientes que guardan tokens.
- `supabase-dashboard/apps/dashboard/src/components/Layout`: el layout con sidebar/topbar que puedes reutilizar.
- `supabase-dashboard/apps/dashboard/src/pages`: revisa cómo implementan tablas, metric cards y estados.

Una vez conectada tu API, puedes customizar esa UI sin perder el layout que te gusta y seguir desarrollando StrucApp dentro de la misma estructura (o migrando poco a poco desde `frontend/`). Mantén los cambios documentados y revisa (o crea) tests en backend/frontend antes de desplegar.
