import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi, type Profile } from '../api/profileApi'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    retry: false,
  })
}

export function useSaveProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: profileApi.save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['macros'] })
    },
  })
}
