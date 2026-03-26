import { useNavigate } from 'react-router-dom'
import { useCalendarSlots, useRemoveSlot } from '../hooks/useCalendar'
import type { WeeklySlot } from '../api/calendarApi'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const MEAL_TYPES = ['petit-déjeuner', 'déjeuner', 'collation', 'dîner']
const MEAL_EMOJIS: Record<string, string> = {
  'petit-déjeuner': '🌅',
  'déjeuner': '🍽️',
  'collation': '🍎',
  'dîner': '🌙',
}

function SlotCell({
  slot,
  dayIndex,
  mealType,
  onAdd,
  onRemove,
}: {
  slot: WeeklySlot | null
  dayIndex: number
  mealType: string
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  const recipe = slot?.recipe

  return (
    <div className="min-h-[72px]">
      {recipe ? (
        <div className="bg-white rounded-xl p-2 relative group shadow-card">
          <p className="text-xs font-semibold text-brand leading-tight truncate pr-5">{recipe.name}</p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {recipe.calories && (
              <span className="text-[10px] text-primary font-medium">{Math.round(recipe.calories)} kcal</span>
            )}
            {recipe.protein && (
              <span className="text-[10px] text-secondary font-medium">P {Math.round(recipe.protein)}g</span>
            )}
          </div>
          <button
            onClick={() => slot && onRemove(slot.id)}
            className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-400 transition text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="w-full min-h-[72px] border border-dashed border-warm-300 hover:border-primary/40 hover:bg-primary/5 rounded-xl flex items-center justify-center transition"
        >
          <span className="text-gray-300 hover:text-primary text-xl transition">+</span>
        </button>
      )}
    </div>
  )
}

export function CalendarPage() {
  const navigate = useNavigate()
  const { data: slots, isLoading } = useCalendarSlots()
  const removeSlot = useRemoveSlot()

  const getSlot = (dayIndex: number, mealType: string): WeeklySlot | null => {
    return slots?.find(s => s.day_index === dayIndex && s.meal_type === mealType) ?? null
  }

  const totalCalories = slots?.reduce((sum, s) => sum + (s.recipe?.calories ?? 0), 0) ?? 0
  const totalProtein = slots?.reduce((sum, s) => sum + (s.recipe?.protein ?? 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-warm text-brand pb-24">
      <header className="border-b border-warm-200 bg-white px-4 py-4 flex items-center justify-between">
        <div className="w-10" />
        <h1 className="font-bold text-lg">Calendrier semaine 📅</h1>
        <button
          onClick={() => navigate('/library')}
          className="text-xs bg-primary hover:bg-primary-dark text-white font-bold px-3 py-1.5 rounded-lg transition"
        >
          + Recette
        </button>
      </header>

      {/* Weekly totals */}
      {slots && slots.length > 0 && (
        <div className="max-w-full px-4 py-3 border-b border-warm-200 bg-white/60">
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">
              Cette semaine : <span className="text-primary font-bold">{Math.round(totalCalories)} kcal</span>
            </span>
            <span className="text-gray-500">
              Protéines : <span className="text-secondary font-bold">{Math.round(totalProtein)}g</span>
            </span>
            <span className="text-gray-400">{slots.length} repas planifiés</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto animate-fade-in">
          <div style={{ minWidth: 700 }} className="px-4 py-4">
            {/* Header row */}
            <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '90px repeat(7, 1fr)' }}>
              <div />
              {DAY_NAMES.map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wide py-1">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Meal rows */}
            {MEAL_TYPES.map(mealType => (
              <div
                key={mealType}
                className="grid gap-2 mb-2"
                style={{ gridTemplateColumns: '90px repeat(7, 1fr)' }}
              >
                {/* Row label */}
                <div className="flex items-center gap-1.5 pr-2">
                  <span className="text-base">{MEAL_EMOJIS[mealType]}</span>
                  <span className="text-xs text-gray-400 capitalize leading-tight">{mealType}</span>
                </div>

                {/* 7 day cells */}
                {DAY_NAMES.map((_, dayIndex) => {
                  const slot = getSlot(dayIndex, mealType)
                  return (
                    <SlotCell
                      key={dayIndex}
                      slot={slot}
                      dayIndex={dayIndex}
                      mealType={mealType}
                      onAdd={() => navigate(`/library?addTo=${dayIndex}:${mealType}`)}
                      onRemove={id => removeSlot.mutate(id)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!slots || slots.length === 0) && (
        <div className="text-center py-20 px-4">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-brand font-semibold text-lg mb-2">Calendrier vide</p>
          <p className="text-gray-500 text-sm mb-6">
            Ajoute des recettes de la bibliothèque à ta semaine.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition"
          >
            📚 Parcourir la bibliothèque
          </button>
        </div>
      )}
    </div>
  )
}
