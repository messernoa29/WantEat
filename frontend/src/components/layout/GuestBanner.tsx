import { useNavigate } from 'react-router-dom'

export function GuestBanner() {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-xs font-medium">
        👋 Mode invité — Crée un compte pour sauvegarder et générer ton plan
      </p>
      <button
        onClick={() => navigate('/login')}
        className="shrink-0 bg-white text-primary text-xs font-bold px-3 py-1 rounded-lg transition hover:bg-white/90"
      >
        S'inscrire
      </button>
    </div>
  )
}
