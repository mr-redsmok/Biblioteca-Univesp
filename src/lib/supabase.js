import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  return Boolean(url && anon)
}

if (!isSupabaseConfigured()) {
  console.warn('[supabase] SEM CONFIG: crie .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e reinicie o dev. App segue só no localStorage.')
}

export const supabase = isSupabaseConfigured() ? createClient(url, anon) : null
