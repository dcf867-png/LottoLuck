import type { SavedPick, Draw, Game } from './types'

const TRACK_KEY = 'lottopulse_trackrecord_v1'

export function loadSavedPicks(): SavedPick[] {
  try {
    const raw = localStorage.getItem(TRACK_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedPick[]
  } catch {
    return []
  }
}

export function savePick(pick: Omit<SavedPick, 'id' | 'savedAt'>): SavedPick {
  const today = new Date().toISOString().slice(0, 10)
  const newPick: SavedPick = {
    ...pick,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    savedAt: today,
  }
  try {
    const picks = loadSavedPicks()
    const isDuplicate = picks.some(p =>
      p.savedAt === today &&
      p.game === pick.game &&
      p.source === pick.source &&
      p.whites.join(',') === pick.whites.join(',') &&
      p.bonus === pick.bonus
    )
    if (!isDuplicate) {
      picks.push(newPick)
      localStorage.setItem(TRACK_KEY, JSON.stringify(picks))
    }
  } catch {}
  return newPick
}

export function clearSavedPicks(): void {
  try { localStorage.removeItem(TRACK_KEY) } catch {}
}

export function deleteSavedPick(id: string): void {
  try {
    const picks = loadSavedPicks().filter(p => p.id !== id)
    localStorage.setItem(TRACK_KEY, JSON.stringify(picks))
  } catch {}
}

export interface DrawResult {
  draw: Draw
  whiteMatches: number
  bonusMatch: boolean
}

export function matchPickAgainstDraws(pick: SavedPick, draws: Draw[]): DrawResult[] {
  return draws
    .filter(d => d.game === pick.game && d.date > pick.savedAt)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(draw => ({
      draw,
      whiteMatches: draw.whites.filter(w => pick.whites.includes(w)).length,
      bonusMatch: draw.bonus === pick.bonus,
    }))
}

export function prizeTier(game: Game, whites: number, bonus: boolean): string | null {
  if (game === 'powerball') {
    if (whites === 5 && bonus) return 'JACKPOT'
    if (whites === 5) return '$1,000,000'
    if (whites === 4 && bonus) return '$50,000'
    if (whites === 4) return '$100'
    if (whites === 3 && bonus) return '$100'
    if (whites === 3) return '$7'
    if (whites === 2 && bonus) return '$7'
    if (bonus) return '$4'
    return null
  } else {
    if (whites === 5 && bonus) return 'JACKPOT'
    if (whites === 5) return '$1,000,000'
    if (whites === 4 && bonus) return '$10,000'
    if (whites === 4) return '$500'
    if (whites === 3 && bonus) return '$200'
    if (whites === 3) return '$10'
    if (whites === 2 && bonus) return '$10'
    if (whites === 1 && bonus) return '$4'
    if (bonus) return '$2'
    return null
  }
}
