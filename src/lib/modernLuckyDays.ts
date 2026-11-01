import type { NatalChart, PlanetInfo } from './astrology'
import { getTransits } from './astrology'
import { personalDayNumber, lifePathNumber } from './numerology'
import { assignStars, DAY_NAMES, moonPhaseName, moonPhaseScore, norm360, toDateStr, type DayScore } from './luckyDays'

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

// Sunday=0 … Saturday=6
const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']

const PLANET_BENEFIC: Record<string, number> = {
  Jupiter: 1.0, Venus: 0.85, Sun: 0.65, Moon: 0.60,
  Mercury: 0.50, Mars: 0.35, Saturn: 0.20,
}

// Universal quality of each personal day number for lucky purposes
const DAY_QUALITY: Record<number, number> = {
  1: 0.65, 2: 0.50, 3: 0.90, 4: 0.30, 5: 0.70,
  6: 0.80, 7: 0.55, 8: 0.65, 9: 0.80, 11: 1.0, 22: 1.0, 33: 1.0,
}

function getGroup(n: number): 'A' | 'B' | 'C' {
  const flat = n > 9 ? (n === 11 ? 2 : n === 22 ? 4 : 6) : n
  if ([1, 5, 7].includes(flat)) return 'A'
  if ([2, 4, 8].includes(flat)) return 'B'
  return 'C'
}

function isRetrograde(name: string, today: PlanetInfo[], tomorrow: PlanetInfo[]): boolean {
  let diff = tomorrow.find(p => p.name === name)!.lon - today.find(p => p.name === name)!.lon
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return diff < 0
}

// Astrological aspect compatibility between two signs, 0–1
function signCompatibility(signA: string, signB: string): number {
  const a = SIGNS.indexOf(signA)
  const b = SIGNS.indexOf(signB)
  if (a === -1 || b === -1) return 0.5
  const diff = Math.abs(a - b)
  const dist = Math.min(diff, 12 - diff)
  const scores = [1.0, 0.45, 0.80, 0.20, 1.0, 0.30, 0.50]
  return scores[dist] ?? 0.5
}

export function scoreModernDays(natal: NatalChart, days = 42, startDate?: Date): DayScore[] {
  const today = startDate ? new Date(startDate) : new Date()
  today.setHours(12, 0, 0, 0)

  const natalSun = natal.planets.find(p => p.name === 'Sun')
  const natalMoon = natal.planets.find(p => p.name === 'Moon')
  const lifePath = lifePathNumber(natal.birthDate)
  const lpGroup = getGroup(lifePath)

  const results: DayScore[] = []

  for (let i = 0; i < days; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() + i)
    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)
    const dateStr = toDateStr(day)

    const transits = getTransits(day)
    const nextTransits = getTransits(nextDay)
    const sun = transits.find(t => t.name === 'Sun')!
    const moon = transits.find(t => t.name === 'Moon')!

    // Moon phase
    const phase = norm360(moon.lon - sun.lon)
    const phaseName = moonPhaseName(phase)
    const phaseScore = moonPhaseScore(phase)

    // Moon sign vs natal sun + moon compatibility
    const sign = moon.modernSign
    const sunCompat = natalSun ? signCompatibility(sign, natalSun.modernSign) : 0.5
    const moonCompat = natalMoon ? signCompatibility(sign, natalMoon.modernSign) : 0.5
    const moonSignScore = sunCompat * 0.6 + moonCompat * 0.4

    // Personal day number
    const personalDay = personalDayNumber(natal.birthDate, day)
    const baseQuality = DAY_QUALITY[personalDay] ?? 0.5
    const pdGroup = getGroup(personalDay)
    let pdScore = baseQuality
    if (personalDay === lifePath) pdScore = 1.0
    else if (lpGroup === pdGroup) pdScore = Math.min(1, pdScore + 0.15)

    // Day ruler (planet associated with the day of week)
    const dow = day.getDay()
    const ruler = DAY_RULERS[dow]
    let dayRulerScore = PLANET_BENEFIC[ruler] ?? 0.5
    const natalRuler = natal.planets.find(p => p.name === ruler)
    if (natalRuler && natalSun) {
      const compat = signCompatibility(natalRuler.modernSign, natalSun.modernSign)
      dayRulerScore = Math.min(1, dayRulerScore + compat * 0.2 - 0.1)
    }

    // Retrograde penalty
    const mercRx = isRetrograde('Mercury', transits, nextTransits)
    const venusRx = isRetrograde('Venus', transits, nextTransits)
    let rxPenalty = 0
    if (mercRx) rxPenalty += 0.4
    if (venusRx) rxPenalty += 0.25
    const rxScore = Math.max(0, 1 - rxPenalty)

    // Combined weighted score
    const score = Math.max(0, Math.min(1,
      phaseScore * 0.25 +
      moonSignScore * 0.25 +
      pdScore * 0.20 +
      dayRulerScore * 0.15 +
      rxScore * 0.15
    ))

    // Human-readable reasons
    const reasons: string[] = []

    if (phaseScore >= 0.9) {
      reasons.push(`${phaseName} — peak lunar energy`)
    } else if (phaseScore >= 0.55) {
      reasons.push(`${phaseName} — favorable lunar cycle`)
    } else if (phaseScore <= 0.15) {
      reasons.push('Quarter Moon — lower lunar momentum')
    }

    if (moonSignScore >= 0.80 && natalSun) {
      reasons.push(`Moon in ${sign} — harmonizes with your ${natalSun.modernSign} Sun`)
    } else if (moonSignScore >= 0.65 && natalMoon) {
      reasons.push(`Moon in ${sign} — compatible with your ${natalMoon.modernSign} Moon`)
    } else if (moonSignScore <= 0.30 && natalSun) {
      reasons.push(`Moon in ${sign} — some friction with your ${natalSun.modernSign} Sun`)
    }

    if (personalDay === 11 || personalDay === 22 || personalDay === 33) {
      reasons.push(`Personal Day ${personalDay} — master number, amplified energy`)
    } else if (personalDay === lifePath) {
      reasons.push(`Personal Day ${personalDay} — aligns with your Life Path ${lifePath}`)
    } else if (pdScore >= 0.75) {
      reasons.push(`Personal Day ${personalDay} — flows with your Life Path ${lifePath}`)
    }

    if (dayRulerScore >= 0.80) {
      reasons.push(`${ruler} rules ${DAY_NAMES[dow]} — a natural benefic influence`)
    } else if (dayRulerScore <= 0.30) {
      reasons.push(`${ruler} rules ${DAY_NAMES[dow]} — disciplined, measured energy`)
    }

    if (mercRx) reasons.push('Mercury retrograde — review before committing')
    if (venusRx) reasons.push('Venus retrograde — temper financial decisions')

    if (reasons.length === 0) reasons.push('Steady energy — reliable for measured moves')

    // Special day detection (5-star tier) — once-a-year events only
    const birthMMDD = natal.birthDate.slice(5)
    const isSolarReturn = dateStr.slice(5) === birthMMDD
    const isNewMoonInSunSign = phaseName === 'New Moon' && natalSun !== undefined && sign === natalSun.modernSign

    if (isSolarReturn) reasons.unshift('☀️ Solar Return — your personal power day of the year')
    if (isNewMoonInSunSign && natalSun) reasons.unshift(`🌑 New Moon in ${natalSun.modernSign} — your most powerful reset of the year`)

    const isSpecial = isSolarReturn || isNewMoonInSunSign

    results.push({ date: dateStr, score, stars: isSpecial ? 5 : 0, moonPhaseName: phaseName, moonSign: sign, dayName: DAY_NAMES[dow], reasons })
  }

  assignStars(results)

  return results
}
