import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Without Supabase keys the app runs in demo mode and keeps data in localStorage. */
export const isDemoMode = !url || !anonKey

export const supabase = isDemoMode ? null : createClient(url, anonKey)

export const DEMO_ACCOUNT = { email: 'demo@medimeet.app', password: 'medimeet123' }
