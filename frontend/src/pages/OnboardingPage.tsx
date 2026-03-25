import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSaveProfile } from '../hooks/useProfile'
import type { ProfileSave } from '../api/profileApi'

type FormData = ProfileSave

const DEFAULT: FormData = {
  first_name: '',
  age: 25,
  weight_kg: 75,
  height_cm: 175,
  gender: 'homme',
  goal: 'cut',
  target_weight_kg: 70,
  target_deadline: '',
  qualitative_goals: [],
  sport_days: [0, 2, 4],
  sport_types: [],
  sport_location: 'salle',
  sport_level: 'intermédiaire',
  meals_per_day: 3,
  diet_type: 'omnivore',
  cooking_time: 'normal',
  allergies: [],
  food_aversions: '',
}

function computeBMR(w: number, h: number, a: number, g: string) {
  const base = 10 * w + 6.25 * h - 5 * a
  return g === 'homme' ? base + 5 : base - 161
}
function computeTDEE(bmr: number, sportDays: number[]) {
  const n = sportDays.length
  return (bmr * 1.55 * n + bmr * 1.2 * (7 - n)) / 7
}
function goalEstimate(current: number, target: number, tdee: number, goal: string) {
  if (Math.abs(current - target) < 0.5) return null
  const deficit = goal === 'cut' ? Math.min(350, tdee * 0.2) : goal === 'recomp' ? 175 : 0
  if (deficit <= 0) return null
  const wk = deficit * 7 / 7700
  if (wk < 0.01) return null
  return { weeks: Math.max(1, Math.round(Math.abs(current - target) / wk)), weeklyKg: Math.round(wk * 100) / 100 }
}

const DAY_SHORT = ['L', 'M', 'Me', 'J', 'V', 'S', 'D']
const DAY_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function SliderInput({ label, value, min, max, step = 1, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <p className="text-sm font-semibold text-brand">{label}</p>
        <div className="flex items-center gap-1">
          <input type="number" value={value} min={min} max={max} step={step}
            onChange={e => onChange(parseFloat(e.target.value) || min)}
            className="w-16 text-right font-bold text-primary text-lg border-none outline-none bg-transparent" />
          <span className="text-gray-500 text-sm">{unit}</span>
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full" />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min} {unit}</span><span>{max} {unit}</span>
      </div>
    </div>
  )
}

function Pill({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${value === o ? 'bg-primary text-white' : 'bg-warm-100 text-brand hover:bg-warm-200'}`}
        >{o}</button>
      ))}
    </div>
  )
}

function MultiGrid({ options, selected, onChange, cols = 2 }: {
  options: { label: string; value: string; emoji?: string }[]
  selected: string[]; onChange: (v: string[]) => void; cols?: number
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(({ label, value, emoji }) => (
        <button key={value} type="button" onClick={() => toggle(value)}
          className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium text-left transition ${
            selected.includes(value) ? 'border-primary bg-primary/5 text-primary' : 'border-warm-200 bg-white text-brand hover:border-primary/30'
          }`}
        >
          {emoji && <span>{emoji}</span>}
          <span className="leading-tight">{label}</span>
        </button>
      ))}
    </div>
  )
}

function S1({ d, u }: { d: FormData; u: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Prénom</p>
        <input type="text" placeholder="Comment on t'appelle ?" value={d.first_name ?? ''}
          onChange={e => u('first_name', e.target.value)}
          className="w-full bg-white border-2 border-warm-200 rounded-xl px-4 py-3 text-brand font-medium focus:outline-none focus:border-primary transition" />
      </div>
      <div className="grid grid-cols-2 gap-3 items-start">
        <div>
          <p className="text-sm font-semibold text-brand mb-2">Âge</p>
          <input type="number" min={10} max={100} value={d.age}
            onChange={e => u('age', parseInt(e.target.value) || 18)}
            className="w-full bg-white border-2 border-warm-200 rounded-xl px-4 py-3 text-brand font-bold text-lg focus:outline-none focus:border-primary transition" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand mb-2">Sexe</p>
          <Pill options={['homme', 'femme', 'non-binaire']} value={d.gender} onChange={v => u('gender', v)} />
        </div>
      </div>
      <SliderInput label="Poids actuel" value={d.weight_kg} min={35} max={200} step={0.5} unit="kg" onChange={v => u('weight_kg', v)} />
      <SliderInput label="Taille" value={d.height_cm} min={140} max={220} unit="cm" onChange={v => u('height_cm', v)} />
    </div>
  )
}

function S2({ d, u }: { d: FormData; u: (k: keyof FormData, v: unknown) => void }) {
  const bmr = computeBMR(d.weight_kg, d.height_cm, d.age, d.gender)
  const tdee = computeTDEE(bmr, d.sport_days)
  const est = d.target_weight_kg ? goalEstimate(d.weight_kg, d.target_weight_kg, tdee, d.goal) : null
  const tooFast = est && est.weeklyKg > 0.75

  return (
    <div className="space-y-6">
      <SliderInput label="Poids cible" value={d.target_weight_kg ?? d.weight_kg} min={35} max={200} step={0.5} unit="kg" onChange={v => u('target_weight_kg', v)} />
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Délai souhaité (optionnel)</p>
        <input type="text" placeholder="dans 3 mois, d'ici l'été…" value={d.target_deadline ?? ''}
          onChange={e => u('target_deadline', e.target.value)}
          className="w-full bg-white border-2 border-warm-200 rounded-xl px-4 py-3 text-brand focus:outline-none focus:border-primary transition" />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Objectif principal</p>
        <MultiGrid cols={2} options={[
          { label: 'Perte de gras', value: 'cut', emoji: '🔥' },
          { label: 'Prise de masse', value: 'bulk', emoji: '💪' },
          { label: 'Recomposition', value: 'recomp', emoji: '⚡' },
          { label: 'Maintien', value: 'maintain', emoji: '🎯' },
        ]} selected={[d.goal]} onChange={v => u('goal', v[v.length - 1] ?? 'maintain')} />
      </div>
      {est && (
        <div className={`bg-white rounded-2xl shadow-card p-4 border-2 ${tooFast ? 'border-orange-300' : 'border-accent/40'}`}>
          {tooFast ? (
            <><p className="text-orange-500 font-bold mb-1">⚠️ Rythme trop rapide</p>
              <p className="text-sm text-gray-600">{est.weeklyKg} kg/sem dépasse 0.5 kg recommandés pour préserver ton muscle.</p></>
          ) : (
            <><p className="text-accent font-bold mb-1">✅ Objectif réaliste</p>
              <p className="text-sm text-gray-600">De <strong>{d.weight_kg} kg</strong> à <strong>{d.target_weight_kg} kg</strong> en <strong>~{est.weeks} semaines</strong> ({est.weeklyKg} kg/sem) 💪</p></>
          )}
        </div>
      )}
    </div>
  )
}

function S3({ d, u }: { d: FormData; u: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <MultiGrid cols={1} options={[
        { label: 'Perdre du gras', value: 'perdre-gras', emoji: '🔥' },
        { label: 'Prendre du muscle', value: 'prendre-muscle', emoji: '💪' },
        { label: 'Recomposition (les deux)', value: 'recomp', emoji: '⚡' },
        { label: 'Améliorer mes performances sportives', value: 'performance', emoji: '🏆' },
        { label: 'Manger sainement sans me priver', value: 'sante', emoji: '🥗' },
        { label: 'Préparer un événement (mariage, compétition…)', value: 'evenement', emoji: '📅' },
      ]} selected={d.qualitative_goals} onChange={v => u('qualitative_goals', v)} />
    </div>
  )
}

function S4({ d, u }: { d: FormData; u: (k: keyof FormData, v: unknown) => void }) {
  const toggleDay = (i: number) => {
    const days = d.sport_days.includes(i) ? d.sport_days.filter(x => x !== i) : [...d.sport_days, i].sort()
    u('sport_days', days)
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand mb-3">Jours d'entraînement</p>
        <div className="flex gap-2 justify-between">
          {DAY_SHORT.map((day, i) => (
            <button key={i} type="button" onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition ${d.sport_days.includes(i) ? 'bg-primary text-white' : 'bg-warm-100 text-brand hover:bg-warm-200'}`}
            >{day}</button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {d.sport_days.length} j/sem — {d.sport_days.map(i => DAY_FULL[i]).join(', ') || 'Aucun'}
        </p>
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Type de sport</p>
        <MultiGrid cols={2} options={[
          { label: 'Musculation', value: 'musculation', emoji: '🏋️' },
          { label: 'Running', value: 'running', emoji: '🏃' },
          { label: 'Vélo', value: 'velo', emoji: '🚴' },
          { label: 'Natation', value: 'natation', emoji: '🏊' },
          { label: 'Sports collectifs', value: 'collectif', emoji: '⚽' },
          { label: 'HIIT', value: 'hiit', emoji: '🔥' },
          { label: 'Yoga / Pilates', value: 'yoga', emoji: '🧘' },
          { label: 'Plein air', value: 'plein-air', emoji: '🌿' },
        ]} selected={d.sport_types} onChange={v => u('sport_types', v)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Lieu d'entraînement</p>
        <Pill options={['salle', 'maison', 'plein air', 'les trois']} value={d.sport_location ?? 'salle'} onChange={v => u('sport_location', v)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Ton niveau</p>
        <Pill options={['débutant', 'intermédiaire', 'avancé']} value={d.sport_level ?? 'intermédiaire'} onChange={v => u('sport_level', v)} />
      </div>
    </div>
  )
}

function S5({ d, u }: { d: FormData; u: (k: keyof FormData, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Régime alimentaire</p>
        <Pill options={['omnivore', 'sans porc', 'végétarien', 'vegan', 'sans gluten']} value={d.diet_type} onChange={v => u('diet_type', v)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Allergies & intolérances</p>
        <MultiGrid cols={3} options={[
          { label: 'Lactose', value: 'lactose' }, { label: 'Gluten', value: 'gluten' },
          { label: 'Noix', value: 'noix' }, { label: 'Fruits de mer', value: 'fruits-de-mer' },
          { label: 'Œufs', value: 'oeufs' }, { label: 'Autres', value: 'autres' },
        ]} selected={d.allergies} onChange={v => u('allergies', v)} />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Temps de cuisine</p>
        <MultiGrid cols={1} options={[
          { label: 'Rapide (< 15 min)', value: 'rapide', emoji: '⚡' },
          { label: 'Normal (~30 min)', value: 'normal', emoji: '🍳' },
          { label: 'Meal prep le dimanche', value: 'meal_prep', emoji: '📦' },
        ]} selected={[d.cooking_time]} onChange={v => u('cooking_time', v[v.length - 1] ?? 'normal')} />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Repas par jour</p>
        <Pill options={['2', '3', '4', '5']} value={String(d.meals_per_day)} onChange={v => u('meals_per_day', parseInt(v))} />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand mb-2">Aversions alimentaires (optionnel)</p>
        <textarea placeholder="Je n'aime pas… les champignons, le chou-fleur…"
          value={d.food_aversions ?? ''} onChange={e => u('food_aversions', e.target.value)} rows={3}
          className="w-full bg-white border-2 border-warm-200 rounded-xl px-4 py-3 text-brand text-sm focus:outline-none focus:border-primary transition resize-none" />
      </div>
    </div>
  )
}

function Summary({ d }: { d: FormData }) {
  const bmr = computeBMR(d.weight_kg, d.height_cm, d.age, d.gender)
  const tdee = computeTDEE(bmr, d.sport_days)
  const est = d.target_weight_kg ? goalEstimate(d.weight_kg, d.target_weight_kg, tdee, d.goal) : null
  const gl: Record<string, string> = { cut: '🔥 Perte de gras', bulk: '💪 Prise de masse', recomp: '⚡ Recomposition', maintain: '🎯 Maintien' }
  const C = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-2xl shadow-card p-5 ${className}`}>{children}</div>
  )
  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <p className="text-3xl font-bold text-brand">{d.first_name ? `Super ${d.first_name} !` : 'Profil prêt !'}</p>
        <p className="text-gray-500 mt-1">Ta feuille de route personnalisée 🚀</p>
      </div>
      <C>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Profil physique</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Poids', `${d.weight_kg} kg`], ['Taille', `${d.height_cm} cm`], ['Âge', `${d.age} ans`]].map(([l, v]) => (
            <div key={l}><p className="text-lg font-bold text-brand">{v}</p><p className="text-xs text-gray-400">{l}</p></div>
          ))}
        </div>
      </C>
      <C>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Objectif</p>
        <p className="font-bold text-lg text-primary mb-1">{gl[d.goal]}</p>
        {d.target_weight_kg && (
          <p className="text-sm text-gray-600">{d.weight_kg} kg → <strong>{d.target_weight_kg} kg</strong>{est && ` en ~${est.weeks} semaines`}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">TDEE moyen : ~{Math.round(tdee)} kcal/jour</p>
      </C>
      <C>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Sport</p>
        <p className="text-sm text-brand"><strong>{d.sport_days.length} séances/sem</strong> — {d.sport_days.map(i => DAY_FULL[i]).join(', ') || 'Aucune'}</p>
        {d.sport_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {d.sport_types.map(s => <span key={s} className="text-xs bg-warm-100 px-2 py-0.5 rounded-full text-gray-600">{s}</span>)}
          </div>
        )}
      </C>
      <C>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Alimentation</p>
        <p className="text-sm text-brand capitalize">{d.diet_type} · {d.meals_per_day} repas/j · {d.cooking_time}</p>
      </C>
    </div>
  )
}

const TITLES = ['Profil physique', 'Ton objectif', 'Tes motivations', 'Sport & activité', 'Alimentation']

export function OnboardingPage() {
  const navigate = useNavigate()
  const save = useSaveProfile()
  const [step, setStep] = useState(1)
  const [showSummary, setShowSummary] = useState(false)
  const [formData, setFormData] = useState<FormData>(DEFAULT)

  const update = useCallback((key: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  if (showSummary) {
    return (
      <div className="min-h-screen bg-warm">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          <Summary d={formData} />
          <button onClick={async () => { await save.mutateAsync(formData); navigate('/dashboard') }}
            disabled={save.isPending}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl text-lg transition disabled:opacity-50"
          >{save.isPending ? 'Enregistrement…' : "✨ C'est parti — génère mon premier plan"}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex gap-1.5 mb-6">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-warm-200'}`} />
          ))}
        </div>
        <div className="mb-6">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Étape {step}/5</p>
          <h1 className="text-2xl font-bold text-brand">{TITLES[step - 1]}</h1>
        </div>
        <div key={step}>
          {step === 1 && <S1 d={formData} u={update} />}
          {step === 2 && <S2 d={formData} u={update} />}
          {step === 3 && <S3 d={formData} u={update} />}
          {step === 4 && <S4 d={formData} u={update} />}
          {step === 5 && <S5 d={formData} u={update} />}
        </div>
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 py-3.5 rounded-2xl border-2 border-warm-200 font-bold text-brand hover:bg-warm-100 transition"
            >← Retour</button>
          )}
          <button onClick={() => step < 5 ? setStep(step + 1) : setShowSummary(true)}
            className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition"
          >{step === 5 ? 'Voir mon résumé →' : 'Continuer →'}</button>
        </div>
      </div>
    </div>
  )
}
