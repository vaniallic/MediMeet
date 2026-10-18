import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { TbCalendarEvent, TbFilePlus, TbHomeFilled, TbUserFilled } from 'react-icons/tb'
import { isDemoMode } from '../lib/supabase'

const TABS = [
  { to: '/home', label: 'Home', icon: TbHomeFilled },
  { to: '/appointments', label: 'Upcoming appointments', icon: TbCalendarEvent },
  { to: '/history', label: 'History', icon: TbFilePlus },
  { to: '/profile', label: 'Profile', icon: TbUserFilled },
]
const TAB_ROOTS = [...TABS.map((t) => t.to), '/pharmacy']

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-[500] mt-auto flex h-16 shrink-0 items-center justify-around border-t border-mist/70 bg-white/95 px-5 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          aria-label={label}
          className={({ isActive }) =>
            `grid h-11 w-11 place-items-center rounded-full transition ${
              isActive ? 'bg-brand text-white shadow-press' : 'text-brand hover:bg-brand-light'
            }`
          }
        >
          <Icon className="h-6 w-6" />
        </NavLink>
      ))}
    </nav>
  )
}

/**
 * Phone-sized app column. On tablets and desktops it becomes a device frame centred in the
 * viewport with the same margin on every side.
 */
export default function AppShell() {
  const { pathname } = useLocation()
  const showNav = TAB_ROOTS.includes(pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('app-scroll')?.scrollTo?.(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_50%_0%,#dceef0_0,#eaf0f1_50%,#e2ebed_100%)] md:flex md:h-dvh md:items-center md:justify-center md:p-8">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[420px] flex-col overflow-x-clip bg-white md:h-full md:max-h-[860px] md:min-h-0 md:overflow-hidden md:rounded-[40px] md:shadow-[0_24px_60px_rgba(4,103,125,0.22)] md:ring-8 md:ring-ink">
        <main id="app-scroll" className="flex flex-1 flex-col md:no-scrollbar md:overflow-y-auto">
          <div key={pathname} className="page-in flex flex-1 flex-col">
            <Outlet />
          </div>
          {showNav && <BottomNav />}
        </main>
      </div>
      {isDemoMode && (
        <p className="fixed right-4 bottom-4 hidden rounded-full bg-white/80 px-3 py-1.5 text-[11px] text-muted shadow-soft md:block">
          Demo mode · data saved in this browser
        </p>
      )}
    </div>
  )
}
