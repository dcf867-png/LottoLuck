import { julian, solar, moonposition, sidereal } from 'astronomia'
import { Planet } from 'astronomia/planetposition'
import vsopMercury from 'astronomia/data/vsop87Bmercury'
import vsopVenus from 'astronomia/data/vsop87Bvenus'
import vsopMars from 'astronomia/data/vsop87Bmars'
import vsopJupiter from 'astronomia/data/vsop87Bjupiter'
import vsopSaturn from 'astronomia/data/vsop87Bsaturn'

const RAD = 180 / Math.PI
const DEG = Math.PI / 180

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

function planetLonDeg(planet: Planet, jde: number): number {
  return norm360(planet.position(jde).lon * RAD)
}

function ascendantLonDeg(jde: number, lat: number, lng: number): number {
  const gst = norm360(sidereal.apparent(jde) * RAD)
  const lst = (gst + lng + 360) % 360
  const ramc = lst * DEG
  const eps = 23.4397 * DEG
  const phi = lat * DEG
  const asc = Math.atan2(Math.cos(ramc), -Math.sin(ramc) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps))
  return norm360(asc * RAD)
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

export interface PlanetInfo {
  name: string
  lon: number
  sign: string
}

export interface NatalChart {
  birthDate: string
  birthTime?: string
  lat?: number
  lng?: number
  planets: PlanetInfo[]
  ascendant?: PlanetInfo
  todayMoonPhase: number
  todayMoonPhaseName: string
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

  const sunLon = solarLon(birthJDE)
  const moonLon = moonLonDeg(birthJDE)
  const mercuryLon = planetLonDeg(mercuryPlanet, birthJDE)
  const venusLon = planetLonDeg(venusPlanet, birthJDE)
  const marsLon = planetLonDeg(marsPlanet, birthJDE)
  const jupiterLon = planetLonDeg(jupiterPlanet, birthJDE)
  const saturnLon = planetLonDeg(saturnPlanet, birthJDE)

  const planets: PlanetInfo[] = [
    { name: 'Sun', lon: sunLon, sign: lonToSign(sunLon) },
    { name: 'Moon', lon: moonLon, sign: lonToSign(moonLon) },
    { name: 'Mercury', lon: mercuryLon, sign: lonToSign(mercuryLon) },
    { name: 'Venus', lon: venusLon, sign: lonToSign(venusLon) },
    { name: 'Mars', lon: marsLon, sign: lonToSign(marsLon) },
    { name: 'Jupiter', lon: jupiterLon, sign: lonToSign(jupiterLon) },
    { name: 'Saturn', lon: saturnLon, sign: lonToSign(saturnLon) },
  ]

  let ascendant: PlanetInfo | undefined
  if (birthTime && lat != null && lng != null) {
    const ascLon = ascendantLonDeg(birthJDE, lat, lng)
    ascendant = { name: 'Ascendant', lon: ascLon, sign: lonToSign(ascLon) }
  }

  const todaySunLon = solarLon(todayJDE)
  const todayMoonLon = moonLonDeg(todayJDE)
  const todayMoonPhase = norm360(todayMoonLon - todaySunLon)

  return {
    birthDate,
    birthTime,
    lat,
    lng,
    planets,
    ascendant,
    todayMoonPhase,
    todayMoonPhaseName: moonPhaseName(todayMoonPhase),
  }
}

export function getCurrentTransits(): PlanetInfo[] {
  const jde = julian.DateToJD(new Date())

  const sunLon = solarLon(jde)
  const moonLon = moonLonDeg(jde)
  const mercuryLon = planetLonDeg(mercuryPlanet, jde)
  const venusLon = planetLonDeg(venusPlanet, jde)
  const marsLon = planetLonDeg(marsPlanet, jde)
  const jupiterLon = planetLonDeg(jupiterPlanet, jde)
  const saturnLon = planetLonDeg(saturnPlanet, jde)

  return [
    { name: 'Sun', lon: sunLon, sign: lonToSign(sunLon) },
    { name: 'Moon', lon: moonLon, sign: lonToSign(moonLon) },
    { name: 'Mercury', lon: mercuryLon, sign: lonToSign(mercuryLon) },
    { name: 'Venus', lon: venusLon, sign: lonToSign(venusLon) },
    { name: 'Mars', lon: marsLon, sign: lonToSign(marsLon) },
    { name: 'Jupiter', lon: jupiterLon, sign: lonToSign(jupiterLon) },
    { name: 'Saturn', lon: saturnLon, sign: lonToSign(saturnLon) },
  ]
}
