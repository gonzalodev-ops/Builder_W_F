# 🚀 Inicio Rápido - Chispas

## ✅ Estado Actual

**TODO LISTO PARA EMPEZAR** 🎉

- ✅ Proyecto Next.js configurado
- ✅ Base de datos Supabase completamente configurada
- ✅ Estructura de carpetas creada
- ✅ Rutas de las 5 etapas implementadas
- ✅ Componentes UI base creados
- ✅ Schema de base de datos aplicado
- ✅ Datos iniciales insertados

## 📝 Último Paso: Variables de Entorno

**1. Crea el archivo `.env.local` en la raíz del proyecto:**

```bash
# Copia este contenido exacto:
NEXT_PUBLIC_SUPABASE_URL=https://dlgjqrluazetxgvzxyle.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZ2pxcmx1YXpldHhndnp4eWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTUxMzYsImV4cCI6MjA4MDI3MTEzNn0.rxgFuL2SIooJ_gCwtG6JDKvLfuFF2GG88x4Hy120SHA
```

## 🏃 Ejecutar la Aplicación

```bash
# Instalar dependencias (si aún no lo hiciste)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🎯 Qué Puedes Hacer Ahora

### 1. Ver la aplicación
- `/` - Página de inicio
- `/processes` - Lista de procesos (vacía por ahora)
- `/processes/new` - Crear nuevo proceso

### 2. Crear tu primer proceso
1. Ve a `/processes/new`
2. Completa el formulario
3. Sigue las 5 etapas:
   - **Describir** → Captura los pasos
   - **Flujo** → Visualiza y ordena
   - **Entregables** → Define qué se produce
   - **KPIs** → Establece métricas
   - **Mejoras y Resumen** → Optimiza y exporta

### 3. Probar con usuario real (opcional)

**Crear usuario en Supabase:**
1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard/project/dlgjqrluazetxgvzxyle)
2. Authentication > Users > "Add user"
3. Crea un usuario con email/password

**Vincular a la compañía demo:**
```sql
-- En Supabase SQL Editor, reemplaza USER_ID con el ID real
INSERT INTO user_profiles (id, company_id, full_name, email)
VALUES (
  'USER_ID_AQUI',
  '00000000-0000-0000-0000-000000000001',
  'Tu Nombre',
  'tu@email.com'
);
```

## 📦 Lo Que Ya Está Listo

### Frontend
- ✅ Next.js 14 con App Router
- ✅ Tailwind CSS configurado
- ✅ Rutas de las 5 etapas
- ✅ Barra de progreso de etapas
- ✅ Formularios básicos

### Backend
- ✅ 9 tablas en Supabase
- ✅ RLS habilitado y configurado
- ✅ 13 roles predefinidos
- ✅ 1 compañía demo

### Por Implementar (MVP)
- ⏳ Conexión real con Supabase (formularios)
- ⏳ Autenticación de usuarios
- ⏳ Editor visual de flujo
- ⏳ Sistema de sugerencias (IA/reglas)
- ⏳ Exportación a PDF

## 🐛 Solución de Problemas

### "Cannot connect to Supabase"
→ Verifica que `.env.local` existe y tiene las credenciales correctas

### "Unauthorized" o errores 403
→ Necesitas crear un usuario y vincularlo a la compañía demo

### El proyecto no compila
```bash
# Limpia e instala de nuevo
rm -rf .next node_modules
npm install
npm run dev
```

## 📚 Documentación

- [README.md](README.md) - Documentación general
- [SETUP.md](SETUP.md) - Guía de configuración detallada
- [SUPABASE_CREDENTIALS.md](SUPABASE_CREDENTIALS.md) - Credenciales y estado de DB
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Resumen de implementación

---

**¡Listo! Ya puedes empezar a desarrollar Chispas!** ✨

