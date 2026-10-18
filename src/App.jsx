import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import { Spinner } from './components/ui'

import Landing from './pages/Landing'
import { Login, SignUp, ForgotPassword, ResetPassword } from './pages/Auth'
import Home from './pages/Home'
import Search from './pages/Search'
import Nearby from './pages/Nearby'
import HospitalDetail from './pages/HospitalDetail'
import { Specialists, SpecialistDoctors } from './pages/Specialists'
import DoctorDetail from './pages/DoctorDetail'
import { Checkout, PayScreen, PaymentSuccess } from './pages/Payment'
import { Appointments, AppointmentDetail, Review } from './pages/Appointments'
import { Pharmacy, ChangePickup } from './pages/Pharmacy'
import { Profile, EditProfile, Settings, PrivacyPage } from './pages/Profile'
import Emergency from './pages/Emergency'
import Tip from './pages/Tip'
import News from './pages/News'
import Notifications from './pages/Notifications'
import NotFound from './pages/NotFound'

function Loading() {
  return (
    <div className="grid flex-1 place-items-center py-24 text-brand">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function GuestOnly({ children }) {
  const { user, ready, recovering } = useAuth()
  if (!ready) return <Loading />
  if (user && !recovering) return <Navigate to="/home" replace />
  return children
}

// Browsing is open to guests. Login is only needed to book and for personal areas.
const guard = (el) => <RequireAuth>{el}</RequireAuth>

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<GuestOnly><Landing /></GuestOnly>} />
        <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="signup" element={<GuestOnly><SignUp /></GuestOnly>} />
        <Route path="forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="privacy" element={<PrivacyPage />} />

        <Route path="home" element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="nearby" element={<Nearby />} />
        <Route path="hospitals/:id" element={<HospitalDetail />} />
        <Route path="specialists" element={<Specialists />} />
        <Route path="specialists/:slug" element={<SpecialistDoctors />} />
        <Route path="doctors/:id" element={<DoctorDetail />} />
        <Route path="checkout/:id" element={guard(<Checkout />)} />
        <Route path="pay/:id" element={guard(<PayScreen />)} />
        <Route path="success/:id" element={guard(<PaymentSuccess />)} />
        <Route path="appointments" element={guard(<Appointments />)} />
        <Route path="history" element={guard(<Appointments mode="history" />)} />
        <Route path="appointments/:id" element={guard(<AppointmentDetail />)} />
        <Route path="appointments/:id/review" element={guard(<Review />)} />
        <Route path="pharmacy" element={guard(<Pharmacy />)} />
        <Route path="pharmacy/:id/pickup" element={guard(<ChangePickup />)} />
        <Route path="profile" element={guard(<Profile />)} />
        <Route path="profile/edit" element={guard(<EditProfile />)} />
        <Route path="settings/:section" element={guard(<Settings />)} />
        <Route path="tips/:slug" element={<Tip />} />
        <Route path="news" element={<News />} />
        <Route path="notifications" element={guard(<Notifications />)} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
