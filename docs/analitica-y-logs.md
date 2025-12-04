# Analítica y Logs de Uso de IA

Este documento describe la estrategia de instrumentación para capturar métricas de uso de los Modelos de Lenguaje (LLMs) y el comportamiento de los usuarios dentro de **Workflows Builder**.

## Objetivo

El objetivo principal es recopilar datos que permitan:
1. **Optimizar costos y latencia** de las llamadas a la IA.
2. **Entender la calidad de las sugerencias** midiendo la tasa de aceptación de los usuarios.
3. **Analizar el flujo de trabajo** de los usuarios para identificar puntos de fricción o valor.

## Estructura de Datos

### 1. Logs Técnicos de IA (`ai_usage_logs`)

Esta tabla registra cada interacción técnica con los proveedores de IA (actualmente Gemini). Se inserta desde el servidor (`src/lib/ai/logging.ts`).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del log. |
| `created_at` | TIMESTAMPTZ | Fecha y hora de la llamada. |
| `provider` | VARCHAR | Proveedor de IA (ej. `gemini`). |
| `model` | VARCHAR | Modelo utilizado (ej. `gemini-1.5-flash`). |
| `use_case` | VARCHAR | Caso de uso (ej. `suggest_improvements`, `suggest_kpis`, `parse_sop`). |
| `process_id` | UUID | (Opcional) ID del proceso asociado a la llamada. |
| `latency_ms` | INTEGER | Tiempo de respuesta en milisegundos. |
| `input_tokens` | INTEGER | Tokens enviados (estimado o real). |
| `output_tokens` | INTEGER | Tokens recibidos (estimado o real). |
| `success` | BOOLEAN | Si la llamada fue exitosa. |
| `error_message` | TEXT | Mensaje de error si `success` es `false`. |

### 2. Eventos de Uso de la App (`app_usage_events`)

Esta tabla registra acciones de negocio significativas realizadas por los usuarios en la interfaz. Se inserta principalmente desde el cliente (`src/lib/analytics/logEvent.ts`).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del evento. |
| `created_at` | TIMESTAMPTZ | Fecha y hora del evento. |
| `user_id` | UUID | ID del usuario que realizó la acción. |
| `company_id` | UUID | (Opcional) ID de la empresa del usuario. |
| `process_id` | UUID | (Opcional) ID del proceso donde ocurrió el evento. |
| `event_type` | VARCHAR | Tipo de evento (ver lista abajo). |
| `source` | VARCHAR | Origen del evento (ej. `web_app`). |
| `metadata` | JSONB | Datos adicionales específicos del evento (IDs, estados previos, etc.). |

## Eventos Instrumentados

Actualmente se capturan los siguientes eventos:

### Resumen y Finalización (`SummaryPage`)
- **`process_marked_ready`**: El usuario marca un proceso como "listo".
  - *Metadata*: `{ previous_status: 'borrador' }`
- **`pdf_exported`**: El usuario descarga el PDF del proceso.
  - *Metadata*: `{ step_count, has_improvements, has_automations }`
- **`improvement_updated`**: El usuario edita una sugerencia de mejora.
  - *Metadata*: `{ improvement_id }`
- **`improvement_deleted`**: El usuario elimina una sugerencia de mejora.
  - *Metadata*: `{ improvement_id }`
- **`automation_updated`**: El usuario edita una sugerencia de automatización.
  - *Metadata*: `{ automation_id }`
- **`automation_deleted`**: El usuario elimina una sugerencia de automatización.
  - *Metadata*: `{ automation_id }`

### KPIs (`KPIsPage`)
- **`kpi_suggestion_accepted`**: El usuario acepta un KPI sugerido por la IA (sin editar).
  - *Metadata*: `{ name, metric_type, has_target }`
- **`kpi_suggestion_edit_started`**: El usuario inicia la edición de una sugerencia de IA.
  - *Metadata*: `{ suggestion_id }`
- **`kpi_suggestion_edit_cancelled`**: El usuario cancela la edición de una sugerencia.
- **`kpi_suggestion_edited_and_accepted`**: El usuario guarda un KPI modificado a partir de una sugerencia.
  - *Metadata*: 
    ```json
    {
      "changes": { "name_changed": true, "target_changed": true, ... },
      "original": { "name": "...", "target": "..." },
      "final": { "name": "...", "target": "..." }
    }
    ```
- **`kpi_created_from_list`**: El usuario añade un KPI de la lista de sugerencias estáticas.
  - *Metadata*: `{ name, metric_type }`

### Entregables (`DeliverablesPage`)
- **`deliverable_suggestion_accepted`**: El usuario acepta un entregable sugerido por la IA (sin editar).
  - *Metadata*: `{ recipient, type }`
- **`deliverable_suggestion_edit_started`**: El usuario inicia la edición de una sugerencia de IA.
  - *Metadata*: `{ suggestion_id }`
- **`deliverable_suggestion_edit_cancelled`**: El usuario cancela la edición de una sugerencia.
- **`deliverable_suggestion_edited_and_accepted`**: El usuario guarda un entregable modificado a partir de una sugerencia.
  - *Metadata*:
    ```json
    {
      "changes": { "name_changed": true, "description_changed": true, ... },
      "original": { "name": "...", "type": "..." },
      "final": { "name": "...", "type": "..." }
    }
    ```
- **`deliverable_created_manual`**: El usuario crea un entregable manualmente.
  - *Metadata*: `{ type, recipient }`

## Preguntas de Negocio (Analytics)

Con estos datos podemos responder preguntas como:

1.  **Tasa de Aceptación de IA**:
    *   ¿Qué porcentaje de las sugerencias de KPIs son aceptadas por los usuarios?
    *   *Query*: Count `kpi_suggestion_accepted` vs Total `suggest_kpis` calls (o comparado con KPIs totales).

2.  **Valor Percibido**:
    *   ¿Los procesos que se "marcan como listos" tienen más o menos sugerencias de IA aceptadas que los que se quedan en borrador?
    *   *Query*: Join `app_usage_events` (ready) with `ai_usage_logs` stats per process.

3.  **Performance de IA**:
    *   ¿Cuál es la latencia promedio por caso de uso? ¿Hay casos de uso que fallan frecuentemente?
    *   *Query*: Avg `latency_ms` by `use_case` in `ai_usage_logs`.

4.  **Comportamiento de Exportación**:
    *   ¿Qué tan completo está un proceso (steps, improvements) cuando se exporta a PDF?
    *   *Query*: Analyze metadata from `pdf_exported`.

5.  **Calidad de Sugerencias (Edición)**:
    *   ¿Qué tan a menudo los usuarios tienen que corregir a la IA? ¿Qué campos corrigen más (nombre, tipo, destinatario)?
    *   *Query*: Analizar `kpi_suggestion_edited_and_accepted` y `deliverable_suggestion_edited_and_accepted` buscando `changes.name_changed = true`, etc.


