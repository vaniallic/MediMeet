import { supabase } from '../supabase'
import { buildCatalog, friendlyError } from './catalog'

let catalogPromise = null

const must = ({ data, error }) => {
  if (error) {
    const e = new Error(friendlyError(error))
    e.code = error.code
    throw e
  }
  return data
}

async function uid() {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user?.id
  if (!id) throw new Error('Please log in again.')
  return id
}

async function getCatalog(force = false) {
  if (!catalogPromise || force) {
    catalogPromise = Promise.all([
      supabase.from('specialties').select('*').order('name'),
      supabase.from('hospitals').select('*').order('name'),
      supabase.from('doctors').select('*').order('rating', { ascending: false }),
    ])
      .then(([s, h, d]) => buildCatalog({ specialties: must(s), hospitals: must(h), doctors: must(d) }))
      .catch((e) => {
        catalogPromise = null
        throw e
      })
  }
  return catalogPromise
}

async function enrichAppointments(rows) {
  const cat = await getCatalog()
  return rows.map(({ reviews, ...a }) => ({
    ...a,
    doctor: cat.doctorById[a.doctor_id],
    review: Array.isArray(reviews) ? reviews[0] ?? null : reviews ?? null,
  }))
}

async function enrichPrescriptions(rows) {
  const cat = await getCatalog()
  return rows.map((p) => ({ ...p, doctor: cat.doctorById[p.doctor_id] }))
}

export const supabaseApi = {
  mode: 'supabase',

  // ---- auth -------------------------------------------------------------
  async getUser() {
    const { data } = await supabase.auth.getSession()
    return data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null
  },
  onAuthChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      cb(session?.user ? { id: session.user.id, email: session.user.email } : null, event)
    })
    return () => data.subscription.unsubscribe()
  },
  async signIn(email, password) {
    must(await supabase.auth.signInWithPassword({ email, password }))
  },
  async signUp({ email, password, fullName, phone }) {
    const data = must(
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone }, emailRedirectTo: `${location.origin}/home` },
      }),
    )
    return { needsConfirmation: !data.session }
  },
  async signInWithProvider(provider) {
    must(await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/home` } }))
  },
  async sendPasswordReset(email) {
    must(await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` }))
  },
  async updatePassword(password) {
    must(await supabase.auth.updateUser({ password }))
  },
  async signOut() {
    await supabase.auth.signOut()
  },

  // ---- profile ----------------------------------------------------------
  async getProfile() {
    const id = await uid()
    const { data: session } = await supabase.auth.getSession()
    const row = must(await supabase.from('profiles').select('*').eq('id', id).maybeSingle())
    return { ...(row ?? { id, full_name: '' }), email: session.session.user.email }
  },
  async updateProfile(patch) {
    const id = await uid()
    const { full_name, phone, birth_date, notifications } = patch
    return must(
      await supabase
        .from('profiles')
        .update({ full_name, phone, birth_date: birth_date || null, notifications })
        .eq('id', id)
        .select()
        .single(),
    )
  },

  // ---- catalog ----------------------------------------------------------
  getCatalog,
  async bookedSlots(doctorId, date) {
    const rows = must(await supabase.rpc('booked_slots', { p_doctor: doctorId, p_date: date }))
    return (rows ?? []).map((r) => (typeof r === 'string' ? r : r.booked_slots ?? Object.values(r)[0]))
  },

  // ---- appointments -----------------------------------------------------
  async createAppointment({ doctorId, date, time }) {
    const user_id = await uid()
    const row = must(
      await supabase.from('appointments').insert({ user_id, doctor_id: doctorId, date, time }).select().single(),
    )
    return (await enrichAppointments([row]))[0]
  },
  async listAppointments() {
    const rows = must(
      await supabase
        .from('appointments')
        .select('*, reviews(rating, comment)')
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .order('time', { ascending: true }),
    )
    return enrichAppointments(rows)
  },
  async getAppointment(id) {
    const row = must(await supabase.from('appointments').select('*, reviews(rating, comment)').eq('id', id).maybeSingle())
    if (!row) throw new Error('Appointment not found')
    return (await enrichAppointments([row]))[0]
  },
  async payAppointment(id, { method, insurance }) {
    must(await supabase.rpc('pay_appointment', { p_id: id, p_method: method, p_insurance: insurance || null }))
    return this.getAppointment(id)
  },
  async cancelAppointment(id) {
    must(await supabase.rpc('cancel_appointment', { p_id: id }))
  },
  async finishVisit(id) {
    must(await supabase.rpc('finish_visit', { p_id: id }))
  },
  async submitReview(appointment, { rating, comment }) {
    const user_id = await uid()
    must(
      await supabase
        .from('reviews')
        .insert({ appointment_id: appointment.id, user_id, doctor_id: appointment.doctor_id, rating, comment }),
    )
    await getCatalog(true)
  },

  // ---- pharmacy ---------------------------------------------------------
  async listPrescriptions() {
    const rows = must(await supabase.from('prescriptions').select('*').order('created_at', { ascending: false }))
    return enrichPrescriptions(rows)
  },
  async payPrescription(id, method) {
    must(await supabase.rpc('pay_prescription', { p_id: id, p_method: method }))
  },
  async changePickup(id, place) {
    must(
      await supabase.rpc('change_pickup', {
        p_id: id,
        p_name: place.name,
        p_address: place.address,
        p_lat: place.lat,
        p_lng: place.lng,
      }),
    )
  },

  async exportData() {
    const [profile, appointments, prescriptions] = await Promise.all([
      this.getProfile(),
      this.listAppointments(),
      this.listPrescriptions(),
    ])
    return { profile, appointments, prescriptions }
  },
}
