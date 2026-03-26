import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCategories, useRecipes } from '../hooks/useLibrary'
import { useAddSlot } from '../hooks/useCalendar'
import { useAuth } from '../hooks/useAuth'
import { GuestBanner } from '../components/layout/GuestBanner'
import type { RecipeCategory, RecipeFilters, RecipeList, RecipeSubcategoryShort } from '../api/libraryApi'

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const cfg =
    score >= 80 ? { color: 'bg-accent/15 text-accent', label: '🎯' } :
    score >= 60 ? { color: 'bg-secondary/15 text-secondary', label: '👍' } :
    score >= 40 ? { color: 'bg-primary/15 text-primary', label: '⚠️' } :
                  { color: 'bg-red-100 text-red-500', label: '❌' }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label} {score}%
    </span>
  )
}

function RecipeRow({
  recipe, onSelect, addMode, onAdd, adding,
}: {
  recipe: RecipeList
  onSelect: () => void
  addMode: boolean
  onAdd: () => void
  adding: boolean
}) {
  return (
    <div className="bg-white rounded-2xl flex items-center gap-3 p-3 shadow-card">
      <div
        className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-2xl bg-warm-100 overflow-hidden"
        onClick={onSelect}
      >
        {recipe.image_urls[0]
          ? <img src={recipe.image_urls[0]} alt="" className="w-full h-full object-cover" />
          : '🍽️'}
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <p className="font-semibold text-brand text-sm truncate">{recipe.name}</p>
        {recipe.creator_handle && (
          <p className="text-xs text-primary truncate">{recipe.creator_handle}</p>
        )}
        <div className="flex gap-2 mt-0.5 items-center flex-wrap">
          {recipe.calories && (
            <span className="text-xs text-gray-400">{Math.round(recipe.calories)} kcal</span>
          )}
          {recipe.protein && (
            <span className="text-xs text-secondary">P {Math.round(recipe.protein)}g</span>
          )}
          <span className="text-xs text-gray-400">⏱ {recipe.prep_time_min}min</span>
          {recipe.tiktok_url && <span className="text-xs text-gray-400">🎵</span>}
          {recipe.is_saved && <span className="text-xs text-yellow-500">♥</span>}
          <ScoreBadge score={recipe.score} />
        </div>
      </div>

      {addMode ? (
        <button
          onClick={onAdd}
          disabled={adding}
          className="shrink-0 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          {adding ? '…' : '+ Ajouter'}
        </button>
      ) : (
        <button onClick={onSelect} className="shrink-0 text-gray-300 hover:text-primary transition text-lg">
          ›
        </button>
      )}
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Nom' },
  { value: 'likes', label: '❤️ Les plus aimées' },
  { value: 'recent', label: '🆕 Les plus récentes' },
  { value: 'random', label: '🎲 Surprise !' },
]

const PREP_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: '10', label: '< 10 min' },
  { value: '20', label: '< 20 min' },
  { value: '30', label: '< 30 min' },
]

function FilterPanel({
  filters, onChange,
}: {
  filters: RecipeFilters
  onChange: (f: RecipeFilters) => void
}) {
  const [kcalInput, setKcalInput] = useState(filters.kcal_max?.toString() ?? '')
  const [protInput, setProtInput] = useState(filters.prot_min?.toString() ?? '')

  const set = (patch: Partial<RecipeFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 shadow-card">
      {/* Sort */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Trier par</p>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => set({ sort: o.value as RecipeFilters['sort'] })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                filters.sort === o.value ? 'bg-primary text-white' : 'bg-warm-100 text-gray-600'
              }`}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* Prep time */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Temps de prépa</p>
        <div className="flex flex-wrap gap-2">
          {PREP_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => set({ prep_max: o.value ? Number(o.value) : undefined })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                (filters.prep_max?.toString() ?? '') === o.value ? 'bg-primary text-white' : 'bg-warm-100 text-gray-600'
              }`}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Kcal max</p>
          <input
            type="number"
            placeholder="ex: 600"
            value={kcalInput}
            onChange={e => setKcalInput(e.target.value)}
            onBlur={() => set({ kcal_max: kcalInput ? Number(kcalInput) : undefined })}
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Protéines min (g)</p>
          <input
            type="number"
            placeholder="ex: 30"
            value={protInput}
            onChange={e => setProtInput(e.target.value)}
            onBlur={() => set({ prot_min: protInput ? Number(protInput) : undefined })}
            className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Saved only */}
      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => set({ saved_only: !filters.saved_only })}
          className={`w-10 h-6 rounded-full transition ${filters.saved_only ? 'bg-primary' : 'bg-warm-200'} relative`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${filters.saved_only ? 'left-5' : 'left-1'}`} />
        </div>
        <span className="text-sm text-brand">Mes favoris uniquement</span>
      </label>

      <button
        onClick={() => {
          setKcalInput('')
          setProtInput('')
          onChange({ sort: 'name' })
        }}
        className="text-xs text-gray-400 hover:text-primary transition"
      >
        Réinitialiser les filtres
      </button>
    </div>
  )
}

export function LibraryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isGuest } = useAuth()

  const addToParam = searchParams.get('addTo')
  const addMode = !!addToParam
  const [addDay, addMealType] = addToParam ? addToParam.split(':') : []

  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | null>(null)
  const [selectedSubcat, setSelectedSubcat] = useState<RecipeSubcategoryShort | null>(null)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<RecipeFilters>({ sort: 'name' })

  const { data: categories, isLoading: catLoading } = useCategories()

  const recipeParams: RecipeFilters = {
    ...filters,
    ...(selectedSubcat && selectedSubcat.id ? { subcategory_id: selectedSubcat.id } : {}),
    ...(selectedCategory && !selectedSubcat ? { category_id: selectedCategory.id } : {}),
  }
  // Affiche toujours les recettes (tendances si aucune catégorie sélectionnée)
  const trendParams: RecipeFilters = { sort: 'likes' }
  const showRecipes = !!(selectedSubcat || selectedCategory)
  const { data: recipes, isLoading: recipesLoading } = useRecipes(recipeParams, showRecipes)
  const { data: trendRecipes, isLoading: trendLoading } = useRecipes(trendParams, !showRecipes && !catLoading)

  const addSlot = useAddSlot()

  const handleAdd = async (recipe: RecipeList) => {
    if (!addToParam) return
    await addSlot.mutateAsync({
      day_index: Number(addDay),
      meal_type: addMealType,
      recipe_id: recipe.id,
    })
    navigate('/calendar')
  }

  const filtered = recipes?.filter(r =>
    search ? r.name.toLowerCase().includes(search.toLowerCase()) : true
  ) ?? []

  const reset = () => {
    setSelectedCategory(null)
    setSelectedSubcat(null)
    setSearch('')
    setShowFilters(false)
    setFilters({ sort: 'name' })
  }

  return (
    <div className="min-h-screen bg-warm text-brand pb-24">
      {isGuest && <GuestBanner />}
      {/* Header */}
      <header className="border-b border-warm-200 bg-white px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => {
            if (selectedSubcat) return setSelectedSubcat(null)
            if (selectedCategory) return setSelectedCategory(null)
            navigate(addMode ? '/calendar' : '/dashboard')
          }}
          className="text-gray-400 hover:text-brand transition"
        >
          ←
        </button>
        <h1 className="font-bold text-lg">
          {selectedSubcat
            ? `${selectedSubcat.emoji} ${selectedSubcat.name}`
            : selectedCategory
            ? `${selectedCategory.emoji} ${selectedCategory.name}`
            : '📚 Bibliothèque'}
        </h1>
        {addMode ? (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Mode ajout</span>
        ) : showRecipes ? (
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`text-sm font-medium transition ${showFilters ? 'text-primary' : 'text-gray-400'}`}
          >
            Filtres {showFilters ? '▲' : '▼'}
          </button>
        ) : <div className="w-16" />}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* GLOBAL SEARCH (always visible when no category) */}
        {!selectedCategory && !catLoading && !addMode && (
          <input
            type="text"
            placeholder="🔍 Rechercher une recette…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-warm-200 rounded-xl px-4 py-2.5 text-brand placeholder-gray-400 text-sm focus:outline-none focus:border-primary shadow-sm"
          />
        )}

        {/* CATEGORY GRID */}
        {!selectedCategory && !catLoading && (
          <>
            <p className="text-gray-500 text-sm">
              {addMode ? 'Choisis une recette à ajouter au calendrier.' : 'Explore par catégorie ou recherche une recette.'}
            </p>
            {!search && (
              <div className="grid grid-cols-3 gap-3">
                {categories?.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className="bg-white hover:bg-warm-100 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-200 shadow-card hover:shadow-card-hover press"
                  >
                    <span className="text-3xl">{cat.emoji}</span>
                    <span className="text-xs font-semibold text-brand text-center leading-tight">{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.subcategories.length} sous-cat.</span>
                  </button>
                ))}
              </div>
            )}

            {/* TRENDING / SEARCH RESULTS */}
            {!addMode && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-brand">
                    {search ? `Résultats pour "${search}"` : 'Tendances 🔥'}
                  </h2>
                  {!search && <span className="text-xs text-gray-400">Les plus aimées</span>}
                </div>
                {trendLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(search
                      ? trendRecipes?.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
                      : trendRecipes?.slice(0, 8)
                    )?.map((recipe, i) => (
                      <div key={recipe.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}>
                        <RecipeRow
                          recipe={recipe}
                          onSelect={() => navigate(`/library/recipe/${recipe.id}`)}
                          addMode={false}
                          onAdd={() => {}}
                          adding={false}
                        />
                      </div>
                    ))}
                    {search && trendRecipes?.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                      <p className="text-center text-gray-400 py-8">Aucune recette trouvée</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {catLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* SUBCATEGORY LIST */}
        {selectedCategory && !selectedSubcat && (
          <div className="space-y-2">
            <p className="text-gray-500 text-sm">Sélectionne une sous-catégorie</p>
            {selectedCategory.subcategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcat(sub)}
                className="w-full bg-white hover:bg-warm-100 rounded-2xl p-4 flex items-center justify-between transition shadow-card"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{sub.emoji}</span>
                  <span className="font-semibold text-brand">{sub.name}</span>
                </span>
                <span className="text-gray-300 text-lg">›</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedSubcat({ id: '', slug: '', name: 'Tout voir', emoji: '📋' })}
              className="w-full text-center text-gray-400 text-sm py-2 hover:text-primary transition"
            >
              Voir tout dans {selectedCategory.name}
            </button>
          </div>
        )}

        {/* RECIPE LIST */}
        {showRecipes && (
          <>
            {showFilters && (
              <FilterPanel filters={filters} onChange={setFilters} />
            )}

            <input
              type="text"
              placeholder="Rechercher une recette…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-warm-200 rounded-xl px-4 py-2.5 text-brand placeholder-gray-400 text-sm focus:outline-none focus:border-primary shadow-sm"
            />

            {recipesLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-12">Aucune recette trouvée</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((recipe, i) => (
                  <div key={recipe.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                    <RecipeRow
                      recipe={recipe}
                      onSelect={() => navigate(`/library/recipe/${recipe.id}`)}
                      addMode={addMode}
                      onAdd={() => handleAdd(recipe)}
                      adding={addSlot.isPending}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
