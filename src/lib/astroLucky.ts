import type { Game } from './types'
import { GAME_CONFIG } from './types'
import type { NatalChart, PlanetInfo } from './astrology'
import { getCurrentTransits } from './astrology'

const DEG = Math.PI / 180

function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function aspectScore(angle: number): number {
  if (angle <= 8) return 3
  if (Math.abs(angle - 60) <= 6) return 2
  if (Math.abs(angle - 90) <= 8) return -1
  if (Math.abs(angle - 120) <= 8) return 3
  if (Math.abs(angle - 180) <= 8) return -1
  return 0
}

function lonToAnchor(lon: number, max: number): number {
  return Math.max(1, Math.min(max, Math.round((lon / 360) * max) + 1))
}

function scoreNatalPlanet(natalLon: number, transits: PlanetInfo[]): number {
  let score = 1
  for (const t of transits) {
    score += aspectScore(angularDistance(t.lon, natalLon))
  }
  return Math.max(score, 0.5)
}

export function generateAstrologyPick(
  natal: NatalChart,
  game: Game,
  variation = 0,
): { whites: number[]; bonus: number } {
  const whiteMax = GAME_CONFIG[game].whiteMax.current
  const bonusMax = GAME_CONFIG[game].bonusMax.current

  const transits = getCurrentTransits()
  const scores = new Float64Array(whiteMax + 1)

  const allNatal = [...natal.planets]
  if (natal.ascendant) allNatal.push(natal.ascendant)

  allNatal.forEach((planet, idx) => {
    const base = lonToAnchor(planet.lon, whiteMax)
    const varShift = (variation * (idx + 1) * 7) % whiteMax
    const anchor = ((base + varShift - 1) % whiteMax) + 1
    const planetScore = scoreNatalPlanet(planet.lon, transits)

    for (let offset = -4; offset <= 4; offset++) {
      const n = ((anchor + offset - 1 + whiteMax) % whiteMax) + 1
      const weight = (5 - Math.abs(offset)) / 5
      scores[n] += planetScore * weight
    }
  })

  // Moon phase bias: waxing favors lower numbers, waning favors higher
  const phaseBias = Math.cos(natal.todayMoonPhase * DEG) * 1.5
  for (let n = 1; n <= whiteMax; n++) {
    const pos = (n / whiteMax - 0.5) * 2
    scores[n] += pos * phaseBias
  }

  // Variation perturbation: break ties differently each call
  for (let n = 1; n <= whiteMax; n++) {
    scores[n] += 0.4 * Math.sin((n + variation * 13) * 37 * DEG)
  }

  // Pick the highest-scoring number from each of 5 equal zones to guarantee spread
  const zoneSize = Math.ceil(whiteMax / 5)
  const whites: number[] = []
  for (let z = 0; z < 5; z++) {
    const start = z * zoneSize + 1
    const end = Math.min(start + zoneSize - 1, whiteMax)
    let best = start
    for (let n = start + 1; n <= end; n++) {
      if (scores[n] > scores[best]) best = n
    }
    whites.push(best)
  }
  whites.sort((a, b) => a - b)

  const transitMoon = transits.find(t => t.name === 'Moon')!
  const degInSign = transitMoon.lon % 30
  const bonus = ((Math.round((degInSign / 30) * bonusMax) + variation * 5) % bonusMax) + 1

  return { whites, bonus }
}
