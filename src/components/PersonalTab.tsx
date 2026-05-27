import { useState, useEffect } from 'react'
import { buildNatalChart, type NatalChart } from '../lib/astrology'
import AstroPanel from './AstroPanel'
import NumerologyPick from './NumerologyPick'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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
  const { user } = useAuth()
  const [birthDate, setBirthDate] = useState(stateRef.current.birthDate ?? '')
  const [birthTime, setBirthTime] = useState(stateRef.current.birthTime ?? '')
  const [cityState, setCityState] = useState(stateRef.current.cityState ?? '')
  const [chart, setChart] = useState<NatalChart | null>(stateRef.current.chart ?? null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Auto-load profile data when user is logged in
  useEffect(() => {
    if (!user || stateRef.current.chart) return
    supabase
      .from('profiles')
      .select('birth_date, birth_time, birth_city')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const date = data.birth_date ?? ''
        const time = data.birth_time ?? ''
        const city = data.birth_city ?? ''
        if (date) {
          setBirthDate(date)
          setBirthTime(time)
          setCityState(city)
          persist({ birthDate: date, birthTime: time, cityState: city })
          setProfileLoaded(true)
          generateChart(date, time, city)
        }
      })
  }, [user])

  // Persist state into the ref so it survives unmount
  function persist(patch: Partial<PersonalTabState>) {
    Object.assign(stateRef.current, patch)
  }

  async function generateChart(date: string, time: string, city: string) {
    if (!date) { setError('Please enter your date of birth.'); return }
    setError('')
    setIsLoading(true)
    try {
      let lat: number | undefined
      let lng: number | undefined
      if (city.trim()) {
        const coords = await geocodeCity(city.trim())
        if (coords) { lat = coords.lat; lng = coords.lng }
      }
      const newChart = buildNatalChart(date, time || undefined, lat, lng)
      setChart(newChart)
      persist({ chart: newChart })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = () => generateChart(birthDate, birthTime, cityState)

  return (
    <>
      {profileLoaded && (
        <div className="mx-4 mb-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 text-center">
          ✓ Birth info loaded from your profile
        </div>
      )}
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
