import Papa from 'papaparse'
import { GAME_CONFIG } from './types'
import type { Draw, Era, Game } from './types'

export function parseDrawDate(raw: string): string {
  return raw.slice(0, 10)
}

export function tagEra(game: Game, date: string): Era {
  return date >= GAME_CONFIG[game].currentEraStart ? 'current' : 'legacy'
}

export function parseCsvRow(game: Game, row: Record<string, string>): Draw {
  const date = parseDrawDate(row.draw_date)
  const whites = [
    parseInt(row.n1, 10),
    parseInt(row.n2, 10),
    parseInt(row.n3, 10),
    parseInt(row.n4, 10),
    parseInt(row.n5, 10),
  ].sort((a, b) => a - b)
  return { date, whites, bonus: parseInt(row.bonus, 10), game, era: tagEra(game, date) }
}

export function parseApiRow(game: Game, row: Record<string, string>): Draw {
  const date = parseDrawDate(row.draw_date)
  const nums = row.winning_numbers.trim().split(/\s+/).map(Number)
  // Powerball: 6 numbers in winning_numbers (5 white + bonus as last)
  // Mega Millions: 5 numbers in winning_numbers, bonus in mega_ball field
  const whites = nums.slice(0, 5).sort((a, b) => a - b)
  const bonus = game === 'powerball' ? nums[5] : parseInt(row['mega_ball'], 10)
  const multiplier = row.multiplier ? parseInt(row.multiplier, 10) : undefined
  return { date, whites, bonus, game, era: tagEra(game, date), multiplier }
}

export function parseCsv(game: Game, csvText: string): Draw[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })
  return result.data.map(row => parseCsvRow(game, row))
}

// Texas Lottery CSV format (no header):
// Mega Millions, Month, Day, Year, n1, n2, n3, n4, n5, megaball, megaplier
export function parseTxLotteryCsv(csvText: string): Draw[] {
  return csvText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('Mega Millions'))
    .map(line => {
      const p = line.split(',')
      const month = p[1].trim().padStart(2, '0')
      const day = p[2].trim().padStart(2, '0')
      const year = p[3].trim()
      const date = `${year}-${month}-${day}`
      const whites = [p[4], p[5], p[6], p[7], p[8]]
        .map(n => parseInt(n.trim(), 10))
        .sort((a, b) => a - b)
      const bonus = parseInt(p[9].trim(), 10)
      const rawMult = p[10]?.trim()
      const multiplier = rawMult ? parseInt(rawMult, 10) || undefined : undefined
      return { date, whites, bonus, game: 'megamillions' as const, era: tagEra('megamillions', date), multiplier }
    })
    .filter(d => !isNaN(d.bonus))
}

export function mergeAndDedup(a: Draw[], b: Draw[]): Draw[] {
  const seen = new Map<string, Draw>()
  for (const draw of [...a, ...b]) {
    seen.set(draw.date, draw)
  }
  return Array.from(seen.values()).sort((x, y) => x.date.localeCompare(y.date))
}
