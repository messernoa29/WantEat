import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/admin', label: '📊 Dashboard', end: true },
  { to: '/admin/recipes', label: '🍽️ Recettes' },
  { to: '/admin/users', label: '👥 Utilisateurs' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-warm text-brand">
      <header className="bg-brand text-white px-4 py-3 flex items-center gap-4">
        <span className="font-bold text-lg">WantEat Admin</span>
        <nav className="flex gap-2 ml-4">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/dashboard" className="ml-auto text-sm text-white/60 hover:text-white transition">
          ← App
        </NavLink>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </div>
    </div>
  )
}
