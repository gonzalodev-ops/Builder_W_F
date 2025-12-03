# 🚀 Configuración de Supabase Edge Functions - IA (estado actual y diseño histórico)

Las funciones de IA se ejecutan como **Supabase Edge Functions** para mayor seguridad y rendimiento.

> Nota: el frontend actual de Chispas usa **una sola Edge Function** llamada `ai-gemini` con distintos `use_case`.  
> El diseño que se describe más abajo con 4 functions (`parse-sop`, `suggest-deliverables`, etc.) corresponde a una **versión anterior** y se mantiene aquí como referencia histórica.

---

## 📦 Edge Function usada por el frontend actual

- **`ai-gemini`** – única Edge Function que recibe un `use_case` y delega en:
  - `parse_sop`
  - `suggest_deliverables`
  - `suggest_kpis`
  - `suggest_improvements`

Ejemplo de llamada desde el frontend:

```ts
const { data, error } = await supabase.functions.invoke('ai-gemini', {
  body: {
    use_case: 'parse_sop',
    payload: {
      sopText,
      processSummary: { name, objective, type, trigger }
    }
  }
})
```

Si prefieres seguir el diseño anterior de 4 functions separadas, puedes usar el resto de este documento como guía, pero tendrás que ajustar el frontend para llamar a cada function por separado.

---

## ⚙️ Configuración del Secret

### 1. Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crea una nueva API key
3. Cópiala (la necesitarás en el siguiente paso)

### 2. Configurar el Secret en Supabase

```bash
# Login a Supabase (si no lo has hecho)
npx supabase login

# Link tu proyecto
npx supabase link --project-ref dlgjqrluazetxgvzxyle

# Configurar el secret
npx supabase secrets set GEMINI_API_KEY=tu_api_key_aqui
```

O desde el Dashboard de Supabase:
1. Ve a tu proyecto en [app.supabase.com](https://app.supabase.com)
2. Settings → Edge Functions → Secrets
3. Agrega un nuevo secret:
   - Name: `GEMINI_API_KEY`
   - Value: tu API key de Gemini

---

## 🚀 Desplegar las Functions

```bash
# Desplegar todas las functions
npx supabase functions deploy parse-sop
npx supabase functions deploy suggest-deliverables
npx supabase functions deploy suggest-kpis
npx supabase functions deploy suggest-improvements
```

O desplegar todas a la vez:

```bash
npx supabase functions deploy
```

---

## 🧪 Probar las Functions Localmente

### 1. Iniciar Supabase local

```bash
npx supabase start
```

### 2. Configurar secret local

```bash
# Crear archivo .env en supabase/functions/
echo "GEMINI_API_KEY=tu_api_key_aqui" > supabase/.env
```

### 3. Servir una function

```bash
npx supabase functions serve parse-sop --env-file supabase/.env
```

### 4. Probar con curl

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/parse-sop' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "sopText": "Primero recibimos la solicitud. Luego validamos los datos. Finalmente enviamos confirmación al cliente.",
    "processSummary": {
      "name": "Proceso de prueba",
      "objective": "Probar el parser",
      "type": "cliente",
      "trigger": "Solicitud recibida"
    }
  }'
```

---

## 📍 URLs de las Functions Desplegadas

Una vez desplegadas, las functions estarán disponibles en:

```
https://dlgjqrluazetxgvzxyle.supabase.co/functions/v1/parse-sop
https://dlgjqrluazetxgvzxyle.supabase.co/functions/v1/suggest-deliverables
https://dlgjqrluazetxgvzxyle.supabase.co/functions/v1/suggest-kpis
https://dlgjqrluazetxgvzxyle.supabase.co/functions/v1/suggest-improvements
```

---

## 🔒 Seguridad

- ✅ La API key de Gemini está en los secrets de Supabase (no en el código)
- ✅ Las functions tienen CORS configurado
- ✅ Requieren autenticación con el anon key de Supabase
- ✅ Se ejecutan en el edge (latencia baja)

---

## 💡 Uso desde el Frontend

```typescript
import { supabase } from '@/lib/supabase/client'

// Ejemplo: Parse SOP
const { data, error } = await supabase.functions.invoke('parse-sop', {
  body: {
    sopText: 'Tu SOP aquí...',
    processSummary: {
      name: 'Mi proceso',
      objective: 'Objetivo',
      type: 'cliente',
      trigger: 'Evento'
    }
  }
})

if (error) {
  console.error('Error:', error)
} else {
  console.log('Pasos detectados:', data.steps)
}
```

---

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY no está configurada"

Solución: Asegúrate de haber configurado el secret correctamente:

```bash
npx supabase secrets set GEMINI_API_KEY=tu_api_key
```

### Error: "Function not found"

Solución: Despliega la function:

```bash
npx supabase functions deploy nombre-function
```

### Error de CORS

Las functions ya tienen CORS configurado. Si hay problemas, verifica que:
- Estés usando el anon key correcto
- Las headers incluyan `apikey` y `Authorization`

---

## 📊 Monitoring

Para ver logs de las functions:

```bash
# Logs en tiempo real
npx supabase functions logs parse-sop --tail

# Ver últimos logs
npx supabase functions logs parse-sop
```

O desde el Dashboard:
1. Edge Functions → nombre de la function → Logs

---

## 🎉 ¡Listo!

Una vez desplegadas las functions con el secret configurado:
1. El frontend llamará automáticamente a las Edge Functions
2. Gemini procesará las solicitudes
3. Los resultados se mostrarán en la UI

**No necesitas configurar nada más en variables de entorno locales** - todo está en Supabase.

