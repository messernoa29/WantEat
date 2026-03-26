import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { session, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    else if (isSignUp) setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand via-[#2D2D4E] to-brand flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 right-0 w-48 h-48 bg-accent/10 rounded-full translate-x-1/2 -translate-y-1/2" />

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg shadow-primary/30 animate-float">
            🥗
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">WantEat</h1>
          <p className="text-white/50 mt-2 text-sm">Ton coach nutrition IA</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-7 shadow-2xl">
          {success ? (
            <div className="text-center py-4 animate-scale-in">
              <div className="text-5xl mb-4">📧</div>
              <p className="font-bold text-brand text-lg">Vérifie ta boîte mail !</p>
              <p className="text-gray-500 text-sm mt-2">Un lien de confirmation t'a été envoyé.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-brand mb-5">
                {isSignUp ? 'Créer un compte' : 'Connexion'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-warm-100 text-brand rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-warm-200 transition"
                    placeholder="toi@exemple.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-warm-100 text-brand rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-warm-200 transition"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl animate-slide-down">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition shadow-md shadow-primary/20 disabled:opacity-50 press mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Chargement…
                    </span>
                  ) : isSignUp ? "Créer mon compte" : "Se connecter"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="w-full text-gray-400 text-sm hover:text-primary transition mt-4"
              >
                {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
              </button>
            </>
          )}
        </div>

        {/* Guest mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => { continueAsGuest(); navigate('/library') }}
            className="text-white/60 hover:text-white/90 text-sm transition underline underline-offset-4"
          >
            Parcourir les recettes sans compte →
          </button>
        </div>
      </div>
    </div>
  )
}
