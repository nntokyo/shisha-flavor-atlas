import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export function getServerSupabase(event: H3Event) {
  const config = useRuntimeConfig(event)
  const url = String(config.public.supabaseUrl || '')
  const key = String(config.public.supabaseKey || '')

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase public environment variables are not configured'
    })
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}
