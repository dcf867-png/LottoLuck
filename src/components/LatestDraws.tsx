import { useState } from 'react'
import type { Draw } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'

interface Props {
  pbDraws: Draw[]
  mmDraws: Draw[]
}

function Ball({ num, color }: { num: number; color: string }) {
  return (
    <div className={`${color} w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md`}>
      {num}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DrawRow({ draw, game }: { draw: Draw; game: 'powerball' | 'megamillions' }) {
  const cfg = GAME_CONFIG[game]
  const labelColor = game === 'powerball' ? 'text-red-500' : 'text-yellow-400'
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-semibold ${labelColor}`}>{cfg.label}</span>
        <span className="text-[11px] text-gray-400">{formatDate(draw.date)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {draw.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
        <Ball num={draw.bonus} color={cfg.bonusColor} />
        {draw.multiplier && (
          <span className="ml-1 text-xs text-gray-400">
            {game === 'powerball' ? 'PP' : 'MX'} <span className="text-white font-bold">{draw.multiplier}×</span>
          </span>
        )}
      </div>
    </div>
  )
}

type RangeEntry = { draw: Draw; game: 'powerball' | 'megamillions' }

export default function LatestDraws({ pbDraws, mmDraws }: Props) {
  const [date, setDate] = useState('')
  const [lookupResult, setLookupResult] = useState<{ pb: Draw | null; mm: Draw | null } | null>(null)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [rangeResults, setRangeResults] = useState<RangeEntry[] | null>(null)
  const [rangeError, setRangeError] = useState('')

  const pbRecent = pbDraws.slice(-5).reverse()
  const mmRecent = mmDraws.slice(-5).reverse()

  function handleLookup() {
    if (!date) return
    const pb = pbDraws.find(d => d.date === date) ?? null
    const mm = mmDraws.find(d => d.date === date) ?? null
    setLookupResult({ pb, mm })
  }

  function handleClear() {
    setDate('')
    setLookupResult(null)
  }

  function handleRangeSearch() {
    setRangeError('')
    if (!fromDate || !toDate) { setRangeError('Please enter both a from and to date.'); return }
    if (fromDate > toDate) { setRangeError('"From" date must be before "To" date.'); return }
    const pb: RangeEntry[] = pbDraws
      .filter(d => d.date >= fromDate && d.date <= toDate)
      .map(d => ({ draw: d, game: 'powerball' as const }))
    const mm: RangeEntry[] = mmDraws
      .filter(d => d.date >= fromDate && d.date <= toDate)
      .map(d => ({ draw: d, game: 'megamillions' as const }))
    const combined = [...pb, ...mm].sort((a, b) => b.draw.date.localeCompare(a.draw.date))
    setRangeResults(combined)
  }

  function handleRangeClear() {
    setFromDate('')
    setToDate('')
    setRangeResults(null)
    setRangeError('')
  }

  const hasAnyResult = lookupResult && (lookupResult.pb || lookupResult.mm)
  const noResults = lookupResult && !lookupResult.pb && !lookupResult.mm

  return (
    <>
      {/* Draw Date Lookup */}
      <section className="panel">
        <h2 className="panel-title text-white">
          <span className="dot" />Draw Date Lookup
        </h2>
        <p className="text-xs text-gray-400 mb-3">Enter a draw date to see the winning numbers.</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setLookupResult(null) }}
              className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-orange-500 pr-8"
            />
            {date && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none"
                aria-label="Clear date"
              >×</button>
            )}
          </div>
          <button
            onClick={handleLookup}
            disabled={!date}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-lg transition-colors"
          >
            Look up
          </button>
        </div>

        {noResults && (
          <p className="text-xs text-red-400 mt-3">No draws found for that date.</p>
        )}

        {hasAnyResult && (
          <div className="mt-4 flex flex-col gap-3">
            {lookupResult.pb && (
              <div className="bg-black/25 rounded-lg py-3 px-3">
                <DrawRow draw={lookupResult.pb} game="powerball" />
              </div>
            )}
            {lookupResult.mm && (
              <div className="bg-black/25 rounded-lg py-3 px-3">
                <DrawRow draw={lookupResult.mm} game="megamillions" />
              </div>
            )}
          </div>
        )}
      </section>

      {/* Date Range Lookup */}
      <section className="panel">
        <h2 className="panel-title text-white">
          <span className="dot" />Date Range Lookup
        </h2>
        <p className="text-xs text-gray-400 mb-3">List all draws between two dates.</p>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 w-8 shrink-0">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setRangeResults(null) }}
              className="flex-1 bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 w-8 shrink-0">To</span>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setRangeResults(null) }}
              className="flex-1 bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleRangeSearch}
              disabled={!fromDate || !toDate}
              className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Search
            </button>
            {(fromDate || toDate || rangeResults) && (
              <button
                onClick={handleRangeClear}
                className="text-sm text-gray-500 hover:text-white px-3 rounded-lg border border-white/10 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {rangeError && <p className="text-xs text-red-400 mt-2">{rangeError}</p>}

        {rangeResults !== null && rangeResults.length === 0 && (
          <p className="text-xs text-gray-500 mt-3">No draws found in that date range.</p>
        )}

        {rangeResults !== null && rangeResults.length > 0 && (
          <div className="mt-4 flex flex-col gap-1 max-h-96 overflow-y-auto">
            <p className="text-[10px] text-gray-500 mb-1">{rangeResults.length} draw{rangeResults.length !== 1 ? 's' : ''} found</p>
            {rangeResults.map(({ draw, game }) => (
              <div key={`${game}-${draw.date}`} className="bg-black/25 rounded-lg py-2 px-3">
                <DrawRow draw={draw} game={game} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent draws list */}
      <section className="panel">
        <h2 className="panel-title text-white/80">
          <span className="dot" />Recent Draws
        </h2>

        <div className="flex flex-col gap-0">
          <p className="text-[10px] uppercase tracking-widest text-red-500 mb-1">Powerball</p>
          {pbRecent.map((draw, i) => (
            <div key={draw.date}>
              <DrawRow draw={draw} game="powerball" />
              {i < pbRecent.length - 1 && <div className="border-t border-white/5" />}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 my-4" />

        <div className="flex flex-col gap-0">
          <p className="text-[10px] uppercase tracking-widest text-yellow-400 mb-1">Mega Millions</p>
          {mmRecent.map((draw, i) => (
            <div key={draw.date}>
              <DrawRow draw={draw} game="megamillions" />
              {i < mmRecent.length - 1 && <div className="border-t border-white/5" />}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
