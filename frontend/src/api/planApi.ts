import { api } from '../lib/api'

export interface Ingredient { name: string; quantity_g: number }
export interface Sauce { name: string; ingredients: string[]; kcal_per_serving: number }
export interface Meal {
  meal_id: string
  meal_type: string
  name: string
  ingredients: Ingredient[]
  calories: number
  protein: number
  carbs: number
  fat: number
  prep_time_min: number
  steps: string[]
  sauce: Sauce | null
  plating_tip: string | null
}
export interface DayPlan {
  day_id: string
  day_index: number
  is_sport_day: boolean
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  meals: Meal[]
}
export interface MealPlan {
  plan_id: string
  user_id: string
  week_start: string
  status: string
  days: DayPlan[]
}

export const planApi = {
  generate: () => api.post('/plan/generate').then(r => r.data),
  getCurrent: () => api.get<MealPlan>('/plan/current').then(r => r.data),
}
