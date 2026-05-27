import { useState } from 'react'
import { buildNatalChart, type NatalChart } from '../lib/astrology'
import AstroPanel from './AstroPanel'
import NumerologyPick from './NumerologyPick'

async function geocodeCity(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data: Array<{ lat: string; lon: string }> = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export interface PersonalTabState {
  birthDate?: string
  birthTime?: string
  cityState?: string
  chart?: NatalChart | null
}

interface Props {
  stateRef: React.MutableRefObject<PersonalTabState>
}

export default function PersonalTab({ stateRef }: Props) {
  const [birthDate, setBirthDate] = useState(stateRef.current.birthDate ?? '')
  const [birthTime, setBirthTime] = useState(stateRef.current.birthTime ?? '')
  const [cityState, setCityState] = useState(stateRef.current.cityState ?? '')
  const [chart, setChart] = useState<NatalChart | null>(stateRef.current.chart ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Persist state into the ref so it survives unmount
  function persist(patch: Partial<PersonalTabState>) {
    Object.assign(stateRef.current, patch)
  }

  async function handleGenerate() {
    if (!birthDate) { setError('Please enter your date of birth.'); return }
    setError('')
    setIsLoading(true)
    try {
      let lat: number | undefined
      let lng: number | undefined
      if (cityState.trim()) {
        const coords = await geocodeCity(cityState.trim())
        if (coords) { lat = coords.lat; lng = coords.lng }
      }
      const newChart = buildNatalChart(birthDate, birthTime || undefined, lat, lng)
      setChart(newChart)
      persist({ chart: newChart })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AstroPanel
        chart={chart}
        birthDate={birthDate}
        birthTime={birthTime}
        cityState={cityState}
        onBirthDateChange={v => { setBirthDate(v); persist({ birthDate: v }) }}
        onBirthTimeChange={v => { setBirthTime(v); persist({ birthTime: v }) }}
        onCityStateChange={v => { setCityState(v); persist({ cityState: v }) }}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        error={error}
      />
      <NumerologyPick sharedBirthDate={birthDate} />
    </>
  )
}
