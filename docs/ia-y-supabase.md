## Integración de IA y Supabase en Chispas

Este documento explica cómo se conectan **IA (Gemini)** y **Supabase** dentro del proyecto: qué casos de uso de IA existen, cómo se llaman desde el frontend y cómo se relacionan con las tablas principales.

---

## 1. Panorama general

### 1.1. Piezas principales

- **Supabase (PostgreSQL + Auth + Edge Functions)**  
  - Base de datos principal (tablas `processes`, `steps`, `roles`, `deliverables`, `kpis`, `improvement_suggestions`, `automation_suggestions`, etc.).
  - Motor de autenticación y RLS.
  - Hospeda la Edge Function `ai-gemini`.

- **Edge Function `ai-gemini`** (`supabase/functions/ai-gemini/index.ts`)  
  - Encapsula todas las llamadas a Google Gemini.
  - Expone un endpoint único con diferentes `use_case`.

- **Frontend Next.js**  
  - Invoca `ai-gemini` vía `supabase.functions.invoke('ai-gemini', { body: { … } })`.
  - Convierte las respuestas de IA al formato interno y las guarda en Supabase cuando es necesario.

---

## 2. Edge Function `ai-gemini`

Archivo: `supabase/functions/ai-gemini/index.ts`

### 2.1. Estructura

- Tipo de cuerpo esperado:

```ts
type UseCase =
  | "parse_sop"
  | "suggest_deliverables"
  | "suggest_kpis"
  | "suggest_improvements"

interface RequestBody {
  use_case: UseCase
  payload: any
}
```

- Flujo básico:
  1. Lee el cuerpo JSON.
  2. Según `use_case`, delega a una función interna:
     - `handleParseSop`
     - `handleSuggestDeliverables`
     - `handleSuggestKpis`
     - `handleSuggestImprovements`
  3. Cada handler construye un `prompt` específico y llama a `callGemini`.
  4. Se devuelve siempre JSON válido con el formato esperado por el frontend.

### 2.2. Llamada a Gemini

```ts
async function callGemini(userPrompt: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY")
  // ...
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        responseMimeType: "application/json",
      },
    }),
  })
  // parsea y hace JSON.parse del texto devuelto
}
```

El **SYSTEM_PROMPT** fija el rol de Gemini como asistente experto en procesos y obliga a responder **solo en JSON**.

---

## 3. Casos de uso de IA

### 3.1. `parse_sop` – Detectar pasos desde un SOP

- **Handler:** `handleParseSop(payload)`
- **Se usa en:** `DescribePage` (`src/app/processes/[id]/describe/page.tsx`)

**Input (`payload`):**
- `sopText: string`
- `processSummary?: { name, objective, type, trigger }`

**Prompt (resumen):**
- Analiza un texto informal.
- Ignora anécdotas/comentarios y extrae solo acciones reales del negocio.
- Debe devolver entre 3 y 15 pasos.
- Siempre infiere un `role_hint` (nunca `null`).

**Output esperado:**

```json
{
  "steps": [
    {
      "name": "Acción profesional en infinitivo",
      "role_hint": "Rol responsable inferido",
      "notes": null
    }
  ]
}
```

**Uso en frontend:**
- Se convierte a una lista local de `{ name, role }`.
- El usuario puede editar antes de guardar en `steps`/`roles`.

---

### 3.2. `suggest_deliverables` – Sugerir entregables

- **Handler:** `handleSuggestDeliverables(payload)`
- **Pensado para:** etapa de Entregables (`/processes/[id]/deliverables`)

**Input (`payload`):**
- `processSummary`: datos básicos del proceso.
- `steps`: lista de pasos (id, nombre, etc.).
- `existingDeliverables`: entregables ya definidos por el usuario.

**Prompt (resumen):**
- Proponer entre 3 y 10 entregables nuevos en total.
- No repetir entregables existentes.
- Priorizar:
  - Lo que recibe el cliente.
  - Lo que necesitan otras áreas.
  - Lo que conviene archivar.
- Usar tipos: `documento|archivo|registro|correo|otro`.
- Usar destinatarios: `cliente|interno|archivo`.

**Output esperado:**

```json
{
  "suggestions": [
    {
      "step_id": "uuid",
      "name": "Nombre del entregable",
      "type": "documento",
      "recipient": "cliente",
      "reason": "Motivo de la sugerencia"
    }
  ]
}
```

**Relación con tablas:**
- Las sugerencias aceptadas se insertan en `deliverables`:
  - `step_id`, `name`, `type`, `recipient`, `description` (puede usar `reason`).

---

### 3.3. `suggest_kpis` – Sugerir KPIs

- **Handler:** `handleSuggestKpis(payload)`
- **Se usa en:** etapa de KPIs (`/processes/[id]/kpis`)

**Input (`payload`):**
- `processSummary`
- `deliverables`
- `existingKpis`

**Prompt (resumen):**
- Proponer entre 3 y 7 KPIs útiles.
- Evitar duplicar KPIs ya existentes.
- Guía por tipo de proceso (cliente, interno, fiscal, RH…).

**Output esperado:**

```json
{
  "suggestions": [
    {
      "name": "Nombre del KPI",
      "description": "Descripción breve",
      "metric_type": "tiempo|porcentaje|cantidad|otro",
      "example_target": "Ejemplo de meta"
    }
  ]
}
```

**Relación con tablas:**
- Cada KPI aceptado se inserta en `kpis`:
  - `process_id`
  - `name`
  - `description`
  - `metric_type`
  - `target_value` (puede partir de `example_target`)
  - `is_active`

---

### 3.4. `suggest_improvements` – Mejoras y automatizaciones

- **Handler:** `handleSuggestImprovements(payload)`
- **Se usa en:** etapa de Summary (`/processes/[id]/summary`)

**Input (`payload`):**
- `processSummary`
- `steps`
- `deliverables`
- `kpis`

**Prompt (resumen):**
- Analizar el proceso y proponer:
  1. Pocas oportunidades de **mejora del proceso**.
  2. Pocas oportunidades de **automatización**.
- Ser específico y accionable.

**Output esperado:**

```json
{
  "improvements": [
    {
      "type": "simplificar|agregar|reordenar|clarificar",
      "description": "Acción específica",
      "affected_step_ids": ["uuid"]
    }
  ],
  "automations": [
    {
      "step_id": "uuid",
      "automation_type": "notificacion|integracion|documento|archivo|formulario",
      "description": "Qué automatizar y cómo"
    }
  ]
}
```

**Relación con tablas:**

- Tabla `improvement_suggestions`:
  - `process_id`
  - `type`
  - `description`
  - `affected_steps` (array de `uuid`)
  - `status` (ej. `pending`)

- Tabla `automation_suggestions`:
  - `step_id`
  - `automation_type`
  - `description`
  - `status`

En `SummaryPage`, estas sugerencias se pueden **editar** y **eliminar**, y se reflejan en las tablas.

---

## 4. Tablas principales relacionadas con IA

### 4.1. `processes`

- Usado para:
  - Proveer contexto a la IA (nombre, objetivo, tipo, disparador).
  - Filtrar sugerencias por proceso.

### 4.2. `steps`

- Usado para:
  - Enviar a IA la secuencia de pasos con rol y posición.
  - Saber en qué pasos aplicar entregables, KPIs o automatizaciones.

### 4.3. `deliverables`

- Usado para:
  - Enriquecer prompts (`suggest_kpis`, `suggest_improvements`).
  - Explicar qué sale del proceso hacia cliente/interno.

### 4.4. `kpis`

- Usado para:
  - Enriquecer el análisis de mejoras.
  - Mostrar indicadores actuales en el PDF/resumen.

### 4.5. `improvement_suggestions` y `automation_suggestions`

- Representan la **capa de conocimiento generado por IA** y/o reglas.
- Permiten:
  - Persistir las sugerencias en la base.
  - Editarlas manualmente.
  - Exportarlas al Workflow Package.

---

## 5. Patrón de uso desde el frontend

Ejemplo general (Next.js / Supabase client):

```ts
const { data, error } = await supabase.functions.invoke("ai-gemini", {
  body: {
    use_case: "suggest_improvements",
    payload: {
      processSummary: { name, objective, type },
      steps,
      roles,
      deliverables,
      kpis,
    },
  },
})
```

Patrones importantes:
- **Siempre validar `error`** y mostrar mensajes claros si la IA falla.
- **Fallback local**: si la IA falla, se usan reglas simples (`generateImprovementSuggestions`, `generateAutomationSuggestions`) para no dejar la UI vacía.
- **Nunca confiar ciegamente**: las sugerencias se presentan como propuestas editables, no se aplican automáticamente.

---

## 6. Buenas prácticas para modificar prompts

1. Mantener el **contrato de salida**:
   - Si cambias el prompt, respeta la estructura JSON que espera el frontend.
2. Escribir prompts en español claro, con ejemplos concretos.
3. Evitar pedir demasiado contenido:
   - Máximo ~10–15 elementos por lista en el MVP.
4. Probar siempre el caso de uso:
   - Con procesos cortos.
   - Con procesos sin entregables/KPIs (asegurarse de que maneje listas vacías).
5. Versionar cambios significativos:
   - Documentar cambios de prompt en `CHANGELOG.md` o en este mismo archivo si afectan el comportamiento de negocio.


