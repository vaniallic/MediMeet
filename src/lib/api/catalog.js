/** Joins the raw catalog tables into the shape the UI uses. */
export function buildCatalog({ specialties, hospitals, doctors }) {
  const hospitalById = Object.fromEntries(hospitals.map((h) => [h.id, h]))
  const specialtyBySlug = Object.fromEntries(specialties.map((s) => [s.slug, s]))
  const docs = doctors.map((d) => ({
    ...d,
    rating: Number(d.rating),
    photo: d.photo || '/img/doctors/default.png',
    hospital: hospitalById[d.hospital_id],
    specialtyName: specialtyBySlug[d.specialty]?.name ?? d.specialty,
  }))
  return {
    specialties,
    hospitals,
    doctors: docs,
    doctorById: Object.fromEntries(docs.map((d) => [d.id, d])),
    hospitalById,
    specialtyBySlug,
  }
}

export const friendlyError = (err) => {
  const msg = err?.message || String(err)
  if (err?.code === '23505' || /appointments_slot_unique|duplicate key/i.test(msg))
    return 'Sorry, someone just booked this time. Please pick another slot.'
  if (/Invalid login credentials/i.test(msg)) return 'Email or password is incorrect.'
  if (/User already registered/i.test(msg)) return 'An account with this email already exists. Try logging in.'
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Can’t reach the server. Check your connection and try again.'
  return msg
}
