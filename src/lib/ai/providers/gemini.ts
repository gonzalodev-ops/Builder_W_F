import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  AiProvider,
  AutomationSuggestionAI,
  DeliverableSuggestion,
  ImprovementSuggestionAI,
  KpiSuggestion,
  ParsedStep,
  ParseSopParams,
  SuggestDeliverablesParams,
  SuggestImprovementsParams,
  SuggestKpisParams,
} from '../types'

const MODEL_NAME = 'gemini-1.5-flash'

const SYSTEM_PROMPT = `
Eres un asistente especializado en DISEÑO DE PROCESOS DE NEGOCIO para la herramienta “Chispas”.

Chispas siempre sigue esta cadena:
“Proceso → Flujo → Entregables → KPIs → Mejoras → Automatización → Resumen”.

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
`.trim()

type UseCase =
  | 'parse_sop'
  | 'suggest_deliverables'
  | 'suggest_kpis'
  | 'suggest_improvements'

interface CallGeminiOptions<T> {
  useCase: UseCase
  userPrompt: string
  schemaName: string
}

async function callGemini<T>({ userPrompt }: CallGeminiOptions<T>): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const start = Date.now()

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'user', parts: [{ text: userPrompt }] },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const end = Date.now()

  const response = await result.response
  const text = response.text()

  // TODO: registrar en ai_usage_logs (en otra capa)
  const latencyMs = end - start
  void latencyMs

  return JSON.parse(text) as T
}

export class GeminiAiProvider implements AiProvider {
  async parseSopToSteps(params: ParseSopParams): Promise<ParsedStep[]> {
    const { sopText, processSummary } = params

    const processBlock = processSummary
      ? `
Contexto del proceso:
- Nombre: ${processSummary.name}
- Objetivo: ${processSummary.objective}
- Tipo: ${processSummary.type}
- Disparador: ${processSummary.trigger}
`.trim()
      : 'Contexto del proceso: (no disponible)'

    const prompt = `
Tarea: a partir de un procedimiento (SOP) en texto libre, genera la lista de pasos secuenciales del proceso.

${processBlock}

Reglas para los pasos:
- Como referencia, la mayoría de los procesos tendrá entre 3 y 30 pasos, PERO:
  - Si el proceso es realmente corto, puedes devolver menos de 3 pasos.
  - Si el proceso es complejo y necesita más de 30 pasos para ser claro, puedes devolver más.
- Cada paso debe describir UNA acción clara que alguien realiza.
- Usa verbos en infinitivo o forma impersonal.
- Ignora anécdotas o comentarios que no sean parte del flujo.
- Si dudas del responsable, usa un rol genérico aproximado (Ventas, Crédito, Operaciones, Facturación, Legal, RH, Soporte, Dirección). Si no tienes pista, deja role_hint en null.
- Usa “notes” solo para aclaraciones cortas que puedan ayudar a mejorar el proceso.

SOP del usuario:
"""
${sopText}
"""

Responde EXCLUSIVAMENTE en JSON con este formato EXACTO:
{
  "steps": [
    {
      "name": "Nombre corto y claro del paso",
      "role_hint": "Rol responsable sugerido o null",
      "notes": "Nota opcional o null"
    }
  ]
}
`.trim()

    const result = await callGemini<{ steps: ParsedStep[] }>({
      useCase: 'parse_sop',
      userPrompt: prompt,
      schemaName: 'ParseSopResponse',
    })

    return result.steps ?? []
  }

  async suggestDeliverables(
    params: SuggestDeliverablesParams,
  ): Promise<DeliverableSuggestion[]> {
    const prompt = `
Tarea: proponer ENTREGABLES para un proceso.

Definición:
- Un “entregable” es ALGO CONCRETO que se produce en un paso y que le sirve a otra persona o área.

Contexto del proceso:
${JSON.stringify(params.processSummary, null, 2)}

Pasos del proceso (en orden):
${JSON.stringify(params.steps, null, 2)}

Entregables ya definidos por el usuario:
${JSON.stringify(params.existingDeliverables, null, 2)}

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
`.trim()

    const result = await callGemini<{ suggestions: DeliverableSuggestion[] }>({
      useCase: 'suggest_deliverables',
      userPrompt: prompt,
      schemaName: 'SuggestDeliverablesResponse',
    })

    return result.suggestions ?? []
  }

  async suggestKpis(params: SuggestKpisParams): Promise<KpiSuggestion[]> {
    const prompt = `
Tarea: proponer entre 3 y 7 KPIs útiles para medir un PROCESO completo.

Contexto del proceso:
${JSON.stringify(params.processSummary, null, 2)}

Entregables clave del proceso:
${JSON.stringify(params.deliverables, null, 2)}

KPIs ya definidos por el usuario (evita duplicarlos):
${JSON.stringify(params.existingKpis, null, 2)}

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
`.trim()

    const result = await callGemini<{ suggestions: KpiSuggestion[] }>({
      useCase: 'suggest_kpis',
      userPrompt: prompt,
      schemaName: 'SuggestKpisResponse',
    })

    return result.suggestions ?? []
  }

  async suggestImprovementsAndAutomations(
    params: SuggestImprovementsParams,
  ): Promise<{
    improvements: ImprovementSuggestionAI[]
    automations: AutomationSuggestionAI[]
  }> {
    const prompt = `
Tarea: analizar un proceso y proponer:
1) POCAS oportunidades de MEJORA DEL PROCESO.
2) POCAS oportunidades de AUTOMATIZACIÓN.

Contexto del proceso:
${JSON.stringify(params.processSummary, null, 2)}

Pasos (en orden):
${JSON.stringify(params.steps, null, 2)}

Entregables:
${JSON.stringify(params.deliverables, null, 2)}

KPIs activos:
${JSON.stringify(params.kpis, null, 2)}

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
`.trim()

    const result = await callGemini<{
      improvements: ImprovementSuggestionAI[]
      automations: AutomationSuggestionAI[]
    }>({
      useCase: 'suggest_improvements',
      userPrompt: prompt,
      schemaName: 'SuggestImprovementsResponse',
    })

    return {
      improvements: result.improvements ?? [],
      automations: result.automations ?? [],
    }
  }
}


