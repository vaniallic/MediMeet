// Demo backend: same interface as supabaseApi, stored in this browser's localStorage.
// Used when no Supabase keys are configured, so the app can be tried without a server.
import * as data from '../../data/catalog'
import { addDays, todayISO, isSlotPast, fromISODate } from '../format'
import { buildCatalog } from './catalog'
import { DEMO_ACCOUNT } from '../supabase'

const KEY = 'medimeet-demo-v1'
const HOLD_MINUTES = 15
const listeners = new Set()
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms))
const uuid = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16))

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable */
  }
  return { users: [], session: null, appointments: [], reviews: [], prescriptions: [], ratings: {} }
}
let db = load()
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}

const currentUser = () => db.users.find((u) => u.id === db.session) ?? null
const requireUser = () => {
  const u = currentUser()
  if (!u) throw new Error('Please log in again.')
  return u
}
const emit = () => {
  const u = currentUser()
  listeners.forEach((cb) => cb(u ? { id: u.id, email: u.email } : null))
}

function catalog() {
  const doctors = data.doctors.map((d) => ({ ...d, ...(db.ratings[d.id] ?? {}) }))
  return buildCatalog({ specialties: data.specialties, hospitals: data.hospitals, doctors })
}

function makePrescription(appt, paid) {
  const doc = data.doctors.find((d) => d.id === appt.doctor_id)
  const hospital = data.hospitals.find((h) => h.id === doc.hospital_id)
  const items = data.prescriptionTemplates[doc.specialty] ?? data.prescriptionTemplates.default
  const created = fromISODate(appt.date)
  const [hh, mm] = appt.time.split(':').map(Number)
  created.setHours(hh, mm + 45)
  db.prescriptions.push({
    id: uuid(),
    user_id: appt.user_id,
    appointment_id: appt.id,
    doctor_id: doc.id,
    items,
    total: items.reduce((s, i) => s + i.qty * i.price, 0),
    status: paid ? 'paid' : 'unpaid',
    payment_method: paid ? 'QRIS' : null,
    paid_at: paid ? created.toISOString() : null,
    pickup_name: `${hospital.name} Pharmacy`,
    pickup_address: hospital.address,
    pickup_lat: hospital.lat,
    pickup_lng: hospital.lng,
    created_at: created.toISOString(),
  })
}

function newAppointment(user_id, doctor_id, date, time, status = 'pending_payment') {
  const doc = data.doctors.find((d) => d.id === doctor_id)
  return {
    id: uuid(),
    user_id,
    doctor_id,
    date,
    time,
    status,
    fee: doc.fee,
    admin_fee: data.ADMIN_FEE,
    insurance_provider: null,
    insurance_covered: 0,
    total: doc.fee + data.ADMIN_FEE,
    payment_method: null,
    paid_at: null,
    queue_no: null,
    created_at: new Date().toISOString(),
  }
}

function createUser({ email, password, fullName, phone }) {
  const user = {
    id: uuid(),
    email: email.toLowerCase(),
    password,
    profile: { full_name: fullName, phone: phone || '', birth_date: null, notifications: true },
  }
  db.users.push(user)
  // Same starter history the Supabase trigger creates.
  const a1 = { ...newAppointment(user.id, data.doctors[0].id, addDays(todayISO(), -5), '09:00', 'completed'), payment_method: 'QRIS', queue_no: 3 }
  const a2 = { ...newAppointment(user.id, data.doctors[3].id, addDays(todayISO(), -40), '10:00', 'completed'), payment_method: 'GoPay', queue_no: 1 }
  a1.paid_at = new Date(Date.now() - 6 * 86400000).toISOString()
  a2.paid_at = new Date(Date.now() - 41 * 86400000).toISOString()
  db.appointments.push(a1, a2)
  makePrescription(a1, false)
  makePrescription(a2, true)
  return user
}

const isActiveHold = (a) =>
  a.status === 'confirmed' ||
  (a.status === 'pending_payment' && Date.now() - new Date(a.created_at).getTime() < HOLD_MINUTES * 60000)

const enrichAppt = (a) => {
  const cat = catalog()
  const r = db.reviews.find((x) => x.appointment_id === a.id)
  return { ...a, doctor: cat.doctorById[a.doctor_id], review: r ? { rating: r.rating, comment: r.comment } : null }
}

const ownAppt = (id) => {
  const u = requireUser()
  const a = db.appointments.find((x) => x.id === id && x.user_id === u.id)
  if (!a) throw new Error('Appointment not found')
  return a
}

const METHODS = ['QRIS', 'GoPay', 'Virtual Account', 'Card']

export const localApi = {
  mode: 'demo',

  async getUser() {
    const u = currentUser()
    return u ? { id: u.id, email: u.email } : null
  },
  onAuthChange(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  async signIn(email, password) {
    await wait()
    let u = db.users.find((x) => x.email === email.toLowerCase())
    if (!u && email.toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      u = createUser({ ...DEMO_ACCOUNT, fullName: 'Kimberly Smith', phone: '081234567890' })
    }
    if (!u || u.password !== password) throw new Error('Email or password is incorrect.')
    db.session = u.id
    save()
    emit()
  },
  async signUp({ email, password, fullName, phone }) {
    await wait()
    if (db.users.some((x) => x.email === email.toLowerCase()))
      throw new Error('An account with this email already exists. Try logging in.')
    const u = createUser({ email, password, fullName, phone })
    db.session = u.id
    save()
    emit()
    return { needsConfirmation: false }
  },
  async signInWithProvider(provider) {
    const name = provider[0].toUpperCase() + provider.slice(1)
    throw new Error(`${name} sign-in needs the Supabase backend. In demo mode, use email and password.`)
  },
  async sendPasswordReset() {
    await wait()
    throw new Error('Password reset emails need the Supabase backend. In demo mode, just create a new account.')
  },
  async updatePassword(password) {
    await wait()
    requireUser().password = password
    save()
  },
  async signOut() {
    db.session = null
    save()
    emit()
  },

  async getProfile() {
    await wait(120)
    const u = requireUser()
    return { id: u.id, email: u.email, ...u.profile }
  },
  async updateProfile(patch) {
    await wait()
    const u = requireUser()
    u.profile = { ...u.profile, ...patch }
    save()
    return u.profile
  },

  async getCatalog() {
    await wait(120)
    return catalog()
  },
  async bookedSlots(doctorId, date) {
    await wait(150)
    return db.appointments.filter((a) => a.doctor_id === doctorId && a.date === date && isActiveHold(a)).map((a) => a.time)
  },

  async createAppointment({ doctorId, date, time }) {
    await wait()
    const u = requireUser()
    const doc = data.doctors.find((d) => d.id === doctorId)
    if (!doc) throw new Error('Doctor not found')
    if (date < todayISO()) throw new Error('Please choose a date from today onwards')
    if (!doc.days.includes(fromISODate(date).getDay())) throw new Error('The doctor does not practise on this day')
    if (!doc.slots.includes(time)) throw new Error("This time is not in the doctor's schedule")
    if (isSlotPast(date, time)) throw new Error('This time has already passed')
    db.appointments.forEach((a) => {
      if (a.doctor_id === doctorId && a.date === date && a.time === time && a.status === 'pending_payment' && !isActiveHold(a))
        a.status = 'cancelled'
    })
    if (db.appointments.some((a) => a.doctor_id === doctorId && a.date === date && a.time === time && isActiveHold(a)))
      throw new Error('Sorry, someone just booked this time. Please pick another slot.')
    const a = newAppointment(u.id, doctorId, date, time)
    db.appointments.push(a)
    save()
    return enrichAppt(a)
  },
  async listAppointments() {
    await wait(150)
    const u = requireUser()
    return db.appointments
      .filter((a) => a.user_id === u.id && a.status !== 'cancelled')
      .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))
      .map(enrichAppt)
  },
  async getAppointment(id) {
    await wait(120)
    return enrichAppt(ownAppt(id))
  },
  async payAppointment(id, { method, insurance }) {
    await wait(500)
    const a = ownAppt(id)
    if (a.status === 'cancelled') throw new Error('This booking expired. Please choose the time again.')
    if (a.status !== 'pending_payment') throw new Error('This appointment is already paid')
    if (!METHODS.includes(method)) throw new Error('Unknown payment method')
    const covered = insurance?.trim() ? Math.floor(a.fee * data.INSURANCE_COVERAGE) : 0
    Object.assign(a, {
      status: 'confirmed',
      payment_method: method,
      paid_at: new Date().toISOString(),
      insurance_provider: insurance?.trim() || null,
      insurance_covered: covered,
      total: a.fee + a.admin_fee - covered,
      queue_no:
        db.appointments.filter(
          (x) => x.doctor_id === a.doctor_id && x.date === a.date && ['confirmed', 'completed'].includes(x.status),
        ).length + 1,
    })
    save()
    return enrichAppt(a)
  },
  async cancelAppointment(id) {
    await wait()
    const a = ownAppt(id)
    if (!['pending_payment', 'confirmed'].includes(a.status)) throw new Error("This appointment can't be cancelled")
    a.status = 'cancelled'
    save()
  },
  async finishVisit(id) {
    await wait()
    const a = ownAppt(id)
    if (a.status !== 'confirmed') throw new Error('Only confirmed appointments can be finished')
    a.status = 'completed'
    makePrescription(a, false)
    save()
  },
  async submitReview(appointment, { rating, comment }) {
    await wait()
    const u = requireUser()
    const a = ownAppt(appointment.id)
    if (a.status !== 'completed') throw new Error('You can review a doctor after your visit.')
    if (db.reviews.some((r) => r.appointment_id === a.id)) throw new Error('You already reviewed this visit.')
    db.reviews.push({ id: uuid(), appointment_id: a.id, user_id: u.id, doctor_id: a.doctor_id, rating, comment, created_at: new Date().toISOString() })
    const base = catalog().doctorById[a.doctor_id]
    const count = base.reviews_count + 1
    db.ratings[a.doctor_id] = {
      reviews_count: count,
      rating: Math.round(((base.rating * base.reviews_count + rating) / count) * 10) / 10,
    }
    save()
  },

  async listPrescriptions() {
    await wait(150)
    const u = requireUser()
    const cat = catalog()
    return db.prescriptions
      .filter((p) => p.user_id === u.id)
      .sort((x, y) => y.created_at.localeCompare(x.created_at))
      .map((p) => ({ ...p, doctor: cat.doctorById[p.doctor_id] }))
  },
  async payPrescription(id, method) {
    await wait(500)
    const u = requireUser()
    const p = db.prescriptions.find((x) => x.id === id && x.user_id === u.id && x.status === 'unpaid')
    if (!p) throw new Error('Prescription not found or already paid')
    Object.assign(p, { status: 'paid', payment_method: method, paid_at: new Date().toISOString() })
    save()
  },
  async changePickup(id, place) {
    await wait()
    const u = requireUser()
    const p = db.prescriptions.find((x) => x.id === id && x.user_id === u.id)
    if (!p) throw new Error('Prescription not found')
    Object.assign(p, { pickup_name: place.name, pickup_address: place.address, pickup_lat: place.lat, pickup_lng: place.lng })
    save()
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
