declare module 'astronomia' {
  export const julian: {
    CalendarGregorianToJD(year: number, month: number, day: number): number
    DateToJD(date: Date): number
  }
  export const solar: {
    apparentLongitude(T: number): number
  }
  export const moonposition: {
    position(jde: number): { lon: number; lat: number; delta: number }
  }
  export const sidereal: {
    apparent(jde: number): number
  }
}

declare module 'astronomia/planetposition' {
  export class Planet {
    constructor(data: unknown)
    position(jde: number): { lon: number; lat: number; range: number }
  }
}

declare module 'astronomia/data/vsop87Bmercury' { const d: unknown; export default d }
declare module 'astronomia/data/vsop87Bvenus'   { const d: unknown; export default d }
declare module 'astronomia/data/vsop87Bmars'    { const d: unknown; export default d }
declare module 'astronomia/data/vsop87Bjupiter' { const d: unknown; export default d }
declare module 'astronomia/data/vsop87Bsaturn'  { const d: unknown; export default d }
