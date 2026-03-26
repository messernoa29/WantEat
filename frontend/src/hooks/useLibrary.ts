import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { libraryApi, type RecipeFilters } from '../api/libraryApi'

export function useCategories() {
  return useQuery({
    queryKey: ['library', 'categories'],
    queryFn: libraryApi.getCategories,
    staleTime: Infinity,
  })
}

export function useRecipes(params: RecipeFilters, enabled = true) {
  return useQuery({
    queryKey: ['library', 'recipes', params],
    queryFn: () => libraryApi.getRecipes(params),
    enabled,
  })
}

export function useRecipe(id: string | null) {
  return useQuery({
    queryKey: ['library', 'recipe', id],
    queryFn: () => libraryApi.getRecipe(id!),
    enabled: !!id,
  })
}

export function useSaveRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? libraryApi.unsaveRecipe(id) : libraryApi.saveRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] })
    },
  })
}
