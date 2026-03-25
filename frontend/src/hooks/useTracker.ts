import { useQuery } from '@tanstack/react-query'
import { trackerApi } from '../api/trackerApi'

export function useTrackerToday() {
  return useQuery({
    queryKey: ['tracker', 'today'],
    queryFn: trackerApi.getToday,
    retry: false,
  })
}
