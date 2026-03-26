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
  tiktok_video_id: string | null
  creator_handle: string | null
  creator_name: string | null
  tags: string[]
  likes_count: number
  saves_count: number
  score: number | null
  is_saved: boolean
}

export interface RecipeStep {
  text: string
  timer_min?: number
}

export interface RecipeDetail extends RecipeList {
  ingredients: { name: string; quantity_g: number; unit?: string }[]
  steps: RecipeStep[]
  plating_tip: string | null
  subcategory: RecipeSubcategoryShort | null
}

export interface RecipeFilters {
  subcategory_id?: string
  category_id?: string
  tags?: string
  kcal_max?: number
  prot_min?: number
  prep_max?: number
  creator?: string
  sort?: 'name' | 'likes' | 'recent' | 'random'
  saved_only?: boolean
}

export const libraryApi = {
  getCategories: () => api.get<RecipeCategory[]>('/library/categories').then(r => r.data),
  getRecipes: (params: RecipeFilters) =>
    api.get<RecipeList[]>('/library/recipes', { params }).then(r => r.data),
  getRecipe: (id: string) => api.get<RecipeDetail>(`/library/recipes/${id}`).then(r => r.data),
  saveRecipe: (id: string) => api.post(`/library/recipes/${id}/save`).then(r => r.data),
  unsaveRecipe: (id: string) => api.delete(`/library/recipes/${id}/save`).then(r => r.data),
}
