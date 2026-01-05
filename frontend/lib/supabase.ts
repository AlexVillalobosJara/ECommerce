import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Log status on module load in client-side production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.log('[Supabase Init Check]', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'N/A'
    })
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const SUPABASE_BUCKET = 'ecommerce-imagenes'
