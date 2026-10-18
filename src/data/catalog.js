// Catalog data shared by demo mode and the Supabase seed (scripts/gen-seed-sql.mjs).
// Hospitals and doctors are fictional. Hospitals in Indonesia don't publish a public
// booking API, so schedules and fees are simulated.

export const ADMIN_FEE = 5000
export const INSURANCE_COVERAGE = 0.8 // simulated: insurance covers 80% of the consultation fee

// Order and illustrations follow the "Choose Your Specialist" screen in Figma (public/img/spec/<slug>.png).
export const specialties = [
  { slug: 'general', name: 'General Practitioner', icon: 'stethoscope', blurb: 'Everyday illness, check-ups, referrals' },
  { slug: 'pediatrics', name: 'Pediatrician', icon: 'baby', blurb: 'Babies, children and teens' },
  { slug: 'internal', name: 'Internist', icon: 'activity', blurb: 'Adult internal organs and chronic illness' },
  { slug: 'obgyn', name: 'Obstetrician-Gynecologist', icon: 'heart', blurb: "Pregnancy and women's health" },
  { slug: 'surgery', name: 'General Surgeon', icon: 'scissors', blurb: 'Surgical consultations' },
  { slug: 'ent', name: 'ENT Specialist', icon: 'ear', blurb: 'Ear, nose and throat' },
  { slug: 'eye', name: 'Ophthalmologist', icon: 'eye', blurb: 'Eyes and vision' },
  { slug: 'dental', name: 'Dentist', icon: 'smile', blurb: 'Teeth and gums' },
  { slug: 'neuro', name: 'Neurologist', icon: 'brain', blurb: 'Brain, nerves, headaches and seizures' },
  { slug: 'cardio', name: 'Cardiologist', icon: 'heartPulse', blurb: 'Heart and blood vessels' },
  { slug: 'derm', name: 'Dermatologist', icon: 'sparkles', blurb: 'Skin, hair and nails' },
  { slug: 'pulmo', name: 'Pulmonologist', icon: 'activity', blurb: 'Lungs, asthma and breathing' },
  { slug: 'ortho', name: 'Orthodontist', icon: 'smile', blurb: 'Braces and teeth alignment' },
  { slug: 'psych', name: 'Psychiatrist', icon: 'brain', blurb: 'Mental health' },
  { slug: 'anesth', name: 'Anesthesiologist', icon: 'activity', blurb: 'Pain management and pre-surgery checks' },
  { slug: 'geri', name: 'Geriatrician', icon: 'heart', blurb: 'Care for older adults' },
  { slug: 'pathology', name: 'Clinical Pathologist', icon: 'activity', blurb: 'Lab tests and results' },
  { slug: 'radiology', name: 'Radiologist', icon: 'activity', blurb: 'X-ray, CT and ultrasound' },
  { slug: 'nutrition', name: 'Clinical Nutritionist', icon: 'heart', blurb: 'Diet plans and weight management' },
  { slug: 'allergy', name: 'Allergist / Immunologist', icon: 'sparkles', blurb: 'Allergies and immune system' },
]

export const specialtyImage = (slug) => `/img/spec/${slug}.png`

// Partner hospitals from the Figma prototype. Locations are real; doctors, schedules and fees are simulated.
export const hospitals = [
  {
    id: '11111111-0000-4000-8000-000000000001',
    name: 'Ciputra Hospital',
    address: 'Jl. Boulevard Raya No.1, Kalideres, West Jakarta 11830',
    lat: -6.1355,
    lng: 106.7189,
    phone: null,
    rating: 4.9,
    color: '#04677d',
    image: '/img/hospitals/ciputra.jpg',
  },
  {
    id: '11111111-0000-4000-8000-000000000002',
    name: 'Siloam Hospital',
    address: 'Jl. Kelapa Dua Raya No.1001, Kelapa Dua, Tangerang, Banten 15810',
    lat: -6.2297,
    lng: 106.602,
    phone: null,
    rating: 4.8,
    color: '#2f8a7e',
    image: '/img/hospitals/siloam.jpg',
  },
  {
    id: '11111111-0000-4000-8000-000000000003',
    name: 'Tzu Chi Hospital',
    address: 'Pantai Indah Kapuk Boulevard, Kamal Muara, Penjaringan, North Jakarta 14470',
    lat: -6.1097,
    lng: 106.7417,
    phone: null,
    rating: 4.9,
    color: '#3b7ea1',
    image: '/img/hospitals/tzuchi.jpg',
  },
]

const H = hospitals.map((h) => h.id)
const WEEKDAYS = [1, 2, 3, 4, 5]
const ALL_DAYS = [1, 2, 3, 4, 5, 6]
const MORNING = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00']
const AFTERNOON = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const FULL = [...MORNING, ...AFTERNOON]

const d = (n) => `22222222-0000-4000-8000-${String(n).padStart(12, '0')}`

export const doctors = [
  { id: d(1), photo: '/img/doctors/joko.png', portrait: '/img/doctors/joko-portrait.png', name: 'Dr. Joko Santoso', specialty: 'general', hospital_id: H[0], experience_years: 21, patients: 3500, rating: 5.0, reviews_count: 2600, fee: 200000, days: ALL_DAYS, slots: FULL, bio: 'Family doctor known for unhurried consultations and clear explanations. Handles general check-ups, fever, flu, and referrals to specialists.' },
  { id: d(2), photo: '/img/doctors/hengky.png', name: 'Dr. Hengky', specialty: 'general', hospital_id: H[0], experience_years: 12, patients: 2100, rating: 4.9, reviews_count: 980, fee: 150000, days: WEEKDAYS, slots: MORNING, bio: 'General practitioner focused on preventive care and lifestyle-related conditions.' },
  { id: d(3), name: 'Dr. Nadia Putri', specialty: 'general', hospital_id: H[2], experience_years: 6, patients: 900, rating: 4.8, reviews_count: 310, fee: 150000, days: ALL_DAYS, slots: AFTERNOON, bio: 'Friendly GP for students and young professionals. Evening slots available.' },
  { id: d(4), photo: '/img/doctors/felicia-a.png', name: 'Dr. Felicia, Sp.A', specialty: 'pediatrics', hospital_id: H[0], experience_years: 15, patients: 2800, rating: 5.0, reviews_count: 1500, fee: 350000, days: WEEKDAYS, slots: FULL, bio: 'Pediatrician covering growth and development, immunization schedules, and childhood illness.' },
  { id: d(5), name: 'Dr. Lukas Gunawan, Sp.A', specialty: 'pediatrics', hospital_id: H[2], experience_years: 9, patients: 1400, rating: 4.8, reviews_count: 620, fee: 300000, days: [2, 4, 6], slots: MORNING, bio: 'Pediatrician with a special interest in allergies and nutrition in children.' },
  { id: d(6), photo: '/img/doctors/setiawi.png', name: 'Dr. Setiawi, Sp.PD', specialty: 'internal', hospital_id: H[1], experience_years: 18, patients: 3100, rating: 4.9, reviews_count: 1200, fee: 400000, days: WEEKDAYS, slots: AFTERNOON, bio: 'Internist managing diabetes, hypertension, and digestive conditions.' },
  { id: d(7), photo: '/img/doctors/nay.png', name: 'Dr. Nay, Sp.OG', specialty: 'obgyn', hospital_id: H[0], experience_years: 14, patients: 2400, rating: 5.0, reviews_count: 1800, fee: 450000, days: [1, 3, 5], slots: FULL, bio: 'Obstetrician-gynecologist for pregnancy check-ups, ultrasound, and reproductive health.' },
  { id: d(8), photo: '/img/doctors/felicia-og.png', name: 'Dr. Felicia, Sp.OG', specialty: 'obgyn', hospital_id: H[2], experience_years: 8, patients: 1100, rating: 4.8, reviews_count: 540, fee: 400000, days: [2, 4, 6], slots: MORNING, bio: 'Gentle, thorough care for pregnancy and menstrual health.' },
  { id: d(9), name: 'Dr. Bima Prakoso, Sp.B', specialty: 'surgery', hospital_id: H[1], experience_years: 20, patients: 2700, rating: 4.9, reviews_count: 900, fee: 500000, days: WEEKDAYS, slots: MORNING, bio: 'General surgeon for pre- and post-operative consultations.' },
  { id: d(10), name: 'Dr. Rina Hartono, Sp.THT-KL', specialty: 'ent', hospital_id: H[2], experience_years: 11, patients: 1600, rating: 4.8, reviews_count: 700, fee: 350000, days: [1, 2, 4, 5], slots: AFTERNOON, bio: 'ENT specialist for sinusitis, hearing problems, and tonsillitis.' },
  { id: d(11), name: 'Dr. Andreas Tan, Sp.M', specialty: 'eye', hospital_id: H[1], experience_years: 16, patients: 2900, rating: 4.9, reviews_count: 1300, fee: 380000, days: WEEKDAYS, slots: FULL, bio: 'Ophthalmologist for vision tests, dry eyes, and cataract consultations.' },
  { id: d(12), name: 'drg. Maya Lestari', specialty: 'dental', hospital_id: H[2], experience_years: 7, patients: 1900, rating: 4.9, reviews_count: 860, fee: 250000, days: ALL_DAYS, slots: FULL, bio: 'Dentist for check-ups, scaling, fillings, and braces consultations.' },
  { id: d(13), name: 'Dr. Yohanes Purba, Sp.JP', specialty: 'cardio', hospital_id: H[1], experience_years: 22, patients: 3300, rating: 5.0, reviews_count: 1400, fee: 600000, days: [1, 3, 5], slots: MORNING, bio: 'Cardiologist for chest pain, palpitations, and heart check-ups.' },
  { id: d(14), name: 'Dr. Sari Dewi, Sp.DVE', specialty: 'derm', hospital_id: H[0], experience_years: 10, patients: 2000, rating: 4.8, reviews_count: 1100, fee: 350000, days: WEEKDAYS, slots: AFTERNOON, bio: 'Dermatologist for acne, eczema, and skin allergies.' },
  { id: d(15), name: 'Dr. Kevin Halim, Sp.KJ', specialty: 'psych', hospital_id: H[2], experience_years: 9, patients: 1200, rating: 4.9, reviews_count: 480, fee: 450000, days: [1, 2, 3, 4], slots: AFTERNOON, bio: 'Psychiatrist offering a calm, judgment-free space for anxiety, sleep, and mood concerns.' },
  { id: d(16), name: 'drg. Agus Salim, Sp.Ort', specialty: 'ortho', hospital_id: H[1], experience_years: 17, patients: 2500, rating: 4.8, reviews_count: 760, fee: 450000, days: [2, 4, 6], slots: MORNING, bio: 'Orthodontist for braces, aligners and bite problems in teens and adults.' },
  { id: d(17), name: 'Dr. Ratna Sari, Sp.N', specialty: 'neuro', hospital_id: H[0], experience_years: 13, patients: 1800, rating: 4.9, reviews_count: 690, fee: 450000, days: [1, 3, 5], slots: AFTERNOON, bio: 'Neurologist for migraines, dizziness, nerve pain and stroke follow-up.' },
  { id: d(18), name: 'Dr. Hendra Lim, Sp.P', specialty: 'pulmo', hospital_id: H[1], experience_years: 15, patients: 2200, rating: 4.8, reviews_count: 830, fee: 400000, days: WEEKDAYS, slots: MORNING, bio: 'Pulmonologist for asthma, long coughs and lung check-ups.' },
  { id: d(19), name: 'Dr. Wulan Pratiwi, Sp.An', specialty: 'anesth', hospital_id: H[2], experience_years: 10, patients: 1300, rating: 4.9, reviews_count: 410, fee: 350000, days: [2, 4], slots: MORNING, bio: 'Anesthesiologist for pre-surgery consultations and chronic pain management.' },
  { id: d(20), name: 'Dr. Bambang Susilo, Sp.PD-KGer', specialty: 'geri', hospital_id: H[0], experience_years: 24, patients: 3000, rating: 5.0, reviews_count: 1100, fee: 450000, days: [1, 2, 3, 4], slots: MORNING, bio: 'Geriatrician helping older adults manage several conditions and medicines at once.' },
  { id: d(21), name: 'Dr. Lina Kusuma, Sp.PK', specialty: 'pathology', hospital_id: H[1], experience_years: 11, patients: 1500, rating: 4.8, reviews_count: 380, fee: 250000, days: ALL_DAYS, slots: MORNING, bio: 'Clinical pathologist who explains your lab results in plain language.' },
  { id: d(22), name: 'Dr. Arif Rahman, Sp.Rad', specialty: 'radiology', hospital_id: H[1], experience_years: 14, patients: 2600, rating: 4.8, reviews_count: 520, fee: 300000, days: WEEKDAYS, slots: FULL, bio: 'Radiologist for X-ray, ultrasound and CT consultations.' },
  { id: d(23), name: 'Dr. Dewi Anggraini, Sp.GK', specialty: 'nutrition', hospital_id: H[2], experience_years: 8, patients: 1700, rating: 4.9, reviews_count: 740, fee: 300000, days: [1, 3, 5, 6], slots: AFTERNOON, bio: 'Clinical nutritionist for healthy weight, diabetes diets and sports nutrition.' },
  { id: d(25), photo: '/img/doctors/sri-dewi.png', name: 'Dr. Sri Dewi', specialty: 'general', hospital_id: H[0], experience_years: 26, patients: 4100, rating: 5.0, reviews_count: 1900, fee: 250000, days: [1, 2, 3, 4, 5], slots: AFTERNOON, bio: 'Senior family doctor with a calm, thorough style. Popular with older patients and families.' },
  { id: d(26), photo: '/img/doctors/prabo.png', name: 'Dr. Prabo', specialty: 'general', hospital_id: H[2], experience_years: 14, patients: 2300, rating: 4.9, reviews_count: 870, fee: 200000, days: ALL_DAYS, slots: MORNING, bio: 'General practitioner for check-ups, medical certificates and common illnesses.' },
  { id: d(27), photo: '/img/doctors/kevin.png', name: 'Dr. Kevin', specialty: 'general', hospital_id: H[1], experience_years: 7, patients: 1500, rating: 4.8, reviews_count: 520, fee: 175000, days: ALL_DAYS, slots: FULL, bio: 'Young GP with flexible hours, including evenings and Saturdays.' },
  { id: d(28), photo: '/img/doctors/angel.png', name: 'Dr. Angel', specialty: 'general', hospital_id: H[2], experience_years: 19, patients: 3200, rating: 4.9, reviews_count: 1250, fee: 225000, days: WEEKDAYS, slots: AFTERNOON, bio: 'General practitioner focused on women’s and family health.' },
  { id: d(24), name: 'Dr. Yoga Pratama, Sp.PD-KAI', specialty: 'allergy', hospital_id: H[0], experience_years: 12, patients: 1400, rating: 4.8, reviews_count: 450, fee: 450000, days: [2, 4], slots: AFTERNOON, bio: 'Allergist-immunologist for food allergies, hives and recurring infections.' },
]

// Prescriptions are generated from these when a visit is marked as finished (simulated).
export const prescriptionTemplates = {
  general: [
    { name: 'Paracetamol 500 mg', dose: '3× a day after meals, as needed', qty: 10, price: 1500 },
    { name: 'Vitamin C 500 mg', dose: '1× a day', qty: 10, price: 2500 },
  ],
  pediatrics: [
    { name: 'Paracetamol syrup 120 mg/5 ml', dose: '3× a day, 5 ml', qty: 1, price: 28000 },
    { name: 'Zinc syrup', dose: '1× a day, 5 ml', qty: 1, price: 35000 },
  ],
  internal: [
    { name: 'Omeprazole 20 mg', dose: '1× a day before breakfast', qty: 14, price: 4000 },
    { name: 'Antacid suspension', dose: '3× a day before meals', qty: 1, price: 26000 },
  ],
  ent: [
    { name: 'Cetirizine 10 mg', dose: '1× a day at night', qty: 10, price: 3000 },
    { name: 'Saline nasal spray', dose: '2 sprays, 3× a day', qty: 1, price: 45000 },
  ],
  derm: [
    { name: 'Hydrocortisone cream 1%', dose: 'Thin layer, 2× a day', qty: 1, price: 32000 },
    { name: 'Gentle moisturizer', dose: 'Apply after bathing', qty: 1, price: 85000 },
  ],
  eye: [{ name: 'Artificial tears', dose: '1–2 drops, 4× a day', qty: 1, price: 48000 }],
  dental: [{ name: 'Chlorhexidine mouthwash 0.2%', dose: 'Rinse 2× a day', qty: 1, price: 38000 }],
  default: [
    { name: 'Paracetamol 500 mg', dose: '3× a day after meals, as needed', qty: 10, price: 1500 },
    { name: 'Multivitamin', dose: '1× a day', qty: 10, price: 3000 },
  ],
}

export const tips = [
  {
    slug: 'walk-30-minutes',
    category: 'Lifestyle', art: 'heart', tint: '#d9e8ea',
    caption: 'Consider a 30-minute walk today.',
    title: 'Consider a 30-minute walk today',
    body: [
      'Short, brisk walks add up. Thirty minutes a day, even split into three 10-minute walks, is an easy way to move more without a gym.',
      'Try walking after lunch, taking the stairs instead of the lift, or getting off public transport one stop earlier.',
      'If you have a heart, lung or joint condition, ask your doctor what level of activity is right for you.',
    ],
  },
  {
    slug: 'more-fiber',
    category: 'Nutrition', art: 'medicine', tint: '#efe3f0',
    caption: 'Increase fiber intake this week.',
    title: 'Add more fiber this week',
    body: [
      'Fiber keeps digestion regular and helps you feel full for longer. Most adults eat less than they need.',
      'Easy swaps: brown rice instead of white, fruit with the skin on, tempeh or beans in place of some meat, and a portion of vegetables with every meal.',
      'Increase fiber gradually and drink more water as you do.',
    ],
  },
  {
    slug: 'breathing-break',
    category: 'Mental Health', art: 'monitor', tint: '#dfe2fa',
    caption: 'Try a 3-minute breathing exercise.',
    title: 'Try a 3-minute breathing break',
    body: [
      'Slow breathing is a simple way to settle your body when you feel stressed.',
      'Breathe in through your nose for 4 counts, hold for 4, and breathe out slowly for 6. Repeat for about three minutes.',
      'If stress or low mood is affecting your daily life, talking to a professional can help. You can book a psychiatrist in MediMeet.',
    ],
  },
  {
    slug: 'drink-water',
    category: 'Hydration', art: 'iv', tint: '#d8eef2',
    caption: 'Keep a water bottle within reach.',
    title: 'Keep a water bottle within reach',
    body: [
      'Even mild dehydration can cause headaches, tiredness and trouble concentrating. Sipping through the day works better than drinking a lot at once.',
      'Pale yellow urine is a handy sign that you are drinking enough. You may need more when it is hot or when you exercise.',
      'If you have a heart or kidney condition, ask your doctor how much fluid is right for you.',
    ],
  },
  {
    slug: 'check-blood-pressure',
    category: 'Heart Health', art: 'bloodpressure', tint: '#f6dfdc',
    caption: 'Know your blood pressure numbers.',
    title: 'Know your blood pressure numbers',
    body: [
      'High blood pressure usually has no symptoms, so the only way to know is to measure it. Many pharmacies and clinics can check it for you.',
      'Less salt, regular movement, enough sleep and not smoking all help keep it in a healthy range.',
      'If your readings are often high, book a visit with an internist or a cardiologist.',
    ],
  },
  {
    slug: 'wash-hands',
    category: 'Hygiene', art: 'firstaid', tint: '#e4efd9',
    caption: 'Wash hands for 20 seconds.',
    title: 'Wash your hands for 20 seconds',
    body: [
      'Washing hands with soap is one of the simplest ways to avoid catching and spreading infections.',
      'Wet, lather, and scrub for about 20 seconds, including between fingers and under nails, then rinse and dry with a clean towel.',
      'Do it before eating, after using the toilet, and after coming home from outside.',
    ],
  },
  {
    slug: 'regular-checkup',
    category: 'Check-up', art: 'lab', tint: '#f3e8cf',
    caption: 'Plan a yearly health check-up.',
    title: 'Plan a yearly health check-up',
    body: [
      'A routine check-up can catch problems such as high blood sugar or cholesterol before they cause symptoms.',
      'Ask your doctor which tests suit your age and family history, and write down questions before the visit.',
      'You can book a general practitioner in MediMeet in under a minute.',
    ],
  },
  {
    slug: 'flu-season',
    category: 'Seasonal', art: 'syringe', tint: '#d6e6fb',
    caption: 'Flu season is here. Protect yourself.',
    title: 'Flu season is here: protect yourself',
    body: [
      'Flu spreads more easily during the rainy season. An annual flu vaccine is the most effective protection.',
      'Wash your hands often, wear a mask when you are sick, and stay home to rest if you have a fever.',
      'See a doctor if a fever lasts more than three days, or if you have trouble breathing.',
    ],
  },
]
