import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { GuestLock } from './GuestLock'

interface Props {
  children: React.ReactNode
  guestFallback?: { feature: string; description: string; emoji: string }
}

export function ProtectedRoute({ children, guestFallback }: Props) {
  const { session, loading, isGuest } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session && !isGuest) return <Navigate to="/login" replace />

  if (!session && isGuest && guestFallback) {
    return <GuestLock {...guestFallback} />
  }

  if (!session && isGuest) return <Navigate to="/library" replace />

  return <>{children}</>
}
