import { api } from '../lib/api'

export interface WaterToday {
  date: string
  consumed_ml: number
  goal_ml: number
  pct: number
}

export const waterApi = {
  getToday: () => api.get<WaterToday>('/water/today').then(r => r.data),
  add: (amount_ml = 250) => api.post<WaterToday>('/water/add', { amount_ml }).then(r => r.data),
  reset: () => api.delete('/water/reset'),
}
