import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Accueil' },
  { to: '/plan',      icon: '📅', label: 'Plan' },
  { to: '/library',   icon: '📚', label: 'Recettes' },
  { to: '/calendar',  icon: '🗓️', label: 'Semaine' },
  { to: '/profile',   icon: '👤', label: 'Profil' },
]

export function BottomNav() {
  const location = useLocation()
  const { session, loading, isGuest } = useAuth()

  const hiddenPaths = ['/login', '/onboarding', '/admin'].some(p => location.pathname.startsWith(p))
  if (loading || (!session && !isGuest) || hiddenPaths) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 animate-slide-bottom">
      <div className="glass border-t border-warm-200 px-2 pt-2 pb-safe">
        <div className="max-w-lg mx-auto flex items-stretch justify-around">
          {NAV.map(({ to, icon, label }) => {
            const active = to === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 press min-w-[56px] ${
                  active
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-semibold tracking-wide transition-all ${
                  active ? 'text-primary opacity-100' : 'opacity-60'
                }`}>
                  {label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-primary animate-scale-in" />
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
