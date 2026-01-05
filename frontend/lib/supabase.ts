import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Diagnostic log for production troubleshooting
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️ Supabase config missing in client bundle. url:', !!supabaseUrl, 'key:', !!supabaseAnonKey)
    }
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const SUPABASE_BUCKET = 'ecommerce-imagenes'
