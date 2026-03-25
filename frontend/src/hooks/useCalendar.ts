import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calendarApi, type WeeklySlotCreate } from '../api/calendarApi'

export function useCalendarSlots() {
  return useQuery({
    queryKey: ['calendar', 'slots'],
    queryFn: calendarApi.getSlots,
  })
}

export function useAddSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: WeeklySlotCreate) => calendarApi.addSlot(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  })
}

export function useRemoveSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => calendarApi.removeSlot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  })
}
