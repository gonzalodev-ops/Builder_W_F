# 🔐 Credenciales de Supabase - Configuración Completa

## ✅ Estado de la Base de Datos

**¡La base de datos está completamente configurada!** 🎉

- ✅ 9 tablas creadas
- ✅ RLS habilitado en todas las tablas
- ✅ Políticas de seguridad aplicadas
- ✅ Funciones y triggers configurados
- ✅ Índices creados
- ✅ 1 compañía demo creada
- ✅ 13 roles predefinidos insertados

## 📋 Datos Insertados

- **Compañías**: 1 (Demo Company)
- **Roles**: 13 (Ventas, Coordinador, Facturación, etc.)
- **Procesos**: 0 (listos para crear)

## 🔑 Configuración de Variables de Entorno

**Crea el archivo `.env.local` en la raíz del proyecto con este contenido:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dlgjqrluazetxgvzxyle.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZ2pxcmx1YXpldHhndnp4eWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTUxMzYsImV4cCI6MjA4MDI3MTEzNn0.rxgFuL2SIooJ_gCwtG6JDKvLfuFF2GG88x4Hy120SHA
```

**⚠️ Nota sobre SUPABASE_SERVICE_ROLE_KEY:**
- La service_role_key solo la necesitas si vas a hacer operaciones administrativas desde el servidor
- Por ahora, con las dos variables anteriores es suficiente para el MVP

## 🚀 Próximos Pasos

### 1. Crear el archivo .env.local

```bash
# En la raíz del proyecto, crea .env.local con el contenido de arriba
# O copia desde el ejemplo:
cp .env.local.example .env.local
# Y luego edita con las credenciales reales
```

### 2. Verificar la conexión

```bash
npm run dev
```

### 3. Crear tu primer usuario (opcional)

Puedes ir a tu proyecto de Supabase:
- Ve a **Authentication** > **Users**
- Click en "Add user"
- Email: tu@email.com
- Password: (elige uno seguro)

### 4. Vincular el usuario a la compañía demo

Una vez creado el usuario, ejecuta en Supabase SQL Editor:

```sql
-- Reemplaza 'TU_USER_ID' con el ID del usuario que acabas de crear
INSERT INTO user_profiles (id, company_id, full_name, email)
VALUES (
  'TU_USER_ID',
  '00000000-0000-0000-0000-000000000001',
  'Tu Nombre',
  'tu@email.com'
);
```

## 📊 Estructura de Tablas Creadas

1. **companies** - Empresas (multi-tenant)
2. **user_profiles** - Perfiles de usuario
3. **processes** - Procesos principales
4. **steps** - Pasos de cada proceso
5. **roles** - Catálogo de roles
6. **deliverables** - Entregables por paso
7. **kpis** - Métricas de proceso
8. **improvement_suggestions** - Mejoras sugeridas
9. **automation_suggestions** - Automatizaciones sugeridas

## 🛡️ Seguridad Configurada

- ✅ Row Level Security (RLS) habilitado
- ✅ Usuarios solo ven datos de su empresa
- ✅ Políticas de SELECT, INSERT, UPDATE, DELETE
- ✅ Multi-tenant seguro por defecto

## ✨ ¡Listo para Desarrollar!

Tu base de datos está **100% configurada y lista** para empezar a desarrollar Chispas.

**URLs Importantes:**
- **Proyecto**: https://dlgjqrluazetxgvzxyle.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/dlgjqrluazetxgvzxyle

