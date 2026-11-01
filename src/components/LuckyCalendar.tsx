import { useState, useMemo, useEffect, useRef } from 'react'
import type { NatalChart } from '../lib/astrology'
import type { CalendarMonth } from '../lib/calendarMonths'
import { toDateStr, type DayScore } from '../lib/luckyDays'

interface Props {
  title: string
  description: string
  chart: NatalChart | null
  scoreDays: (chart: NatalChart, days: number, startDate: Date) => DayScore[]
  monthAt: (offset: number) => CalendarMonth
  showRegularDate?: boolean
}

const PHASE_ICONS: Record<string, string> = {
  'New Moon': '🌑', 'Full Moon': '🌕', 'First Quarter': '🌓', 'Last Quarter': '🌗',
}

function scoreColor(stars: number): string {
  if (stars === 4) return 'bg-amber-400 text-gray-900'
  if (stars === 3) return 'bg-emerald-500/80 text-white'
  if (stars === 2) return 'bg-sky-500/65 text-white'
  return 'bg-amber-800/70 text-white/60'
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(count)}<span className="text-white/20">{'★'.repeat(5 - count)}</span>
    </span>
  )
}

function DaySummary({ day }: { day: DayScore }) {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] text-purple-300">
      {day.babylonianDate && (
        <>
          <span>{day.babylonianDate}</span>
          <span>·</span>
        </>
      )}
      <span>{PHASE_ICONS[day.moonPhaseName] ?? '🌙'} {day.moonPhaseName}</span>
      <span>·</span>
      <span>Moon in {day.moonSign}</span>
    </div>
  )
}

export default function LuckyCalendar({ title, description, chart, scoreDays, monthAt, showRegularDate }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateStr(today)

  // Calendar state
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [topDaysOpen, setTopDaysOpen] = useState(true)
  const month = monthAt(offset)
  const monthStart = month.start.getTime()
  const monthLast = month.last.getTime()

  // Score cache
  const scoreCacheRef = useRef<Map<string, DayScore>>(new Map())
  const [cacheVersion, setCacheVersion] = useState(0)

  const [prevChart, setPrevChart] = useState<NatalChart | null>(null)
  if (chart !== prevChart) {
    setPrevChart(chart)
    setSelected(null)
    scoreCacheRef.current.clear()
    setCacheVersion(0)
  }

  useEffect(() => {
    if (!chart) return
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const firstOfMonth = new Date(monthStart)
    const lastOfMonth = new Date(monthLast)
    if (lastOfMonth < now) return

    const startDate = firstOfMonth < now ? new Date(now) : new Date(firstOfMonth)
    let allCached = true
    const check = new Date(startDate)
    while (check <= lastOfMonth) {
      if (!scoreCacheRef.current.has(toDateStr(check))) { allCached = false; break }
      check.setDate(check.getDate() + 1)
    }
    if (allCached) return

    const daysToScore = Math.round((lastOfMonth.getTime() - startDate.getTime()) / 86400000) + 1
    for (const s of scoreDays(chart, daysToScore, startDate)) {
      scoreCacheRef.current.set(s.date, s)
    }
    setCacheVersion(v => v + 1)
  }, [chart, monthStart, monthLast, scoreDays])

  const scoreMap = useMemo(() => new Map(scoreCacheRef.current), [cacheVersion])

  const top5 = useMemo(() => {
    const future = [...scoreMap.values()].filter(s => s.date > todayStr)
    return future.sort((a, b) => b.score - a.score).slice(0, 5)
  }, [scoreMap, todayStr])

  const selectedDay = selected ? scoreMap.get(selected) ?? null : null

  // Calendar helpers
  const cells: (number | null)[] = [
    ...Array(month.start.getDay()).fill(null),
    ...Array.from({ length: month.days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function canGoBack() {
    return offset > 0
  }
  function canGoForward() {
    return true
  }
  function prevMonth() {
    if (!canGoBack()) return
    setOffset(o => o - 1)
  }
  function nextMonth() {
    if (!canGoForward()) return
    setOffset(o => o + 1)
  }
  function cellDate(day: number): Date {
    const date = new Date(month.start)
    date.setDate(date.getDate() + day - 1)
    return date
  }
  function showDay(dateStr: string) {
    let target = 0
    while (toDateStr(monthAt(target).last) < dateStr) target++
    setOffset(target)
    setSelected(dateStr)
  }
  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] uppercase tracking-[3px] text-purple-400 text-center">{title}</p>
      <p className="text-xs text-gray-400 -mt-2">{description}</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} disabled={!canGoBack()} className="text-purple-400 hover:text-purple-300 disabled:opacity-20 text-4xl px-2">‹</button>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm font-semibold text-white">{month.title}</span>
          {month.subtitle && <span className="text-[11px] text-gray-300">{month.subtitle}</span>}
        </div>
        <button onClick={nextMonth} disabled={!canGoForward()} className="text-purple-400 hover:text-purple-300 disabled:opacity-20 text-4xl px-2">›</button>
      </div>

      {/* Months of the year */}
      {month.position && (
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${month.position.total}, 1fr)` }}>
          {Array.from({ length: month.position.total }, (_, i) => {
            const target = offset + i - month.position!.index
            const isCurrent = i === month.position!.index
            return (
              <button
                key={i}
                onClick={() => setOffset(target)}
                disabled={target < 0}
                aria-label={`Month ${i + 1}`}
                aria-current={isCurrent ? 'true' : undefined}
                className={`h-7 rounded text-[11px] font-medium transition-colors disabled:opacity-30 ${isCurrent ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-[10px] text-white/40 font-medium py-1">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />
          const date = cellDate(day)
          const dateStr = toDateStr(date)
          const ds = scoreMap.get(dateStr)
          const isPast = dateStr < todayStr
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selected
          let cls = 'aspect-square flex flex-col items-center justify-center rounded text-xs font-medium transition-all '
          if (isPast) cls += 'bg-white/5 text-white/20 cursor-default'
          else if (ds && ds.stars === 5) cls += 'bg-purple-600 text-white cursor-pointer hover:brightness-110'
          else if (ds) cls += scoreColor(ds.stars) + ' cursor-pointer hover:brightness-110'
          else cls += 'bg-white/10 text-white/40 cursor-default'
          if (isToday) cls += ' ring-2 ring-purple-400'
          if (isSelected && !isPast) cls += ' ring-2 ring-white'
          return (
            <div key={dateStr} className={cls} onClick={() => !isPast && ds && setSelected(isSelected ? null : dateStr)}>
              <span className={showRegularDate ? 'leading-none' : undefined}>{day}</span>
              {showRegularDate && (
                <span className="leading-tight opacity-80" style={{ fontSize: 'clamp(7px, 2.3vw, 10px)' }}>
                  {date.getMonth() + 1}/{date.getDate()}
                </span>
              )}
              {ds && !isPast && (
                <span className="text-yellow-300 leading-none whitespace-nowrap" style={{ fontSize: 'clamp(7px, 2.3vw, 11px)', letterSpacing: '-0.5px', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                  {'★'.repeat(ds.stars)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!chart && (
        <p className="text-xs text-gray-500 text-center">Generate your charts above to see lucky day scores.</p>
      )}

      {/* Legend */}
      <div className="flex gap-3 flex-wrap justify-center">
        {[{ color: 'bg-amber-800/70', label: 'Low' }, { color: 'bg-sky-500/65', label: 'Moderate' }, { color: 'bg-emerald-500/80', label: 'Good' }, { color: 'bg-amber-400', label: 'High' }, { color: 'bg-purple-600', label: 'Special' }].map(({ color, label }) => (
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
          <DaySummary day={selectedDay} />
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
          <button
            onClick={() => setTopDaysOpen(open => !open)}
            aria-expanded={topDaysOpen}
            className="flex items-center justify-center gap-2 py-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span className="text-[10px] uppercase tracking-[3px]">Top Lucky Days</span>
            <span className="text-xl leading-none" aria-hidden="true">{topDaysOpen ? '▲' : '▼'}</span>
          </button>
          {topDaysOpen && top5.map(day => (
            <div
              key={day.date}
              className="bg-black/25 rounded-lg px-4 py-3 flex flex-col gap-1.5 cursor-pointer hover:bg-black/40 transition-colors"
              onClick={() => showDay(day.date)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{formatDate(day.date)}</span>
                <Stars count={day.stars} />
              </div>
              <DaySummary day={day} />
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
  )
}
