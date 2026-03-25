import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useRecipe } from '../hooks/useLibrary'
import { useAddSlot } from '../hooks/useCalendar'

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

function extractTikTokId(url: string): string | null {
  const match = url.match(/video\/(\d+)/)
  return match ? match[1] : null
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const addToParam = searchParams.get('addTo')

  const { data: recipe, isLoading } = useRecipe(id ?? null)
  const addSlot = useAddSlot()

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedMeal, setSelectedMeal] = useState('déjeuner')

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!recipe) return null

  const tikTokId = recipe.tiktok_url ? extractTikTokId(recipe.tiktok_url) : null

  return (
    <div className="min-h-screen bg-warm text-brand pb-24">
      {/* Header */}
      <header className="border-b border-warm-200 bg-white px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-brand transition">←</button>
        <h1 className="font-bold text-base truncate max-w-[60%] text-center">{recipe.name}</h1>
        <div className="w-8" />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── HERO IMAGE ── */}
        <div className="rounded-2xl overflow-hidden aspect-video bg-warm-200 flex items-center justify-center">
          {recipe.image_urls.length > 0 ? (
            <img src={recipe.image_urls[0]} alt={recipe.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <span className="text-6xl">🍽️</span>
              <p className="text-sm">Pas encore de photo</p>
            </div>
          )}
        </div>

        {/* ── TIKTOK VIDEO ── */}
        {tikTokId ? (
          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Vidéo TikTok</p>
            <div className="rounded-2xl overflow-hidden" style={{ maxHeight: 500 }}>
              <iframe
                src={`https://www.tiktok.com/embed/v2/${tikTokId}`}
                className="w-full"
                style={{ height: 500, border: 'none' }}
                allowFullScreen
                allow="encrypted-media"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-card">
            <span className="text-2xl">🎵</span>
            <div>
              <p className="font-semibold text-sm text-brand">Vidéo TikTok</p>
              <p className="text-xs text-gray-400">Bientôt disponible pour cette recette</p>
            </div>
          </div>
        )}

        {/* ── SCORE ── */}
        {recipe.score !== null && <ScoreBar score={recipe.score} />}

        {/* ── MACROS ── */}
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

        {/* ── META ── */}
        <div className="flex gap-4 text-sm text-gray-400">
          <span>⏱ {recipe.prep_time_min} min</span>
          <span className="capitalize">📊 {recipe.difficulty}</span>
          {recipe.subcategory && <span>🏷️ {recipe.subcategory.name}</span>}
        </div>

        {recipe.description && (
          <p className="text-gray-500 text-sm leading-relaxed">{recipe.description}</p>
        )}

        {/* ── INGREDIENTS ── */}
        {recipe.ingredients.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ingrédients</p>
            <div className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 shadow-card">
                  <span className="text-brand text-sm">{ing.name}</span>
                  <span className="text-gray-400 text-sm">
                    {ing.quantity_g}{ing.unit ? ` ${ing.unit}` : 'g'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ÉTAPES ── */}
        {recipe.steps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Préparation</p>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600">
                  <span className="bg-primary text-white font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

      </div>

      {/* ── FLOATING ADD BUTTON ── */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4">
        <button
          onClick={() => addToParam ? handleAdd() : setShowAddModal(true)}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-primary/25 transition"
        >
          📅 Ajouter au calendrier
        </button>
      </div>

      {/* ── ADD MODAL ── */}
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
