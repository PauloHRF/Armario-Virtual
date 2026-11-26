import { AuthClient } from '@supabase/auth-js'

export const url = import.meta.env.VITE_SUPABASE_URL?.trim()
export const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const cliente = url?.startsWith('https://') && chave?.startsWith('sb_publishable_')
  ? new AuthClient({
      url: url.replace(/\/$/, '') + '/auth/v1',
      headers: { apikey: chave },
      storageKey: 'armario-auth-' + new URL(url).hostname,
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    })
  : null
