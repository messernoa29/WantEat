/**
 * Tests unitaires pour la logique d'affichage des scores (ScoreBadge).
 * Vérifie la catégorisation visuelle des scores.
 */

type ScoreConfig = { color: string; label: string }

function getScoreConfig(score: number): ScoreConfig {
  if (score >= 80) return { color: 'bg-accent/15 text-accent', label: '🎯' }
  if (score >= 60) return { color: 'bg-secondary/15 text-secondary', label: '👍' }
  if (score >= 40) return { color: 'bg-primary/15 text-primary', label: '⚠️' }
  return { color: 'bg-red-100 text-red-500', label: '❌' }
}

describe('ScoreBadge — catégorisation des scores', () => {
  it('score >= 80 → parfait (🎯)', () => {
    expect(getScoreConfig(80).label).toBe('🎯')
    expect(getScoreConfig(95).label).toBe('🎯')
    expect(getScoreConfig(100).label).toBe('🎯')
  })

  it('score >= 60 et < 80 → bon (👍)', () => {
    expect(getScoreConfig(60).label).toBe('👍')
    expect(getScoreConfig(70).label).toBe('👍')
    expect(getScoreConfig(79).label).toBe('👍')
  })

  it('score >= 40 et < 60 → moyen (⚠️)', () => {
    expect(getScoreConfig(40).label).toBe('⚠️')
    expect(getScoreConfig(50).label).toBe('⚠️')
    expect(getScoreConfig(59).label).toBe('⚠️')
  })

  it('score < 40 → mauvais (❌)', () => {
    expect(getScoreConfig(0).label).toBe('❌')
    expect(getScoreConfig(20).label).toBe('❌')
    expect(getScoreConfig(39).label).toBe('❌')
  })

  it('la frontière 80 est dans la catégorie parfait', () => {
    expect(getScoreConfig(79).label).toBe('👍')
    expect(getScoreConfig(80).label).toBe('🎯')
  })

  it('la frontière 60 est correcte', () => {
    expect(getScoreConfig(59).label).toBe('⚠️')
    expect(getScoreConfig(60).label).toBe('👍')
  })

  it('la frontière 40 est correcte', () => {
    expect(getScoreConfig(39).label).toBe('❌')
    expect(getScoreConfig(40).label).toBe('⚠️')
  })
})

describe('ScoreBadge — couleurs CSS', () => {
  it('score parfait utilise la couleur accent', () => {
    expect(getScoreConfig(85).color).toContain('accent')
  })

  it('bon score utilise la couleur secondary', () => {
    expect(getScoreConfig(65).color).toContain('secondary')
  })

  it('mauvais score utilise la couleur rouge', () => {
    expect(getScoreConfig(10).color).toContain('red')
  })
})
