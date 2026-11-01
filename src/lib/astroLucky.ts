import type { Game } from './types'
import { GAME_CONFIG } from './types'
import type { NatalChart, PlanetInfo } from './astrology'
import { getTransits, PLANET_NATURE } from './astrology'
import { babylonianDate, favorableWeight } from './babylonian'

const DEG = Math.PI / 180

function lonToAnchor(lon: number, max: number): number {
  return Math.max(1, Math.min(max, Math.round((lon / 360) * max) + 1))
}

function scoreNatalPlanet(natal: PlanetInfo, transits: PlanetInfo[]): number {
  let score = 1
  for (const t of transits) {
    if (t.sign === natal.sign) score += PLANET_NATURE[t.name] * 3
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

  const transits = getTransits()
  const { monthIndex } = babylonianDate(new Date())
  const scores = new Float64Array(whiteMax + 1)

  const allNatal = natal.planets

  // Rotate planet order per game so each game emphasises different planets
  const rotated = game === 'powerball'
    ? allNatal
    : [...allNatal.slice(2), ...allNatal.slice(0, 2)]

  rotated.forEach((planet, idx) => {
    const base = lonToAnchor(planet.lon, whiteMax)
    const varShift = (variation * (idx + 1) * 7) % whiteMax
    const anchor = ((base + varShift - 1) % whiteMax) + 1
    const planetScore = scoreNatalPlanet(planet, transits)

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

  // Numbers line up with the days of this Babylonian month, wrapping past 30, and favorable days score higher
  for (let n = 1; n <= whiteMax; n++) {
    scores[n] += 0.75 * favorableWeight(monthIndex, ((n - 1) % 30) + 1)
  }

  // Game-specific perturbation so PB and MM scores diverge
  const gameSalt = game === 'powerball' ? 0 : 53
  for (let n = 1; n <= whiteMax; n++) {
    scores[n] += 0.4 * Math.sin((n + variation * 13 + gameSalt) * 37 * DEG)
    scores[n] += 0.25 * Math.cos((n + gameSalt) * 19 * DEG)
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
  const transitSun = transits.find(t => t.name === 'Sun')!
  // PB uses Moon position; MM uses Sun-Moon midpoint for a genuinely different bonus
  const bonusLon = game === 'powerball'
    ? transitMoon.lon
    : (transitMoon.lon + transitSun.lon) / 2 % 360
  const degInSign = bonusLon % 30
  const bonus = ((Math.round((degInSign / 30) * bonusMax) + variation * 5) % bonusMax) + 1

  return { whites, bonus }
}
