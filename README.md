# ✨ Chispas - Herramienta de Workflows

Transforma tus procesos en flujos de trabajo accionables siguiendo la cadena:

> **Proceso → Flujo → Entregables → KPIs → Mejoras → Automatización → Workflow Package**

## 🎯 Objetivo

Permitir que cualquier persona (no experta en procesos) pueda:

1. **Describir** cómo trabaja hoy con IA que analiza SOPs automáticamente 🤖
2. **Ver, ajustar y mejorar** un flujo visual simple (pasos + responsables)
3. **Hacer explícitos los entregables** con sugerencias inteligentes de IA 🤖
4. **Definir pocos KPIs útiles** personalizados por IA según contexto 🤖
5. **Detectar oportunidades de mejora** del proceso con análisis de IA 🤖
6. **Identificar oportunidades de automatización** con IA avanzada 🤖
7. **Generar un entregable claro**: el **Workflow Package** en PDF

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **IA**: Google Gemini 1.5 Flash (via Supabase Edge Functions)
- **Drag & Drop**: @dnd-kit
- **PDF Export**: @react-pdf/renderer
- **Despliegue**: Vercel

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia `.env.local.example` a `.env.local`
3. Completa las variables de entorno con tus credenciales de Supabase
4. Ejecuta el schema en Supabase SQL Editor:

```bash
# Copia el contenido de supabase/schema.sql y ejecútalo en Supabase SQL Editor
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
WORKFLOWS/
├── docs/                           # Documentación de diseño
│   ├── diseno_herramienta_workflows.md
│   └── stack_nextjs_supabase.md
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx             # Layout principal
│   │   ├── page.tsx               # Página de inicio
│   │   └── processes/             # Rutas de procesos
│   │       ├── page.tsx           # Lista de procesos
│   │       ├── new/               # Crear proceso
│   │       └── [id]/              # Detalle de proceso
│   │           ├── describe/      # Etapa 1: Describir
│   │           ├── flow/          # Etapa 2: Flujo
│   │           ├── deliverables/  # Etapa 3: Entregables
│   │           ├── kpis/          # Etapa 4: KPIs
│   │           └── summary/       # Etapa 5: Mejoras y Resumen
│   ├── components/                # Componentes reutilizables
│   │   └── StageProgressBar.tsx  # Barra de progreso de etapas
│   └── lib/
│       ├── supabase/              # Configuración de Supabase
│       │   ├── client.ts          # Cliente para componentes
│       │   └── server.ts          # Cliente para servidor
│       └── domain/                # Lógica de negocio (futuro)
├── supabase/
│   └── schema.sql                 # Schema de base de datos
└── package.json
```

## 🎨 Flujo de Usuario (5 Etapas)

1. **Describir** → Capturar el proceso (preguntas guiadas o SOP)
2. **Flujo** → Generar y aprobar el flujo visual
3. **Entregables** → Definir qué se entrega y a quién
4. **KPIs** → Activar métricas con metas claras
5. **Mejoras y Resumen** → Ver oportunidades y generar Workflow Package

## 📦 Modelo de Datos

### Entidades Principales

- **Process**: Unidad principal de trabajo
- **Step**: Acciones dentro del proceso (ordenadas)
- **Role**: Responsables de los pasos
- **Deliverable**: Productos del proceso
- **KPI**: Métricas del proceso
- **Improvement Suggestion**: Oportunidades de mejora
- **Automation Suggestion**: Pasos automatizables

Ver `supabase/schema.sql` para el esquema completo.

## 🔐 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Multi-tenant por defecto (aislamiento por company_id)
- Políticas de acceso basadas en el usuario autenticado

## 🧩 Próximos Pasos

- [ ] Implementar autenticación con Supabase Auth
- [ ] Conectar formularios con base de datos
- [ ] Implementar detección de pasos desde SOP (IA/reglas)
- [ ] Crear editor visual de flujo
- [ ] Implementar sistema de sugerencias
- [ ] Generar PDF del Workflow Package

## 📄 Documentación

Para más detalles sobre el diseño y arquitectura, ver:

- [Diseño de la Herramienta](docs/diseno_herramienta_workflows.md)
- [Stack Técnico](docs/stack_nextjs_supabase.md)

## 📝 Licencia

Proyecto privado - Todos los derechos reservados

