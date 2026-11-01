import { describe, it, expect } from 'vitest'
import { babylonianDate, favorableWeight, monthsInYear, MONTH_NAMES } from './babylonian'
import { buildNatalChart, getTransits } from './astrology'
import { generateAstrologyPick } from './astroLucky'
import { scoreDays } from './luckyDays'

function localDate(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d, 12)
}

describe('babylonian calendar', () => {
  it('opens 2026 on the first crescent after the spring equinox', () => {
    expect(babylonianDate(localDate(2026, 3, 21))).toMatchObject({ year: 2026, monthName: 'Nisannu', day: 1 })
    expect(babylonianDate(localDate(2026, 3, 20)).year).toBe(2025)
  })

  it('adds a 13th month in about 7 of every 19 years', () => {
    for (const start of [2000, 2019]) {
      const years = Array.from({ length: 19 }, (_, i) => monthsInYear(start + i))
      expect(years.every(n => n === 12 || n === 13)).toBe(true)
      const thirteen = years.filter(n => n === 13).length
      expect(thirteen).toBeGreaterThanOrEqual(6)
      expect(thirteen).toBeLessThanOrEqual(8)
    }
  })

  it('only makes months of 29 or 30 days and keeps Nisannu near the equinox', () => {
    const lengths = new Map<string, number>()
    const day = localDate(2024, 1, 1)
    for (let i = 0; i < 365 * 8; i++) {
      const date = babylonianDate(day)
      if (date.monthIndex < 0) throw new Error(`no month for ${day.toISOString()}`)
      const key = `${date.year}-${date.monthIndex}`
      lengths.set(key, Math.max(lengths.get(key) ?? 0, date.day))
      if (date.monthIndex === 0 && date.day === 1) {
        expect(day.getMonth()).toBeGreaterThanOrEqual(2)
        expect(day.getMonth()).toBeLessThanOrEqual(3)
      }
      day.setDate(day.getDate() + 1)
    }
    const full = [...lengths.entries()].slice(1, -1).map(([, length]) => length)
    expect(full.every(length => length === 29 || length === 30)).toBe(true)
  })

  it('reads favorable days from the tablet', () => {
    expect(MONTH_NAMES).toHaveLength(13)
    expect(favorableWeight(0, 1)).toBe(1)
    expect(favorableWeight(0, 4)).toBe(0.5)
    expect(favorableWeight(0, 2)).toBe(0)
    expect(favorableWeight(12, 17)).toBe(1)
  })
})

describe('sky positions', () => {
  // Modern-zodiac chart for 2000-01-01 12:00 UT
  it('places the planets as seen from Earth', () => {
    const modern = buildNatalChart('2000-01-01').planets
    const signs = Object.fromEntries(modern.map(p => [p.name, p.modernSign]))
    expect(signs).toMatchObject({
      Sun: 'Capricorn', Moon: 'Scorpio', Mercury: 'Capricorn', Venus: 'Sagittarius',
      Mars: 'Aquarius', Jupiter: 'Aries', Saturn: 'Taurus',
    })
  })

  it('moves signs back about 25 degrees to the stars', () => {
    const sun = buildNatalChart('2000-04-01').planets.find(p => p.name === 'Sun')!
    expect(sun.modernSign).toBe('Aries')
    expect(sun.sign).toBe('Pisces')
  })

  it('returns all seven bodies for a given date', () => {
    expect(getTransits(localDate(2026, 11, 1))).toHaveLength(7)
  })
})

describe('luck calculation', () => {
  const chart = buildNatalChart('1985-06-15')

  it('scores every day with a Babylonian date and no numerology reasons', () => {
    const days = scoreDays(chart, 30, localDate(2026, 11, 1))
    expect(days).toHaveLength(30)
    for (const day of days) {
      expect(day.score).toBeGreaterThanOrEqual(0)
      expect(day.score).toBeLessThanOrEqual(1)
      expect(day.babylonianDate).toMatch(/^[A-Za-z ]+ \d+$/)
      expect(day.reasons.join(' ')).not.toMatch(/Personal Day|Life Path|retrograde/)
    }
  })

  it('still builds valid picks for both games', () => {
    for (const game of ['powerball', 'megamillions'] as const) {
      const { whites, bonus } = generateAstrologyPick(chart, game)
      expect(new Set(whites).size).toBe(5)
      expect(bonus).toBeGreaterThanOrEqual(1)
    }
  })
})
