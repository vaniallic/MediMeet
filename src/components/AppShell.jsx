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

/**
 * Floating pill: it hovers above the bottom edge with space on all sides instead of being glued to it.
 * The wrapper ignores touches so only the pill itself is tappable.
 */
export function BottomNav() {
  return (
    <div className="pointer-events-none sticky bottom-0 z-[500] mt-auto shrink-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <nav
        aria-label="Main"
        className="pointer-events-auto mx-auto flex h-[68px] w-full items-center justify-around rounded-full bg-white px-4 shadow-[0_10px_28px_rgba(4,103,125,0.20)] ring-1 ring-mist"
      >
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `grid h-12 w-12 place-items-center rounded-full transition ${
                isActive ? 'bg-brand text-white shadow-press' : 'text-brand/70 hover:bg-brand-light hover:text-brand'
              }`
            }
          >
            <Icon className="h-6 w-6" />
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/**
 * Layout: on phones the app fills the whole screen edge to edge, so every phone size gets
 * the same side margins from the pages themselves. From 640px it becomes a centred column,
 * and from 768px a device frame with equal margin on every side.
 */
export default function AppShell() {
  const { pathname } = useLocation()
  const showNav = TAB_ROOTS.includes(pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('app-scroll')?.scrollTo?.(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh bg-mist-light md:flex md:h-dvh md:items-center md:justify-center md:p-8">
      <div className="relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-white sm:max-w-[480px] md:h-full md:max-h-[860px] md:min-h-0 md:max-w-[420px] md:overflow-hidden md:rounded-[40px] md:shadow-[0_24px_60px_rgba(4,103,125,0.22)] md:ring-8 md:ring-ink">
        <main id="app-scroll" className="flex min-w-0 flex-1 flex-col md:no-scrollbar md:overflow-y-auto">
          <div key={pathname} className="page-in flex min-w-0 flex-1 flex-col">
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
