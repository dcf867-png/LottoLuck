import { useState, useMemo } from 'react'
import type { NatalChart } from '../lib/astrology'
import { scoreDays, toDateStr, type DayScore } from '../lib/luckyDays'

interface Props {
  chart: NatalChart | null
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December']

const PHASE_ICONS: Record<string, string> = {
  'New Moon': '🌑',
  'Full Moon': '🌕',
  'First Quarter': '🌓',
  'Last Quarter': '🌗',
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
      {'★'.repeat(count)}
      <span className="text-white/20">{'★'.repeat(4 - count)}</span>
    </span>
  )
}

export default function LuckyCalendar({ chart }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  // Compute scores once per chart change — covers 42 days from today
  const scoreMap = useMemo<Map<string, DayScore>>(() => {
    if (!chart) return new Map()
    const scores = scoreDays(chart, 42)
    return new Map(scores.map(s => [s.date, s]))
  }, [chart])

  // Top 5 lucky days (future only, sorted by score)
  const top5 = useMemo(() => {
    const future = [...scoreMap.values()].filter(s => s.date > todayStr)
    return future.sort((a, b) => b.score - a.score).slice(0, 5)
  }, [scoreMap, todayStr])

  const selectedDay = selected ? scoreMap.get(selected) ?? null : null

  // Calendar grid helpers
  const firstDow = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function canGoBack() {
    return viewYear > today.getFullYear() || viewMonth > today.getMonth()
  }
  function canGoForward() {
    // Allow up to 1 month ahead (we have 42 days of scores)
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 42)
    const firstOfNextNext = new Date(viewYear, viewMonth + 2, 1)
    return firstOfNextNext <= maxDate
  }
  function prevMonth() {
    if (!canGoBack()) return
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (!canGoForward()) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function cellDateStr(day: number): string {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${viewYear}-${m}-${d}`
  }

  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <section className="panel">
      <h3 className="panel-title text-purple-400">
        <span className="dot" />Lucky Calendar
      </h3>
      <p className="text-xs text-gray-300 mb-4">
        Your luckiest days based on lunar cycles, personal numerology, and planetary influences.
      </p>

      {!chart && (
        <p className="text-xs text-gray-500 text-center py-4">Enter your birth info above to see your lucky days.</p>
      )}

      {chart && (
        <div className="flex flex-col gap-5">

          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              disabled={!canGoBack()}
              className="text-purple-400 hover:text-purple-300 disabled:opacity-20 text-lg px-2"
            >‹</button>
            <span className="text-sm font-semibold text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              disabled={!canGoForward()}
              className="text-purple-400 hover:text-purple-300 disabled:opacity-20 text-lg px-2"
            >›</button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-[10px] text-white/40 font-medium py-1">{d}</div>
            ))}

            {/* Day cells */}
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />
              const dateStr = cellDateStr(day)
              const ds = scoreMap.get(dateStr)
              const isPast = dateStr < todayStr
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selected

              let cellClass = 'aspect-square flex flex-col items-center justify-center rounded text-xs font-medium transition-all '

              if (isPast) {
                cellClass += 'bg-white/5 text-white/20 cursor-default'
              } else if (ds) {
                cellClass += scoreColor(ds.score) + ' cursor-pointer hover:brightness-110'
              } else {
                cellClass += 'bg-white/10 text-white/40 cursor-default'
              }

              if (isToday) cellClass += ' ring-2 ring-purple-400'
              if (isSelected && !isPast) cellClass += ' ring-2 ring-white'

              return (
                <div
                  key={dateStr}
                  className={cellClass}
                  onClick={() => !isPast && ds && setSelected(isSelected ? null : dateStr)}
                >
                  <span>{day}</span>
                  {ds && !isPast && (
                    <span className="text-yellow-400 leading-none" style={{ fontSize: '7px', letterSpacing: '-1px' }}>
                      {'★'.repeat(ds.stars)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-3 flex-wrap justify-center">
            {[
              { color: 'bg-emerald-500/70', label: 'High', stars: 4 },
              { color: 'bg-yellow-500/60', label: 'Good', stars: 3 },
              { color: 'bg-orange-600/50', label: 'Moderate', stars: 2 },
              { color: 'bg-white/10', label: 'Low', stars: 1 },
            ].map(({ color, label, stars }) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-[10px] text-white/50">{label}</span>
                <Stars count={stars} />
              </div>
            ))}
          </div>

          {/* Selected day details */}
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
              <p className="text-[10px] uppercase tracking-[3px] text-purple-400 text-center">
                Top Lucky Days
              </p>
              {top5.map(day => (
                <div
                  key={day.date}
                  className="bg-black/25 rounded-lg px-4 py-3 flex flex-col gap-1.5 cursor-pointer hover:bg-black/40 transition-colors"
                  onClick={() => {
                    const [y, m] = day.date.split('-').map(Number)
                    setViewYear(y)
                    setViewMonth(m - 1)
                    setSelected(day.date)
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
      )}
    </section>
  )
}
