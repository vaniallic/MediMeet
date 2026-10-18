# MediMeet

**Your health, one tap away.** A mobile-first web app for finding a doctor, booking a consultation, paying, and picking up your prescription.

MediMeet started as a group Figma prototype for a university course. This repository turns that prototype into a working product: real accounts, a real database with server-side rules, live map data, and every screen of the original flow.

> Portfolio project. The partner hospitals (Ciputra, Siloam, Tzu Chi) and their photos come from the original prototype; the doctors, schedules and fees are simulated and not affiliated with those hospitals. Payments are simulated. Do not use it for real medical appointments.

## Features

- **Accounts** — email/password sign-up, Google / Facebook / Apple sign-in, password reset (Supabase Auth)
- **Find care** — search across doctors, specialists and partner hospitals; 20 specialties; sort doctors by rating, fee or experience
- **Real places nearby** — hospitals, clinics and pharmacies around the user from the OpenStreetMap Overpass API, on an interactive Leaflet map, with a readable location label from Nominatim
- **Booking** — 3-week date strip and time grid that hides past times and slots other users have already taken
- **No double booking** — enforced by the database (partial unique index), not just the UI; unpaid holds are released after 15 minutes
- **Checkout** — insurance option, fee breakdown, QRIS / GoPay / Virtual Account / Card (all simulated), QR code and countdown, queue number on success
- **After the visit** — appointment detail with directions and an “Add to calendar” (.ics) download, reviews that update the doctor’s rating, appointment history
- **Pharmacy** — prescriptions with items and totals, pay for medicine, change the pick-up pharmacy from real nearby pharmacies
- **Profile** — edit profile, notification setting, payment history, change password, download my data (JSON), FAQ, emergency numbers
- **Health news** — auto-sliding cards with the latest headlines from Kemenkes RI (Sehat Negeriku) and WHO, fetched by a Supabase Edge Function
- **Notifications** — reminders for upcoming visits, unpaid bookings, prescriptions ready and reviews to leave
- **Demo mode** — with no Supabase keys the whole app runs on localStorage, so it can be tried instantly

## Tech stack

React 19 · Vite · Tailwind CSS v4 · React Router · Supabase (PostgreSQL, Auth, RLS, RPC) · Leaflet / React Leaflet · OpenStreetMap tiles, Overpass & Nominatim · qrcode.react · react-icons · Vercel

## Architecture

```
src/
  lib/api/          one interface, two backends
    supabaseApi.js  production: Supabase queries + RPC calls
    localApi.js     demo mode: same functions on localStorage
  lib/osm.js        Overpass (nearby places) + Nominatim (location label), cached per session
  context/          auth, location, toasts
  pages/            one file per screen group
  data/catalog.js   specialties, hospitals, doctors (also generates supabase/seed.sql)
  lib/news.js       health news client (Edge Function + fallback)
  lib/notifications.js  notifications built from appointments and prescriptions
supabase/
  schema.sql        tables, row-level security, triggers, RPC functions
  seed.sql          catalog data
  functions/health-news  Edge Function: Kemenkes + WHO RSS → JSON
```

Server-side rules live in Postgres, so they hold even if someone calls the API directly:

| Rule | Where |
| --- | --- |
| Users only see their own appointments, prescriptions and profile | RLS policies |
| A slot can only be booked once | `appointments_slot_unique` partial index |
| Booking must be in the doctor’s schedule, not in the past; fee is set by the server | `prepare_appointment` trigger |
| Payment, cancel, finish visit, pick-up change | `security definer` RPC functions that check `auth.uid()` |
| Reviews only for your own completed visits; doctor rating recalculated | RLS + `refresh_doctor_rating` trigger |
| New accounts get a profile and sample history | `handle_new_user` trigger |

## Run locally

Requires Node 20.19+.

```bash
npm install
npm run dev
```

Without a `.env.local` the app starts in **demo mode**. Log in with **Try the demo account** (`demo@medimeet.app` / `medimeet123`) or sign up with any email.

## Connect Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/schema.sql`, then `supabase/seed.sql`.
3. **Project Settings → API** → copy the Project URL and the `anon` public key into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. **Authentication → URL Configuration** → set Site URL to your deployed URL and add `http://localhost:5173/**` and `https://<your-site>/**` to Redirect URLs.
5. For a smoother demo, turn off **Confirm email** under Authentication → Providers → Email, then create the demo user in **Authentication → Users → Add user** (`demo@medimeet.app` / `medimeet123`, “Auto confirm”).
6. Optional — social sign-in: enable Google, Facebook and/or Apple under Authentication → Providers, create the OAuth app with each provider using the callback URL Supabase shows there, and paste the client ID and secret. Buttons for providers you don't enable will show an error.

If you change `src/data/catalog.js`, run `npm run seed:sql` and re-run `supabase/seed.sql`.

### Health news Edge Function

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy health-news --no-verify-jwt
```

`npm run test:news` checks the RSS parser locally. Without the function (or in demo mode) the slideshow shows MediMeet's own health tips.

## Deploy (Vercel)

Import the repo in Vercel, add the two `VITE_SUPABASE_*` variables, and deploy. `vercel.json` already rewrites all routes to `index.html`.

## Credits and notes

- Original prototype: MediMeet group project (Figma). Illustrations, 3D icons, specialist artwork, doctor and hospital photos come from that prototype.
- Map data and tiles © OpenStreetMap contributors. Please keep the attribution visible. The public OSM tile server is meant for light use; for real traffic switch to a tile provider with an API key.
- The prototype used Lufga (a paid font); this build uses Outfit and Montserrat from Google Fonts.
- Doctors without a photo in the prototype use a neutral illustrated avatar. The prototype's profile photo was replaced with initials, since it shows a real person.
