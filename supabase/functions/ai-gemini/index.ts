import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MODEL_NAME = "gemini-2.0-flash";

const SYSTEM_PROMPT = `
Eres un asistente especializado en DISEÑO DE PROCESOS DE NEGOCIO para la herramienta "Chispas".

Chispas siempre sigue esta cadena:
"Proceso → Flujo → Entregables → KPIs → Mejoras → Automatización → Resumen".

Tu trabajo es:
- Entender descripciones de procesos en lenguaje natural (a veces desordenadas o informales).
- Transformarlas en estructuras MUY claras y accionables (JSON).
- Proponer mejoras simples y realistas, sin rediseñar todo el proceso.
- Escribir SIEMPRE en español neutro, claro y corto.

REGLAS IMPORTANTES:
- Responde SIEMPRE EXCLUSIVAMENTE en JSON válido, sin texto adicional.
- Si te falta información, devuelve valores nulos o listas vacías, no inventes datos.
- No cambies el sentido del proceso del usuario; solo organiza, resume y sugieres.
- Cada sugerencia debe ser comprensible para alguien sin formación técnica en procesos.

Nunca expliques tu razonamiento. Solo devuelve el JSON en el formato solicitado en el mensaje del usuario.
`.trim();

type UseCase =
  | "parse_sop"
  | "suggest_deliverables"
  | "suggest_kpis"
  | "suggest_improvements";

interface RequestBody {
  use_case: UseCase;
  payload: any;
}

async function callGemini(userPrompt: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          { text: SYSTEM_PROMPT }
        ]
      },
      contents: [
        {
          parts: [
            { text: userPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        responseMimeType: "application/json",
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini API Error] Status: ${response.status}`, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  return JSON.parse(text);
}

async function handleParseSop(payload: any): Promise<Response> {
  const { sopText, processSummary } = payload;

  if (!sopText || typeof sopText !== "string") {
    return json({ error: "sopText es requerido" }, 400);
  }

  const processBlock = processSummary
    ? `
Contexto del proceso:
- Nombre: ${processSummary.name}
- Objetivo: ${processSummary.objective}
- Tipo: ${processSummary.type}
- Disparador: ${processSummary.trigger}
`.trim()
    : "Contexto del proceso: (no disponible)";

  const prompt = `
Tarea: analizar un texto que describe un proceso de negocio y extraer SOLO las acciones reales del proceso.

CRÍTICO - EL TEXTO PUEDE SER MUY INFORMAL:
- IGNORA completamente: anécdotas personales, quejas, comentarios emocionales, muletillas, expresiones coloquiales
- EXTRAE solo: las acciones concretas del proceso de negocio
- CONVIERTE: lenguaje informal → descripción profesional y clara
- INFIERE roles: usa el contexto del proceso (tipo, objetivo) y el tipo de acción para asignar un rol responsable

Ejemplos de transformación:
❌ "En fin" → NO ES UN PASO
❌ "Ahí siempre me tardo porque" → NO ES UN PASO
✅ "subo el archivo, disperso la lana" → PASO: "Subir archivo al sistema" (rol: Operaciones), PASO: "Dispersar pago" (rol: Finanzas)
✅ "valido la información" → PASO: "Validar información recibida" (rol: Coordinador)
✅ "timbro los recibos ante el SAT" → PASO: "Timbrar recibos fiscales en SAT" (rol: Contabilidad)
✅ "se los mando por correo a la gente" → PASO: "Enviar documentos por correo electrónico" (rol: rol del paso anterior o Administración)

${processBlock}

SOP del usuario (PUEDE SER MUY INFORMAL - extrae solo acciones reales):
"""
${sopText}
"""

IMPORTANTE: 
- Devuelve entre 3 y 15 pasos profesionales (no fragmentos literales)
- Cada paso debe ser una acción específica del negocio
- SIEMPRE infiere un rol_hint basado en el tipo de acción (nunca null)
- Si el rol no es obvio, usa: Coordinador, Operaciones, Administración, o el tipo de proceso

Responde EXCLUSIVAMENTE en JSON con este formato EXACTO:
{
  "steps": [
    {
      "name": "Acción profesional en infinitivo (ej: Recibir solicitud del cliente)",
      "role_hint": "Rol responsable inferido (nunca null, siempre asignar algo)",
      "notes": null
    }
  ]
}
`.trim();

  const result = await callGemini(prompt);
  return json(result, 200);
}

async function handleSuggestDeliverables(payload: any): Promise<Response> {
  const { processSummary, steps, existingDeliverables } = payload;

  const prompt = `
Tarea: proponer ENTREGABLES para un proceso.

Contexto del proceso:
${JSON.stringify(processSummary, null, 2)}

Pasos del proceso (en orden):
${JSON.stringify(steps, null, 2)}

Entregables ya definidos por el usuario:
${JSON.stringify(existingDeliverables, null, 2)}

Reglas para tus sugerencias:
- Como referencia, propondrás normalmente entre 3 y 10 entregables nuevos en total.
- NO repitas entregables que ya existen.
- Prioriza:
  - Lo que recibe el CLIENTE.
  - Lo que necesitan otras áreas para seguir trabajando.
  - Lo que conviene archivar como evidencia.
- Usa tipos: documento, archivo, registro, correo, otro.
- Usa destinatarios: cliente, interno, archivo.

Formato de respuesta:
{
  "suggestions": [
    {
      "step_id": "uuid de un paso existente",
      "name": "Nombre claro del entregable",
      "type": "documento|archivo|registro|correo|otro",
      "recipient": "cliente|interno|archivo",
      "reason": "Motivo de la sugerencia, en 1–2 frases"
    }
  ]
}
`.trim();

  const result = await callGemini(prompt);
  return json(result, 200);
}

async function handleSuggestKpis(payload: any): Promise<Response> {
  const { processSummary, deliverables, existingKpis } = payload;

  const prompt = `
Tarea: proponer entre 3 y 7 KPIs útiles para medir un PROCESO completo.

Contexto del proceso:
${JSON.stringify(processSummary, null, 2)}

Entregables clave del proceso:
${JSON.stringify(deliverables, null, 2)}

KPIs ya definidos por el usuario (evita duplicarlos):
${JSON.stringify(existingKpis, null, 2)}

Guía por tipo de proceso (solo referencia):
- cliente: tiempos de respuesta, tiempos de ciclo, satisfacción, cumplimiento de entregas.
- interno / operativo: tiempos de procesamiento, % de cumplimiento, retrabajo, volumen de casos.
- fiscal / financiero: % de cumplimiento en tiempo, errores/multas evitadas, montos procesados.
- rh: tiempos de onboarding, retención, satisfacción del empleado.

Formato de respuesta:
{
  "suggestions": [
    {
      "name": "Nombre del KPI",
      "description": "Descripción breve",
      "metric_type": "tiempo|porcentaje|cantidad|otro",
      "example_target": "Ejemplo de meta"
    }
  ]
}
`.trim();

  const result = await callGemini(prompt);
  return json(result, 200);
}

async function handleSuggestImprovements(payload: any): Promise<Response> {
  const { processSummary, steps, deliverables, kpis } = payload;

  const prompt = `
Tarea: analizar un proceso y proponer:
1) POCAS oportunidades de MEJORA DEL PROCESO.
2) POCAS oportunidades de AUTOMATIZACIÓN.

Contexto del proceso:
${JSON.stringify(processSummary, null, 2)}

Pasos (en orden):
${JSON.stringify(steps, null, 2)}

Entregables:
${JSON.stringify(deliverables, null, 2)}

KPIs activos:
${JSON.stringify(kpis, null, 2)}

Formato de respuesta:
{
  "improvements": [
    {
      "type": "simplificar|agregar|reordenar|clarificar",
      "description": "Descripción breve",
      "affected_step_ids": ["uuid"]
    }
  ],
  "automations": [
    {
      "step_id": "uuid",
      "automation_type": "notificacion|integracion|documento|archivo|formulario",
      "description": "Descripción breve"
    }
  ]
}
`.trim();

  const result = await callGemini(prompt);
  return json(result, 200);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Método no permitido" }, 405);
    }

    const body = (await req.json()) as RequestBody;

    switch (body.use_case) {
      case "parse_sop":
        return await handleParseSop(body.payload);
      case "suggest_deliverables":
        return await handleSuggestDeliverables(body.payload);
      case "suggest_kpis":
        return await handleSuggestKpis(body.payload);
      case "suggest_improvements":
        return await handleSuggestImprovements(body.payload);
      default:
        return json({ error: "use_case inválido" }, 400);
    }
  } catch (err) {
    console.error("[ai-gemini] error", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return json({ 
      error: "Error interno en ai-gemini", 
      details: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    }, 500);
  }
});
