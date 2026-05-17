import { useState, useMemo } from 'react'
import { GAME_CONFIG } from '../lib/types'
import type { NatalChart } from '../lib/astrology'
import { generateAstrologyPick } from '../lib/astroLucky'
import { scoreDays, toDateStr, type DayScore } from '../lib/luckyDays'

interface PickPair {
  pb: { whites: number[]; bonus: number }
  mm: { whites: number[]; bonus: number }
  index: number
}

interface Props {
  chart: NatalChart | null
  birthDate: string
  birthTime: string
  cityState: string
  onBirthDateChange: (v: string) => void
  onBirthTimeChange: (v: string) => void
  onCityStateChange: (v: string) => void
  onGenerate: () => void
  isLoading: boolean
  error: string
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December']

const PHASE_ICONS: Record<string, string> = {
  'New Moon': '🌑', 'Full Moon': '🌕', 'First Quarter': '🌓', 'Last Quarter': '🌗',
}

function scoreColor(score: number): string {
  if (score >= 0.70) return 'bg-emerald-500/70 text-white'
  if (score >= 0.50) return 'bg-yellow-500/60 text-white'
  if (score >= 0.30) return 'bg-orange-600/50 text-white'
  return 'bg-white/10 text-white/40'
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(count)}<span className="text-white/20">{'★'.repeat(5 - count)}</span>
    </span>
  )
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

export default function AstroPanel({
  chart,
  birthDate, birthTime, cityState,
  onBirthDateChange, onBirthTimeChange, onCityStateChange,
  onGenerate, isLoading, error,
}: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)

  // Calendar state
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  // Picks state
  const [picks, setPicks] = useState<PickPair[]>([])
  const [prevChart, setPrevChart] = useState<NatalChart | null>(null)
  if (chart !== prevChart) {
    setPrevChart(chart)
    if (picks.length > 0) setPicks([])
    setSelected(null)
  }

  const scoreMap = useMemo<Map<string, DayScore>>(() => {
    if (!chart) return new Map()
    return new Map(scoreDays(chart, 42).map(s => [s.date, s]))
  }, [chart])

  const top5 = useMemo(() => {
    const future = [...scoreMap.values()].filter(s => s.date > todayStr)
    return future.sort((a, b) => b.score - a.score).slice(0, 5)
  }, [scoreMap, todayStr])

  const selectedDay = selected ? scoreMap.get(selected) ?? null : null

  // Calendar helpers
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function canGoBack() {
    return viewYear > today.getFullYear() || viewMonth > today.getMonth()
  }
  function canGoForward() {
    return true
  }
  function prevMonth() {
    if (!canGoBack()) return
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (!canGoForward()) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1)
  }
  function cellDateStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function handleGenerate() {
    if (!chart) return
    setPicks([{ pb: generateAstrologyPick(chart, 'powerball', 0), mm: generateAstrologyPick(chart, 'megamillions', 0), index: 0 }])
  }
  function handleGenerateAnother() {
    if (!chart) return
    const nextIndex = picks.length
    setPicks(prev => [...prev, { pb: generateAstrologyPick(chart, 'powerball', nextIndex), mm: generateAstrologyPick(chart, 'megamillions', nextIndex), index: nextIndex }])
  }

  const sun = chart?.planets.find(p => p.name === 'Sun')
  const moon = chart?.planets.find(p => p.name === 'Moon')

  return (
    <section className="panel">
      <h3 className="panel-title text-purple-400">
        <span className="dot" />Astrology
      </h3>

      {/* Birth info form */}
      <p className="text-xs text-gray-400 mb-3">No personal data is collected or shared with anyone.</p>
      <div className="flex flex-col gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-200 mb-1">
            Date of Birth <span className="text-purple-400">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={birthDate}
              onChange={e => onBirthDateChange(e.target.value)}
              className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-500 pr-8"
            />
            {birthDate && (
              <button onClick={() => onBirthDateChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none" aria-label="Clear date">×</button>
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
              onChange={e => onBirthTimeChange(e.target.value)}
              className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-500 pr-8"
            />
            {birthTime && (
              <button onClick={() => onBirthTimeChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none" aria-label="Clear time">×</button>
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
            onChange={e => onCityStateChange(e.target.value)}
            placeholder="e.g. Boise, Idaho"
            className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-purple-500"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {isLoading ? 'Calculating...' : 'Generate My Charts'}
        </button>
      </div>

      <div className="flex flex-col gap-5">

        {/* Natal chart badges — only after chart is generated */}
        {chart && (
          <>
            <div>
              <p className="text-xs text-gray-300 mb-2 uppercase tracking-widest">Your Natal Chart</p>
              <div className="grid grid-cols-2 gap-3">
                {sun && <ChartBadge label="Sun" value={sun.sign} />}
                {moon && <ChartBadge label="Moon" value={moon.sign} />}
                {chart.ascendant && <ChartBadge label="Rising" value={chart.ascendant.sign} />}
                <ChartBadge label="Moon Phase" value={chart.todayMoonPhaseName} />
              </div>
            </div>
            <div className="border-t border-white/10" />
          </>
        )}

        {/* Lucky Calendar — always visible */}
        <div className="flex flex-col gap-4">
          <p className="text-[10px] uppercase tracking-[3px] text-purple-400 text-center">Lucky Calendar</p>
          <p className="text-xs text-gray-400 -mt-2">
            Your luckiest days based on lunar cycles, personal numerology, and planetary influences.
          </p>

          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} disabled={!canGoBack()} className="text-purple-400 hover:text-purple-300 disabled:opacity-20 text-lg px-2">‹</button>
            <span className="text-sm font-semibold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} disabled={!canGoForward()} className="text-purple-400 hover:text-purple-300 disabled:opacity-20 text-lg px-2">›</button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-[10px] text-white/40 font-medium py-1">{d}</div>
            ))}
            {cells.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} />
              const dateStr = cellDateStr(day)
              const ds = scoreMap.get(dateStr)
              const isPast = dateStr < todayStr
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selected
              let cls = 'aspect-square flex items-center justify-center rounded text-xs font-medium transition-all '
              if (isPast) cls += 'bg-white/5 text-white/20 cursor-default'
              else if (ds) cls += scoreColor(ds.score) + ' cursor-pointer hover:brightness-110'
              else cls += 'bg-white/10 text-white/40 cursor-default'
              if (isToday) cls += ' ring-2 ring-purple-400'
              if (isSelected && !isPast) cls += ' ring-2 ring-white'
              return (
                <div key={dateStr} className={cls} onClick={() => !isPast && ds && setSelected(isSelected ? null : dateStr)}>
                  {day}
                </div>
              )
            })}
          </div>

          {!chart && (
            <p className="text-xs text-gray-500 text-center">Generate your charts above to see lucky day scores.</p>
          )}

          {/* Legend */}
          <div className="flex gap-3 flex-wrap justify-center">
            {[{ color: 'bg-emerald-500/70', label: 'High' }, { color: 'bg-yellow-500/60', label: 'Good' }, { color: 'bg-orange-600/50', label: 'Moderate' }, { color: 'bg-white/10', label: 'Low' }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-[10px] text-white/50">{label}</span>
              </div>
            ))}
          </div>

          {/* Selected day */}
          {selectedDay && (
            <div className="bg-black/25 rounded-lg px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{formatDate(selectedDay.date)}</span>
                <Stars count={selectedDay.stars} />
              </div>
              <div className="flex gap-2 text-[11px] text-purple-300">
                <span>{PHASE_ICONS[selectedDay.moonPhaseName] ?? '🌙'} {selectedDay.moonPhaseName}</span>
                <span>·</span>
                <span>Moon in {selectedDay.moonSign}</span>
              </div>
              <ul className="flex flex-col gap-1 mt-1">
                {selectedDay.reasons.map((r, i) => (
                  <li key={i} className="text-[11px] text-white/70 flex gap-1.5">
                    <span className="text-purple-400 shrink-0">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top 5 lucky days */}
          {top5.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[3px] text-purple-400 text-center">Top Lucky Days</p>
              {top5.map(day => (
                <div
                  key={day.date}
                  className="bg-black/25 rounded-lg px-4 py-3 flex flex-col gap-1.5 cursor-pointer hover:bg-black/40 transition-colors"
                  onClick={() => {
                    const [y, m] = day.date.split('-').map(Number)
                    setViewYear(y); setViewMonth(m - 1); setSelected(day.date)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{formatDate(day.date)}</span>
                    <Stars count={day.stars} />
                  </div>
                  <div className="flex gap-2 text-[11px] text-purple-300">
                    <span>{PHASE_ICONS[day.moonPhaseName] ?? '🌙'} {day.moonPhaseName}</span>
                    <span>·</span>
                    <span>Moon in {day.moonSign}</span>
                  </div>
                  <ul className="flex flex-col gap-0.5 mt-0.5">
                    {day.reasons.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-[11px] text-white/70 flex gap-1.5">
                        <span className="text-purple-400 shrink-0">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Astrology Pick — only after chart is generated */}
        {chart && (
          <>
            <div className="border-t border-white/10" />
            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-[3px] text-purple-400 text-center">Astrology Pick</p>
              <p className="text-xs text-gray-400">Generate a pick from your natal chart and today's planetary transits.</p>

              {picks.length === 0 && (
                <button onClick={handleGenerate} className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  Generate My Pick
                </button>
              )}

              {picks.length > 0 && (
                <div className="flex flex-col gap-3">
                  {picks.map((pair, i) => (
                    <div key={pair.index} className="flex flex-col gap-3 bg-black/25 rounded-lg py-3 px-2">
                      <p className="text-xs text-gray-300 uppercase tracking-widest text-center">Pick {i + 1}</p>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-red-500">Powerball</span>
                        <div className="flex flex-wrap justify-center gap-2">
                          {pair.pb.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
                          <Ball num={pair.pb.bonus} color={GAME_CONFIG.powerball.bonusColor} />
                        </div>
                      </div>
                      <div className="border-t border-white/10" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-yellow-400">Mega Millions</span>
                        <div className="flex flex-wrap justify-center gap-2">
                          {pair.mm.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
                          <Ball num={pair.mm.bonus} color={GAME_CONFIG.megamillions.bonusColor} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={handleGenerateAnother} className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors text-center">
                    Generate another
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </section>
  )
}
