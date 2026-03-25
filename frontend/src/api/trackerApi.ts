import { api } from '../lib/api'

export interface TrackerToday {
  date: string
  calories_target: number
  protein_target: number
  carbs_target: number
  fat_target: number
  calories_consumed: number
  protein_consumed: number
  carbs_consumed: number
  fat_consumed: number
}

export const trackerApi = {
  getToday: () => api.get<TrackerToday>('/tracker/today').then(r => r.data),
}
