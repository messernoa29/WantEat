import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { waterApi } from '../api/waterApi'

export function useWaterToday() {
  return useQuery({
    queryKey: ['water', 'today'],
    queryFn: waterApi.getToday,
    retry: false,
  })
}

export function useAddWater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ml: number = 250) => waterApi.add(ml),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['water'] }),
  })
}
