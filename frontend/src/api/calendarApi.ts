import { api } from '../lib/api'
import type { RecipeList } from './libraryApi'

export interface WeeklySlot {
  id: string
  day_index: number
  meal_type: string
  recipe: RecipeList | null
}

export interface WeeklySlotCreate {
  day_index: number
  meal_type: string
  recipe_id: string
}

export const calendarApi = {
  getSlots: () => api.get<WeeklySlot[]>('/calendar/slots').then(r => r.data),
  addSlot: (body: WeeklySlotCreate) => api.post<WeeklySlot>('/calendar/slots', body).then(r => r.data),
  removeSlot: (id: string) => api.delete(`/calendar/slots/${id}`),
}
