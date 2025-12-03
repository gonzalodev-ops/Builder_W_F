# 🚀 Guía de Configuración - Chispas

## Paso 1: Configurar Supabase

### 1.1 Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Guarda:
   - URL del proyecto
   - Clave pública (anon key)
   - Clave de servicio (service_role key) - solo si es necesario

### 1.2 Ejecutar el schema

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase/schema.sql` de este proyecto
3. Copia todo el contenido y pégalo en el editor SQL de Supabase
4. Ejecuta el script (botón "Run")

Esto creará todas las tablas, índices, políticas de seguridad y funciones necesarias.

### 1.3 Opcional: Seed de roles predefinidos

Si quieres tener roles predefinidos para todas las empresas, ejecuta:

```sql
-- Crear una compañía de prueba
INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Demo Company');

-- Insertar roles predefinidos
INSERT INTO roles (company_id, name, is_predefined) VALUES
(NULL, 'Ventas', true),
(NULL, 'Coordinador', true),
(NULL, 'Coordinador RH', true),
(NULL, 'Facturación', true),
(NULL, 'Dirección', true),
(NULL, 'Recursos Humanos', true),
(NULL, 'Soporte', true),
(NULL, 'Administración', true),
(NULL, 'Contabilidad', true),
(NULL, 'Marketing', true),
(NULL, 'Operaciones', true),
(NULL, 'Legal', true),
(NULL, 'TI / Tecnología', true);
```

## Paso 2: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

2. Edita `.env.local` y completa con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-aqui
```

**⚠️ Importante**: 
- Las variables `NEXT_PUBLIC_*` son públicas (visibles en el cliente)
- `SUPABASE_SERVICE_ROLE_KEY` es privada (solo servidor)
- Nunca compartas la service_role_key públicamente

## Paso 3: Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Paso 4: Configurar Autenticación (Opcional para MVP)

Si quieres habilitar registro/login de usuarios:

1. En Supabase, ve a **Authentication** > **Providers**
2. Habilita **Email** como proveedor
3. Configura las URLs de callback si usas dominios personalizados

## Estructura de Prueba

Para probar la aplicación rápidamente:

1. Crea un usuario de prueba en Supabase (Authentication > Users)
2. Inserta una compañía de prueba:

```sql
INSERT INTO companies (name) VALUES ('Mi Empresa de Prueba');
```

3. Vincula el usuario a la compañía:

```sql
INSERT INTO user_profiles (id, company_id, full_name, email)
VALUES (
  'tu-user-id-de-supabase',
  'tu-company-id',
  'Tu Nombre',
  'tu@email.com'
);
```

## Solución de Problemas

### Error de conexión a Supabase

- Verifica que las variables de entorno estén correctas
- Asegúrate de que el proyecto de Supabase esté activo
- Revisa la consola del navegador para más detalles

### Error de permisos (403/RLS)

- Verifica que las políticas de RLS estén aplicadas
- Asegúrate de que el usuario esté vinculado a una compañía en `user_profiles`
- Revisa los logs de Supabase en la sección de Logs

### Warnings de npm

Los warnings sobre paquetes deprecados son normales y no afectan la funcionalidad. Supabase está migrando a `@supabase/ssr` pero `@supabase/auth-helpers-nextjs` aún funciona correctamente.

## Próximos Pasos

Una vez configurado, puedes:

1. ✅ Navegar a `/processes` para ver la lista de procesos
2. ✅ Crear un nuevo proceso con el botón "+ Nuevo Proceso"
3. ✅ Seguir el flujo de 5 etapas:
   - Describir → Flujo → Entregables → KPIs → Mejoras y Resumen

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Diseño de Chispas](docs/diseno_herramienta_workflows.md)

