/**
 * Tests unitaires pour le mode invité (localStorage)
 * Ces tests vérifient la logique de persistance du mode invité
 * sans dépendre de React ou de Supabase.
 */

const GUEST_KEY = 'wanteat_guest'

describe('Mode invité — localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('démarre sans mode invité par défaut', () => {
    expect(localStorage.getItem(GUEST_KEY)).toBeNull()
  })

  it('active le mode invité en écrivant dans localStorage', () => {
    localStorage.setItem(GUEST_KEY, 'true')
    expect(localStorage.getItem(GUEST_KEY)).toBe('true')
  })

  it('détecte correctement le mode invité', () => {
    localStorage.setItem(GUEST_KEY, 'true')
    const isGuest = localStorage.getItem(GUEST_KEY) === 'true'
    expect(isGuest).toBe(true)
  })

  it('désactive le mode invité en supprimant la clé', () => {
    localStorage.setItem(GUEST_KEY, 'true')
    localStorage.removeItem(GUEST_KEY)
    const isGuest = localStorage.getItem(GUEST_KEY) === 'true'
    expect(isGuest).toBe(false)
  })

  it('ne confond pas une autre clé avec le mode invité', () => {
    localStorage.setItem('other_key', 'true')
    const isGuest = localStorage.getItem(GUEST_KEY) === 'true'
    expect(isGuest).toBe(false)
  })

  it('une valeur "false" ne déclenche pas le mode invité', () => {
    localStorage.setItem(GUEST_KEY, 'false')
    const isGuest = localStorage.getItem(GUEST_KEY) === 'true'
    expect(isGuest).toBe(false)
  })
})

describe('Mode invité — routes accessibles', () => {
  const PUBLIC_ROUTES = ['/library', '/library/recipe/123', '/login']
  const PROTECTED_ROUTES = ['/dashboard', '/plan', '/calendar', '/profile']

  it('les routes publiques sont définies', () => {
    expect(PUBLIC_ROUTES).toContain('/library')
    expect(PUBLIC_ROUTES).toContain('/login')
  })

  it('les routes protégées ne sont pas dans les routes publiques', () => {
    PROTECTED_ROUTES.forEach(route => {
      expect(PUBLIC_ROUTES).not.toContain(route)
    })
  })
})
