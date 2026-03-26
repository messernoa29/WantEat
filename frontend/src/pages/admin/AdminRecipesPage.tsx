import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'

export function AdminRecipesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['admin', 'recipes', search],
    queryFn: () => adminApi.getRecipes({ search: search || undefined, limit: 100 }),
  })

  const deleteRecipe = useMutation({
    mutationFn: (id: string) => adminApi.deleteRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'recipes'] }),
  })

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm(`Supprimer "${name}" ?`)) deleteRecipe.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Recettes</h1>
        <button
          onClick={() => navigate('/admin/recipes/new')}
          className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-xl transition text-sm"
        >
          + Nouvelle recette
        </button>
      </div>

      <input
        type="text"
        placeholder="Rechercher…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-brand placeholder-gray-400 text-sm focus:outline-none focus:border-primary bg-white shadow-sm"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-100 text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Recette</th>
                <th className="text-left px-4 py-3">Créateur</th>
                <th className="text-right px-4 py-3">Kcal</th>
                <th className="text-right px-4 py-3">Prot</th>
                <th className="text-right px-4 py-3">⏱</th>
                <th className="text-right px-4 py-3">♥</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {recipes?.map(r => (
                <tr key={r.id} className="hover:bg-warm-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.image_urls?.[0] ? (
                        <img src={r.image_urls[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center text-base">🍽️</div>
                      )}
                      <div>
                        <p className="font-medium text-brand">{r.name}</p>
                        {r.tags?.length > 0 && (
                          <p className="text-xs text-gray-400">{r.tags.slice(0, 3).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.creator_handle ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{r.calories ? Math.round(r.calories) : '—'}</td>
                  <td className="px-4 py-3 text-right text-secondary">{r.protein ? Math.round(r.protein) + 'g' : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{r.prep_time_min}m</td>
                  <td className="px-4 py-3 text-right text-gray-400">{r.saves_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/recipes/${r.id}/edit`)}
                        className="text-xs text-primary hover:underline"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => confirmDelete(r.id, r.name)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && recipes?.length === 0 && (
            <p className="text-center text-gray-400 py-12">Aucune recette</p>
          )}
        </div>
      )}
    </div>
  )
}
