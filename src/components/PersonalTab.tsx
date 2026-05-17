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

export default function PersonalTab() {
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [cityState, setCityState] = useState('')
  const [chart, setChart] = useState<NatalChart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
      setChart(buildNatalChart(birthDate, birthTime || undefined, lat, lng))
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
        onBirthDateChange={setBirthDate}
        onBirthTimeChange={setBirthTime}
        onCityStateChange={setCityState}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        error={error}
      />
      <NumerologyPick sharedBirthDate={birthDate} />
    </>
  )
}
