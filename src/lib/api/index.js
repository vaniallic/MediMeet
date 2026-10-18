import { isDemoMode } from '../supabase'
import { supabaseApi } from './supabaseApi'
import { localApi } from './localApi'

/** One interface, two backends: Supabase in production, localStorage in demo mode. */
export const api = isDemoMode ? localApi : supabaseApi
export { friendlyError } from './catalog'
