import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan, useGeneratePlan } from '../hooks/usePlan'
import type { DayPlan, Meal } from '../api/planApi'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const MEAL_EMOJIS: Record<string, string> = {
  'petit-déjeuner': '🌅',
  'collation matin': '🍎',
  'déjeuner': '🍽️',
  'collation': '🥜',
  'dîner': '🌙',
  'collation soir': '🌙',
}

function MealCard({ meal }: { meal: Meal }) {
  const [open, setOpen] = useState(false)
  const emoji = MEAL_EMOJIS[meal.meal_type.toLowerCase()] ?? '🍴'

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card">
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl mt-0.5">{emoji}</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{meal.meal_type}</p>
            <p className="font-semibold text-brand truncate">{meal.name}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-400">
              <span>{Math.round(meal.calories)} kcal</span>
              <span className="text-secondary">P: {Math.round(meal.protein)}g</span>
              <span className="text-yellow-500">G: {Math.round(meal.carbs)}g</span>
              <span className="text-primary">L: {Math.round(meal.fat)}g</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">⏱ {meal.prep_time_min}min</span>
          <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-warm-200 pt-4">
          {/* Ingrédients */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ingrédients</p>
            <div className="flex flex-wrap gap-2">
              {meal.ingredients.map((ing, i) => (
                <span key={i} className="bg-warm-100 text-brand text-xs px-2 py-1 rounded-lg">
                  {ing.name} <span className="text-gray-400">{ing.quantity_g}g</span>
                </span>
              ))}
            </div>
          </div>

          {/* Étapes */}
          {meal.steps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Préparation</p>
              <ol className="space-y-1.5">
                {meal.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Sauce */}
          {meal.sauce && (
            <div className="bg-primary-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-primary mb-1">🥣 {meal.sauce.name}</p>
              <p className="text-xs text-gray-500">{meal.sauce.ingredients?.join(' · ')}</p>
              {meal.sauce.kcal_per_serving && (
                <p className="text-xs text-gray-400 mt-0.5">{meal.sauce.kcal_per_serving} kcal/portion</p>
              )}
            </div>
          )}

          {/* Dressage */}
          {meal.plating_tip && (
            <div className="flex gap-2 text-sm text-gray-500 italic">
              <span>✨</span>
              <span>{meal.plating_tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DayCard({ day, active, onClick }: { day: DayPlan; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 shrink-0 press ${
        active ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105' : 'bg-white text-gray-500 hover:bg-warm-100 shadow-card'
      }`}
    >
      <span className="text-xs font-medium">{DAY_NAMES[day.day_index]?.slice(0, 3)}</span>
      {day.is_sport_day && <span className="text-xs mt-0.5">{active ? '🏋️' : '💪'}</span>}
    </button>
  )
}

export function PlanPage() {
  const { data: plan, isLoading, isError } = usePlan()
  const generate = useGeneratePlan()
  const navigate = useNavigate()
  const [activeDay, setActiveDay] = useState(0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentDay = plan?.days?.[activeDay]

  return (
    <div className="min-h-screen bg-warm text-brand pb-24">
      <header className="border-b border-warm-200 bg-white px-4 py-4 flex items-center justify-between">
        <div className="w-10" />
        <h1 className="font-bold text-lg">Plan 7 jours 📅</h1>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending || plan?.status === 'pending'}
          className="text-xs bg-primary hover:bg-primary-dark text-white font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          {generate.isPending || plan?.status === 'pending' ? '⏳' : '↻ Regénérer'}
        </button>
      </header>

      {/* Pas de plan ou en cours */}
      {(!plan || plan.status === 'pending' || plan.status === 'failed') && (
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          {plan?.status === 'failed' ? (
            <>
              <div className="text-5xl mb-4">❌</div>
              <p className="text-brand font-semibold text-lg mb-2">La génération a échoué</p>
              <p className="text-gray-500 text-sm mb-6">Réessaie, Claude peut avoir un bug passager.</p>
              <button
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition"
              >
                🔄 Réessayer
              </button>
            </>
          ) : plan?.status === 'pending' ? (
            <>
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-brand font-semibold text-lg mb-2">Claude cuisine ton plan…</p>
              <p className="text-gray-500 text-sm">Génération en cours, ça prend ~45 secondes.</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🍽️</div>
              <p className="text-brand font-semibold text-lg mb-2">Aucun plan cette semaine</p>
              <p className="text-gray-500 text-sm mb-6">Génère ton plan personnalisé en un clic.</p>
              <button
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition disabled:opacity-50"
              >
                {generate.isPending ? 'Lancement…' : '✨ Générer mon plan'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Plan prêt */}
      {plan?.status === 'ready' && plan.days.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
          {/* Sélecteur de jours */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {plan.days
              .slice()
              .sort((a, b) => a.day_index - b.day_index)
              .map((day, i) => (
                <DayCard key={day.day_id} day={day} active={activeDay === i} onClick={() => setActiveDay(i)} />
              ))}
          </div>

          {currentDay && (
            <>
              {/* Totaux du jour */}
              <div className="bg-white rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-brand">{DAY_NAMES[currentDay.day_index]}</h2>
                  {currentDay.is_sport_day && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Jour sport 💪</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Calories', value: Math.round(currentDay.total_calories), unit: 'kcal', color: 'text-primary' },
                    { label: 'Protéines', value: Math.round(currentDay.total_protein), unit: 'g', color: 'text-secondary' },
                    { label: 'Glucides', value: Math.round(currentDay.total_carbs), unit: 'g', color: 'text-yellow-500' },
                    { label: 'Lipides', value: Math.round(currentDay.total_fat), unit: 'g', color: 'text-accent' },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className="bg-warm-100 rounded-xl py-2">
                      <p className={`text-lg font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-gray-400">{unit}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Repas */}
              <div className="space-y-3">
                {currentDay.meals.map(meal => (
                  <MealCard key={meal.meal_id} meal={meal} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
