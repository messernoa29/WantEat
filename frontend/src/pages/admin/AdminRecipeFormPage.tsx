import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import { libraryApi } from '../../api/libraryApi'
import type { RecipeCategory } from '../../api/libraryApi'

type Ingredient = { name: string; quantity_g: number; unit: string }
type Step = { text: string; timer_min: number | undefined }

const EMPTY_FORM = {
  name: '',
  description: '' as string | null,
  subcategory_id: '' as string | undefined,
  calories: '' as unknown as number | null,
  protein: '' as unknown as number | null,
  carbs: '' as unknown as number | null,
  fat: '' as unknown as number | null,
  prep_time_min: 20,
  difficulty: 'facile',
  tiktok_url: '' as string | null,
  tiktok_video_id: '' as string | null,
  image_urls: [] as string[],
  creator_handle: '' as string | null,
  creator_name: '' as string | null,
  tags: [] as string[],
  plating_tip: '' as string | null,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
      <p className="font-bold text-brand text-base border-b border-warm-100 pb-2">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

const INPUT = 'w-full border border-warm-200 rounded-xl px-3 py-2 text-sm text-brand focus:outline-none focus:border-primary bg-white'

export function AdminRecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin', 'recipe', id],
    queryFn: () => adminApi.getRecipe(id!),
    enabled: isEdit,
  })

  const { data: categories } = useQuery({
    queryKey: ['library', 'categories'],
    queryFn: libraryApi.getCategories,
    staleTime: Infinity,
  })

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [tagInput, setTagInput] = useState('')
  const [pasteBuffer, setPasteBuffer] = useState('')
  const [saved, setSaved] = useState(false)

  // Catégorie sélectionnée dans le picker (pour filtrer les sous-catégories)
  const [pickerCategory, setPickerCategory] = useState<RecipeCategory | null>(null)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? '',
        description: existing.description ?? '',
        subcategory_id: (existing.subcategory?.id as string) ?? '',
        calories: existing.calories ?? ('' as unknown as null),
        protein: existing.protein ?? ('' as unknown as null),
        carbs: existing.carbs ?? ('' as unknown as null),
        fat: existing.fat ?? ('' as unknown as null),
        prep_time_min: existing.prep_time_min ?? 20,
        difficulty: existing.difficulty ?? 'facile',
        tiktok_url: existing.tiktok_url ?? '',
        tiktok_video_id: existing.tiktok_video_id ?? '',
        image_urls: existing.image_urls ?? [],
        creator_handle: existing.creator_handle ?? '',
        creator_name: existing.creator_name ?? '',
        tags: existing.tags ?? [],
        plating_tip: existing.plating_tip ?? '',
      })
      setIngredients((existing.ingredients as unknown as Ingredient[]) ?? [])
      setSteps(
        (existing.steps ?? []).map(s =>
          typeof s === 'string' ? { text: s, timer_min: undefined } : s as Step
        )
      )
      // Pré-sélectionner la catégorie du picker
      if (existing.subcategory && categories) {
        const cat = categories.find(c =>
          c.subcategories.some(sub => sub.id === (existing.subcategory!.id as unknown as string))
        )
        if (cat) setPickerCategory(cat)
      }
    }
  }, [existing, categories])

  const handleTikTokUrl = (url: string) => {
    setForm(prev => ({ ...prev, tiktok_url: url }))
    const match = url.match(/video\/(\d+)/)
    if (match) setForm(prev => ({ ...prev, tiktok_video_id: match[1] }))
  }

  const handleMacro = (field: 'protein' | 'carbs' | 'fat', val: string) => {
    const num = val ? Number(val) : null
    setForm(prev => {
      const updated = { ...prev, [field]: num }
      const p = Number(updated.protein) || 0
      const c = Number(updated.carbs) || 0
      const f = Number(updated.fat) || 0
      updated.calories = p || c || f ? Math.round(p * 4 + c * 4 + f * 9) : ('' as unknown as null)
      return updated
    })
  }

  const parseAndImportIngredients = () => {
    if (!pasteBuffer.trim()) return
    const lines = pasteBuffer.split('\n').filter(Boolean)
    const parsed: Ingredient[] = lines.map(line => {
      const m = line.match(/^(\d+(?:[.,]\d+)?)\s*(g|ml|cs|cc|pièce|pcs)?\s+(.+)$/i)
      if (m) return { quantity_g: Number(m[1].replace(',', '.')), unit: m[2] ?? 'g', name: m[3].trim() }
      return { quantity_g: 0, unit: 'g', name: line.trim() }
    })
    setIngredients(prev => [...prev, ...parsed])
    setPasteBuffer('')
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        subcategory_id: form.subcategory_id || undefined,
        calories: form.calories ? Number(form.calories) : null,
        protein: form.protein ? Number(form.protein) : null,
        carbs: form.carbs ? Number(form.carbs) : null,
        fat: form.fat ? Number(form.fat) : null,
        description: form.description || null,
        creator_handle: form.creator_handle || null,
        creator_name: form.creator_name || null,
        tiktok_url: form.tiktok_url || null,
        tiktok_video_id: form.tiktok_video_id || null,
        plating_tip: form.plating_tip || null,
        ingredients,
        steps,
      }
      return isEdit ? adminApi.updateRecipe(id!, payload) : adminApi.createRecipe(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'recipes'] })
      qc.invalidateQueries({ queryKey: ['library'] })
      setSaved(true)
      setTimeout(() => navigate('/admin/recipes'), 1200)
    },
  })

  if (isEdit && loadingExisting) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const imageUrl = form.image_urls?.[0]
  const tiktokId = form.tiktok_video_id

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/recipes')} className="text-gray-400 hover:text-brand text-xl">←</button>
        <h1 className="text-2xl font-bold text-brand">{isEdit ? 'Modifier la recette' : 'Nouvelle recette'}</h1>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-3 text-sm font-medium">
          ✅ Recette enregistrée ! Redirection…
        </div>
      )}

      {save.isError && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-3 text-sm">
          ❌ Erreur : {(save.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Réessaie'}
        </div>
      )}

      {/* INFOS GÉNÉRALES */}
      <Section title="Infos générales">
        <Field label="Nom de la recette *">
          <input
            className={INPUT}
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Bowl poulet skyr avocat"
          />
        </Field>

        <Field label="Description">
          <textarea
            className={INPUT}
            rows={2}
            value={form.description ?? ''}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Présentation courte de la recette…"
          />
        </Field>

        {/* Catégorie → Sous-catégorie */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Catégorie">
            <select
              className={INPUT}
              value={pickerCategory?.id ?? ''}
              onChange={e => {
                const cat = categories?.find(c => c.id === e.target.value) ?? null
                setPickerCategory(cat)
                setForm(p => ({ ...p, subcategory_id: '' }))
              }}
            >
              <option value="">— Choisir —</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Sous-catégorie *" hint={!pickerCategory ? 'Sélectionne une catégorie d\'abord' : undefined}>
            <select
              className={INPUT}
              value={form.subcategory_id ?? ''}
              disabled={!pickerCategory}
              onChange={e => setForm(p => ({ ...p, subcategory_id: e.target.value }))}
            >
              <option value="">— Choisir —</option>
              {pickerCategory?.subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.emoji} {sub.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Difficulté">
            <select className={INPUT} value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
              <option value="facile">Facile</option>
              <option value="moyen">Moyen</option>
              <option value="difficile">Difficile</option>
            </select>
          </Field>
          <Field label="Temps de prépa (min)">
            <input
              type="number"
              className={INPUT}
              value={form.prep_time_min}
              min={1}
              onChange={e => setForm(p => ({ ...p, prep_time_min: Number(e.target.value) }))}
            />
          </Field>
        </div>
      </Section>

      {/* CRÉATEUR & TIKTOK */}
      <Section title="Créateur & TikTok">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Handle TikTok">
            <input className={INPUT} value={form.creator_handle ?? ''} onChange={e => setForm(p => ({ ...p, creator_handle: e.target.value }))} placeholder="@pseudo" />
          </Field>
          <Field label="Nom du créateur">
            <input className={INPUT} value={form.creator_name ?? ''} onChange={e => setForm(p => ({ ...p, creator_name: e.target.value }))} placeholder="Bastien Swiss Fit Cook" />
          </Field>
        </div>
        <Field label="Lien TikTok" hint="L'ID vidéo sera extrait automatiquement">
          <input
            className={INPUT}
            value={form.tiktok_url ?? ''}
            onChange={e => handleTikTokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@.../video/7..."
          />
        </Field>
        {tiktokId && (
          <div className="rounded-xl overflow-hidden border border-warm-200 bg-black">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
              className="w-full"
              style={{ height: 400, border: 'none' }}
              allowFullScreen
            />
          </div>
        )}
      </Section>

      {/* IMAGE */}
      <Section title="Image">
        <Field label="URL image principale" hint="Unsplash, Imgur, ou tout lien HTTPS public">
          <input
            className={INPUT}
            value={form.image_urls?.[0] ?? ''}
            onChange={e => setForm(p => ({ ...p, image_urls: e.target.value ? [e.target.value] : [] }))}
            placeholder="https://images.unsplash.com/..."
          />
        </Field>
        {imageUrl && (
          <div className="relative rounded-xl overflow-hidden h-40 bg-warm-100">
            <img src={imageUrl} alt="Aperçu" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">Aperçu</span>
          </div>
        )}
      </Section>

      {/* MACROS */}
      <Section title="Macros nutritionnelles">
        <div className="grid grid-cols-4 gap-3">
          {[
            { key: 'calories', label: 'Kcal', readOnly: true, color: 'text-primary' },
            { key: 'protein', label: 'Protéines (g)', color: 'text-secondary' },
            { key: 'carbs', label: 'Glucides (g)', color: 'text-yellow-500' },
            { key: 'fat', label: 'Lipides (g)', color: 'text-accent' },
          ].map(({ key, label, readOnly, color }) => (
            <Field key={key} label={label}>
              <input
                type="number"
                min={0}
                className={INPUT + (readOnly ? ' bg-warm-50 cursor-default' : '')}
                readOnly={readOnly}
                value={(form as Record<string, unknown>)[key] as string ?? ''}
                onChange={e => {
                  if (!readOnly) handleMacro(key as 'protein' | 'carbs' | 'fat', e.target.value)
                }}
              />
              {readOnly && <p className={`text-xs font-bold mt-1 ${color}`}>auto-calculé</p>}
            </Field>
          ))}
        </div>
        <p className="text-xs text-gray-400">Kcal = Protéines×4 + Glucides×4 + Lipides×9</p>
      </Section>

      {/* TAGS */}
      <Section title="Tags">
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {(form.tags ?? []).map((tag, i) => (
            <span key={i} className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              #{tag}
              <button
                onClick={() => setForm(p => ({ ...p, tags: (p.tags ?? []).filter((_, j) => j !== i) }))}
                className="hover:text-red-500 font-bold"
              >×</button>
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
              if (!(form.tags ?? []).includes(tagInput.trim())) {
                setForm(p => ({ ...p, tags: [...(p.tags ?? []), tagInput.trim()] }))
              }
              setTagInput('')
            }
          }}
          placeholder="Tape un tag + Entrée (ex: bowl, viral, high-protein…)"
        />
      </Section>

      {/* INGRÉDIENTS */}
      <Section title="Ingrédients">
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Qté"
                className={INPUT + ' w-20'}
                value={ing.quantity_g || ''}
                min={0}
                onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, quantity_g: Number(e.target.value) } : x))}
              />
              <select
                className={INPUT + ' w-24'}
                value={ing.unit}
                onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))}
              >
                {['g', 'ml', 'cs', 'cc', 'pièce'].map(u => <option key={u}>{u}</option>)}
              </select>
              <input
                className={INPUT + ' flex-1'}
                value={ing.name}
                onChange={e => setIngredients(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                placeholder="Nom de l'ingrédient"
              />
              <button
                onClick={() => setIngredients(prev => prev.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 text-xl shrink-0 leading-none"
              >×</button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIngredients(prev => [...prev, { name: '', quantity_g: 0, unit: 'g' }])}
          className="text-sm text-primary hover:underline font-medium"
        >
          + Ajouter un ingrédient
        </button>

        {/* Import rapide */}
        <div className="border-t border-warm-100 pt-3 space-y-2">
          <p className="text-xs text-gray-400 font-medium">Import rapide — colle une liste</p>
          <textarea
            className={INPUT}
            rows={3}
            value={pasteBuffer}
            onChange={e => setPasteBuffer(e.target.value)}
            placeholder={'150g poulet cuit\n200ml lait\n2 cs skyr\n30g flocons d\'avoine'}
          />
          <button
            onClick={parseAndImportIngredients}
            disabled={!pasteBuffer.trim()}
            className="text-sm bg-warm-100 hover:bg-warm-200 text-brand font-medium px-4 py-1.5 rounded-lg transition disabled:opacity-40"
          >
            ↓ Importer les ingrédients
          </button>
        </div>
      </Section>

      {/* ÉTAPES */}
      <Section title="Étapes de préparation">
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="bg-primary text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-2">{i + 1}</span>
              <div className="flex-1 space-y-1.5">
                <textarea
                  className={INPUT}
                  rows={2}
                  value={step.text}
                  onChange={e => setSteps(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                  placeholder="Décris l'étape avec précision…"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">⏱ Timer :</span>
                  <input
                    type="number"
                    className="border border-warm-200 rounded-lg px-2 py-1 text-xs w-20 focus:outline-none focus:border-primary"
                    value={step.timer_min ?? ''}
                    min={1}
                    onChange={e => setSteps(prev => prev.map((x, j) => j === i ? { ...x, timer_min: e.target.value ? Number(e.target.value) : undefined } : x))}
                    placeholder="min"
                  />
                </div>
              </div>
              <button
                onClick={() => setSteps(prev => prev.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 text-xl mt-2 shrink-0 leading-none"
              >×</button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setSteps(prev => [...prev, { text: '', timer_min: undefined }])}
          className="text-sm text-primary hover:underline font-medium"
        >
          + Ajouter une étape
        </button>
      </Section>

      {/* CONSEIL DE DRESSAGE */}
      <Section title="Conseil de dressage (optionnel)">
        <textarea
          className={INPUT}
          rows={2}
          value={form.plating_tip ?? ''}
          onChange={e => setForm(p => ({ ...p, plating_tip: e.target.value }))}
          placeholder="Ex: Dispose les ingrédients en éventail, garnis de graines de sésame…"
        />
      </Section>

      {/* ACTIONS */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/admin/recipes')}
          className="flex-1 border border-warm-200 text-gray-500 font-medium py-3 rounded-2xl hover:bg-warm-100 transition"
        >
          Annuler
        </button>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.name || saved}
          className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
        >
          {save.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement…
            </span>
          ) : saved ? '✅ Enregistré !' : isEdit ? 'Enregistrer les modifications' : '🚀 Publier la recette'}
        </button>
      </div>
    </div>
  )
}
