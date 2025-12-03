## 1. Visión general

La herramienta está pensada para transformar cómo el equipo describe, entiende y mejora sus procesos, convirtiéndolos en un **flujo de trabajo accionable**, siguiendo siempre esta cadena:

> **Proceso → Flujo → Entregables → KPIs → Mejoras → Automatización → Resumen del flujo de trabajo (Workflow Package)**

### Objetivo principal

Permitir que cualquier persona (no experta en procesos) pueda:

1. **Describir** cómo trabaja hoy (texto, SOP o preguntas guiadas).
2. **Ver, ajustar y mejorar** un flujo visual simple (pasos + responsables).
3. **Hacer explícitos los entregables** hacia cliente y áreas internas.
4. **Definir pocos KPIs útiles** que midan el desempeño del flujo.
5. **Detectar oportunidades de mejora del proceso** (simplificaciones, faltantes, redundancias, cuellos de botella).
6. **Identificar oportunidades de automatización** a partir de los pasos.
7. **Generar un entregable claro**: el **Resumen del flujo de trabajo (Workflow Package)**.

La herramienta está optimizada para procesos de entre **3 y 30 pasos**.  
- Para menos de 3 pasos, se muestra una advertencia suave (“revisa si falta algo importante”), pero se permite continuar.  
- Para más de 30 pasos, el flujo sigue siendo lineal, con *scroll*, sin optimizaciones avanzadas en el MVP.

### Entregable clave: Workflow Package

El resultado concreto por proceso es un **Resumen del flujo de trabajo**, que se puede ver en pantalla y exportar (PDF), que incluye:

- Información básica del proceso (nombre, objetivo, tipo, disparador).
- Diagrama del flujo lineal.
- Lista de pasos con sus responsables.
- Entregables clave (sobre todo los que van al cliente).
- KPIs activos y sus metas.
- Oportunidades de mejora del proceso.
- Lista de pasos candidatos a automatización con su tipo sugerido.

Este documento es el que se comparte con socios, equipo y clientes y, a futuro, puede servir como base para integraciones y automatización.

---

## 2. Modelo conceptual (alto nivel)

Para alinear producto, diseño y desarrollo, se define el siguiente modelo conceptual:

- **Proceso**
  - Es la unidad principal de trabajo en la herramienta.
  - Tiene: nombre, objetivo, tipo, disparador, estado (`Borrador` / `Listo`), y un conjunto de pasos, entregables, KPIs y oportunidades de mejora/automatización.

- **Paso**
  - Representa una acción dentro del proceso.
  - Cada Proceso tiene muchos Pasos **ordenados**.
  - Cada Paso tiene:
    - Un **Rol responsable**.
    - 0 o más **Entregables**.
    - 0 o 1 **Tipo de automatización sugerida**.
    - Puede estar involucrado en una o más **oportunidades de mejora del proceso**.

- **Rol**
  - En el MVP, un Rol representa un **puesto o función**, no una persona concreta (ej. “Ventas”, “Coordinador RH”, “Facturación”).
  - El usuario puede:
    - Elegir roles desde un **catálogo simple de roles frecuentes**.
    - Crear roles nuevos a texto libre.
  - Opcionalmente, se puede mostrar un campo informativo tipo “Persona habitual” (ej. “Juan Pérez”), sin gestión de usuarios/permisos en esta versión.

- **Entregable**
  - Algo que se produce en uno o varios pasos.
  - Cada Entregable pertenece a un Paso e incluye: descripción, tipo (Documento / Archivo / Registro en sistema / Correo / Otro) y destinatario (Cliente / Interno / Archivo).

- **KPI**
  - Métrica que se usará para evaluar el Proceso.
  - En el MVP, los KPIs se definen **a nivel de Proceso**, no por persona ni por Rol.
  - Cada KPI tiene nombre, descripción, tipo, estado (activo/no activo) y una meta asociada.

- **Oportunidad de mejora del proceso**
  - Sugerencia de simplificación, corrección o reorganización del flujo.
  - Puede involucrar uno o varios Pasos (ej. pasos redundantes, cuellos de botella, faltantes típicos).

- **Oportunidad de automatización**
  - Sugerencia de automatizar un Paso o conjunto de Pasos.
  - Cada Paso puede tener 0 o 1 tipo de automatización sugerida.

---

## 3. Principios de diseño

1. **Simplicidad radical**  
   Pocas piezas, pocas decisiones por pantalla. Nada de notaciones complejas. La herramienta está hecha para personas que no saben de BPMN.

2. **Flujo guiado en 5 etapas**  
   La experiencia de uso es en sí misma un flujo de trabajo:
   1. Describir  
   2. Flujo  
   3. Entregables  
   4. KPIs  
   5. Mejoras, Automatización y Resumen

3. **Navegación flexible (no túnel rígido)**  
   Aunque la experiencia invita a avanzar paso a paso, el usuario puede **navegar libremente hacia adelante y hacia atrás** usando la barra de etapas.  
   Si al volver atrás modifica algo relevante (por ejemplo, la lista de pasos), la herramienta puede marcar ciertos elementos (entregables, KPIs, oportunidades) como **“pendientes de revisar”**, sin bloquear el trabajo.

4. **Un objetivo claro por etapa**  
   En cada etapa hay una frase visible del tipo: “Objetivo: ___” y una mini-checklist. El usuario siempre sabe qué está tratando de completar.

5. **Un solo CTA principal por pantalla**  
   Siempre hay un botón principal que representa el siguiente paso del flujo (ej. “Generar mi flujo”, “Continuar a entregables”, “Marcar flujo como listo”).

6. **Foco en el Workflow Package**  
   Todo lo que se hace en la herramienta alimenta al Workflow Package. Si una función no ayuda a hacer ese paquete más claro y útil, se considera fuera de alcance del MVP.

---

## 4. Flujo general de usuario (Core loop)

El recorrido estándar del usuario para un proceso es:

1. Crear proceso (nombre, objetivo, tipo, disparador).
2. **Etapa 1 – Describir**: capturar el proceso (preguntas guiadas o SOP) y obtener una lista de pasos.
3. **Etapa 2 – Flujo**: generar y aprobar el flujo visual (orden + responsables).
4. **Etapa 3 – Entregables**: definir qué se entrega, en qué pasos y a quién.
5. **Etapa 4 – KPIs**: activar pocos KPIs con metas claras.
6. **Etapa 5 – Mejoras, Automatización y Resumen**:
   - Ver oportunidades de **mejora del proceso**.
   - Ver oportunidades de **automatización**.
   - Cerrar el diseño generando el Workflow Package y marcando el flujo como `Listo`.

La interfaz refleja estas 5 etapas con una barra de progreso permanente:

> **1. Describir → 2. Flujo → 3. Entregables → 4. KPIs → 5. Mejoras, Automatización y Resumen**

El usuario puede:

- Avanzar siguiendo el flujo sugerido.
- Volver a etapas anteriores para ajustar, sin perder su trabajo (gracias al autosave).

---

## 5. Detalle funcional por etapa

En todas las etapas, cada decisión de diseño se evalúa en función de si mejora el **Workflow Package** final.  
Cada paso del usuario debe aportar claridad a la cadena:

> **Proceso → Flujo → Entregables → KPIs → Mejoras → Automatización → Resumen**

### 5.1. Etapa 1 – Describir el proceso

**Objetivo:** obtener una lista de pasos razonable de cómo se trabaja hoy.

Al crear un proceso, se capturan datos básicos:

- Nombre del proceso.
- Objetivo (1–2 líneas).
- Tipo de proceso (ej. Cliente, Interno, Fiscal, RH…).
- Disparador (qué evento lo inicia).

Luego, el usuario entra a la pantalla **“Describir”** y elige **un método de captura**:

- **Preguntas guiadas**  
  “Te hago preguntas y voy armando los pasos”.

- **Pegar procedimiento (SOP)**  
  “Pegas tu texto y yo detecto los pasos”.

> Regla de simplicidad: cada proceso usa **solo un método de captura**. Si se empieza por uno, el otro queda deshabilitado para ese proceso.

#### 5.1.1. Preguntas guiadas

Wizard simple con preguntas tipo:

- ¿Qué es lo primero que sucede?  
- ¿Quién lo hace?  
- ¿Qué sucede después?

Cada bloque de respuesta genera un paso preliminar con:

- Nombre del paso (a partir de la descripción).
- Rol responsable (si se indica).

El usuario puede editar/eliminar estos pasos antes de continuar.

#### 5.1.2. Pegar SOP / procedimiento

- Área de texto grande para pegar un procedimiento existente.
- Botón **“Detectar pasos”**.
- La herramienta devuelve una lista de pasos sugeridos:
  - Nombre del paso.
  - Rol sugerido (si se puede inferir).

El usuario edita y confirma esta lista.

Si no se detectan pasos, se muestra un mensaje del tipo:

> “No pude detectar pasos en tu texto. Revisa que sea un procedimiento (con acciones) y no solo una descripción general.”

#### 5.1.3. Checklist de la etapa 1

Visible en un panel lateral:

- [ ] Tengo al menos 3 pasos (o el mínimo que definamos).  
- [ ] La secuencia tiene sentido (no falta nada obvio).

Cuando se cumple lo mínimo, se habilita el botón principal:

> **“Se ve bien, generar mi flujo ▶”**

Al pulsar, la herramienta genera el flujo lineal y pasa a la Etapa 2.

---

### 5.2. Etapa 2 – Flujo

**Objetivo:** ordenar el proceso, dejar claros los responsables y preparar la base para mejoras, entregables y automatización.

Al entrar en esta etapa, el sistema convierte la lista de pasos en un diagrama lineal:

> Inicio → Paso 1 → Paso 2 → … → Paso n → Fin

#### 5.2.1. Layout

- **Barra superior** con las 5 etapas, resaltando “2. Flujo”.
- **Panel central**: diagrama lineal del proceso.
- **Panel izquierdo**: lista de pasos (#, nombre, rol).
- **Panel inferior o lateral derecho**: detalles del paso seleccionado (nombre, rol).

La herramienta está optimizada para procesos de 3 a 30 pasos; para más de 30 se utilizará *scroll* sin optimizaciones visuales avanzadas (MVP).

#### 5.2.2. Acciones permitidas (MVP)

- Reordenar pasos (*drag & drop* en la lista).
- Renombrar pasos (edición *inline*).
- Asignar o cambiar rol responsable (desplegable con:
  - catálogo de roles frecuentes,
  - opción de crear nuevo rol a texto libre).

Cuando se selecciona un paso:

- El paso se resalta en el diagrama.
- El resto se atenúa ligeramente para centrar la atención.
- En el panel de detalles solo se muestran:
  - Campo “Nombre del paso”.
  - Campo “Rol responsable”.

#### 5.2.3. Checklist de la etapa 2

- [ ] Todos los pasos tienen un nombre entendible.  
- [ ] El orden refleja cómo se trabaja en la realidad.  
- [ ] Cada paso tiene un responsable asignado.

Cuando la checklist se cumple, se muestra un estado tipo:

> ✅ Flujo listo

Y se habilita el botón principal:

> **“Continuar a entregables ▶”**

---

### 5.3. Etapa 3 – Entregables

**Objetivo:** hacer explícito qué produce el flujo y quién recibe qué.

La pantalla mantiene el diagrama arriba, pero abajo muestra la pestaña **“Entregables”**.

#### 5.3.1. Tabla de entregables

Cada renglón está asociado a un paso:

- Paso.  
- Entregable (texto).  
- Tipo (Documento / Archivo / Registro en sistema / Correo / Otro).  
- Destinatario (Cliente / Interno / Archivo).

Notas de UX:

- No todos los pasos necesitan un entregable.  
- Un mensaje guía aclara:  
  > “Define entregables solo en los pasos que realmente producen algo útil para el cliente o para otra área.”

Al seleccionar un paso en el diagrama, se resalta su fila en la tabla.

#### 5.3.2. Sugerencias de entregables

La herramienta analiza nombres de pasos. Si detecta verbos como “enviar”, “entregar”, “generar”, “emitir”, “presentar”, propone un entregable:

Ejemplo:

- Paso: “Enviar reporte mensual al cliente”.  
- Entregable sugerido: “Reporte mensual (PDF) para cliente”.

La sugerencia se muestra como tarjeta o bloque simple:

- Entregable sugerido.  
- Botones: **[Aceptar] [Editar y aceptar] [Ignorar]**.

Las sugerencias **no se aplican automáticamente**; el usuario siempre decide.

#### 5.3.3. Checklist de la etapa 3

- [ ] Los entregables al cliente están definidos.  
- [ ] Los entregables internos importantes están definidos.

En términos de lógica:

- “Entregables al cliente definidos” = existe al menos un entregable con destinatario Cliente.

Cuando la checklist se cumple, se habilita el botón principal:

> **“Continuar a KPIs ▶”**

---

### 5.4. Etapa 4 – KPIs

**Objetivo:** definir pocas métricas que se van a usar para evaluar el proceso.

La pantalla muestra el diagrama arriba (para contexto) y abajo la pestaña **“KPIs del proceso”**.

#### 5.4.1. Lista de KPIs sugeridos

La herramienta sugiere entre 3 y 7 KPIs basados en:

- Tipo de proceso.
- Entregables, especialmente los que van al cliente.
- Pasos que representen hitos (entrega, cierre, aprobación).

Ejemplos de KPIs sugeridos:

- Tiempo de ciclo (inicio → fin).  
- % de entregas a tiempo.  
- % de casos sin retrabajo.  
- Número de casos atendidos por periodo.

Cada KPI se muestra como tarjeta con:

- Nombre.  
- Descripción breve (lenguaje simple).  
- Tipo de métrica (texto o etiqueta).  
- Checkbox “Activar”.  
- Campo “Meta” (objetivo del KPI).

De nuevo, las sugerencias no se aplican automáticamente; cada KPI debe ser activado por el usuario.

#### 5.4.2. Checklist de la etapa 4

- [ ] Hay al menos 1 KPI activo.  
- [ ] Cada KPI activo tiene una meta definida.

Cuando se cumplen estas condiciones, se habilita el botón principal:

> **“Continuar a mejoras, automatización y resumen ▶”**

---

### 5.5. Etapa 5 – Mejoras, Automatización y Resumen

**Objetivo:** identificar oportunidades de **mejora del proceso** y de **automatización**, y cerrar el diseño del flujo.

La pantalla se divide en dos zonas principales (parte superior e inferior), manteniendo el Workflow Package como vista previa.

#### 5.5.1. Oportunidades de mejora del proceso

La herramienta analiza el flujo propuesto (pasos, roles, entregables, KPIs) y sugiere **mejoras estructurales**, por ejemplo:

- Posibles **pasos redundantes** (dos pasos muy similares con el mismo rol y entregable).
- **Faltantes típicos** según el tipo de proceso (ej. falta un paso de confirmación con el cliente).
- **Cuellos de botella potenciales** (muchos pasos concentrados en un mismo rol).
- Secuencias poco claras (ej. aprobaciones duplicadas, pasos en orden extraño).

Estas sugerencias se muestran en una lista simple:

- Tipo de mejora sugerida (simplificar, agregar, reordenar, clarificar rol).
- Paso(s) afectado(s).
- Descripción breve en lenguaje no técnico.
- Acciones: **[Aceptar] [Editar y aplicar] [Ignorar]**.

Aceptar una sugerencia puede disparar una acción guiada (p.ej. fusionar dos pasos o crear un nuevo paso intermedio).

#### 5.5.2. Oportunidades de automatización

En la parte superior (o en una pestaña junto a “Mejoras”) se muestra una tabla simple:

- Paso.  
- Tipo de automatización sugerida.

Los tipos de automatización sugerida pueden ser:

- Notificación / recordatorio.  
- Integración entre sistemas (copiar/cargar datos).  
- Generación de documento estándar.  
- Movimiento o archivo de documentos.  
- Formularios / captura de datos.

La detección se basa en el texto del paso (palabras clave y patrones típicos).  
En el MVP no se ejecutan automatizaciones; es una vista para tomar conciencia y priorizar.

#### 5.5.3. Resumen del flujo de trabajo (Workflow Package)

En la parte inferior se muestra la vista previa del **Resumen del flujo de trabajo** que luego se podrá exportar a PDF:

Secciones típicas:

1. **Información básica**  
   - Nombre, tipo, objetivo, disparador.

2. **Resumen del flujo**  
   - Diagrama mini o listado de pasos secuenciales.

3. **Pasos y responsables**  
   - Tabla con #, nombre del paso, rol.

4. **Entregables clave**  
   - Especialmente los dirigidos a cliente, con tipo y destinatario.

5. **KPIs del proceso**  
   - Lista de KPIs activos con su meta.

6. **Oportunidades de mejora del proceso**  
   - Lista de sugerencias aceptadas y su tipo.

7. **Oportunidades de automatización**  
   - Lista de pasos candidatos y tipo sugerido de automatización.

#### 5.5.4. Checklist final

- [ ] He revisado las oportunidades de **mejora del proceso**.  
- [ ] He revisado las oportunidades de automatización.  
- [ ] Estoy conforme con el resumen del flujo de trabajo.

Cuando se cumple, aparecen dos acciones claras:

- Botón principal: **“Marcar este flujo como listo”**  
  - Cambia el estado del proceso a `Listo`.  
  - En la lista de procesos aparece un indicador de que ese workflow está diseñado.

- Botón secundario: **“Exportar PDF”**  
  - Genera el Workflow Package como archivo descargable.

---

## 6. Wireframes conceptuales (alto nivel)

A continuación se describen los wireframes en texto para que diseño pueda convertirlos en pantallas visuales.

### 6.1. Lista de procesos

Pantalla simple de entrada:

- Tabla con:
  - Nombre del proceso.
  - Tipo.
  - Estado (Borrador/Listo).
  - Fecha de última edición.
- Botón **“+ Nuevo proceso”**.
- Campo de búsqueda y filtro por tipo.

Al hacer clic en un proceso se abre el editor en la etapa donde se quedó.

### 6.2. Crear proceso / Datos básicos

Formulario con campos:

- Nombre del proceso.
- Objetivo (texto corto, 1–2 líneas).
- Tipo (lista desplegable).
- Disparador (texto breve).

Botón principal: **“Continuar”** → lleva a la Etapa 1 – Describir.

### 6.3. Pantalla “Describir”

- Encabezado: “Paso 1 de 5: Describir – Objetivo: obtener una lista de pasos razonable”.
- Selector de método:
  - Preguntas guiadas.
  - Pegar SOP.
- Área central: *wizard* o *textarea* según método.
- Checklist lateral.
- Indicador de autosave (“Todos los cambios guardados”).
- Botón principal: **“Se ve bien, generar mi flujo ▶”** (solo activo cuando hay información suficiente).

### 6.4. Pantalla “Flujo”

- Encabezado: “Paso 2 de 5: Flujo – Objetivo: ordenar el proceso y definir responsables”.
- Diagrama en el centro, lista de pasos a la izquierda.
- Panel de detalle abajo o a la derecha (nombre + rol).
- Acciones: reordenar, renombrar, asignar rol.
- Checklist de esta etapa.
- Barra superior de etapas con posibilidad de volver a “Describir”.
- Botón principal: **“Continuar a entregables ▶”**.

### 6.5. Pantalla “Entregables”

- Encabezado: “Paso 3 de 5: Entregables – Objetivo: hacer visible qué se entrega y a quién”.
- Diagrama arriba.
- Tabla de entregables abajo.
- Bloque de sugerencias de entregables con opciones Aceptar / Editar y aceptar / Ignorar.
- Checklist de entregables.
- Botón principal: **“Continuar a KPIs ▶”**.

### 6.6. Pantalla “KPIs”

- Encabezado: “Paso 4 de 5: KPIs – Objetivo: definir pocas métricas que sí vas a usar”.
- Diagrama arriba.
- Lista de tarjetas de KPIs sugeridos abajo, con *check* y metas.
- Checklist de KPIs.
- Botón principal: **“Continuar a mejoras, automatización y resumen ▶”**.

### 6.7. Pantalla “Mejoras, automatización y resumen”

- Encabezado: “Paso 5 de 5: Mejoras, automatización y resumen – Objetivo: identificar mejoras y cerrar el diseño del flujo”.
- Parte superior:
  - Lista de oportunidades de **mejora del proceso**.
  - Tabla con oportunidades de **automatización**.
- Parte inferior:
  - Vista previa del Resumen del flujo de trabajo (Workflow Package).
- Checklist final.
- Botón principal: **“Marcar este flujo como listo”**.
- Botón secundario: **“Exportar PDF”**.

---

## 7. Estados del proceso y modelo de guardado

### 7.1. Estados del proceso

- **Borrador**  
  Cualquier proceso que aún no se haya marcado como listo. Puede estar incompleto en una o varias etapas.

- **Listo**  
  Cuando:
  - Se cumplen las condiciones mínimas de todas las etapas (checklists básicos).  
  - El usuario pulsa **“Marcar este flujo como listo”** en la Etapa 5.

En la lista de procesos se muestra el estado para distinguir procesos en diseño de procesos ya diseñados.

### 7.2. Modelo de guardado (autosave)

- La herramienta aplica **guardado automático (autosave)** en cada cambio relevante (pasos, roles, entregables, KPIs, etc.).
- El usuario no necesita pulsar un botón de “Guardar”.
- Se muestran indicadores suaves del tipo “Todos los cambios guardados”.
- El estado del proceso se mantiene en `Borrador` hasta que el usuario lo marca como `Listo`.

---

## 8. Lógica de sugerencias (MVP)

En el MVP, las sugerencias de pasos, entregables, KPIs, mejoras y automatización se basan en **reglas simples**, no en modelos de IA complejos.

- Uso de **palabras clave y patrones de texto**.
- Uso del **tipo de proceso** para priorizar ciertos KPIs o mejoras.

Ejemplos:

- Si un paso contiene verbos como “enviar”, “entregar”, “emitir”, se propondrá un entregable asociado.  
- Si un proceso es de tipo “Cliente”, se priorizan KPIs de tiempos de respuesta y cumplimiento de entregas.

Reglas importantes:

- La herramienta **no modifica el flujo por sí sola**.
- Ninguna sugerencia se aplica automáticamente:
  - Siempre se ofrece al usuario con opciones tipo **[Aceptar] [Editar y aceptar] [Ignorar]**.
  - Solo lo que el usuario acepta explícitamente entra al modelo del proceso.

En fases futuras, la lógica de sugerencias podrá aprender de las decisiones del usuario (qué acepta, qué edita, qué ignora), pero eso queda fuera del alcance del MVP.

---

## 9. Mensajes y estados vacíos (MVP)

- Los mensajes deben evitar lenguaje técnico o alarmista y ser **orientados a la acción**.

Ejemplos:

- SOP sin pasos detectados:  
  > “No pude detectar pasos en tu texto. Revisa que sea un procedimiento (con acciones) y no solo una descripción general.”  
- Sin sugerencias de automatización o KPIs:  
  > “Por ahora no encontré sugerencias automáticas. Puedes seguir avanzando y completar esta sección manualmente.”

En estados vacíos (sin entregables, sin KPIs, sin mejoras), se presentan:

- Mensajes cortos explicando el propósito de la sección.
- Ejemplos mínimos para inspirar al usuario.

---

## 10. Alcance MVP vs fases futuras

### 10.1. Alcance MVP (lo que sí se construye primero)

- Cadena completa: **Proceso → Flujo → Entregables → KPIs → Mejoras → Automatización → Resumen**.
- Un método de captura por proceso (preguntas guiadas o SOP).
- Flujo lineal (sin ramas ni pasos paralelos).
- Operaciones básicas sobre pasos: reordenar, renombrar, asignar rol (con catálogo de roles simples).
- Definición de entregables por paso con sugerencias simples.
- KPIs a nivel proceso con metas.
- Detección básica de:
  - Pasos automatizables (por texto).
  - Oportunidades de mejora (redundancias simples, cuellos de botella evidentes, faltantes típicos).
- Generación del Workflow Package en PDF.
- UX basada en las 5 etapas con objetivos, checklists y un CTA principal por etapa.
- Uso **individual** por proceso (sin colaboración en tiempo real).

### 10.2. Fases futuras (fuera del MVP)

- Flujo avanzado: dividir/combinar pasos, carriles por rol.
- Entregables avanzados: criterios de completitud, entregables críticos.
- KPIs por rol/persona para evaluación más fina.
- Automatización con impacto/dificultad y *quick wins* priorizados.
- Vista ejecutiva específica para socios (basada en el Workflow Package).
- Vistas agregadas por cliente, rol, empresa.
- Versionado avanzado y comentarios.
- Aprendizaje continuo de las acciones del usuario para mejorar las sugerencias.
- Integración del Workflow Package con herramientas de ejecución/automatización.

---

## 11. Consideraciones técnicas de alto nivel (para elección de stack)

Esta sección no define aún el *stack*, pero prepara el terreno indicando **requisitos técnicos clave** que influirán en la elección:

- **Aplicación web centrada en UX**  
  - Interfaz rica, con diagramas, *drag & drop*, formularios reactivos y autosave.  
  - Recomendable un framework SPA moderno (por ejemplo, React, Vue o similar) para ofrecer una experiencia fluida.

- **Persistencia y autosave**  
  - Necesario un backend con API (REST o GraphQL) que soporte:
    - Guardado frecuente de cambios (autosave).
    - Versionado básico de procesos (al menos histórico simple).
  - Base de datos relacional o de documentos (PostgreSQL / similar o NoSQL) capaz de modelar:
    - Procesos, Pasos, Roles, Entregables, KPIs, Sugerencias, etc.

- **Generación de PDF (Workflow Package)**  
  - Módulo de backend o servicio dedicado para:
    - Generar PDFs a partir de plantillas HTML + CSS o librerías específicas.
    - Incluir diagramas/representaciones visuales del flujo.

- **Módulo de sugerencias (reglas / IA ligera)**  
  - En el MVP, bastará con:
    - Un módulo de reglas en backend (palabras clave, patrones).
  - En el futuro, se puede considerar:
    - Modelos de lenguaje o servicios externos para sugerencias más inteligentes.

- **Seguridad y multiempresa (si aplica)**  
  - Definir desde el inicio si:
    - Habrá multi-*tenant* (varias empresas).
    - Habrá control de acceso por usuario a procesos.

- **Escalabilidad moderada**  
  - El volumen de datos por proceso es relativamente pequeño, pero:
    - Se debe diseñar el modelo para crecer en número de procesos y usuarios sin cambiar la arquitectura básica.

Este documento deja claro **qué debe hacer la herramienta y cómo debe comportarse**, de manera que el siguiente paso natural es evaluar alternativas de *stack* (frontend, backend, base de datos, servicios de PDF, posibles integraciones de IA) alineadas con estos requisitos.
