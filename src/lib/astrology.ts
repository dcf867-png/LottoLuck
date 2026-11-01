import { julian, solar, moonposition } from 'astronomia'
import { Planet } from 'astronomia/planetposition'
import vsopEarth from 'astronomia/data/vsop87Bearth'
import vsopMercury from 'astronomia/data/vsop87Bmercury'
import vsopVenus from 'astronomia/data/vsop87Bvenus'
import vsopMars from 'astronomia/data/vsop87Bmars'
import vsopJupiter from 'astronomia/data/vsop87Bjupiter'
import vsopSaturn from 'astronomia/data/vsop87Bsaturn'

const RAD = 180 / Math.PI

const earthPlanet = new Planet(vsopEarth)
const mercuryPlanet = new Planet(vsopMercury)
const venusPlanet = new Planet(vsopVenus)
const marsPlanet = new Planet(vsopMars)
const jupiterPlanet = new Planet(vsopJupiter)
const saturnPlanet = new Planet(vsopSaturn)

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

function norm360(x: number): number {
  return ((x % 360) + 360) % 360
}

function lonToSign(lon: number): string {
  return SIGNS[Math.floor(norm360(lon) / 30)]
}

// Gap between the star-fixed Babylonian zodiac and the modern one: Huber's value at J2000 plus precession
function starOffset(jde: number): number {
  return 24.7336 + (5027.8 / 3600) * ((jde - 2451545.0) / 36525.0)
}

function jdeFromParts(dateStr: string, utHours: number): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return julian.CalendarGregorianToJD(y, m, d + utHours / 24)
}

function solarLon(jde: number): number {
  const T = (jde - 2451545.0) / 36525.0
  return norm360(solar.apparentLongitude(T) * RAD)
}

function moonLonDeg(jde: number): number {
  return norm360(moonposition.position(jde).lon * RAD)
}

// VSOP positions are measured from the Sun, so Earth's is removed to get the planet's place in our sky
function planetLonDeg(planet: Planet, jde: number): number {
  const p = planet.position(jde)
  const e = earthPlanet.position(jde)
  const x = p.range * Math.cos(p.lat) * Math.cos(p.lon) - e.range * Math.cos(e.lat) * Math.cos(e.lon)
  const y = p.range * Math.cos(p.lat) * Math.sin(p.lon) - e.range * Math.cos(e.lat) * Math.sin(e.lon)
  return norm360(Math.atan2(y, x) * RAD)
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

// How each body behaves when it enters a sign: Babylonian benefics above zero, malefics below
export const PLANET_NATURE: Record<string, number> = {
  Jupiter: 1.0, Venus: 0.85, Moon: 0.60, Sun: 0.50,
  Mercury: 0.30, Mars: -0.50, Saturn: -0.60,
}

export interface PlanetInfo {
  name: string
  lon: number
  sign: string
  modernSign: string
}

export interface NatalChart {
  birthDate: string
  birthTime?: string
  lat?: number
  lng?: number
  planets: PlanetInfo[]
  todayMoonPhase: number
  todayMoonPhaseName: string
}

function planetInfo(name: string, modernLon: number, jde: number): PlanetInfo {
  const lon = norm360(modernLon - starOffset(jde))
  return { name, lon, sign: lonToSign(lon), modernSign: lonToSign(modernLon) }
}

function skyAt(jde: number): PlanetInfo[] {
  return [
    planetInfo('Sun', solarLon(jde), jde),
    planetInfo('Moon', moonLonDeg(jde), jde),
    planetInfo('Mercury', planetLonDeg(mercuryPlanet, jde), jde),
    planetInfo('Venus', planetLonDeg(venusPlanet, jde), jde),
    planetInfo('Mars', planetLonDeg(marsPlanet, jde), jde),
    planetInfo('Jupiter', planetLonDeg(jupiterPlanet, jde), jde),
    planetInfo('Saturn', planetLonDeg(saturnPlanet, jde), jde),
  ]
}

export function buildNatalChart(
  birthDate: string,
  birthTime?: string,
  lat?: number,
  lng?: number,
): NatalChart {
  let utHours = 12
  if (birthTime) {
    const [h, m] = birthTime.split(':').map(Number)
    const utcOffset = lng != null ? Math.round(lng / 15) : 0
    utHours = h + m / 60 - utcOffset
  }

  const birthJDE = jdeFromParts(birthDate, utHours)
  const todayJDE = julian.DateToJD(new Date())

  const todaySunLon = solarLon(todayJDE)
  const todayMoonLon = moonLonDeg(todayJDE)
  const todayMoonPhase = norm360(todayMoonLon - todaySunLon)

  return {
    birthDate,
    birthTime,
    lat,
    lng,
    planets: skyAt(birthJDE),
    todayMoonPhase,
    todayMoonPhaseName: moonPhaseName(todayMoonPhase),
  }
}

export function getTransits(date: Date = new Date()): PlanetInfo[] {
  return skyAt(julian.DateToJD(date))
}
