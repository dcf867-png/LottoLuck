import type { NatalChart, PlanetInfo } from './astrology'
import { getTransits, PLANET_NATURE } from './astrology'
import { babylonianDate, favorableWeight } from './babylonian'

const DEG = Math.PI / 180

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function norm360(x: number): number {
  return ((x % 360) + 360) % 360
}

// Peaks at new moon (0°) and full moon (180°), troughs at quarters
function moonPhaseScore(phase: number): number {
  return (1 + Math.cos(2 * phase * DEG)) / 2
}

function moonPhaseName(phase: number): string {
  if (phase < 22.5 || phase >= 337.5) return 'New Moon'
  if (phase < 67.5) return 'Waxing Crescent'
  if (phase < 112.5) return 'First Quarter'
  if (phase < 157.5) return 'Waxing Gibbous'
  if (phase < 202.5) return 'Full Moon'
  if (phase < 247.5) return 'Waning Gibbous'
  if (phase < 292.5) return 'Last Quarter'
  return 'Waning Crescent'
}

interface Contact {
  transit: PlanetInfo
  natal: PlanetInfo
  value: number
}

// Every sky body sharing a sign with a planet in the birth chart
function chartContacts(natal: NatalChart, transits: PlanetInfo[]): Contact[] {
  const contacts: Contact[] = []
  for (const transit of transits) {
    for (const planet of natal.planets) {
      if (transit.sign === planet.sign) {
        contacts.push({ transit, natal: planet, value: PLANET_NATURE[transit.name] })
      }
    }
  }
  return contacts.sort((a, b) => b.value - a.value)
}

export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface DayScore {
  date: string
  score: number       // 0–1
  stars: number       // 1–4
  moonPhaseName: string
  moonSign: string
  dayName: string
  babylonianDate: string
  reasons: string[]
}

export function scoreDays(natal: NatalChart, days = 42, startDate?: Date): DayScore[] {
  const today = startDate ? new Date(startDate) : new Date()
  today.setHours(12, 0, 0, 0)

  const natalSun = natal.planets.find(p => p.name === 'Sun')

  const results: DayScore[] = []

  for (let i = 0; i < days; i++) {
    const day = new Date(today)
    day.setDate(today.getDate() + i)
    const dateStr = toDateStr(day)

    const transits = getTransits(day)
    const sun = transits.find(t => t.name === 'Sun')!
    const moon = transits.find(t => t.name === 'Moon')!

    // Babylonian month and the tablet's favorable days
    const { monthIndex, monthName, day: monthDay } = babylonianDate(day)
    const babylonian = `${monthName} ${monthDay}`
    const favorable = favorableWeight(monthIndex, monthDay)
    const tabletScore = favorable === 1 ? 1 : favorable === 0.5 ? 0.6 : 0.15

    // Sky vs the full birth chart
    const contacts = chartContacts(natal, transits)
    const chartTotal = contacts.reduce((sum, c) => sum + c.value, 0)
    const chartScore = Math.max(0, Math.min(1, 0.5 + chartTotal * 0.2))

    // Moon phase
    const phase = norm360(moon.lon - sun.lon)
    const phaseName = moonPhaseName(phase)
    const phaseScore = moonPhaseScore(phase)

    // Combined weighted score
    const score = Math.max(0, Math.min(1,
      tabletScore * 0.45 +
      chartScore * 0.35 +
      phaseScore * 0.20
    ))

    // Human-readable reasons
    const reasons: string[] = []

    if (monthDay === 1) reasons.push(`New crescent — ${monthName} begins`)

    if (favorable === 1) {
      reasons.push(`${babylonian} — listed as favorable on the Babylonian tablet`)
    } else if (favorable === 0.5) {
      reasons.push(`${babylonian} — listed as half favorable on the Babylonian tablet`)
    } else {
      reasons.push(`${babylonian} — not on the tablet's list of favorable days`)
    }

    const best = contacts[0]
    const worst = contacts[contacts.length - 1]
    if (best && best.value > 0) {
      reasons.push(`${best.transit.name} in ${best.transit.sign} — shares a sign with your birth ${best.natal.name}`)
    }
    if (worst && worst.value < 0) {
      reasons.push(`${worst.transit.name} in ${worst.transit.sign} — weighs on your birth ${worst.natal.name}`)
    }

    if (phaseScore >= 0.9) {
      reasons.push(`${phaseName} — peak lunar energy`)
    } else if (phaseScore >= 0.55) {
      reasons.push(`${phaseName} — favorable lunar cycle`)
    } else if (phaseScore <= 0.15) {
      reasons.push('Quarter Moon — lower lunar momentum')
    }

    // Special day detection (5-star tier) — once-a-year events only
    const birthMMDD = natal.birthDate.slice(5)
    const isSolarReturn = dateStr.slice(5) === birthMMDD
    const isNewMoonInSunSign = phaseName === 'New Moon' && natalSun !== undefined && moon.sign === natalSun.sign

    if (isSolarReturn) reasons.unshift('☀️ Solar Return — your personal power day of the year')
    if (isNewMoonInSunSign && natalSun) reasons.unshift(`🌑 New Moon in ${natalSun.sign} — your most powerful reset of the year`)

    const isSpecial = isSolarReturn || isNewMoonInSunSign

    results.push({ date: dateStr, score, stars: isSpecial ? 5 : 0, moonPhaseName: phaseName, moonSign: moon.sign, dayName: DAY_NAMES[day.getDay()], babylonianDate: babylonian, reasons })
  }

  // Assign stars by rank: top 3 = 4 stars (indigo), rest by percentile
  const nonSpecial = results.filter(r => r.stars !== 5).sort((a, b) => a.score - b.score)
  const n = nonSpecial.length
  nonSpecial.forEach((r, rank) => {
    const pct = rank / n
    r.stars = pct >= 0.85 ? 4 : pct >= 0.60 ? 3 : pct >= 0.30 ? 2 : 1
  })

  return results
}
