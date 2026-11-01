import { babylonianDate, babylonianMonths } from './babylonian'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December']

export interface CalendarMonth {
  title: string
  subtitle?: string
  position?: { index: number; total: number }
  start: Date
  last: Date
  days: number
}

function formatDay(date: Date, withYear = false): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) })
}

// Offsets count forward from the month holding today, which is offset 0
export function regularMonthAt(offset: number): CalendarMonth {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const last = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  return { title: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`, start, last, days: last.getDate() }
}

export function babylonianMonthAt(offset: number): CalendarMonth {
  const today = babylonianDate(new Date())
  let year = today.year
  let index = today.monthIndex + offset
  let months = babylonianMonths(year)
  while (index >= months.length) {
    index -= months.length
    year++
    months = babylonianMonths(year)
  }

  const { name, start, days } = months[index]
  const last = new Date(start)
  last.setDate(last.getDate() + days - 1)
  return {
    title: name,
    subtitle: `Month ${index + 1} of ${months.length} · ${formatDay(start)} – ${formatDay(last, true)}`,
    position: { index, total: months.length },
    start,
    last,
    days,
  }
}
