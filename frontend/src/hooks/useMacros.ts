import { useQuery } from '@tanstack/react-query'
import { macrosApi } from '../api/macrosApi'

export function useMacros() {
  return useQuery({
    queryKey: ['macros'],
    queryFn: macrosApi.get,
    retry: false,
  })
}
