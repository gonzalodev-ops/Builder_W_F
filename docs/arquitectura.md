## Arquitectura de la Herramienta de Workflows (Chispas)

Este documento describe la arquitectura actual del proyecto: cómo se organiza el código, cómo fluyen los datos entre frontend, Supabase e IA, y qué responsabilidades tiene cada módulo principal.

---

## 1. Visión general de capas

- **Frontend (Next.js App Router)**  
  - Ubicación: `src/app/**`, `src/components/**`  
  - Responsables de:
    - Rutas de la aplicación (login, lista de procesos, 5 etapas del flujo).
    - Renderizar formularios, diagramas y tablas.
    - Gestionar estado de UI y llamadas a Supabase/IA desde el cliente.

- **Backend ligero (API Routes y Edge Functions)**  
  - API Routes en Next: `src/app/api/ai/*/route.ts`
  - Edge Function de IA: `supabase/functions/ai-gemini/index.ts`
  - Responsables de:
    - Encapsular llamadas a IA (Gemini).
    - Aplicar prompts específicos por caso de uso.

- **Base de datos y Auth (Supabase)**  
  - Esquema en: `supabase/schema.sql`  
  - Clientes en: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`  
  - Responsables de:
    - Persistir procesos, pasos, roles, entregables, KPIs y sugerencias.
    - Aplicar Row Level Security (RLS) por compañía/usuario.

---

## 2. Rutas principales (flujo en 5 etapas)

Todas las rutas de procesos viven bajo `src/app/processes`:

- `src/app/processes/page.tsx`  
  - Lista de procesos del usuario.
  - Permite crear nuevos procesos, clonar y eliminar.
  - Si un proceso está en estado `listo`, el nombre enlaza directamente a su resumen.

- `src/app/processes/new/page.tsx`  
  - Alta de un nuevo proceso (nombre, objetivo, tipo, disparador).

- `src/app/processes/[id]/describe/page.tsx` – **Etapa 1: Describir**  
  - Permite elegir método de captura:
    - Wizard de preguntas guiadas.
    - SOP (pegar texto / cargar archivo).
  - Usa la Edge Function `ai-gemini` con `use_case: "parse_sop"` para detectar pasos y roles sugeridos.
  - Muestra siempre la tabla de “Pasos detectados”, independientemente del método (fix B‑5).
  - Al pulsar “Se ve bien, generar mi flujo ▶”:
    - Elimina pasos existentes del proceso.
    - Crea/actualiza pasos con `position` secuencial.
    - Crea roles nuevos si el texto de rol no existe aún (fix B‑4).

- `src/app/processes/[id]/flow/page.tsx` – **Etapa 2: Flujo**  
  - Muestra lista de pasos ordenados y permite:
    - Reordenar con drag & drop (`@dnd-kit`).
    - Editar nombre del paso.
    - Asignar/editar rol responsable.
  - Actualiza `position` en Supabase después de cada reordenamiento.
  - Solo permite avanzar si todos los pasos tienen un rol asignado.

- `src/app/processes/[id]/deliverables/page.tsx` – **Etapa 3: Entregables**  
  - Permite definir, por paso:
    - Nombre del entregable.
    - Tipo (documento, archivo, registro, correo, otro).
    - Destinatario (cliente, interno, archivo).
  - Usa IA (use case `suggest_deliverables`) para sugerir entregables basados en pasos y tipo de proceso.

- `src/app/processes/[id]/kpis/page.tsx` – **Etapa 4: KPIs**  
  - Gestiona KPIs a nivel proceso:
    - Nombre, descripción, tipo de métrica, meta.
    - Campo `is_active` para marcar KPIs efectivos.
  - Usa IA (use case `suggest_kpis`) para proponer entre 3 y 7 KPIs, evitando duplicados.

- `src/app/processes/[id]/summary/page.tsx` – **Etapa 5: Mejoras, Automatización y Resumen**  
  - Carga:
    - Proceso (`processes`).
    - Pasos (`steps`).
    - Entregables (`deliverables`).
    - KPIs (`kpis` activos).
    - Roles (`roles`).
    - Sugerencias persistidas (`improvement_suggestions`, `automation_suggestions`).
  - Si no hay sugerencias persistidas, llama a IA (`use_case: "suggest_improvements"`) y las guarda en Supabase.
  - Permite editar y eliminar sugerencias (UX‑4).
  - Muestra el `VisualFlowMap` con pasos, roles, mejoras y automatizaciones.
  - Permite:
    - Marcar el proceso como `listo`.
    - Exportar el Workflow Package a PDF.

---

## 3. Componente `VisualFlowMap`

Archivo: `src/components/process/VisualFlowMap.tsx`

Responsabilidad: mostrar un mapa visual del flujo por “swimlanes” de rol, con conexión secuencial entre pasos.

- **Entradas (props)**:
  - `process`: datos básicos del proceso.
  - `steps`: lista ordenada de pasos (con `position` y `role_id`).
  - `roles`: catálogo de roles.
  - `deliverables`: entregables asociados a pasos.
  - `kpis`: KPIs del proceso (se usan más para contexto).
  - `improvements`: sugerencias de mejora (se usan para tooltips).
  - `automations`: sugerencias de automatización (tooltips).

- **Lógica interna**:
  1. Agrupa los pasos por `role_id` para crear swimlanes:
     - Un carril “Sin asignar” si hay pasos sin rol.
  2. Ordena los carriles según el `position` del primer paso.
  3. Dentro de cada carril:
     - Pinta columnas por posición global del paso.
     - Rellena con “espaciadores” en posiciones donde el carril no tiene paso, para mantener alineación vertical.
  4. Capa SVG:
     - Dibuja líneas curvas (`<motion.path>`) que conectan cada paso con el siguiente, incluso si cambian de carril.
  5. Tooltips:
     - Muestra detalles de mejoras/automatizaciones al hacer clic en los badges correspondientes.

Resultado: el usuario ve claramente la secuencia de pasos y cómo se reparten entre roles, más las oportunidades de mejora/automatización.

---

## 4. Integración de IA – Edge Function `ai-gemini`

Archivo principal: `supabase/functions/ai-gemini/index.ts`

### 4.1. Estructura general

- Se expone una única función Edge con diferentes `use_case`:
  - `"parse_sop"`
  - `"suggest_deliverables"`
  - `"suggest_kpis"`
  - `"suggest_improvements"`

- Entrada HTTP:
  - `POST` con cuerpo:
    ```json
    {
      "use_case": "parse_sop",
      "payload": { ... }
    }
    ```

- Flujo:
  1. Valida `use_case`.
  2. Construye un prompt específico para Gemini en función del caso.
  3. Llama a la API de Gemini con `callGemini`.
  4. Devuelve JSON tipado y listo para usar en frontend.

### 4.2. Casos de uso

- **parse_sop**  
  - Input: `sopText` + `processSummary`.  
  - Output: lista de pasos con `name` y `role_hint`.  
  - Se usa en `DescribePage` para generar pasos desde un SOP.

- **suggest_deliverables**  
  - Input: `processSummary`, `steps`, `existingDeliverables`.  
  - Output: `suggestions[]` con entregables recomendados.  
  - Se usa en la etapa de Entregables.

- **suggest_kpis**  
  - Input: `processSummary`, `deliverables`, `existingKpis`.  
  - Output: `suggestions[]` con KPIs propuestos (nombre, descripción, tipo, ejemplo de meta).

- **suggest_improvements**  
  - Input: `processSummary`, `steps`, `deliverables`, `kpis`.  
  - Output:
    - `improvements[]` (tipo, descripción, `affected_step_ids`).
    - `automations[]` (step_id, tipo de automatización, descripción).
  - Se usa en la etapa de Summary; las respuestas se convierten y persisten en las tablas correspondientes.

---

## 5. Modelo de datos en Supabase (resumen)

Las tablas clave (ver detalles en `supabase/schema.sql`):

- `companies`  
  - Identifica a cada empresa/tenant.

- `user_profiles`  
  - Vincula usuarios de Supabase Auth con `company_id`.

- `processes`  
  - Campos principales: `id`, `company_id`, `name`, `objective`, `type`, `trigger`, `status`, `capture_method`.

- `steps`  
  - `process_id` → `processes.id`
  - `role_id` → `roles.id`
  - `name`, `description`, `position`, `sla_duration`.

- `roles`  
  - `company_id` (puede ser `NULL` para roles predefinidos globales).
  - `name`, `is_predefined`.

- `deliverables`  
  - `step_id` → `steps.id`
  - `name`, `type`, `recipient`, `description`.

- `kpis`  
  - `process_id` → `processes.id`
  - `name`, `description`, `metric_type`, `is_active`, `target_value`.

- `improvement_suggestions`  
  - `process_id` → `processes.id`
  - `type`, `description`, `affected_steps[]`, `status`.

- `automation_suggestions`  
  - `step_id` → `steps.id`
  - `automation_type`, `description`, `status`.

---

## 6. Flujo de datos típico

### 6.1. Desde la descripción al flujo

1. Usuario crea proceso en `/processes/new`.
2. En `/processes/[id]/describe`:
   - Guarda texto SOP o respuestas del wizard en estado local.
   - Llama a `ai-gemini` (`parse_sop`) → devuelve pasos sugeridos.
   - El usuario revisa/edita y guarda → se insertan filas en `steps`.

### 6.2. Desde flujo a entregables/KPIs

1. En `/processes/[id]/flow` el usuario ordena y asigna roles → se actualizan `steps`.
2. En `/processes/[id]/deliverables`:
   - Se leen `steps` y `deliverables`.
   - Opcionalmente se invoca IA (`suggest_deliverables`) para sugerencias.
3. En `/processes/[id]/kpis`:
   - Se leen `process`, `deliverables`, `kpis`.
   - Opcionalmente IA (`suggest_kpis`) para propuestas.

### 6.3. Summary y Workflow Package

1. `/processes/[id]/summary` carga todo el contexto.
2. Llama (solo si hace falta) a `suggest_improvements`.
3. Persiste sugerencias.
4. Renderiza:
   - `VisualFlowMap`.
   - Listas de mejoras y automatizaciones editables.
   - Resumen textual del flujo.
5. El botón “Exportar PDF” usa `WorkflowPackagePDF` para generar el documento descargable.

---

## 7. Cómo extender la arquitectura

- **Nuevas etapas o pestañas**:  
  - Crear nuevas rutas debajo de `src/app/processes/[id]/<nueva-etapa>/page.tsx`.
  - Reutilizar `StageProgressBar` para reflejar el nuevo paso.

- **Nuevos campos en procesos/pasos**:  
  - Añadir columnas en migraciones de Supabase.
  - Actualizar tipos en `src/types/database.ts`.
  - Ajustar componentes donde se lean/escriban esos campos.

- **Nuevos casos de uso de IA**:  
  - Agregar un nuevo `use_case` en `ai-gemini/index.ts` y su prompt.
  - Invocarlo desde una API Route o directamente desde el frontend vía `supabase.functions.invoke`.


