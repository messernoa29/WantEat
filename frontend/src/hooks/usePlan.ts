import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { planApi } from '../api/planApi'

export function usePlan() {
  return useQuery({
    queryKey: ['plan'],
    queryFn: planApi.getCurrent,
    retry: false,
    refetchInterval: (query) => {
      // Poll toutes les 5s si le plan est en cours de génération
      if (query.state.data?.status === 'pending') return 5000
      return false
    },
  })
}

export function useGeneratePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: planApi.generate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan'] }),
  })
}
