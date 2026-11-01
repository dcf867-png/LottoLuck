import { moonphase, moonposition, solar, solstice } from 'astronomia'

const RAD = 180 / Math.PI
const DEG = Math.PI / 180

// Babylon, in present-day Iraq. Months are worked out from here so everyone shares one calendar.
const BABYLON_LAT = 32.54 * DEG
const BABYLON_LNG = 44.42

const SYNODIC_MONTH = 29.530588
const MAX_MONTH_DAYS = 30
const UNIX_EPOCH_JD = 2440587.5

// A crescent counts as seen once the Moon is a day old and sets 48 minutes after the Sun
const MIN_MOON_AGE_DAYS = 1
const MIN_MOONSET_LAG_DAYS = 48 / 1440

// Geocentric altitudes at the moment of setting, allowing for refraction and the Moon's parallax
const SUNSET_ALTITUDE = -0.8333
const MOONSET_ALTITUDE = 0.125

export const MONTH_NAMES = [
  'Nisannu', 'Ayyaru', 'Simanu', 'Duuzu', 'Abu', 'Elulu',
  'Tashritu', 'Arahsamna', 'Kislimu', 'Tebetu', 'Shabatu', 'Addaru', 'Second Addaru',
]

interface FavorableDays {
  full: number[]
  half: number[]
}

// Months 1–12 are tablet K.98 + MS 2226 (7th century BC, copied from originals "from Babylon"),
// the only one with all twelve lists complete. Second Addaru is BM 50634, whose opening is lost.
// A "½" on the tablet goes in `half`. Editions: Jiménez et al., Cuneiform Commentaries Project (Yale),
// CCP 3.8.1.A and 3.8.1.E. Where the tablet reads "14/15" both days are treated as half.
const FAVORABLE_DAYS: FavorableDays[] = [
  { full: [1, 8, 10, 11, 14, 16], half: [4, 6, 23] },
  { full: [2, 6, 8, 10, 12, 15, 16, 18, 20, 22, 24, 26, 28, 29, 30], half: [] },
  { full: [3, 5, 9, 11, 12, 13, 15, 16, 22, 24, 27, 30], half: [] },
  { full: [3, 7, 11, 13, 17, 19, 21, 22, 26, 27, 28, 29], half: [] },
  { full: [1, 2, 10, 12, 15, 16], half: [6] },
  { full: [1, 2, 3, 5, 7, 9, 11, 14, 15, 17, 19, 22, 27, 29], half: [] },
  { full: [1, 4, 6, 7, 9, 11, 14, 17, 19, 21, 22, 23, 26, 28, 29], half: [8, 13] },
  { full: [2, 6, 7, 9, 11, 13, 15, 17, 19, 20, 22, 24, 26, 28, 30], half: [] },
  { full: [1, 5, 9, 11, 13, 16, 18, 21, 23, 25, 29, 30], half: [] },
  { full: [7, 13, 14, 21, 22, 23, 25, 26, 28, 29], half: [11, 17, 24, 27] },
  { full: [1, 7, 11, 14, 17, 19, 21, 22, 23, 25, 26, 28], half: [10, 29] },
  { full: [1, 2, 4, 5, 6, 8, 9, 12, 13, 16, 20, 22, 24, 25, 27, 30], half: [14, 15] },
  { full: [7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28], half: [] },
]

function norm360(x: number): number {
  return ((x % 360) + 360) % 360
}

function decimalYear(jde: number): number {
  return 2000 + (jde - 2451545.0) / 365.25
}

function dayNumber(jd: number): number {
  return Math.floor(jd - UNIX_EPOCH_JD)
}

function altitudeAtBabylon(lon: number, lat: number, jd: number): number {
  const eps = 23.4393 * DEG
  const ra = Math.atan2(Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps), Math.cos(lon))
  const dec = Math.asin(Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon))
  const greenwich = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0))
  const hourAngle = (greenwich + BABYLON_LNG) * DEG - ra
  return Math.asin(
    Math.sin(BABYLON_LAT) * Math.sin(dec) + Math.cos(BABYLON_LAT) * Math.cos(dec) * Math.cos(hourAngle),
  ) * RAD
}

function sunAltitude(jd: number): number {
  return altitudeAtBabylon(solar.apparentLongitude((jd - 2451545.0) / 36525.0), 0, jd)
}

function moonAltitude(jd: number): number {
  const moon = moonposition.position(jd)
  return altitudeAtBabylon(moon.lon, moon.lat, jd)
}

function sunsetAtBabylon(day: number): number {
  let lo = UNIX_EPOCH_JD + day + (12 - BABYLON_LNG / 15) / 24
  let hi = lo + 0.45
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2
    if (sunAltitude(mid) > SUNSET_ALTITUDE) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// Babylonian days began at sunset, so the day after the crescent is seen is day 1 of the month
function monthStartAfter(conjunction: number): number {
  const firstEvening = dayNumber(conjunction)
  for (let evening = firstEvening; evening < firstEvening + 3; evening++) {
    const sunset = sunsetAtBabylon(evening)
    if (sunset - conjunction < MIN_MOON_AGE_DAYS) continue
    if (moonAltitude(sunset + MIN_MOONSET_LAG_DAYS) > MOONSET_ALTITUDE) return evening + 1
  }
  return firstEvening + 4
}

function monthStartsBetween(fromJde: number, toJde: number): number[] {
  const starts: number[] = []
  let conjunction = moonphase.newMoon(decimalYear(fromJde))
  while (conjunction < toJde) {
    const previous = starts[starts.length - 1]
    const start = monthStartAfter(conjunction)
    starts.push(previous === undefined ? start : Math.min(start, previous + MAX_MONTH_DAYS))
    conjunction = moonphase.newMoon(decimalYear(conjunction + SYNODIC_MONTH))
  }
  return starts
}

const yearCache = new Map<number, number[]>()

// The year opens on the first new month on or after the spring equinox, which keeps Nisannu in
// spring. A year holding 13 months before the next opening gets Second Addaru. The list ends with
// the next year's first day.
function monthsOfYear(year: number): number[] {
  const cached = yearCache.get(year)
  if (cached) return cached

  const equinox = solstice.march(year)
  const nextEquinox = solstice.march(year + 1)
  const starts = monthStartsBetween(equinox - 1.5 * SYNODIC_MONTH, nextEquinox + 1.5 * SYNODIC_MONTH)
  const first = starts.findIndex(s => s >= dayNumber(equinox))
  const next = starts.findIndex(s => s >= dayNumber(nextEquinox))
  const months = starts.slice(first, next + 1)
  yearCache.set(year, months)
  return months
}

export function monthsInYear(year: number): number {
  return monthsOfYear(year).length - 1
}

export interface BabylonianMonth {
  name: string
  start: Date
  days: number
}

export function babylonianMonths(year: number): BabylonianMonth[] {
  const months = monthsOfYear(year)
  return months.slice(0, -1).map((start, i) => {
    const utc = new Date(start * 86400000)
    return {
      name: MONTH_NAMES[i],
      start: new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()),
      days: months[i + 1] - start,
    }
  })
}

export interface BabylonianDate {
  year: number
  monthIndex: number
  monthName: string
  day: number
}

export function babylonianDate(date: Date): BabylonianDate {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  const year = today < monthsOfYear(date.getFullYear())[0] ? date.getFullYear() - 1 : date.getFullYear()
  const months = monthsOfYear(year)
  const monthIndex = months.findIndex((start, i) => today >= start && today < months[i + 1])
  return { year, monthIndex, monthName: MONTH_NAMES[monthIndex], day: today - months[monthIndex] + 1 }
}

// 1 = listed as favorable, 0.5 = listed with a ½, 0 = not listed
export function favorableWeight(monthIndex: number, day: number): number {
  const list = FAVORABLE_DAYS[monthIndex]
  if (list.full.includes(day)) return 1
  return list.half.includes(day) ? 0.5 : 0
}
