import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useMacros } from '../hooks/useMacros'
import { useTrackerToday } from '../hooks/useTracker'
import { usePlan, useGeneratePlan } from '../hooks/usePlan'
import { useWaterToday, useAddWater } from '../hooks/useWater'

// ── MacroRing ────────────────────────────────────────────────────
function MacroRing({ label, value, max, color, unit, delay = 0 }: {
  label: string; value: number; max: number; color: string; unit: string; delay?: number
}) {
  const r = 34
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / Math.max(max, 1), 1)
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative">
        <svg viewBox="0 0 80 80" className="w-[76px] h-[76px]">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#F0EDE8" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{Math.round(value)}</span>
          <span className="text-[9px] text-gray-400">{unit}</span>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-gray-600 mt-1.5">{label}</p>
      <p className="text-[10px] text-gray-400">/ {Math.round(max)}</p>
    </div>
  )
}

// ── CalorieMain ──────────────────────────────────────────────────
function CalorieMain({ consumed, target }: { consumed: number; target: number }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const pct = Math.min(consumed / Math.max(target, 1), 1)
  const offset = circ * (1 - pct)
  const remaining = Math.max(target - consumed, 0)
  const over = consumed > target

  return (
    <div className="flex flex-col items-center animate-scale-in">
      <div className="relative">
        <svg viewBox="0 0 132 132" className="w-32 h-32">
          <circle cx="66" cy="66" r={r} fill="none" stroke="#F0EDE8" strokeWidth="9" />
          <circle cx="66" cy="66" r={r} fill="none"
            stroke={over ? '#EF4444' : '#FF6B35'} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 66 66)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-brand">{Math.round(consumed)}</span>
          <span className="text-[10px] text-gray-400">kcal</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {over
          ? <span className="text-red-500 font-medium">+{Math.round(consumed - target)} au-dessus</span>
          : <span><span className="font-semibold text-brand">{Math.round(remaining)}</span> kcal restantes</span>
        }
      </p>
    </div>
  )
}

// ── WaterTracker ─────────────────────────────────────────────────
function WaterTracker() {
  const { data: water } = useWaterToday()
  const addWater = useAddWater()

  if (!water) return null

  const liters = (water.consumed_ml / 1000).toFixed(1)
  const goal = (water.goal_ml / 1000).toFixed(1)
  const pct = water.pct
  const drops = Math.min(Math.round(pct / 12.5), 8)

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 animate-slide-up delay-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-brand">Hydratation</p>
          <p className="text-sm text-gray-500 mt-0.5">{liters} L <span className="text-gray-300">/ {goal} L</span></p>
        </div>
        <button
          onClick={() => addWater.mutate(250)}
          disabled={addWater.isPending}
          className="bg-secondary text-white font-bold px-4 py-2 rounded-xl text-sm transition hover:bg-secondary-dark disabled:opacity-50 press shadow-sm"
        >
          💧 +250 ml
        </button>
      </div>

      {/* Drop indicators */}
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${
              i < drops ? 'bg-secondary' : 'bg-warm-200'
            }`}
            style={{ transitionDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        {pct >= 100 ? '🎉 Objectif atteint !' : `${pct}% de l'objectif`}
      </p>
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
  const totalDiff = diff + (weeklyChange ? Math.abs(weeklyChange) * (weeksToGoal ?? 0) : 0)
  const progressPct = totalDiff > 0 ? Math.min(((totalDiff - diff) / totalDiff) * 100, 100) : 0

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 animate-slide-up delay-300">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-brand">{isLoss ? '📉 Objectif perte' : '📈 Objectif prise'}</p>
        {weeksToGoal && (
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
            ~{weeksToGoal} sem
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <p className="text-xl font-bold text-brand">{currentWeight}</p>
          <p className="text-xs text-gray-400">Actuel</p>
        </div>
        <div className="flex-1 mx-4">
          <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-400 mt-1">{diff.toFixed(1)} kg restants</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-accent">{targetWeight}</p>
          <p className="text-xs text-gray-400">Objectif</p>
        </div>
      </div>
      {weeklyChange && (
        <p className="text-xs text-gray-500 bg-warm-100 rounded-xl px-3 py-2">
          Rythme : <strong>{Math.abs(weeklyChange)} kg/semaine</strong>
        </p>
      )}
    </div>
  )
}

// ── QuickCard ─────────────────────────────────────────────────────
function QuickCard({ emoji, title, subtitle, to, color = 'hover:bg-warm-100', delay = 0 }: {
  emoji: string; title: string; subtitle: string; to: string; color?: string; delay?: number
}) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className={`bg-white ${color} shadow-card hover:shadow-card-hover rounded-2xl p-5 text-left transition-all duration-200 press animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-2xl mb-2">{emoji}</p>
      <p className="font-bold text-brand text-sm">{title}</p>
      <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export function DashboardPage() {
  const { signOut } = useAuth()
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
        <div className="text-center max-w-sm animate-scale-in">
          <div className="text-7xl mb-6 animate-float">🥗</div>
          <h2 className="text-2xl font-bold text-brand mb-2">Bienvenue sur WantEat !</h2>
          <p className="text-gray-500 mb-8">Configure ton profil pour commencer ton plan nutritionnel personnalisé.</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-8 rounded-2xl transition shadow-lg shadow-primary/25 press"
          >
            Configurer mon profil →
          </button>
        </div>
      </div>
    )
  }

  const calConsumed = tracker?.calories_consumed ?? 0
  const calTarget = tracker?.calories_target ?? macros?.calories ?? 0

  const goalLabels: Record<string, string> = {
    cut: '🔥 Sèche', bulk: '💪 Prise de masse', recomp: '⚡ Recompo', maintain: '🎯 Maintien',
  }

  const today = new Date().getDay()
  const isSportDay = profile.sport_days.includes(today === 0 ? 6 : today - 1)
  const todayCalories = isSportDay ? macros?.calories_sport : macros?.calories_rest

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne après-midi' : 'Bonsoir'

  return (
    <div className="min-h-screen bg-warm text-brand pb-24">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-brand via-brand to-[#2D2D4E] px-5 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div className="animate-slide-down">
              <p className="text-white/60 text-sm font-medium">{greeting},</p>
              <h1 className="text-2xl font-extrabold text-white mt-0.5">
                {profile.first_name || 'Champion'} 👋
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="bg-white/10 text-white/80 text-xs px-2.5 py-1 rounded-full font-medium">
                  {goalLabels[profile.goal]}
                </span>
                {isSportDay && (
                  <span className="bg-primary/80 text-white text-xs px-2.5 py-1 rounded-full font-bold animate-pulse-glow">
                    💪 Jour de sport
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-white/40 hover:text-white/70 text-xs transition mt-1"
            >
              Déco
            </button>
          </div>

          {/* Calorie ring + macros */}
          {macros && (
            <div className="flex items-center justify-around">
              <CalorieMain consumed={calConsumed} target={todayCalories ?? calTarget} />
              <div className="flex gap-3">
                <MacroRing label="Prot." value={tracker?.protein_consumed ?? 0} max={macros.protein_g} color="#FF6B35" unit="g" delay={100} />
                <MacroRing label="Gluc." value={tracker?.carbs_consumed ?? 0} max={macros.carbs_g} color="#2EC4B6" unit="g" delay={200} />
                <MacroRing label="Lip." value={tracker?.fat_consumed ?? 0} max={macros.fat_g} color="#06D6A0" unit="g" delay={300} />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Sport/Repos cards ── */}
        {macros && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up delay-100">
            <div className={`rounded-2xl p-4 transition-all ${isSportDay ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white shadow-card'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isSportDay ? 'text-white/70' : 'text-gray-400'}`}>
                Sport 💪
              </p>
              <p className={`text-2xl font-extrabold ${isSportDay ? 'text-white' : 'text-brand'}`}>{macros.calories_sport}</p>
              <p className={`text-xs mt-0.5 ${isSportDay ? 'text-white/60' : 'text-gray-400'}`}>kcal cibles</p>
            </div>
            <div className={`rounded-2xl p-4 transition-all ${!isSportDay ? 'bg-secondary shadow-lg shadow-secondary/20' : 'bg-white shadow-card'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${!isSportDay ? 'text-white/70' : 'text-gray-400'}`}>
                Repos 😌
              </p>
              <p className={`text-2xl font-extrabold ${!isSportDay ? 'text-white' : 'text-brand'}`}>{macros.calories_rest}</p>
              <p className={`text-xs mt-0.5 ${!isSportDay ? 'text-white/60' : 'text-gray-400'}`}>kcal cibles</p>
            </div>
          </div>
        )}

        {/* ── Water ── */}
        <WaterTracker />

        {/* ── Goal progress ── */}
        {macros && (
          <GoalProgress
            currentWeight={profile.weight_kg}
            targetWeight={profile.target_weight_kg}
            weeksToGoal={macros.weeks_to_goal}
            weeklyChange={macros.weekly_change_kg}
          />
        )}

        {/* ── Plan ── */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-slide-up delay-200">
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-brand text-base">Plan alimentaire IA</h3>
              {plan?.status === 'ready' && (
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Prêt ✓</span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {plan?.status === 'ready' ? '7 jours de repas personnalisés.' : 'Génère ton plan 7 jours par IA.'}
            </p>
            <div className="flex gap-3 flex-wrap">
              {plan?.status === 'ready' && (
                <button
                  onClick={() => navigate('/plan')}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-5 rounded-xl transition text-sm press shadow-sm shadow-primary/20"
                >
                  📅 Voir mon plan
                </button>
              )}
              <button
                onClick={() => generatePlan.mutate()}
                disabled={generatePlan.isPending || plan?.status === 'pending'}
                className="bg-warm-100 hover:bg-warm-200 text-brand font-bold py-2.5 px-5 rounded-xl transition text-sm disabled:opacity-50 flex items-center gap-2 press"
              >
                {generatePlan.isPending || plan?.status === 'pending' ? (
                  <><div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />Génération…</>
                ) : plan?.status === 'ready' ? '↻ Regénérer' : '✨ Générer'}
              </button>
            </div>
            {plan?.status === 'pending' && (
              <p className="text-primary text-xs mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping inline-block" />
                Claude prépare ton plan (~45 sec)…
              </p>
            )}
          </div>
        </div>

        {/* ── Quick nav ── */}
        <div className="grid grid-cols-2 gap-3">
          <QuickCard emoji="📚" title="Bibliothèque" subtitle="Recettes TikTok fitness" to="/library" delay={100} />
          <QuickCard emoji="🗓️" title="Calendrier" subtitle="Planifie ta semaine" to="/calendar" delay={150} />
        </div>

        {/* ── Metabolism ── */}
        {macros && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up delay-300">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">BMR</p>
              <p className="text-2xl font-bold text-brand">{macros.bmr} <span className="text-sm text-gray-400 font-normal">kcal</span></p>
              <p className="text-xs text-gray-400 mt-1">Métabolisme de base</p>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">TDEE moyen</p>
              <p className="text-2xl font-bold text-brand">{macros.tdee} <span className="text-sm text-gray-400 font-normal">kcal</span></p>
              <p className="text-xs text-gray-400 mt-1">Avec ton activité</p>
            </div>
          </div>
        )}

        {/* ── IMC ── */}
        {macros && (
          <div className="bg-white rounded-2xl shadow-card p-5 animate-slide-up delay-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">IMC</p>
                <p className={`text-3xl font-extrabold ${
                  macros.bmi >= 18.5 && macros.bmi < 25 ? 'text-accent' :
                  macros.bmi < 18.5 ? 'text-blue-500' : 'text-orange-500'
                }`}>{macros.bmi}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {macros.bmi < 18.5 ? 'Insuffisance pondérale' :
                   macros.bmi < 25 ? 'Poids normal' :
                   macros.bmi < 30 ? 'Surpoids' : 'Obésité'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Poids de forme</p>
                <p className="text-3xl font-extrabold text-brand">{macros.ideal_weight_kg}</p>
                <p className="text-xs text-gray-400 mt-0.5">kg (Lorentz)</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
