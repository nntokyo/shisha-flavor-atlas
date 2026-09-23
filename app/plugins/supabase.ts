import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabaseKey

  if (!url || !key) {
    throw new Error('Supabase public environment variables are not configured')
  }

  return {
    provide: {
      supabase: createClient(url, key)
    }
  }
})
