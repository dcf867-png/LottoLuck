import { useState } from 'react'
import { GAME_CONFIG } from '../lib/types'
import { buildNatalChart, type NatalChart } from '../lib/astrology'
import { generateAstrologyPick } from '../lib/astroLucky'

interface PickPair {
  pb: { whites: number[]; bonus: number }
  mm: { whites: number[]; bonus: number }
  index: number
}

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

function Ball({ num, color }: { num: number; color: string }) {
  return (
    <div className={`${color} rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-base shadow-lg`}>
      {num}
    </div>
  )
}

function ChartBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-300">{label}</span>
      <span className="text-sm font-bold text-purple-300">{value}</span>
    </div>
  )
}

export default function AstrologyPick() {
  const [open, setOpen] = useState(false)
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [cityState, setCityState] = useState('')
  const [chart, setChart] = useState<NatalChart | null>(null)
  const [picks, setPicks] = useState<PickPair[]>([])
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
      const natal = buildNatalChart(birthDate, birthTime || undefined, lat, lng)
      setChart(natal)
      setPicks([{
        pb: generateAstrologyPick(natal, 'powerball', 0),
        mm: generateAstrologyPick(natal, 'megamillions', 0),
        index: 0,
      }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleGenerateAnother() {
    if (!chart) return
    const nextIndex = picks.length
    setPicks(prev => [...prev, {
      pb: generateAstrologyPick(chart, 'powerball', nextIndex),
      mm: generateAstrologyPick(chart, 'megamillions', nextIndex),
      index: nextIndex,
    }])
  }

  const sun = chart?.planets.find(p => p.name === 'Sun')
  const moon = chart?.planets.find(p => p.name === 'Moon')

  return (
    <div className="px-4 pb-8">
      <div className="bg-gray-900 rounded-xl py-2 px-3 w-fit mx-auto">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 text-left"
        >
          <h3 className="text-sm font-semibold text-purple-400 underline underline-offset-2">Astrology Pick</h3>
          <span className={`text-gray-400 text-xl leading-none transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">No personal data is collected or shared with anyone.</p>

      {open && (
        <div className="mt-3">
          <p className="text-xs text-gray-300 mb-4">
            Generate a pick from your natal chart and today's planetary transits.
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-200 mb-1">Date of Birth <span className="text-purple-400">*</span></label>
              <div className="relative">
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-purple-500 pr-8"
                />
                {birthDate && (
                  <button
                    onClick={() => setBirthDate('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none"
                    aria-label="Clear date"
                  >×</button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-200 mb-1">
                Birth Time <span className="text-gray-400">(optional — enables rising sign)</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={birthTime}
                  onChange={e => setBirthTime(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-purple-500 pr-8"
                />
                {birthTime && (
                  <button
                    onClick={() => setBirthTime('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none"
                    aria-label="Clear time"
                  >×</button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-200 mb-1">
                Birth City / State <span className="text-gray-400">(optional — for rising sign accuracy)</span>
              </label>
              <input
                type="text"
                value={cityState}
                onChange={e => setCityState(e.target.value)}
                placeholder="e.g. Boise, Idaho"
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-purple-500"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Calculating...' : 'Generate My Pick'}
            </button>
          </div>

          {chart && picks.length > 0 && (
            <div className="border-t border-gray-800 pt-4 flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-300 mb-2 uppercase tracking-widest">Your Natal Chart</p>
                <div className="grid grid-cols-2 gap-3">
                  {sun && <ChartBadge label="Sun" value={sun.sign} />}
                  {moon && <ChartBadge label="Moon" value={moon.sign} />}
                  {chart.ascendant && <ChartBadge label="Rising" value={chart.ascendant.sign} />}
                  <ChartBadge label="Moon Phase" value={chart.todayMoonPhaseName} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {picks.map((pair, i) => (
                  <div key={pair.index} className="flex flex-col gap-3 bg-gray-800 rounded-lg py-3 px-2">
                    <p className="text-xs text-gray-300 uppercase tracking-widest text-center">Pick {i + 1}</p>

                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-red-500">Powerball</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {pair.pb.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
                        <Ball num={pair.pb.bonus} color={GAME_CONFIG.powerball.bonusColor} />
                      </div>
                    </div>

                    <div className="border-t border-gray-700" />

                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-yellow-400">Mega Millions</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {pair.mm.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
                        <Ball num={pair.mm.bonus} color={GAME_CONFIG.megamillions.bonusColor} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateAnother}
                className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors text-center"
              >
                Generate another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
