import { api } from '../lib/api'

export interface Profile {
  user_id: string
  first_name?: string
  age: number
  weight_kg: number
  height_cm: number
  gender: string
  goal: string
  target_weight_kg?: number
  target_deadline?: string
  qualitative_goals: string[]
  sport_days: number[]
  sport_types: string[]
  sport_location?: string
  sport_level?: string
  meals_per_day: number
  diet_type: string
  cooking_time: string
  allergies: string[]
  food_aversions?: string
}

export type ProfileSave = Omit<Profile, 'user_id'>

export const profileApi = {
  get: () => api.get<Profile>('/profile').then(r => r.data),
  save: (data: ProfileSave) => api.post<Profile>('/profile', data).then(r => r.data),
}
