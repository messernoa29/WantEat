import { api } from '../lib/api'

export interface RecipeSubcategoryShort {
  id: string
  slug: string
  name: string
  emoji: string
}

export interface RecipeCategory {
  id: string
  slug: string
  name: string
  emoji: string
  description: string | null
  order: number
  subcategories: RecipeSubcategoryShort[]
}

export interface RecipeList {
  id: string
  name: string
  description: string | null
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  prep_time_min: number
  difficulty: string
  image_urls: string[]
  tiktok_url: string | null
  score: number | null
}

export interface RecipeDetail extends RecipeList {
  ingredients: { name: string; quantity_g: number; unit?: string }[]
  steps: string[]
  subcategory: RecipeSubcategoryShort | null
}

export const libraryApi = {
  getCategories: () => api.get<RecipeCategory[]>('/library/categories').then(r => r.data),
  getRecipes: (params: { subcategory_id?: string; category_id?: string }) =>
    api.get<RecipeList[]>('/library/recipes', { params }).then(r => r.data),
  getRecipe: (id: string) => api.get<RecipeDetail>(`/library/recipes/${id}`).then(r => r.data),
}
