import { useEffect, useState } from 'react'
import { useProfile, useSaveProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const GOALS = [
  { value: 'cut', label: 'Sèche', emoji: '🔥' },
  { value: 'recomp', label: 'Recompo', emoji: '⚡' },
  { value: 'maintain', label: 'Maintien', emoji: '🎯' },
  { value: 'bulk', label: 'Prise de masse', emoji: '💪' },
]

const DIETS = [
  { value: 'omnivore', label: 'Omnivore', emoji: '🥩' },
  { value: 'végétarien', label: 'Végétarien', emoji: '🥦' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'sans porc', label: 'Sans porc', emoji: '🚫' },
]

const COOKING = [
  { value: 'rapide', label: 'Rapide', emoji: '⚡' },
  { value: 'normal', label: 'Normal', emoji: '🍳' },
  { value: 'meal_prep', label: 'Meal prep', emoji: '📦' },
]

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const save = useSaveProfile()

  const [form, setForm] = useState({
    age: '',
    weight_kg: '',
    height_cm: '',
    gender: 'homme',
    goal: 'maintain',
    sport_days: [] as number[],
    meals_per_day: 3,
    diet_type: 'omnivore',
    cooking_time: 'normal',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        age: String(profile.age),
        weight_kg: String(profile.weight_kg),
        height_cm: String(profile.height_cm),
        gender: profile.gender,
        goal: profile.goal,
        sport_days: profile.sport_days,
        meals_per_day: profile.meals_per_day,
        diet_type: profile.diet_type,
        cooking_time: profile.cooking_time,
      })
    }
  }, [profile])

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const toggleDay = (day: number) =>
    set('sport_days', form.sport_days.includes(day)
      ? form.sport_days.filter(d => d !== day)
      : [...form.sport_days, day])

  const handleSave = async () => {
    await save.mutateAsync({
      age: parseInt(form.age),
      weight_kg: parseFloat(form.weight_kg),
      height_cm: parseFloat(form.height_cm),
      gender: form.gender,
      goal: form.goal,
      sport_days: form.sport_days,
      meals_per_day: form.meals_per_day,
      diet_type: form.diet_type,
      cooking_time: form.cooking_time,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm text-brand pb-24">
      <header className="border-b border-warm-200 bg-white px-4 py-4 flex items-center justify-center">
        <h1 className="font-bold text-lg">Mon profil 👤</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Email */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Compte</p>
          <p className="text-brand font-medium">{user?.email}</p>
        </div>

        {/* Infos physiques */}
        <div className="bg-white rounded-2xl p-5 space-y-4 shadow-card">
          <h2 className="font-bold text-brand">Informations physiques</h2>

          <div className="flex gap-3">
            {(['homme', 'femme'] as const).map(g => (
              <button
                key={g}
                onClick={() => set('gender', g)}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${
                  form.gender === g ? 'bg-primary text-white shadow-sm' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                }`}
              >
                {g === 'homme' ? '👨 Homme' : '👩 Femme'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'age', label: 'Âge', unit: 'ans' },
              { key: 'weight_kg', label: 'Poids', unit: 'kg' },
              { key: 'height_cm', label: 'Taille', unit: 'cm' },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={form[key as keyof typeof form] as string}
                    onChange={e => set(key, e.target.value)}
                    className="w-full bg-warm-100 text-brand rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-primary text-sm border border-warm-200"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Objectif */}
        <div className="bg-white rounded-2xl p-5 space-y-3 shadow-card">
          <h2 className="font-bold text-brand">Objectif</h2>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => set('goal', g.value)}
                className={`py-2.5 px-3 rounded-xl font-medium text-sm transition flex items-center gap-2 ${
                  form.goal === g.value ? 'bg-primary text-white shadow-sm' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                }`}
              >
                <span>{g.emoji}</span> {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sport */}
        <div className="bg-white rounded-2xl p-5 space-y-4 shadow-card">
          <h2 className="font-bold text-brand">Sport & repas</h2>
          <div>
            <p className="text-xs text-gray-500 mb-2">Jours d'entraînement</p>
            <div className="flex gap-1.5">
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                    form.sport_days.includes(i) ? 'bg-primary text-white shadow-sm' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {form.sport_days.length === 0 ? 'Sédentaire' : `${form.sport_days.length} séance${form.sport_days.length > 1 ? 's' : ''}/sem`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Repas par jour</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => set('meals_per_day', n)}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${
                    form.meals_per_day === n ? 'bg-primary text-white shadow-sm' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="bg-white rounded-2xl p-5 space-y-4 shadow-card">
          <h2 className="font-bold text-brand">Préférences alimentaires</h2>
          <div>
            <p className="text-xs text-gray-500 mb-2">Régime</p>
            <div className="grid grid-cols-2 gap-2">
              {DIETS.map(d => (
                <button
                  key={d.value}
                  onClick={() => set('diet_type', d.value)}
                  className={`py-2.5 px-3 rounded-xl font-medium text-sm transition flex items-center gap-2 ${
                    form.diet_type === d.value ? 'bg-primary text-white shadow-sm' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                  }`}
                >
                  <span>{d.emoji}</span> {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Temps de cuisine</p>
            <div className="flex gap-2">
              {COOKING.map(c => (
                <button
                  key={c.value}
                  onClick={() => set('cooking_time', c.value)}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition flex flex-col items-center gap-0.5 ${
                    form.cooking_time === c.value ? 'bg-primary text-white shadow-sm' : 'bg-warm-100 text-gray-600 hover:bg-warm-200'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span className="text-xs">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={save.isPending}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 text-lg shadow-sm"
        >
          {save.isPending ? 'Enregistrement…' : saved ? '✅ Sauvegardé !' : 'Sauvegarder les modifications'}
        </button>

        {save.isError && (
          <p className="text-red-500 text-sm text-center">
            Erreur : {(save.error as any)?.response?.data?.detail ?? 'Réessaie'}
          </p>
        )}
      </div>
    </div>
  )
}
