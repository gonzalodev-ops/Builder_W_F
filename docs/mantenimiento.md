## Guía de mantenimiento del proyecto Chispas (Workflows)

Este documento resume buenas prácticas para **mantener y extender** el proyecto: cómo tocar código, base de datos, prompts de IA y documentación sin romper el flujo principal.

---

## 1. Principios generales

1. **Respetar la cadena de valor**  
   Cualquier cambio debe mantener clara la secuencia:
   > Proceso → Flujo → Entregables → KPIs → Mejoras → Automatización → Resumen

2. **Cambios pequeños y bien delimitados**  
   - Una PR / commit por tipo de cambio (bugfix, feature, ajuste de copy, etc.).
   - Evitar “mega-commits” que mezclan front, BD y prompts.

3. **Documentar lo que cambie el comportamiento**  
   - Si tocas IA, flujos o arquitectura, actualiza los docs en `docs/` y/o `CHANGELOG.md`.

---

## 2. Trabajar con el código (frontend / lógica)

### 2.1. Estructura a respetar

- Rutas y páginas:
  - `src/app/processes/page.tsx` – lista de procesos.
  - `src/app/processes/[id]/describe/page.tsx` – Etapa 1.
  - `src/app/processes/[id]/flow/page.tsx` – Etapa 2.
  - `src/app/processes/[id]/deliverables/page.tsx` – Etapa 3.
  - `src/app/processes/[id]/kpis/page.tsx` – Etapa 4.
  - `src/app/processes/[id]/summary/page.tsx` – Etapa 5.

- Componentes clave:
  - `StageProgressBar` – barra de etapas.
  - `VisualFlowMap` – mapa visual por rol.
  - `WorkflowPackagePDF` – generación del PDF.

### 2.2. Buenas prácticas de implementación

- Mantener componentes centrados en **una responsabilidad**:
  - Las páginas orquestan datos y llamadas a Supabase.
  - Los componentes puros (`VisualFlowMap`, botones, etc.) solo renderizan UI.

- Evitar lógica de negocio dispersa:
  - Centralizar helpers en `src/lib` cuando la lógica se repite.

- Seguir el estilo de Tailwind existente:
  - Reusar patrones (`max-w-[95%] xl:max-w-[1800px]`, etc.).
  - Mantener jerarquías de headings y textos consistentes.

### 2.3. Lints y tipos

- Ejecutar linter / TypeScript (según configuración del proyecto) antes de hacer commit.
- Si cambias tipos en `src/types/database.ts`, ajustar:
  - Páginas que usan esos tipos.
  - Cualquier helper en `src/lib` que los consuma.

---

## 3. Trabajar con la base de datos (Supabase)

### 3.1. Regla de oro

> Toda modificación de esquema debe hacerse mediante **migraciones** en `supabase/migrations/`.

### 3.2. Pasos para agregar/editar columnas

1. Crear una nueva migración SQL en `supabase/migrations/` con nombre descriptivo, por ejemplo:
   - `20251204120000_add_priority_to_improvement_suggestions.sql`

2. Dentro de la migración:
   - Añadir/alterar columnas:
     ```sql
     ALTER TABLE improvement_suggestions
     ADD COLUMN priority text;
     ```

3. Mantener sincronizado `supabase/schema.sql` si se usa como snapshot.

4. Ajustar tipos en `src/types/database.ts`:
   - Añadir el nuevo campo a la interfaz correspondiente.

5. Actualizar código que inserte/lea esos datos:
   - Páginas en `src/app/processes/[id]/**`.
   - Cualquier helper en `src/lib/utils` o `src/lib/ai`.

### 3.3. RLS y seguridad

- Al tocar políticas de Row Level Security:
  - Verificar que los usuarios sigan viendo solo sus procesos.
  - Probar con:
    - Usuario con procesos.
    - Usuario sin procesos.

---

## 4. Mantener y extender los prompts de IA

Los prompts viven en `supabase/functions/ai-gemini/index.ts`.

### 4.1. Cambios seguros

Puedes modificar:
- Ejemplos de texto.
- Matices de tono (siempre español claro y corto).
- Mensajes de guía para priorizar ciertos tipos de sugerencias.

Mientras:
- No cambies el **formato de salida** (claves JSON, tipos esperados).
- No agregues campos que el frontend no use (o actualiza el frontend en paralelo).

### 4.2. Añadir un nuevo `use_case`

1. Declarar el nuevo valor en el tipo `UseCase`.
2. Implementar un nuevo handler, por ejemplo:
   - `async function handleSuggestRisks(payload: any) { … }`
3. Definir el formato exacto de respuesta JSON en el prompt.
4. Agregar el caso en el `switch` principal.
5. Implementar en el frontend:
   - Llamada a `supabase.functions.invoke`.
   - Conversión de la respuesta al modelo interno.
   - UI para mostrar/editar resultados.

### 4.3. Testing manual recomendado

- Probar con:
  - Procesos cortos (3–5 pasos).
  - Procesos sin entregables/KPIs (listas vacías).
  - Procesos con muchos pasos.

Si la IA falla:
- Asegurarse de que el frontend:
  - Muestra un mensaje claro.
  - Usa fallback local si está implementado (por ejemplo, funciones en `src/lib/utils/suggestions.ts`).

---

## 5. Mantener el Workflow Package (PDF)

Componente: `src/components/WorkflowPackagePDF.tsx`

### 5.1. Al agregar campos nuevos

Si incorporas nuevos datos al resumen (por ejemplo, prioridad de mejoras):
1. Asegúrate de que la página de Summary construya los `rolesMap` y `stepsMap` necesarios.
2. Pasa los datos nuevos como props a `WorkflowPackagePDF`.
3. Agrega las secciones correspondientes en el layout del PDF.

### 5.2. Recomendaciones

- Mantener el PDF legible en una o pocas páginas:
  - Resumir listas largas.
  - Usar secciones y encabezados claros.
- Si cambias estilos, probar con:
  - Procesos con muchos pasos.
  - Procesos con pocas secciones llenas (para ver estados vacíos).

---

## 6. Flujo recomendado para nuevas funcionalidades

1. **Diseño rápido / especificación:**
   - Escribir una nota corta en `docs/` (o un issue) con:
     - Qué pantalla toca.
     - Qué nuevo dato se quiere guardar/mostrar.

2. **Modelo de datos:**
   - Ver si requiere:
     - Nueva tabla.
     - Nuevas columnas.
   - Crear migración si aplica.

3. **Backend / IA (si aplica):**
   - Ajustar Edge Function o helpers de dominio.

4. **Frontend:**
   - Actualizar página(s) afectadas.
   - Mantener la UX alineada con los principios (un objetivo claro por etapa, CTA principal, etc.).

5. **Pruebas manuales básicas:**
   - Recorrer las 5 etapas para un proceso de prueba.
   - Verificar que:
     - No se rompa el flujo existente.
     - El PDF se genere correctamente.

6. **Documentación y commit:**
   - Actualizar documentos afectados en `docs/`.
   - Registrar cambios relevantes en `CHANGELOG.md` si impactan al usuario.

---

## 7. Mantenimiento de documentación

- La documentación viva está en:
  - `README.md`
  - `docs/arquitectura.md`
  - `docs/flujos-usuario.md`
  - `docs/ia-y-supabase.md`
  - `docs/mantenimiento.md`

Recomendaciones:
- Cada vez que se agregue una funcionalidad grande:
  - Añadir o actualizar secciones relevantes.
- Mantener estos documentos cortos y accionables:
  - Evitar copiar código completo.
  - Enlazar a archivos del repo cuando sea necesario.


