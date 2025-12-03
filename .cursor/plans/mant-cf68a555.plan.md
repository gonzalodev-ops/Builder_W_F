<!-- cf68a555-7143-46f9-a771-55370f70f5a3 a5fe3a0b-f80f-4294-a4b0-b9e9ebb8a966 -->
# Plan para convertir el flujo final en una “gema visual” con animaciones

## Objetivo

Diseñar una experiencia muy visual y fluida a lo largo de todos los pasos (1–5), culminando en un **mapa visual del flujo de trabajo** que deje claro, en una sola vista, cómo se mueve el proceso entre responsables y tiempos/SLA, y que invite a replantear mejoras.

## Alcance por zona de la app

### 1. Micro‑interacciones globales (pasos 1–4)

- **Transiciones entre pasos del wizard** (`DescribePage`, `FlowPage`, `DeliverablesPage`, `KPIsPage`, `SummaryPage`):
- Envolver el contenido principal de cada página en un contenedor con animaciones de entrada/salida suaves (fade + slide).
- Animar la `StageProgressBar` para que el avance no sea brusco (por ejemplo, transición de ancho/posición).
- **Acciones con IA y guardado**:
- Estandarizar estados `loading` en todos los botones (IA, guardar, etc.) con el mismo patrón: escala ligera al click, spinner animado y cambio de texto ("Analizando...", "Guardando...").
- **Listas dinámicas (pasos, entregables, KPIs)**:
- Añadir animaciones sutiles de aparición/desaparición en los items cuando se agregan, reordenan (drag & drop) o se eliminan.

### 2. Mapa visual del flujo en el Paso 5 (`SummaryPage`)

- **Vista principal tipo swimlane + tiempo**:
- Construir un componente `VisualFlowMap` que reciba: pasos (con posición y rol), roles, entregables clave y KPIs relevantes.
- Estructura base:
- Carriles horizontales por **rol**.
- Dentro de cada carril, tarjetas de paso colocadas en orden, conectadas por líneas/flechas.
- Colores consistentes por rol (mismos usados en Paso 2).
- **Capa de tiempos/SLA**:
- Definir un modelo mínimo de duración/SLA por paso (aunque al inicio sea estimado o textual).
- Mostrar en cada tarjeta un chip de tiempo/meta y, a nivel global, un pequeño resumen del tiempo total y puntos críticos.
- **Overlay de mejoras y automatización**:
- Integrar las sugerencias de `improvements` y `automations` como badges/íconos sobre los pasos correspondientes.
- Al hacer clic en un badge, mostrar un panel lateral o tooltip con el detalle y, a futuro, atajos de edición ("Ir a flujo", "Ajustar paso").

### 3. Animaciones específicas del mapa (“efecto joya”)

- **Carga inicial del mapa**:
- Animación escalonada: primero aparecen los carriles, luego las tarjetas de pasos, luego la línea principal de flujo se "dibuja" de izquierda a derecha.
- **Hover e interacción**:
- Hover sobre un paso: resaltar tarjeta, intensificar color, mostrar más claramente su SLA y rol.
- Hover sobre un rol: enfocar su carril y atenuar los demás.
- Animar la aparición de los badges de mejora/automatización con un ligero "pop".

## Fases de implementación

1. **Fase 1 – Micro‑interacciones base**

- Definir un pequeño módulo de animaciones (clases reutilizables o componentes wrapper) y aplicarlo a:
- Transición de páginas del wizard.
- Botones con IA/guardado.
- Aparición/desaparición de items en listas.

2. **Fase 2 – Prototipo de mapa visual en `SummaryPage`**

- Implementar `VisualFlowMap` en modo de solo lectura, usando datos reales de `steps`, `roles`, `deliverables` y `kpis`.
- Mostrar carriles por rol, pasos conectados y chips de SLA (aunque las duraciones iniciales sean simples).
- Añadir animaciones de entrada del mapa.

3. **Fase 3 – Enriquecer con mejoras IA y usabilidad**

- Superponer badges de mejoras/automatización sobre los pasos correspondientes.
- Añadir interacciones (hover, click) para explorar las sugerencias sin salir del resumen.
- (Opcional futuro) Añadir atajos directos a edición del flujo desde el mapa.

## Todos propuestos

- `animaciones-globales-wizard`: Estandarizar micro‑interacciones (transiciones, botones, listas) en los pasos 1–4.
- `componente-visual-flow-map`: Diseñar e implementar el componente principal del mapa del flujo en `SummaryPage`.
- `integrar-sla-tiempo-en-mapa`: Definir y mostrar tiempos/SLA por paso dentro del mapa.
- `overlay-mejoras-automatizacion`: Superponer y animar badges de mejoras y automatizaciones sobre el mapa.
- `refinar-ux-mapa`: Ajustar detalles de interacción (hover, focos por rol, tiempos de animación) tras las primeras pruebas con usuarios.