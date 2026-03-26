import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import type { RecipeDetail } from '../../api/libraryApi'

type Ingredient = { name: string; quantity_g: number; unit: string }
type Step = { text: string; timer_min: number | undefined }

const EMPTY: Omit<RecipeDetail, 'id' | 'is_saved' | 'likes_count' | 'saves_count'> = {
  name: '',
  description: null,
  subcategory: null,
  subcategory_id: undefined as unknown as never,
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  prep_time_min: 20,
  difficulty: 'facile',
  ingredients: [],
  steps: [],
  tiktok_url: null,
  tiktok_video_id: null,
  image_urls: [],
  creator_handle: null,
  creator_name: null,
  tags: [],
  plating_tip: null,
  score: null,
  created_at: null,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
      <p className="font-bold text-brand text-base border-b border-warm-100 pb-2">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'w-full border border-warm-200 rounded-xl px-3 py-2 text-sm text-brand focus:outline-none focus:border-primary'

export function AdminRecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin', 'recipe', id],
    queryFn: () => adminApi.getRecipe(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState({ ...EMPTY })
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tiktokPreview, setTiktokPreview] = useState<string | null>(null)

  useEffect(() => {
    if (existing) {
      setForm(existing as unknown as typeof EMPTY)
      setIngredients((existing.ingredients as unknown as Ingredient[]) ?? [])
      setSteps(
        (existing.steps ?? []).map(s =>
          typeof s === 'string' ? { text: s, timer_min: undefined } : s as Step
        )
      )
    }
  }, [existing])

  // Auto-fill tiktok_video_id from URL
  const handleTikTokUrl = (url: string) => {
    setForm(prev => ({ ...prev, tiktok_url: url }))
    const match = url.match(/video\/(\d+)/)
    if (match) {
      setForm(prev => ({ ...prev, tiktok_video_id: match[1] }))
      setTiktokPreview(match[1])
    }
  }

  // Auto-calc calories
  const handleMacro = (field: 'protein' | 'carbs' | 'fat', val: string) => {
    const num = val ? Number(val) : null
    setForm(prev => {
      const updated = { ...prev, [field]: num }
      const p = updated.protein ?? 0
      const c = updated.carbs ?? 0
      const f = updated.fat ?? 0
      updated.calories = Math.round(p * 4 + c * 4 + f * 9)
      return updated
    })
  }

  // Ingredient parser from raw text
  const parseIngredients = (text: string) => {
    const lines = text.split('\n').filter(Boolean)
    const parsed: Ingredient[] = lines.map(line => {
      const m = line.match(/^(\d+(?:[.,]\d+)?)\s*(g|ml|cs|cc|pièce|pcs)?\s+(.+)$/i)
      if (m) return { quantity_g: Number(m[1].replace(',', '.')), unit: m[2] ?? 'g', name: m[3].trim() }
      return { quantity_g: 0, unit: 'g', name: line.trim() }
    })
    setIngredients(prev => [...prev, ...parsed])
  }

  const save = useMutation({
    mutationFn: (draft: boolean) => {
      const payload = {
        ...form,
        ingredients,
        steps,
        tags: form.tags,
      }
      return isEdit
        ? adminApi.updateRecipe(id!, payload)
        : adminApi.createRecipe(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'recipes'] })
      qc.invalidateQueries({ queryKey: ['library'] })
      navigate('/admin/recipes')
    },
  })

  if (isEdit && isLoading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/recipes')} className="text-gray-400 hover:text-brand">←</button>
        <h1 className="text-2xl font-bold text-brand">{isEdit ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
      </div>

      {/* INFOS GÉNÉRALES */}
      <Section title="Infos générales">
        <Field label="Nom de la recette *">
          <input className={INPUT} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Bowl poulet skyr" />
        </Field>
        <Field label="Description">
          <textarea className={INPUT} rows={2} value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Handle TikTok créateur">
            <input className={INPUT} value={form.creator_handle ?? ''} onChange={e => setForm(p => ({ ...p, creator_handle: e.target.value }))} placeholder="@pseudo" />
          </Field>
          <Field label="Nom du créateur">
            <input className={INPUT} value={form.creator_name ?? ''} onChange={e => setForm(p => ({ ...p, creator_name: e.target.value }))} placeholder="Bastien Swiss Fit Cook" />
          </Field>
        </div>
        <Field label="Lien TikTok">
          <input
            className={INPUT}
            value={form.tiktok_url ?? ''}
            onChange={e => handleTikTokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@.../video/..."
          />
        </Field>
        {tiktokPreview && (
          <div className="rounded-xl overflow-hidden border border-warm-200">
            <iframe src={`https://www.tiktok.com/embed/v2/${tiktokPreview}`} className="w-full" style={{ height: 300, border: 'none' }} allowFullScreen />
          </div>
        )}
        <Field label="URL image principale">
          <input className={INPUT} value={form.image_urls?.[0] ?? ''} onChange={e => setForm(p => ({ ...p, image_urls: [e.target.value] }))} placeholder="https://..." />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Difficulté">
            <select className={INPUT} value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
              <option value="facile">Facile</option>
              <option value="moyen">Moyen</option>
              <option value="difficile">Difficile</option>
            </select>
          </Field>
          <Field label="Temps de prépa (min)">
            <input type="number" className={INPUT} value={form.prep_time_min} onChange={e => setForm(p => ({ ...p, prep_time_min: Number(e.target.value) }))} />
          </Field>
        </div>
        <Field label="Tags (Entrée pour ajouter)">
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.tags ?? []).map((tag, i) => (
              <span key={i} className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                #{tag}
                <button onClick={() => setForm(p => ({ ...p, tags: (p.tags ?? []).filter((_, j) => j !== i) }))} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <input
            className={INPUT}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && tagInput.trim()) {
                e.preventDefault()
                setForm(p => ({ ...p, tags: [...(p.tags ?? []), tagInput.trim()] }))
                setTagInput('')
              }
            }}
            placeholder="Ex: bowl, poulet, viral…"
          />
        </Field>
      </Section>

      {/* MACROS */}
      <Section title="Macros">
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'calories', label: 'Kcal', readOnly: true },
            { key: 'protein', label: 'Protéines (g)' },
            { key: 'carbs', label: 'Glucides (g)' },
            { key: 'fat', label: 'Lipides (g)' },
          ].map(({ key, label, readOnly }) => (
            <Field key={key} label={label}>
              <input
                type="number"
                className={INPUT + (readOnly ? ' bg-warm-50 text-gray-400' : '')}
                readOnly={readOnly}
                value={(form as Record<string, unknown>)[key] as number ?? ''}
                onChange={e => {
                  if (key !== 'calories') handleMacro(key as 'protein' | 'carbs' | 'fat', e.target.value)
                }}
              />
            </Field>
          ))}
        </div>
        <p className="text-xs text-gray-400">Les calories se calculent automatiquement depuis P×4 + G×4 + L×9.</p>
      </Section>

      {/* INGRÉDIENTS */}
      <Section title="Ingrédients">
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="number" placeholder="Qté" className={INPUT + ' w-20'} value={ing.quantity_g} onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, quantity_g: Number(e.target.value) } : x))} />
              <select className={INPUT + ' w-24'} value={ing.unit} onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))}>
                {['g', 'ml', 'cs', 'cc', 'pièce'].map(u => <option key={u}>{u}</option>)}
              </select>
              <input className={INPUT + ' flex-1'} value={ing.name} onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Nom de l'ingrédient" />
              <button onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-lg shrink-0">×</button>
            </div>
          ))}
        </div>
        <button onClick={() => setIngredients(prev => [...prev, { name: '', quantity_g: 0, unit: 'g' }])} className="text-sm text-primary hover:underline">+ Ajouter un ingrédient</button>
        <div className="border-t border-warm-100 pt-3">
          <p className="text-xs text-gray-400 mb-1">Import rapide (coller une liste)</p>
          <textarea
            className={INPUT}
            rows={3}
            placeholder="150g poulet cuit&#10;200ml lait&#10;2 cs skyr"
            onBlur={e => { if (e.target.value) { parseIngredients(e.target.value); e.target.value = '' } }}
          />
        </div>
      </Section>

      {/* ÉTAPES */}
      <Section title="Étapes">
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-2">{i + 1}</span>
              <div className="flex-1 space-y-1">
                <textarea
                  className={INPUT}
                  rows={2}
                  value={step.text}
                  onChange={e => setSteps(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                  placeholder="Décris l'étape…"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Timer (min) :</label>
                  <input
                    type="number"
                    className="border border-warm-200 rounded-lg px-2 py-1 text-xs w-16 focus:outline-none focus:border-primary"
                    value={step.timer_min ?? ''}
                    onChange={e => setSteps(prev => prev.map((x, j) => j === i ? { ...x, timer_min: e.target.value ? Number(e.target.value) : undefined } : x))}
                    placeholder="—"
                  />
                </div>
              </div>
              <button onClick={() => setSteps(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-lg mt-2 shrink-0">×</button>
            </div>
          ))}
        </div>
        <button onClick={() => setSteps(prev => [...prev, { text: '', timer_min: undefined }])} className="text-sm text-primary hover:underline">+ Ajouter une étape</button>
      </Section>

      {/* CONSEIL DE DRESSAGE */}
      <Section title="Conseil de dressage (optionnel)">
        <textarea className={INPUT} rows={2} value={form.plating_tip ?? ''} onChange={e => setForm(p => ({ ...p, plating_tip: e.target.value }))} placeholder="Ex: Dispose les ingrédients en éventail…" />
      </Section>

      {/* ACTIONS */}
      <div className="flex gap-3 pb-8">
        <button onClick={() => navigate('/admin/recipes')} className="flex-1 border border-warm-200 text-gray-500 font-medium py-3 rounded-2xl hover:bg-warm-100 transition">
          Annuler
        </button>
        <button
          onClick={() => save.mutate(false)}
          disabled={save.isPending || !form.name}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
        >
          {save.isPending ? 'Enregistrement…' : isEdit ? '✅ Enregistrer' : '🚀 Publier'}
        </button>
      </div>
    </div>
  )
}
