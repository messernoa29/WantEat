import { api } from '../lib/api'
import type { RecipeDetail, RecipeList } from './libraryApi'

export interface AdminStats {
  total_users: number
  active_7d: number
  goal_distribution: Record<string, number>
  avg_age: number | null
  age_buckets: Record<string, number>
  top_recipes_this_week: { id: string; name: string; saves: number }[]
  retention: { j1: number; j7: number; j30: number }
}

export interface AdminUser {
  user_id: string
  first_name: string | null
  age: number | null
  weight_kg: number | null
  height_cm: number | null
  gender: string | null
  goal: string | null
  diet_type: string | null
  sport_days: number[]
  meals_per_day: number | null
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats').then(r => r.data),
  getRecipes: (params?: { search?: string; limit?: number; offset?: number }) =>
    api.get<RecipeList[]>('/admin/recipes', { params }).then(r => r.data),
  getRecipe: (id: string) => api.get<RecipeDetail>(`/admin/recipes/${id}`).then(r => r.data),
  createRecipe: (data: Partial<RecipeDetail>) =>
    api.post<RecipeDetail>('/admin/recipes', data).then(r => r.data),
  updateRecipe: (id: string, data: Partial<RecipeDetail>) =>
    api.put<RecipeDetail>(`/admin/recipes/${id}`, data).then(r => r.data),
  deleteRecipe: (id: string) => api.delete(`/admin/recipes/${id}`),
  getUsers: (params?: { limit?: number; offset?: number }) =>
    api.get<AdminUser[]>('/admin/users', { params }).then(r => r.data),
  exportUsers: () => api.get('/admin/users/export', { responseType: 'blob' }).then(r => r.data),
}
