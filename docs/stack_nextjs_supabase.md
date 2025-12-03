## Plan de stack – Herramienta de Workflows (Next.js + Supabase)

### 1. Objetivo

Definir un stack tecnológico moderno, sencillo de mantener y adecuado para ofrecer la herramienta como **SaaS** en la nube, utilizando **Vercel** para el frontend y **Supabase** como backend de datos y autenticación, alineado con el diseño funcional descrito en `diseno_herramienta_workflows.md`.

---

## 2. Decisión de stack base

- **Lenguaje principal**: **TypeScript** (en todo el proyecto).

- **Frontend + lógica de servidor ligera**: **Next.js** desplegado en **Vercel**
  - Implementará las pantallas del flujo en 5 etapas, autosave, componentes de diagrama y formularios.
  - Usará **Server Components / Server Actions** o API Routes para la lógica que no conviene en el cliente.

- **Backend de datos y autenticación**: **Supabase**
  - **PostgreSQL gestionado** para tablas de:
    - `companies`, `users`
    - `processes`, `steps`, `roles`
    - `deliverables`, `kpis`
    - `improvement_suggestions`, `automation_suggestions`
  - **Supabase Auth** para:
    - Registro y login de usuarios.
    - Control básico de acceso a los datos de cada usuario/empresa.
  - Posible uso de **Row Level Security (RLS)** para aislar datos por empresa (multi-tenant) desde la base de datos.

- **ORM / acceso a datos**:
  - **MVP**: usar el **cliente oficial de Supabase** desde Next.js (sin Prisma) para reducir complejidad.
  - **Futuro**: valorar introducir **Prisma** si el modelo crece y se necesita más tipado/organización en la capa de datos.

- **Generación de PDF (Workflow Package)**:
  - Endpoint en Next.js (Server Action o API Route) que:
    - Obtiene los datos del proceso desde Supabase.
    - Renderiza una plantilla HTML del resumen del flujo.
    - Genera el PDF (por ejemplo con `@react-pdf/renderer` o con un servicio basado en Puppeteer).

- **Módulo de sugerencias (reglas / IA ligera)**:
  - Módulo de lógica en el lado servidor de Next.js (Server Actions / API Routes) que implementa reglas basadas en:
    - Texto de pasos, entregables y tipo de proceso.
  - Deja abierta la puerta a integrar APIs de IA más avanzadas en el futuro.

---

## 3. Arquitectura del repositorio

Dado que usaremos Next.js + Supabase, no es necesario un backend separado; basta con una **estructura simple** en el proyecto `WORKFLOWS`:

- En la raíz del repo:
  - `app/` → rutas y componentes de la app Next.js (flujo de 5 etapas, vistas de procesos, etc.).
  - `components/` → componentes UI reutilizables (diagramas, tablas, formularios, checklists).
  - `lib/supabase/` → inicialización del cliente de Supabase para cliente y servidor, helpers de auth.
  - `lib/domain/` → funciones de dominio (helpers para procesos, pasos, sugerencias, cálculos de KPIs, etc.).
  - `docs/` → documentación (incluyendo `diseno_herramienta_workflows.md` y este documento de stack).

- Scripts típicos de NPM:
  - `npm run dev` → arranca Next.js en local.
  - `npm run build` / `npm run start` → comandos para producción.

Más adelante, si aparecen más servicios (por ejemplo, un motor pesado de sugerencias separado), se puede plantear pasar a un monorepo; el MVP se mantiene con una sola app Next.js.

---

## 4. Infraestructura y despliegue (SaaS)

### 4.1. Desarrollo local

- Next.js corriendo en local.
- Supabase como servicio gestionado (proyecto en la nube) o Supabase local si se desea.
- Configuración mediante variables de entorno en el proyecto de Next.js:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Claves de servicio privadas solo en el lado servidor cuando hagan falta (sin exponerlas al cliente).

### 4.2. Producción

- **Frontend/Servidor Next.js** desplegado en Vercel.
- **Supabase** como backend (PostgreSQL + Auth + Storage) en la nube.
- Dominios:
  - `app.tu-dominio.com` para la aplicación.
  - Opcionalmente, un dominio separado o ruta para una landing pública.

### 4.3. Multiempresa (multi-tenant)

- Tabla `companies` en Supabase.
- Todas las entidades clave (`processes`, `steps`, etc.) referencian `company_id`.
- Los usuarios se vinculan a una compañía (por ahora, una principal por usuario) mediante:
  - Tabla de relación `user_companies` o campo `company_id` en el perfil de usuario.
- Uso de RLS para reforzar que cada usuario solo vea/edite datos de su empresa.

---

## 5. Mapeo de requerimientos → soluciones técnicas

- **Flujo guiado en 5 etapas + navegación flexible**:
  - Rutas de Next.js del tipo:
    - `/processes`
    - `/processes/[id]/describe`
    - `/processes/[id]/flow`
    - `/processes/[id]/deliverables`
    - `/processes/[id]/kpis`
    - `/processes/[id]/summary`
  - Componente de barra de etapas que se alimenta del estado del proceso (datos traídos de Supabase).

- **Modelo de datos (Supabase / PostgreSQL)**:
  - Tablas principales:
    - `companies`, `users`
    - `processes`, `steps`, `roles`
    - `deliverables`, `kpis`
    - `improvement_suggestions`, `automation_suggestions`
  - Uso de claves foráneas y restricciones para garantizar consistencia.

- **Autosave**:
  - En el frontend, hooks (ej. con *debounce*) que llaman a Server Actions o API Routes al cambiar campos clave.
  - En el servidor, funciones que actualizan registros en Supabase de manera incremental.

- **Sugerencias (entregables, KPIs, mejoras, automatización)**:
  - Servicio de dominio en `lib/domain/suggestions.ts` (por ejemplo) que recibe el proceso/pasos y devuelve listas de sugerencias.
  - Persistencia de sugerencias aceptadas en las tablas `improvement_suggestions` y `automation_suggestions`.

- **Workflow Package (PDF)**:
  - Ruta del tipo `/api/processes/[id]/workflow-package.pdf` o Server Action que:
    - Obtiene datos del proceso desde Supabase.
    - Renderiza una plantilla de resumen (HTML/React).
    - Devuelve un PDF descargable.

---

## 6. Próximos pasos de implementación

1. Crear el proyecto Next.js en el repo `WORKFLOWS` siguiendo la estructura descrita.
2. Crear el proyecto en Supabase y definir el esquema inicial de tablas según el modelo conceptual del documento funcional.
3. Configurar las variables de entorno en local y en Vercel para conectar con Supabase.
4. Implementar las primeras rutas/pantallas del flujo (lista de procesos y Etapa 1 – Describir) y su conexión con la base de datos.


