import { createClient } from '@supabase/supabase-js'

// FALLBACKS DE PRODUCCIÓN: 
// Se usan si Vercel falla en inyectar las variables durante el build (común en ciertos flujos)
const PRODUCTION_FALLBACK_URL = 'https://ztwtkwvgxavwwyvdzibz.supabase.co'
const PRODUCTION_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0d3Rrd3ZneGF2d3d5dmR6aWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjQ5ODIsImV4cCI6MjA3NDE0MDk4Mn0.-UJ-Ns_Y1Wcnx6oCOay5SfNdh9Z5hiy3WrTMbgtUaNw'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.NODE_ENV === 'production' ? PRODUCTION_FALLBACK_URL : '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (process.env.NODE_ENV === 'production' ? PRODUCTION_FALLBACK_KEY : '')

// Log status on module load in client-side production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const usingFallback = !process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log('[Supabase Init]', {
        status: usingFallback ? 'Using Hardcoded Fallback' : 'Using Environment Variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
    })
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const SUPABASE_BUCKET = 'ecommerce-imagenes'
