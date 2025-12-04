import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Instancia de Supabase Client para usar en cliente
// Nota: para logs en servidor, usar createClient de supabase-js con service key si es necesario,
// pero aquí asumimos que los eventos de app vienen del frontend.

export interface LogAppEventParams {
  eventType: string
  processId?: string
  metadata?: Record<string, any>
}

export async function logAppEvent(params: LogAppEventParams) {
  const supabase = createClientComponentClient()
  
  try {
    // Obtener usuario actual para vincular el evento
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      // Si no hay sesión, podríamos loguear anónimamente o abortar
      // Por ahora abortamos para no ensuciar
      return
    }

    // Intentar obtener company_id del perfil (opcional, si falla seguimos igual)
    // Hacemos una consulta rápida o asumimos que lo tenemos en el contexto si lo hubiéramos pasado
    // Para hacerlo robusto y rápido, idealmente el company_id debería venir de un Context o Hook,
    // pero aquí haremos un fetch rápido si no es demasiado costoso, o lo dejamos NULL si queremos optimizar.
    // Opcion optimizada: leer de la tabla user_profiles solo si es crítico.
    // Para MVP, intentamos leerlo.
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    const { error } = await supabase
      .from('app_usage_events')
      .insert({
        user_id: session.user.id,
        company_id: profile?.company_id || null,
        process_id: params.processId || null,
        event_type: params.eventType,
        metadata: params.metadata || {},
        source: 'web_app'
      })

    if (error) {
      console.error('Error logging app event:', error)
    }
  } catch (err) {
    console.error('Exception logging app event:', err)
  }
}

