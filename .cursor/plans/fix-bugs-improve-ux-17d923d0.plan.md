<!-- 17d923d0-4b2e-4897-858c-0c9c1cda3e7e a0de1930-6090-49a5-8c5f-731d5361bdea -->
# Plan de Corrección Final y Verificación

Hemos completado la mayoría de las tareas, pero detectamos un error crítico en el nuevo Wizard.

## I. Tareas Pendientes (Lo que falta)

### 1. Corrección Visualización Wizard (B-5) [PENDIENTE]

- **Problema:** El usuario reporta que "no genera nada" al usar el Wizard. Los logs muestran que la IA responde, pero la UI de resultados está oculta porque está anidada dentro de la sección 'SOP'.
- **Acción:** Mover el bloque de `Detected Steps` en `DescribePage` para que sea visible independientemente del método de entrada (SOP o Wizard).
- **Archivo:** `src/app/processes/[id]/describe/page.tsx`.

## II. Tareas Completadas (Lo que ya hicimos)

- **B-1:** Carga de archivos y UI Wizard implementada.
- **B-2 y B-3:** Ajustes de escalado (contenedores más anchos) y legibilidad de texto.
- **B-4:** Persistencia de roles y corrección de `useEffect`.
- **UX-1:** Feedback visual (loading states).
- **UX-2:** Flujo visual mejorado (secuencial).
- **UX-3 y UX-4:** Navegación y edición de sugerencias.
- **Solución 8:** Resumen narrativo.

## III. Respuesta a dudas

- **Botón "Generar mi flujo" (Build):** Este botón **guarda** el diseño del proceso en la base de datos para que puedas editarlo en el siguiente paso (Flujo). No inicia la ejecución del trabajo por parte de las personas todavía; es solo la fase de **diseño**.

---
Voy a proceder a corregir el problema del Wizard inmediatamente.

### To-dos

- [ ] Fix B-2 & B-3: Add viewport meta and fix global CSS text color
- [ ] Fix B-4: Implement role matching and persistence in DescribePage
- [ ] Fix UX-2: Refactor VisualFlowMap for sequential alignment
- [ ] Fix UX-3: Update process list navigation for 'listo' status
- [ ] Fix UX-4: Make AI suggestions editable and improve prompts
- [ ] Add Value: Add summary description in Step 5
- [ ] Fix B-5: Move Wizard results outside of conditional rendering in DescribePage