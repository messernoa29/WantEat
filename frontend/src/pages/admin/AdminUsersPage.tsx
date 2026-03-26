import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, type AdminUser } from '../../api/adminApi'

const GOAL_LABELS: Record<string, string> = {
  cut: 'Sèche', recomp: 'Recompo', maintain: 'Maintien', bulk: 'Prise de masse',
}

const GOAL_COLORS: Record<string, string> = {
  cut: 'bg-red-100 text-red-600',
  recomp: 'bg-yellow-100 text-yellow-700',
  maintain: 'bg-green-100 text-green-700',
  bulk: 'bg-indigo-100 text-indigo-700',
}

function UserRow({ user }: { user: AdminUser }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="hover:bg-warm-50 transition cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3">
          <p className="font-medium text-brand">{user.first_name || '—'}</p>
          <p className="text-xs text-gray-400 font-mono">{user.user_id.slice(0, 8)}…</p>
        </td>
        <td className="px-4 py-3 text-gray-500">{user.age ?? '—'} ans</td>
        <td className="px-4 py-3 text-gray-500">{user.weight_kg ?? '—'} kg</td>
        <td className="px-4 py-3">
          {user.goal ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GOAL_COLORS[user.goal] ?? 'bg-gray-100 text-gray-600'}`}>
              {GOAL_LABELS[user.goal] ?? user.goal}
            </span>
          ) : '—'}
        </td>
        <td className="px-4 py-3 text-gray-500 capitalize">{user.diet_type ?? '—'}</td>
        <td className="px-4 py-3 text-gray-400">{user.sport_days?.length ?? 0} j/sem</td>
        <td className="px-4 py-3 text-gray-300">{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr className="bg-warm-50">
          <td colSpan={7} className="px-6 py-3">
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div><span className="font-medium">Taille :</span> {user.height_cm ?? '—'} cm</div>
              <div><span className="font-medium">Genre :</span> {user.gender ?? '—'}</div>
              <div><span className="font-medium">Repas/j :</span> {user.meals_per_day ?? '—'}</div>
              <div><span className="font-medium">Jours sport :</span> {user.sport_days?.join(', ') ?? '—'}</div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers({ limit: 200 }),
  })

  const handleExport = async () => {
    const blob = await adminApi.exportUsers()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Utilisateurs</h1>
        <button
          onClick={handleExport}
          className="border border-warm-200 text-gray-600 hover:bg-warm-100 font-medium px-4 py-2 rounded-xl transition text-sm"
        >
          ⬇ Exporter CSV
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-100 text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Utilisateur</th>
                <th className="text-left px-4 py-3">Âge</th>
                <th className="text-left px-4 py-3">Poids</th>
                <th className="text-left px-4 py-3">Objectif</th>
                <th className="text-left px-4 py-3">Régime</th>
                <th className="text-left px-4 py-3">Sport</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {users?.map(u => <UserRow key={u.user_id} user={u} />)}
            </tbody>
          </table>
          {!isLoading && users?.length === 0 && (
            <p className="text-center text-gray-400 py-12">Aucun utilisateur</p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Consultation uniquement — les données utilisateur ne peuvent pas être modifiées.
      </p>
    </div>
  )
}
