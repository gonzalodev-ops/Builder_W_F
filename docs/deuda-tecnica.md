# Deuda Técnica - Workflows Builder

## Propósito

Este documento registra **deuda técnica** del proyecto: ideas, mejoras y soluciones a problemas que, aunque valiosas, decidimos aplazar para enfocarnos en prioridades más inmediatas.

### ¿Qué incluir aquí?

- Funcionalidades propuestas que aportan valor pero están fuera del alcance actual.
- Refactorizaciones o mejoras técnicas que optimizarían el sistema pero no bloquean el desarrollo.
- Problemas conocidos de UX o performance que no son críticos en este momento.
- Ideas de IA, analítica o infraestructura que merecen exploración posterior.

### ¿Cómo usar este documento?

1. **Añadir nueva deuda**: Cuando surja una idea buena pero fuera de alcance, añade una fila a la tabla de backlog con un ID único (ej. `TD-003`), título descriptivo, área, impacto estimado y notas relevantes.

2. **Priorizar items**: Cuando decidas trabajar en un item, cambia su `Estado` a `planificado` y, si es necesario, crea un plan detallado (`.plan.md`) vinculado desde la columna `Notas`.

3. **Marcar como completado**: Al resolver un item, actualiza el `Estado` a `hecho` y añade referencia al PR/commit correspondiente.

---

## Backlog de Deuda Técnica

| ID | Título | Área | Estado | Impacto | Esfuerzo | Notas |
|----|--------|------|--------|---------|----------|-------|
| TD-001 | Dashboard / Landing inicial | UX / Producto | propuesto | alto | L | Crear una página de inicio que actúe como hub central con: (1) métricas globales (procesos activos, borradores vs listos), (2) acciones rápidas (nuevo proceso, ver todos), (3) actividad reciente (últimos procesos modificados), (4) estado de uso de IA. Mejora onboarding y navegación. |
| TD-002 | Autoguardado consistente en pasos del flujo | UX / Datos | propuesto | medio-alto | L | Diseñar e implementar autoguardado formal que persista cambios mientras el usuario navega entre pasos sin acción explícita. Requiere: (1) definir modelo de "borrador" vs "definitivo", (2) lógica de debounce/onBlur, (3) manejo de errores de red, (4) indicadores visuales de "guardando..."/"guardado". Reduce riesgo de pérdida de datos pero aumenta complejidad y llamadas a BD. |

---

## Detalles Expandidos

### TD-001: Dashboard / Landing Inicial

**Contexto:**  
Actualmente, el usuario entra directamente a `/processes` o debe navegar manualmente. Un dashboard centralizado ofrecería:
- Visión general del estado de sus procesos.
- Accesos directos a las funciones más usadas.
- Métricas de valor generado por la IA (refuerzo positivo).

**Componentes clave:**
1. **Tarjetas de métricas**: Total procesos, borradores vs listos, roles definidos.
2. **Acciones rápidas**: Botón prominente "Nuevo Proceso".
3. **Actividad reciente**: Últimos 3-5 procesos editados con enlace directo.
4. **Widget de IA**: Estadísticas de sugerencias aceptadas/rechazadas.

**Por qué se aplaza:**  
No es bloqueante para el flujo core de creación de procesos. Primero necesitamos asegurar que el flujo principal sea sólido.

**Próximos pasos cuando se priorice:**
- Diseñar wireframes del dashboard.
- Implementar queries para métricas (contar procesos, actividad reciente).
- Crear componente `DashboardPage` en `/app/dashboard/page.tsx`.

---

### TD-002: Autoguardado Consistente

**Contexto:**  
Actualmente, el modelo es "guardar al hacer clic en acción importante" (crear paso, aceptar KPI, etc.). Si el usuario está escribiendo en un campo de texto y navega con el botón "Volver a procesos", puede perder esos cambios.

**Problema:**  
Baja probabilidad de pérdida de datos en práctica (la mayoría de acciones persisten inmediatamente), pero la *percepción* de riesgo puede generar desconfianza.

**Solución propuesta:**
1. Identificar campos de texto largos susceptibles de pérdida (nombre de proceso, descripción de pasos, etc.).
2. Implementar autoguardado con `debounce` (ej. 2 segundos después de dejar de escribir) o `onBlur`.
3. Mostrar indicador visual de estado ("guardando...", "guardado ✓").
4. Manejar conflictos y errores de red (reintento, fallback).

**Trade-offs:**
- **Pros**: Mejora confianza del usuario, reduce fricción.
- **Contras**: Aumenta llamadas a BD, mayor complejidad en el frontend, riesgo de estados inconsistentes.

**Por qué se aplaza:**  
Requiere diseño cuidadoso del modelo de datos (borrador vs definitivo) y testing exhaustivo de edge cases (red lenta, navegación rápida, etc.). No bloquea el MVP.

**Próximos pasos cuando se priorice:**
- Definir qué campos se autoguardan y cuáles requieren confirmación explícita.
- Implementar hook de autoguardado reutilizable (`useAutosave`).
- Añadir columnas de "borrador" en tablas relevantes (si es necesario).
- Probar exhaustivamente en condiciones adversas.

---

## Historial de Cambios

- **2025-12-04**: Documento creado. Se añaden items iniciales TD-001 (Dashboard) y TD-002 (Autoguardado).


