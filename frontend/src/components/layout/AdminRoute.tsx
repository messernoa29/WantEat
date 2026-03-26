import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied'>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return setStatus('denied')
      const meta = session.user.app_metadata ?? {}
      const userMeta = session.user.user_metadata ?? {}
      const role = meta.role || userMeta.role
      setStatus(role === 'admin' ? 'admin' : 'denied')
    })
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'denied') return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
