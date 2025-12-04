import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase con Service Role (solo usar en servidor)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase: any = null

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Faltan variables de entorno para logging de IA (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). El logging de IA estará deshabilitado.')
} else {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface LogAiUsageParams {
  provider: string
  model: string
  useCase: string
  processId?: string
  latencyMs: number
  inputTokens?: number // Aproximado si no lo da la API
  outputTokens?: number // Aproximado si no lo da la API
  success: boolean
  errorMessage?: string
}

export async function logAiUsage(params: LogAiUsageParams) {
  if (!supabase) return

  try {
    const { error } = await supabase
      .from('ai_usage_logs')
      .insert({
        provider: params.provider,
        model: params.model,
        use_case: params.useCase,
        process_id: params.processId || null,
        latency_ms: params.latencyMs,
        input_tokens: params.inputTokens || 0,
        output_tokens: params.outputTokens || 0,
        success: params.success,
        error_message: params.errorMessage || null,
      })

    if (error) {
      console.error('Error al registrar log de uso de IA:', error)
    }
  } catch (err) {
    console.error('Excepción al registrar log de uso de IA:', err)
  }
}

