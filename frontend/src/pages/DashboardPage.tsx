import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useMacros } from '../hooks/useMacros'
import { useTrackerToday } from '../hooks/useTracker'
import { usePlan, useGeneratePlan } from '../hooks/usePlan'
import { useWaterToday, useAddWater } from '../hooks/useWater'

// ── MacroRing ────────────────────────────────────────────────────
function MacroRing({ label, value, max, color, unit }: {
  label: string; value: number; max: number; color: string; unit: string
}) {
  const r = 34
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / Math.max(max, 1), 1)
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 80 80" className="w-[72px] h-[72px]">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#F0EDE8" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.9s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{Math.round(value)}</span>
          <span className="text-[9px] text-gray-400">{unit}</span>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-gray-600 mt-1">{label}</p>
      <p className="text-[10px] text-gray-400">/ {Math.round(max)}</p>
    </div>
  )
}

// ── WaterTracker ─────────────────────────────────────────────────
function WaterTracker() {
  const { data: water } = useWaterToday()
  const addWater = useAddWater()

  if (!water) return null

  const pct = water.pct
  const liters = (water.consumed_ml / 1000).toFixed(1)
  const goal = (water.goal_ml / 1000).toFixed(1)

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-brand">Hydratation 💧</p>
          <p className="text-sm text-gray-500">{liters} L / {goal} L objectif</p>
        </div>
        <button
          onClick={() => addWater.mutate(250)}
          disabled={addWater.isPending}
          className="bg-secondary text-white font-bold px-4 py-2 rounded-xl text-sm transition hover:bg-secondary-dark disabled:opacity-50"
        >
          +250 ml
        </button>
      </div>
      <div className="h-3 bg-warm-200 rounded-full overflow-hidden">
        <div className="h-full bg-secondary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">
        {pct >= 100 ? '🎉 Objectif atteint !' : `${pct}% de l'objectif`}
      </p>
    </div>
  )
}

// ── BMI Badge ───────────────────────────────────────────────────
function BmiBadge({ bmi, idealWeight }: { bmi: number; idealWeight: number }) {
  const label = bmi < 18.5 ? 'Insuffisance pondérale' :
    bmi < 25 ? 'Poids normal' :
    bmi < 30 ? 'Surpoids' : 'Obésité'
  const color = bmi >= 18.5 && bmi < 25 ? 'text-accent' :
    bmi < 18.5 ? 'text-blue-500' : 'text-orange-500'

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">IMC</p>
          <p className={`text-3xl font-bold ${color}`}>{bmi}</p>
          <p className={`text-sm font-medium ${color}`}>{label}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">Poids de forme</p>
          <p className="text-2xl font-bold text-brand">{idealWeight}</p>
          <p className="text-xs text-gray-400">kg (Lorentz)</p>
        </div>
      </div>
    </div>
  )
}

// ── GoalProgress ─────────────────────────────────────────────────
function GoalProgress({ currentWeight, targetWeight, weeksToGoal, weeklyChange }: {
  currentWeight: number; targetWeight?: number; weeksToGoal?: number | null; weeklyChange?: number | null
}) {
  if (!targetWeight || Math.abs(currentWeight - targetWeight) < 0.5) return null

  const isLoss = currentWeight > targetWeight
  const diff = Math.abs(currentWeight - targetWeight)

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <p className="font-bold text-brand mb-3">
        {isLoss ? '📉 Progression vers ton objectif' : '📈 Progression vers ton objectif'}
      </p>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-primary">{currentWeight} kg</p>
          <p className="text-xs text-gray-400">Poids actuel</p>
        </div>
        <div className="flex-1 mx-4 border-t-2 border-dashed border-warm-300 relative">
          {weeksToGoal && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-warm-100 px-2 py-0.5 rounded-full text-gray-500 whitespace-nowrap">
              ~{weeksToGoal} sem
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-accent">{targetWeight} kg</p>
          <p className="text-xs text-gray-400">Objectif</p>
        </div>
      </div>
      {weeklyChange && (
        <p className="text-sm text-gray-500">
          Rythme actuel : <strong>{Math.abs(weeklyChange)} kg/semaine</strong>
          {' '}({diff.toFixed(1)} kg restants)
        </p>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: macros } = useMacros()
  const { data: tracker } = useTrackerToday()
  const { data: plan } = usePlan()
  const generatePlan = useGeneratePlan()

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🥗</div>
          <h2 className="text-2xl font-bold text-brand mb-2">Bienvenue sur NutriAI !</h2>
          <p className="text-gray-500 mb-6">Configure ton profil pour commencer ton plan nutritionnel personnalisé.</p>
          <button onClick={() => navigate('/onboarding')}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-2xl transition shadow-sm"
          >Configurer mon profil →</button>
        </div>
      </div>
    )
  }

  const calConsumed = tracker?.calories_consumed ?? 0
  const calTarget = tracker?.calories_target ?? macros?.calories ?? 0
  const calPct = calTarget > 0 ? Math.round(calConsumed / calTarget * 100) : 0

  const goalLabels: Record<string, string> = {
    cut: '🔥 Sèche', bulk: '💪 Prise de masse', recomp: '⚡ Recompo', maintain: '🎯 Maintien',
  }

  const today = new Date().getDay()
  const isSportDay = profile.sport_days.includes(today === 0 ? 6 : today - 1)
  const todayCalories = isSportDay ? macros?.calories_sport : macros?.calories_rest

  return (
    <div className="min-h-screen bg-warm text-brand">
      {/* Header */}
      <header className="bg-white border-b border-warm-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">NutriAI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-gray-400 text-sm">{user?.email}</span>
          <button onClick={() => navigate('/profile')} className="text-sm text-gray-500 hover:text-brand transition">Profil</button>
          <button onClick={signOut} className="text-sm text-gray-500 hover:text-brand transition">Déconnexion</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-brand">
            Bonjour {profile.first_name ? profile.first_name : ''} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {goalLabels[profile.goal]} · {profile.weight_kg} kg · {profile.sport_days.length} entraînements/sem
            {isSportDay && <span className="ml-2 text-primary font-medium">💪 Jour de sport</span>}
          </p>
        </div>

        {/* Today's calories */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Aujourd'hui</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{Math.round(calConsumed)}</span>
                <span className="text-gray-400 pb-1 text-sm">/ {Math.round(todayCalories ?? calTarget)} kcal</span>
              </div>
            </div>
            <div className={`text-sm font-bold px-3 py-1.5 rounded-full ${
              calPct >= 90 ? 'bg-accent/10 text-accent' :
              calPct >= 50 ? 'bg-yellow-50 text-yellow-600' :
              'bg-warm-100 text-gray-400'
            }`}>
              {calPct}%
            </div>
          </div>

          {/* Macro rings */}
          {macros && tracker && (
            <div className="flex justify-around py-2">
              <MacroRing label="Protéines" value={tracker.protein_consumed} max={macros.protein_g} color="#FF6B35" unit="g" />
              <MacroRing label="Glucides" value={tracker.carbs_consumed} max={macros.carbs_g} color="#2EC4B6" unit="g" />
              <MacroRing label="Lipides" value={tracker.fat_consumed} max={macros.fat_g} color="#06D6A0" unit="g" />
              <MacroRing label="Calories" value={calConsumed} max={todayCalories ?? macros.calories} color="#8B5CF6" unit="kcal" />
            </div>
          )}

          {/* Macro cibles si pas de tracker */}
          {macros && !tracker && (
            <div className="flex justify-around py-2">
              <MacroRing label="Protéines" value={0} max={macros.protein_g} color="#FF6B35" unit="g" />
              <MacroRing label="Glucides" value={0} max={macros.carbs_g} color="#2EC4B6" unit="g" />
              <MacroRing label="Lipides" value={0} max={macros.fat_g} color="#06D6A0" unit="g" />
              <MacroRing label="Calories" value={0} max={todayCalories ?? macros.calories} color="#8B5CF6" unit="kcal" />
            </div>
          )}
        </div>

        {/* Sport/Repos macros */}
        {macros && (
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl shadow-card p-4 ${isSportDay ? 'bg-primary text-white' : 'bg-white'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isSportDay ? 'text-primary-50' : 'text-gray-400'}`}>
                Jour de sport 💪
              </p>
              <p className={`text-2xl font-bold ${isSportDay ? 'text-white' : 'text-brand'}`}>{macros.calories_sport}</p>
              <p className={`text-xs ${isSportDay ? 'text-primary-50' : 'text-gray-400'}`}>kcal cibles</p>
            </div>
            <div className={`rounded-2xl shadow-card p-4 ${!isSportDay ? 'bg-secondary text-white' : 'bg-white'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${!isSportDay ? 'text-white/70' : 'text-gray-400'}`}>
                Jour de repos 😌
              </p>
              <p className={`text-2xl font-bold ${!isSportDay ? 'text-white' : 'text-brand'}`}>{macros.calories_rest}</p>
              <p className={`text-xs ${!isSportDay ? 'text-white/70' : 'text-gray-400'}`}>kcal cibles</p>
            </div>
          </div>
        )}

        {/* Water */}
        <WaterTracker />

        {/* Goal progress */}
        {macros && (
          <GoalProgress
            currentWeight={profile.weight_kg}
            targetWeight={profile.target_weight_kg}
            weeksToGoal={macros.weeks_to_goal}
            weeklyChange={macros.weekly_change_kg}
          />
        )}

        {/* BMI */}
        {macros && <BmiBadge bmi={macros.bmi} idealWeight={macros.ideal_weight_kg} />}

        {/* Plan alimentaire */}
        <div className="bg-white rounded-2xl shadow-card p-5 border border-primary/10">
          <h3 className="font-bold text-brand text-lg mb-1">Plan alimentaire 7 jours 📅</h3>
          <p className="text-gray-400 text-sm mb-4">
            Génère ou consulte ton plan personnalisé par IA.
          </p>
          <div className="flex gap-3 flex-wrap">
            {plan?.status === 'ready' && (
              <button onClick={() => navigate('/plan')}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-5 rounded-xl transition text-sm"
              >📅 Voir mon plan</button>
            )}
            <button onClick={() => generatePlan.mutate()}
              disabled={generatePlan.isPending || plan?.status === 'pending'}
              className="bg-warm-100 hover:bg-warm-200 text-brand font-bold py-2.5 px-5 rounded-xl transition text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {generatePlan.isPending || plan?.status === 'pending' ? (
                <><div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />Génération…</>
              ) : plan?.status === 'ready' ? '↻ Regénérer' : '✨ Générer mon plan'}
            </button>
          </div>
          {plan?.status === 'pending' && (
            <p className="text-primary text-sm mt-3">⏳ Claude prépare ton plan (~45 sec)…</p>
          )}
        </div>

        {/* Bibliothèque & Calendrier */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/library')}
            className="bg-white hover:bg-warm-100 shadow-card rounded-2xl p-5 text-left transition"
          >
            <p className="text-2xl mb-2">📚</p>
            <p className="font-bold text-brand">Bibliothèque</p>
            <p className="text-gray-400 text-sm mt-0.5">Recettes TikTok fitness</p>
          </button>
          <button onClick={() => navigate('/calendar')}
            className="bg-white hover:bg-warm-100 shadow-card rounded-2xl p-5 text-left transition"
          >
            <p className="text-2xl mb-2">🗓️</p>
            <p className="font-bold text-brand">Calendrier</p>
            <p className="text-gray-400 text-sm mt-0.5">Planifie ta semaine</p>
          </button>
        </div>

        {/* Métabolisme */}
        {macros && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-gray-400 text-sm">BMR (repos total)</p>
              <p className="text-2xl font-bold text-brand mt-1">{macros.bmr} <span className="text-sm text-gray-400">kcal</span></p>
              <p className="text-xs text-gray-400 mt-1">Métabolisme de base</p>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-gray-400 text-sm">TDEE moyen</p>
              <p className="text-2xl font-bold text-brand mt-1">{macros.tdee} <span className="text-sm text-gray-400">kcal</span></p>
              <p className="text-xs text-gray-400 mt-1">Avec ton activité</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
