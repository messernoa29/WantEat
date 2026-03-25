import { api } from '../lib/api'

export interface Macros {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  bmr: number
  tdee: number
  tdee_sport: number
  tdee_rest: number
  calories_sport: number
  calories_rest: number
  bmi: number
  ideal_weight_kg: number
  weekly_change_kg: number | null
  weeks_to_goal: number | null
  water_goal_ml: number
}

export const macrosApi = {
  get: () => api.get<Macros>('/macros').then(r => r.data),
}
