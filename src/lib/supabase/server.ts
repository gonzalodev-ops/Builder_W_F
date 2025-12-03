import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Cliente para Server Components
export const createSupabaseServerClient = () => {
  return createServerComponentClient({ cookies })
}

