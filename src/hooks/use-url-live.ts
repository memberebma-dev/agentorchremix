import { useQuery } from '@tanstack/react-query'

/** Does a real fetch to confirm a hosted URL actually resolves, instead of assuming it does. */
export function useUrlLive(url?: string) {
  return useQuery({
    queryKey: ['url-live', url],
    queryFn: async () => {
      if (!url) return false
      try {
        const res = await fetch(url, { method: 'GET' })
        return res.ok
      } catch {
        return false
      }
    },
    enabled: !!url,
    staleTime: 60000,
    retry: false,
  })
}
