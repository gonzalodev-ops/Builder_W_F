## Auditoría de Estado Funcional – Chispas (03‑dic‑2025)

Este documento resume las diferencias entre lo que dicen los documentos de estado (MVP/IA) y lo que realmente existe en el código de este repo.

### 1. Autenticación y multi‑usuario

- **Según docs**
  - `MVP_COMPLETO.md` indica que el MVP está “COMPLETO y FUNCIONAL end‑to‑end”, aunque en la tabla marca explícitamente la autenticación como “No implementado (Post‑MVP)”.
  - `IMPLEMENTATION_SUMMARY.md` lista la autenticación con Supabase como funcionalidad pendiente.
- **En código**
  - Existen `createSupabaseClient` y `createSupabaseServerClient` en `src/lib/supabase/client.ts` y `src/lib/supabase/server.ts`, basados en `@supabase/auth-helpers-nextjs`, pero:
    - No hay rutas de login/registro (`/auth/**` o similares).
    - No hay `middleware` protegiendo rutas.
    - Ninguna página lee el usuario actual ni filtra por `user_id`.
- **Conclusión**
  - **No hay login ni autenticación implementados**. El producto funciona en modo “single‑tenant / sin usuario”.

### 2. Wizard y Etapa 1 (“Describir”)

- **Según docs**
  - `MVP_COMPLETO.md` habla de un “Parser inteligente de SOP” y marca el “Wizard de preguntas guiadas” como no implementado (Post‑MVP).
  - `IMPLEMENTATION_SUMMARY.md` incluye el wizard como pendiente.
- **En código**
  - `src/app/processes/[id]/describe/page.tsx`:
    - Tiene dos modos: “Preguntas guiadas” (placeholder solo con texto “Próximamente”) y “Pegar procedimiento (SOP)”.
    - El parser principal ya no es de reglas simples: llama a `supabase.functions.invoke('ai-gemini', { use_case: 'parse_sop', ... })` y solo cae al parser local como fallback.
  - No existe un wizard real de preguntas y respuestas; solo el placeholder.
- **Conclusión**
  - **Parser de SOP con IA: implementado (frontend)**.
  - **Wizard guiado: NO implementado (sigue siendo un TODO)**.

### 3. Flujo 2–5 (Flow, Entregables, KPIs, Summary)

- **Según docs**
  - `MVP_COMPLETO.md` afirma que las 5 etapas del flujo están completas (para un MVP sin login).
  - `AI_INTEGRATION_COMPLETE.md` afirma que las 4 etapas clave están conectadas a IA y que la Edge Function ya está desplegada.
- **En código**
  - Rutas existentes y operativas:
    - `src/app/processes/[id]/flow/page.tsx` – editor lineal con drag & drop y asignación de roles desde catálogo Supabase.
    - `src/app/processes/[id]/deliverables/page.tsx` – gestión de entregables por paso + botón “Sugerir con IA”.
    - `src/app/processes/[id]/kpis/page.tsx` – sugerencias estáticas y con IA, activación de KPIs y metas.
    - `src/app/processes/[id]/summary/page.tsx` – genera mejoras y automatizaciones (IA + reglas locales), muestra Workflow Package y exporta PDF.
  - Las 4 pantallas llaman a `supabase.functions.invoke('ai-gemini', { body: { use_case: ... } })`.
- **Conclusión**
  - **Flujo 1–5 para un solo usuario: sí está implementado y es navegable**.
  - La parte de IA en frontend está alineada con `AI_INTEGRATION_COMPLETE.md`.

### 4. Edge Function `ai-gemini` y despliegue

- **Según docs**
  - `AI_INTEGRATION_COMPLETE.md` afirma:
    - “Edge Function `ai-gemini` – YA desplegada”.
    - “GEMINI_API_KEY YA configurada”.
    - Estado “PRODUCCIÓN READY”.
  - `SUPABASE_EDGE_FUNCTIONS_SETUP.md` describe otra arquitectura anterior con **4 functions distintas**: `parse-sop`, `suggest-deliverables`, `suggest-kpis`, `suggest-improvements`.
- **En código**
  - Solo se llama a una function: `supabase.functions.invoke('ai-gemini', ...)`.
  - No existe carpeta `supabase/functions/` ni el código fuente de `ai-gemini` en este repo, por lo que:
    - No se puede verificar desde aquí si la función está desplegada ni su código actual.
- **Conclusión**
  - **Hay incoherencia entre los docs de Edge Functions**:
    - El frontend usa UNA function (`ai-gemini`) con `use_case`.
    - El doc de setup habla de CUATRO functions separadas.
  - Desde este repo **no se puede afirmar** que la function esté desplegada ni 100% operativa en Supabase.

### 5. Uso de tablas `improvement_suggestions` y `automation_suggestions`

- **Según docs**
  - `MVP_COMPLETO.md` y `IMPLEMENTATION_SUMMARY.md` mencionan tablas `improvement_suggestions` y `automation_suggestions`.
- **En código**
  - La lógica de mejoras y automatizaciones en `summary/page.tsx` usa:
    - IA vía `ai-gemini` cuando está disponible.
    - Funciones locales `generateImprovementSuggestions` y `generateAutomationSuggestions` como fallback.
  - No hay lecturas ni escrituras a las tablas `improvement_suggestions` / `automation_suggestions`.
- **Conclusión**
  - **Las tablas existen en el schema pero no se usan todavía en el frontend**. Toda la lógica de sugerencias es in‑memory (IA + reglas locales).

### 6. CRUD de procesos, autosave, clonar/eliminar

- **Según docs**
  - `IMPLEMENTATION_SUMMARY.md` marca CRUD completo de procesos y autosave como pendientes para completar el MVP.
  - `MVP_COMPLETO.md` habla de CRUD “completo” a nivel alto.
- **En código**
  - `src/app/processes/page.tsx`:
    - Lista procesos desde Supabase, con filtros básicos.
    - Enlaza a `/processes/new` y a `/processes/[id]/describe`.
  - No se ve:
    - UI para eliminar procesos.
    - Clonar procesos.
    - Autosave explícito en cada etapa (se guardan acciones concretas, pero no hay un mecanismo general de autosave tipo “onChange → save” con indicador).
- **Conclusión**
  - **Lista y creación básica de procesos: implementadas**.
  - **Eliminar, clonar y autosave global: no implementados todavía**.

---

### Resumen global “Lo planeado vs Lo implementado”

- **Login / multi‑usuario**: No implementado (docs lo marcan como pendiente, pero algunos textos dan una sensación de MVP 100% completo).
- **Wizard guiado en Etapa 1**: No implementado (solo placeholder).
- **Flujo 1–5 para un solo usuario**: Implementado y alineado con gran parte de la documentación.
- **IA (frontend)**: Implementada y alineada con `AI_INTEGRATION_COMPLETE.md` en cuanto a llamadas y UI.
- **IA (Edge Function + despliegue)**: Diseño descrito, pero desde este repo no se puede verificar ni garantizar el despliegue real; además, hay un doc desfasado que habla de 4 functions distintas.
- **Uso de tablas de sugerencias**: No se usan en el frontend; se trabaja en memoria con IA + reglas locales.
- **CRUD extendido (clonar/eliminar, autosave)**: Solo hay una parte implementada (listar/crear); el resto sigue pendiente.


