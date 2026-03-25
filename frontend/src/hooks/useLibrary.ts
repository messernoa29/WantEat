import { useQuery } from '@tanstack/react-query'
import { libraryApi } from '../api/libraryApi'

export function useCategories() {
  return useQuery({
    queryKey: ['library', 'categories'],
    queryFn: libraryApi.getCategories,
    staleTime: Infinity,
  })
}

export function useRecipes(params: { subcategory_id?: string; category_id?: string }) {
  return useQuery({
    queryKey: ['library', 'recipes', params],
    queryFn: () => libraryApi.getRecipes(params),
    enabled: !!(params.subcategory_id || params.category_id),
  })
}

export function useRecipe(id: string | null) {
  return useQuery({
    queryKey: ['library', 'recipe', id],
    queryFn: () => libraryApi.getRecipe(id!),
    enabled: !!id,
  })
}
