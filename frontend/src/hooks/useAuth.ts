import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const GUEST_KEY = 'wanteat_guest'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) {
        localStorage.removeItem(GUEST_KEY)
        setIsGuest(false)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) {
        localStorage.removeItem(GUEST_KEY)
        setIsGuest(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_KEY, 'true')
    setIsGuest(true)
  }

  const signOut = () => {
    localStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    supabase.auth.signOut()
  }

  return { session, user, loading, isGuest, continueAsGuest, signOut }
}
