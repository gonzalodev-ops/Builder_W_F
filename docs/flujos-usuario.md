## Flujos de usuario en Chispas (Proceso → Flujo → Entregables → KPIs → Mejoras → Resumen)

Este documento describe, en lenguaje funcional, cómo usa la herramienta una persona desde que crea un proceso hasta que lo marca como “listo”, y **qué se guarda en Supabase en cada paso**.

---

## 1. Crear proceso

- **Ruta:** `/processes/new`
- **Pantalla:** formulario de datos básicos.

El usuario define:
- Nombre del proceso.
- Objetivo (1–2 líneas).
- Tipo de proceso (cliente, interno, fiscal, RH, operativo, financiero, etc.).
- Disparador (qué evento inicia el flujo).

### Qué se guarda

Tabla `processes`:
- `name`
- `objective`
- `type`
- `trigger`
- `status = 'borrador'`
- `capture_method = null` (se definirá en la etapa 1)
- `company_id`, `created_by`, timestamps

Después de guardar, se redirige a: `/processes/[id]/describe`.

---

## 2. Etapa 1 – Describir el proceso

- **Ruta:** `/processes/[id]/describe`
- **Objetivo visible:** “Objetivo: obtener una lista de pasos razonable de cómo se trabaja hoy”.

### 2.1 Selección de método

El usuario elige **un solo método**:
- Preguntas guiadas (`method = 'guided'`).
- SOP (pegar procedimiento o cargar archivo) (`method = 'sop'`).

Esta selección se mantiene en estado de la página y se persiste luego como `capture_method` cuando se generan los pasos.

### 2.2. Preguntas guiadas

- El usuario responde:
  - Objetivo del proceso (texto).
  - Pasos principales (lista en texto).
- La UI arma un texto interno con secciones “Objetivo:” y “Pasos:”.
- Al pulsar “Generar pasos”:
  - Se envía el texto a la función de IA (`parse_sop`) o al parser local de SOP como fallback.
  - La herramienta recibe una lista de pasos con `name` y `role_hint`.
  - Se muestran en la tabla “Pasos detectados”.

### 2.3. SOP / Procedimiento

- El usuario:
  - Sube un archivo (txt/md/pdf/docx/imágenes – algunos simulados).
  - O pega el texto directamente en el textarea.
- Al pulsar “Detectar pasos con IA”:
  - Se llama a `ai-gemini` (`use_case: 'parse_sop'`).
  - La respuesta se convierte a pasos `{ name, role_hint }`.
  - Se muestran en la tabla “Pasos detectados”.

### 2.4. Tabla “Pasos detectados”

- Siempre visible cuando `steps.length > 0`, sin depender del método (SOP/Wizard).
- Permite:
  - Editar el nombre del paso.
  - Editar el rol en texto libre (se usará para crear/relacionar roles).
  - Agregar pasos manualmente.
  - Eliminar pasos.

### 2.5. Checklist y continuar

Checklist lateral:
- Tener al menos 3 pasos.
- Secuencia con sentido.

Cuando se cumple, el botón **“Se ve bien, generar mi flujo ▶”** permite continuar.

### Qué se guarda al generar el flujo

1. Se consulta `processes` para obtener `company_id`.
2. En `steps`:
   - Se eliminan pasos previos del proceso.
   - Se insertan nuevos pasos con:
     - `process_id`
     - `name`
     - `position` (0, 1, 2…)
     - `role_id` (se calcula abajo).
3. En `roles`:
   - Se construye un mapa de roles existentes por nombre (normalizado).
   - Para cada `step.role` en texto:
     - Si no existe rol con ese nombre para la compañía, se crea:
       - `company_id`
       - `name`
       - `is_predefined = false`
   - Se actualiza el mapa y se asigna `role_id` correcto a cada paso.
4. En `processes`:
   - `capture_method` se actualiza a `'guided'` o `'sop'`.

Luego se redirige a `/processes/[id]/flow`.

---

## 3. Etapa 2 – Flujo

- **Ruta:** `/processes/[id]/flow`
- **Objetivo visible:** “Objetivo: ordenar el proceso y asignar responsables”.

### 3.1. Qué ve el usuario

- Diagrama lineal simple:
  - Inicio → 1 → 2 → … → n → Fin.
- Lista de pasos con drag & drop:
  - Número.
  - Nombre del paso.
  - Rol responsable.
- Panel de detalles del paso seleccionado:
  - Nombre.
  - Rol.
  - Duración estimada (minutos).

### 3.2. Acciones del usuario

- Reordenar pasos con drag & drop.
- Renombrar pasos.
- Cambiar rol responsable (selector de roles existentes).
- Definir `sla_duration` (minutos estimados).

### 3.3. Checklist

- Al menos 3 pasos.
- Todos los pasos tienen responsable.

Cuando se cumple, se habilita **“Continuar a entregables ▶”**.

### Qué se guarda

Tabla `steps`:
- Actualización de `position` al reordenar.
- Actualización de:
  - `name`
  - `role_id`
  - `sla_duration`

No se crean nuevas tablas en esta etapa: solo se actualizan `steps`.

---

## 4. Etapa 3 – Entregables

- **Ruta:** `/processes/[id]/deliverables`
- **Objetivo visible:** “Objetivo: hacer explícito qué se entrega y a quién”.

### 4.1. Qué ve el usuario

- Contexto del flujo (lista/diagrama).
- Tabla de entregables:
  - Paso asociado.
  - Nombre del entregable.
  - Tipo (documento, archivo, registro, correo, otro).
  - Destinatario (cliente, interno, archivo).

### 4.2. Acciones del usuario

- Agregar entregables por paso.
- Editar nombre, tipo y destinatario.
- Eliminar entregables.
- Aceptar o ignorar sugerencias de IA (cuando estén disponibles).

### 4.3. Checklist

- Al menos un entregable dirigido al cliente.
- Entregables internos importantes definidos.

### Qué se guarda

Tabla `deliverables`:
- `step_id`
- `name`
- `type`
- `recipient`
- `description` (opcional)

La relación con `steps` asegura que sepamos en qué punto del flujo se produce cada entregable.

---

## 5. Etapa 4 – KPIs

- **Ruta:** `/processes/[id]/kpis`
- **Objetivo visible:** “Objetivo: definir pocas métricas que sí vas a usar”.

### 5.1. Qué ve el usuario

- Lista de KPIs sugeridos (por IA) y/o ya creados:
  - Nombre.
  - Descripción.
  - Tipo de métrica (tiempo, porcentaje, cantidad, otro).
  - Campo “meta” (target).
  - Check “activo”.

### 5.2. Acciones del usuario

- Activar/desactivar KPIs.
- Editar nombre, descripción, tipo y meta.
- Crear KPIs manualmente.
- Aceptar/editar sugerencias de IA.

### 5.3. Checklist

- Al menos 1 KPI activo.
- Cada KPI activo tiene meta definida.

### Qué se guarda

Tabla `kpis`:
- `process_id`
- `name`
- `description`
- `metric_type`
- `is_active`
- `target_value`

No se modifican pasos ni entregables en esta etapa; solo se asocian métricas al proceso completo.

---

## 6. Etapa 5 – Mejoras, Automatización y Resumen

- **Ruta:** `/processes/[id]/summary`
- **Objetivo visible:** “Objetivo: identificar oportunidades de mejora y cerrar el diseño del flujo”.

### 6.1. Carga de datos

Al entrar, la página carga:
- `processes` (proceso actual).
- `steps` (ordenados).
- `deliverables` del proceso.
- `kpis` activos.
- `roles`.
- Sugerencias previas (si existen):
  - `improvement_suggestions`
  - `automation_suggestions`

Si no hay sugerencias guardadas, se llama a la IA (`suggest_improvements`) y se insertan en las tablas.

### 6.2. Qué ve el usuario

1. **Mapa visual del flujo** (`VisualFlowMap`):
   - Swimlanes por rol.
   - Conexiones entre pasos.
   - Badges de mejoras y automatizaciones por paso.
2. **Oportunidades de mejora del proceso**:
   - Tipo (simplificar, agregar, reordenar, clarificar).
   - Descripción.
   - Pasos afectados (por nombre).
   - Botones de editar y eliminar.
3. **Oportunidades de automatización**:
   - Paso.
   - Tipo de automatización (notificación, integración, documento, archivo, formulario).
   - Descripción editable.
   - Botones de editar y eliminar.
4. **Resumen del flujo de trabajo**:
   - Datos básicos del proceso.
   - Resumen de pasos y responsables.
   - Entregables clave.
   - KPIs activos.
   - Conteo de mejoras y automatizaciones.
   - Tarjetas/resumen numérico (nº de pasos, entregables, KPIs, roles involucrados).

### 6.3. Acciones del usuario

- Editar texto de mejoras y automatizaciones (con persistencia).
- Eliminar sugerencias que no apliquen.
- Revisar el resumen completo.
- Marcar el flujo como listo.
- Exportar el Workflow Package a PDF.

### Qué se guarda

Tablas:

- `improvement_suggestions`:
  - `process_id`
  - `type`
  - `description`
  - `affected_steps` (array de ids de step)
  - `status` (ej. `pending`)

- `automation_suggestions`:
  - `step_id`
  - `automation_type`
  - `description`
  - `status`

Al marcar el flujo como listo:
- `processes.status = 'listo'`

La exportación PDF no cambia datos; solo lee:
- Proceso, pasos, roles, entregables, KPIs, mejoras y automatizaciones.

---

## 7. Lista de procesos y estados

- **Ruta:** `/processes`
- Muestra:
  - Nombre del proceso.
  - Tipo.
  - Estado (`borrador` o `listo`).
  - Última edición.
  - Acciones (clonar, eliminar, ver/editar).

Reglas de navegación:
- Si `status === 'listo'`:
  - El nombre lleva directamente a `/processes/[id]/summary`.
- Si `status === 'borrador'`:
  - El nombre lleva a `/processes/[id]/describe` para continuar el flujo.

---

## 8. Cómo usar este documento

Esta guía sirve para:
- **Producto / UX**: entender qué espera el sistema en cada etapa.
- **Desarrollo**: saber qué tablas/columnas se tocan en cada pantalla.
- **Mantenimiento**: validar que nuevas funcionalidades respetan el flujo general (no romper la cadena Proceso → … → Resumen).


