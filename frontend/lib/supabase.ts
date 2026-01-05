import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// In Next.js, NEXT_PUBLIC_ variables are inlined at build time.
// If they are missing here, they were missing DURING THE BUILD on Vercel.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const SUPABASE_BUCKET = 'ecommerce-imagenes'
