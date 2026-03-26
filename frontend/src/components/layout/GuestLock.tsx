import { useNavigate } from 'react-router-dom'

interface Props {
  feature: string
  description: string
  emoji: string
}

export function GuestLock({ feature, description, emoji }: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4">
      <div className="text-center max-w-sm animate-scale-in">
        <div className="text-7xl mb-6 animate-float">{emoji}</div>
        <h2 className="text-2xl font-bold text-brand mb-2">{feature}</h2>
        <p className="text-gray-500 mb-8">{description}</p>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-primary/25 press mb-3"
        >
          Créer un compte gratuit →
        </button>
        <button
          onClick={() => navigate('/library')}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition py-2"
        >
          ← Retour aux recettes
        </button>
      </div>
    </div>
  )
}
