import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCategories, useRecipes } from '../hooks/useLibrary'
import { useAddSlot } from '../hooks/useCalendar'
import type { RecipeCategory, RecipeList, RecipeSubcategoryShort } from '../api/libraryApi'

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
  recipe,
  onSelect,
  addMode,
  onAdd,
  adding,
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
        <div className="flex gap-2 mt-0.5 items-center flex-wrap">
          {recipe.calories && (
            <span className="text-xs text-gray-400">{Math.round(recipe.calories)} kcal</span>
          )}
          {recipe.protein && (
            <span className="text-xs text-secondary">P {Math.round(recipe.protein)}g</span>
          )}
          <span className="text-xs text-gray-400">⏱ {recipe.prep_time_min}min</span>
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

export function LibraryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const addToParam = searchParams.get('addTo')
  const addMode = !!addToParam
  const [addDay, addMealType] = addToParam ? addToParam.split(':') : []

  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | null>(null)
  const [selectedSubcat, setSelectedSubcat] = useState<RecipeSubcategoryShort | null>(null)
  const [search, setSearch] = useState('')

  const { data: categories, isLoading: catLoading } = useCategories()
  const { data: recipes, isLoading: recipesLoading } = useRecipes(
    selectedSubcat
      ? { subcategory_id: selectedSubcat.id }
      : selectedCategory
      ? { category_id: selectedCategory.id }
      : {}
  )

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

  const reset = () => { setSelectedCategory(null); setSelectedSubcat(null); setSearch('') }

  return (
    <div className="min-h-screen bg-warm text-brand">
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
        ) : <div className="w-16" />}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── CATEGORY GRID ── */}
        {!selectedCategory && !catLoading && (
          <>
            <p className="text-gray-500 text-sm">
              {addMode ? 'Choisis une recette à ajouter au calendrier.' : 'Explore par catégorie ou recherche une recette.'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {categories?.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-white hover:bg-warm-100 rounded-2xl p-4 flex flex-col items-center gap-2 transition shadow-card hover:shadow-card-hover"
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold text-brand text-center leading-tight">{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.subcategories.length} sous-cat.</span>
                </button>
              ))}
            </div>
          </>
        )}

        {catLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── SUBCATEGORY LIST ── */}
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

        {/* ── RECIPE LIST ── */}
        {(selectedSubcat || selectedCategory) && (
          <>
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
                {filtered.map(recipe => (
                  <RecipeRow
                    key={recipe.id}
                    recipe={recipe}
                    onSelect={() => navigate(`/library/recipe/${recipe.id}`)}
                    addMode={addMode}
                    onAdd={() => handleAdd(recipe)}
                    adding={addSlot.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
