import type { Game } from './types'
import { GAME_CONFIG } from './types'

const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

function digitSum(n: number): number {
  return String(n).split('').reduce((sum, d) => sum + parseInt(d), 0)
}

// Reduce to single digit, preserving master numbers 11, 22, 33
function reduce(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = digitSum(n)
  }
  return n
}

export function lifePathNumber(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  return reduce(reduce(month) + reduce(day) + reduce(digitSum(year)))
}

export function expressionNumber(name: string): number {
  const sum = name.toUpperCase().replace(/[^A-Z]/g, '').split('')
    .reduce((acc, ch) => acc + (LETTER_VALUES[ch] ?? 0), 0)
  return reduce(sum)
}

export function soulUrgeNumber(name: string): number {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '').split('')
  const sum = letters.filter(ch => VOWELS.has(ch))
    .reduce((acc, ch) => acc + (LETTER_VALUES[ch] ?? 0), 0)
  return reduce(sum || 1)
}

export function birthdayNumber(dateStr: string): number {
  return reduce(parseInt(dateStr.split('-')[2]))
}

export function personalYearNumber(dateStr: string, year: number): number {
  const [, month, day] = dateStr.split('-').map(Number)
  return reduce(reduce(month) + reduce(day) + reduce(digitSum(year)))
}

export function personalDayNumber(dateStr: string, today: Date): number {
  const personalYear = personalYearNumber(dateStr, today.getFullYear())
  const personalMonth = reduce(personalYear + today.getMonth() + 1)
  return reduce(personalMonth + today.getDate())
}

export interface NumerologyProfile {
  lifePath: number
  expression: number
  soulUrge: number
  birthday: number
  personalYear: number
  personalDay: number
}

export function buildProfile(name: string, dateStr: string): NumerologyProfile {
  const today = new Date()
  return {
    lifePath: lifePathNumber(dateStr),
    expression: expressionNumber(name),
    soulUrge: soulUrgeNumber(name),
    birthday: birthdayNumber(dateStr),
    personalYear: personalYearNumber(dateStr, today.getFullYear()),
    personalDay: personalDayNumber(dateStr, today),
  }
}

// Map a seed (1–33) into a specific zone of the lottery range
// Zones split the white ball range into 5 equal bands, ensuring spread
function pickInZone(seed: number, zoneIndex: number, whiteMax: number, variation: number): number {
  const zoneSize = Math.ceil(whiteMax / 5)
  const zoneStart = zoneIndex * zoneSize + 1
  const zoneEnd = Math.min(zoneStart + zoneSize - 1, whiteMax)
  const effective = zoneEnd - zoneStart + 1
  const offset = (seed - 1 + variation * 5) % effective
  return zoneStart + offset
}

export function generateNumerologyPick(
  profile: NumerologyProfile,
  game: Game,
  variation = 0,
): { whites: number[]; bonus: number } {
  const whiteMax = GAME_CONFIG[game].whiteMax.current
  const bonusMax = GAME_CONFIG[game].bonusMax.current

  // Flatten master numbers to single digit for range math
  const flatten = (n: number) => (n > 9 ? digitSum(n) || 1 : n) || 1

  const allSeeds = [
    flatten(profile.lifePath),
    flatten(profile.expression),
    flatten(profile.soulUrge),
    flatten(profile.birthday),
    flatten(profile.personalYear),
  ]

  // Rotate seed order per game so PB and MM draw from different numerology numbers
  const rotation = game === 'powerball' ? 0 : 2
  const seeds = [...allSeeds.slice(rotation), ...allSeeds.slice(0, rotation)]

  // personalDay shifts the pick daily so each day yields a fresh set
  const dailyShift = flatten(profile.personalDay)
  const effectiveVariation = variation + dailyShift

  const whites = seeds.map((seed, i) => pickInZone(seed, i, whiteMax, effectiveVariation))
  whites.sort((a, b) => a - b)

  const gameBonusSalt = game === 'powerball' ? 0 : 11
  const bonusSeed = seeds.reduce((a, b) => a + b, 0) + effectiveVariation * 7 + gameBonusSalt
  const bonus = (bonusSeed % bonusMax) + 1

  return { whites, bonus }
}
