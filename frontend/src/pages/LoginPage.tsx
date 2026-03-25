import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-card">
            🥗
          </div>
          <h1 className="text-4xl font-bold text-brand">WantEat</h1>
          <p className="text-gray-500 mt-2">Ton coach nutrition IA</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-4 shadow-card">
          <h2 className="text-xl font-semibold text-brand">
            {isSignUp ? 'Créer un compte' : 'Connexion'}
          </h2>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-warm-100 text-brand rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-warm-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-warm-100 text-brand rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-warm-200"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Chargement...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-gray-500 text-sm hover:text-primary transition"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}
