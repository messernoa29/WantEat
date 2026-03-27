import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useRecipe, useSaveRecipe } from '../hooks/useLibrary'
import { useAddSlot } from '../hooks/useCalendar'
import { useAuth } from '../hooks/useAuth'
import { GuestBanner } from '../components/layout/GuestBanner'

const MEAL_TYPES = ['petit-déjeuner', 'déjeuner', 'collation', 'dîner']
const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-accent' :
    score >= 60 ? 'bg-secondary' :
    score >= 40 ? 'bg-primary' : 'bg-red-400'

  const label =
    score >= 80 ? 'Parfait pour toi 🎯' :
    score >= 60 ? 'Bon choix 👍' :
    score >= 40 ? 'Moyen ⚠️' : 'Pas idéal ❌'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-sm text-brand">Score objectif</p>
        <span className="font-bold text-lg text-brand">{score}%</span>
      </div>
      <div className="h-3 bg-warm-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{label} — basé sur tes macros cibles</p>
    </div>
  )
}

function StepTimer({ minutes }: { minutes: number }) {
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    if (running) return
    setRunning(true)
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id)
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setIntervalId(id)
  }

  const reset = () => {
    if (intervalId) clearInterval(intervalId)
    setRunning(false)
    setRemaining(minutes * 60)
  }

  const mm = Math.floor(remaining / 60).toString().padStart(2, '0')
  const ss = (remaining % 60).toString().padStart(2, '0')

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs font-mono bg-warm-100 px-2 py-0.5 rounded text-brand">{mm}:{ss}</span>
      <button onClick={running ? reset : start} className="text-xs text-primary hover:underline">
        {running ? 'Réinitialiser' : remaining < minutes * 60 ? 'Reprendre' : 'Démarrer'}
      </button>
    </div>
  )
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const addToParam = searchParams.get('addTo')
  const { isGuest } = useAuth()

  const { data: recipe, isLoading } = useRecipe(id ?? null)
  const addSlot = useAddSlot()
  const saveRecipe = useSaveRecipe()

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedMeal, setSelectedMeal] = useState('déjeuner')
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [showTikTok, setShowTikTok] = useState(true)

  const toggleIngredient = (i: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleAdd = async () => {
    if (!recipe) return
    if (addToParam) {
      const [day, mealType] = addToParam.split(':')
      await addSlot.mutateAsync({ day_index: Number(day), meal_type: mealType, recipe_id: recipe.id })
      navigate('/calendar')
    } else {
      await addSlot.mutateAsync({ day_index: selectedDay, meal_type: selectedMeal, recipe_id: recipe.id })
      setShowAddModal(false)
    }
  }

  const handleSave = () => {
    if (!recipe) return
    saveRecipe.mutate({ id: recipe.id, saved: recipe.is_saved })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!recipe) return null

  const tikTokId = recipe.tiktok_video_id || (recipe.tiktok_url?.match(/video\/(\d+)/)?.[1] ?? null)

  return (
    <div className="min-h-screen bg-warm text-brand pb-28">
      {isGuest && <GuestBanner />}
      {/* Header */}
      <header className="border-b border-warm-200 bg-white px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-brand transition">←</button>
        <h1 className="font-bold text-base truncate max-w-[60%] text-center">{recipe.name}</h1>
        <button
          onClick={handleSave}
          disabled={saveRecipe.isPending}
          className={`text-xl transition ${recipe.is_saved ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
          title={recipe.is_saved ? 'Retirer des favoris' : 'Sauvegarder'}
        >
          {recipe.is_saved ? '♥' : '♡'}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* HERO : TikTok embed ou image de fallback */}
        {tikTokId ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Vidéo de la recette</p>
              <button
                onClick={() => setShowTikTok(v => !v)}
                className="text-xs text-gray-400 hover:text-primary transition"
              >
                {showTikTok ? 'Masquer' : '▶ Afficher'}
              </button>
            </div>
            {showTikTok && (
              <div className="rounded-2xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
                  className="w-full"
                  style={{ height: 560, border: 'none' }}
                  allowFullScreen
                  allow="encrypted-media"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden aspect-video bg-warm-200">
            {recipe.image_urls.length > 0 ? (
              <img src={recipe.image_urls[0]} alt={recipe.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <span className="text-6xl">🍽️</span>
                <p className="text-sm">Pas encore de photo</p>
              </div>
            )}
          </div>
        )}

        {/* CREATOR BADGE */}
        {recipe.creator_handle && (
          <a
            href={recipe.tiktok_url || `https://www.tiktok.com/${recipe.creator_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-card hover:bg-warm-50 transition"
          >
            <span className="text-2xl">🎵</span>
            <div>
              <p className="font-semibold text-sm text-brand">{recipe.creator_name || recipe.creator_handle}</p>
              <p className="text-xs text-primary">{recipe.creator_handle} · Voir la vidéo sur TikTok</p>
            </div>
            <span className="ml-auto text-gray-300">›</span>
          </a>
        )}

        {/* TAGS */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map(tag => (
              <span key={tag} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* SCORE */}
        {recipe.score !== null && <ScoreBar score={recipe.score} />}

        {/* MACROS */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Calories', value: recipe.calories, unit: 'kcal', color: 'text-primary' },
            { label: 'Protéines', value: recipe.protein, unit: 'g', color: 'text-secondary' },
            { label: 'Glucides', value: recipe.carbs, unit: 'g', color: 'text-yellow-500' },
            { label: 'Lipides', value: recipe.fat, unit: 'g', color: 'text-accent' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="bg-white rounded-2xl py-3 shadow-card">
              <p className={`text-lg font-bold ${color}`}>{value ? Math.round(value) : '—'}</p>
              <p className="text-xs text-gray-400">{unit}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* META */}
        <div className="flex gap-4 text-sm text-gray-400 flex-wrap">
          <span>⏱ {recipe.prep_time_min} min</span>
          <span className="capitalize">📊 {recipe.difficulty}</span>
          {recipe.subcategory && <span>🏷️ {recipe.subcategory.name}</span>}
          {recipe.saves_count > 0 && <span>♥ {recipe.saves_count} sauvegardes</span>}
        </div>

        {recipe.description && (
          <p className="text-gray-500 text-sm leading-relaxed">{recipe.description}</p>
        )}

        {/* INGREDIENTS with checkboxes */}
        {recipe.ingredients.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ingrédients</p>
              {checkedIngredients.size > 0 && (
                <button
                  onClick={() => setCheckedIngredients(new Set())}
                  className="text-xs text-gray-400 hover:text-primary"
                >
                  Tout décocher
                </button>
              )}
            </div>
            <div className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={i}
                  onClick={() => toggleIngredient(i)}
                  className={`flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-card cursor-pointer transition ${
                    checkedIngredients.has(i) ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                      checkedIngredients.has(i) ? 'bg-primary border-primary' : 'border-warm-200'
                    }`}>
                      {checkedIngredients.has(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-brand text-sm ${checkedIngredients.has(i) ? 'line-through' : ''}`}>
                      {ing.name}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {ing.quantity_g}{ing.unit ? ` ${ing.unit}` : 'g'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPES with timers */}
        {recipe.steps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Préparation</p>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => {
                const text = typeof step === 'string' ? step : step.text
                const timer = typeof step === 'string' ? undefined : step.timer_min
                return (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="bg-primary text-white font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <span className="leading-relaxed">{text}</span>
                      {timer && <StepTimer minutes={timer} />}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* PLATING TIP */}
        {recipe.plating_tip && (
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
            <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Conseil de dressage</p>
            <p className="text-sm text-gray-600">{recipe.plating_tip}</p>
          </div>
        )}

      </div>

      {/* FLOATING BUTTONS */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-3 px-4">
        <button
          onClick={handleSave}
          disabled={saveRecipe.isPending}
          className={`py-3.5 px-5 rounded-2xl font-bold shadow-lg transition ${
            recipe.is_saved
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-white text-gray-600 border border-warm-200 hover:border-yellow-400 hover:text-yellow-500'
          }`}
        >
          {recipe.is_saved ? '♥ Sauvegardé' : '♡ Sauvegarder'}
        </button>
        <button
          onClick={() => addToParam ? handleAdd() : setShowAddModal(true)}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-primary/25 transition"
        >
          📅 Ajouter au plan
        </button>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full bg-white rounded-t-3xl p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg text-brand">Ajouter au calendrier</h2>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Jour</p>
              <div className="flex gap-2 flex-wrap">
                {DAY_NAMES.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                      selectedDay === i ? 'bg-primary text-white' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Repas</p>
              <div className="flex gap-2 flex-wrap">
                {MEAL_TYPES.map(mt => (
                  <button
                    key={mt}
                    onClick={() => setSelectedMeal(mt)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition capitalize ${
                      selectedMeal === mt ? 'bg-primary text-white' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                    }`}
                  >
                    {mt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={addSlot.isPending}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
            >
              {addSlot.isPending ? 'Ajout…' : '✅ Confirmer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
