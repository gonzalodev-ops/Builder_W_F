import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Cliente para componentes del cliente
export const createSupabaseClient = () => {
  return createClientComponentClient()
}

// Cliente para uso general (con variables de entorno públicas)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

