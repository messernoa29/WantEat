import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { adminApi } from '../../api/adminApi'

const GOAL_LABELS: Record<string, string> = {
  cut: 'Sèche',
  recomp: 'Recompo',
  maintain: 'Maintien',
  bulk: 'Prise de masse',
}

const GOAL_COLORS: Record<string, string> = {
  cut: '#EF4444',
  recomp: '#F59E0B',
  maintain: '#10B981',
  bulk: '#6366F1',
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-brand">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) return null

  const goalData = Object.entries(stats.goal_distribution).map(([key, val]) => ({
    name: GOAL_LABELS[key] ?? key,
    value: val,
    key,
  }))

  const ageData = Object.entries(stats.age_buckets)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([bucket, count]) => ({ bucket, count }))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand">Vue d'ensemble</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total utilisateurs" value={stats.total_users} />
        <KpiCard label="Actifs 7 jours" value={stats.active_7d} />
        <KpiCard label="Âge moyen" value={stats.avg_age ? `${stats.avg_age} ans` : '—'} />
        <KpiCard label="Rétention J7" value={`${stats.retention.j7}%`} sub={`J1: ${stats.retention.j1}% · J30: ${stats.retention.j30}%`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Goal distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <p className="font-semibold text-brand mb-4">Répartition des objectifs</p>
          {goalData.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={goalData} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                    {goalData.map(entry => (
                      <Cell key={entry.key} fill={GOAL_COLORS[entry.key] ?? '#CBD5E1'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {goalData.map(entry => (
                  <div key={entry.key} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: GOAL_COLORS[entry.key] ?? '#CBD5E1' }} />
                    <span className="text-brand">{entry.name}</span>
                    <span className="text-gray-400 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Age histogram */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <p className="font-semibold text-brand mb-4">Tranches d'âge</p>
          {ageData.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={ageData} barSize={28}>
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={25} />
                <Tooltip />
                <Bar dataKey="count" fill="#6B7FF0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top recipes */}
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <p className="font-semibold text-brand mb-4">Top recettes cette semaine</p>
        {stats.top_recipes_this_week.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune sauvegarde cette semaine</p>
        ) : (
          <div className="space-y-2">
            {stats.top_recipes_this_week.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-gray-400 text-sm">{i + 1}</span>
                <span className="flex-1 text-sm text-brand">{r.name}</span>
                <span className="text-xs text-gray-400">♥ {r.saves} saves</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retention */}
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <p className="font-semibold text-brand mb-4">Rétention</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'J+1', value: stats.retention.j1 },
            { label: 'J+7', value: stats.retention.j7 },
            { label: 'J+30', value: stats.retention.j30 },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-primary">{value}%</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
              <div className="h-2 bg-warm-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
