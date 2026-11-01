import { useState } from 'react'
import { GAME_CONFIG } from '../lib/types'
import type { NatalChart } from '../lib/astrology'
import { generateAstrologyPick } from '../lib/astroLucky'
import { savePick } from '../lib/trackRecord'
import { babylonianMonthAt, regularMonthAt } from '../lib/calendarMonths'
import { scoreDays } from '../lib/luckyDays'
import { scoreModernDays } from '../lib/modernLuckyDays'
import DateInput from './DateInput'
import LuckyCalendar from './LuckyCalendar'

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

function Ball({ num, color }: { num: number; color: string }) {
  return (
    <div className={`${color} rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-base shadow-lg`}>
      {num}
    </div>
  )
}

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const SIGN_COLORS: Record<string, string> = {
  Aries: 'text-red-400',
  Taurus: 'text-emerald-500',
  Gemini: 'text-yellow-300',
  Cancer: 'text-slate-300',
  Leo: 'text-orange-400',
  Virgo: 'text-amber-500',
  Libra: 'text-pink-400',
  Scorpio: 'text-red-700',
  Sagittarius: 'text-purple-400',
  Capricorn: 'text-gray-400',
  Aquarius: 'text-blue-400',
  Pisces: 'text-indigo-400',
}

function ChartBadge({ label, value, modernValue, planetSymbol, symbolColor = 'text-purple-400' }: { label: string; value: string; modernValue?: string; planetSymbol?: string; symbolColor?: string }) {
  const signSymbol = SIGN_SYMBOLS[value]
  const signColor = SIGN_COLORS[value] ?? 'text-purple-300'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm text-gray-300 flex items-center gap-1">
        {planetSymbol && <span className={`${symbolColor} text-2xl leading-none`}>{planetSymbol}</span>}
        {label}
      </span>
      <span className={`text-base font-bold ${signColor}`}>
        {signSymbol && <span className="mr-0.5">{signSymbol}</span>}{value}
      </span>
      {modernValue && modernValue !== value && (
        <span className="text-xs text-gray-300">modern {modernValue}</span>
      )}
    </div>
  )
}

export default function AstroPanel({
  chart,
  birthDate, birthTime, cityState,
  onBirthDateChange, onBirthTimeChange, onCityStateChange,
  onGenerate, isLoading, error,
}: Props) {
  // Picks state
  const [picks, setPicks] = useState<PickPair[]>([])
  const [prevChart, setPrevChart] = useState<NatalChart | null>(null)
  if (chart !== prevChart) {
    setPrevChart(chart)
    if (chart) {
      const pb = generateAstrologyPick(chart, 'powerball', 0)
      const mm = generateAstrologyPick(chart, 'megamillions', 0)
      setPicks([{ pb, mm, index: 0 }])
      savePick({ source: 'astrology', game: 'powerball', whites: pb.whites, bonus: pb.bonus })
      savePick({ source: 'astrology', game: 'megamillions', whites: mm.whites, bonus: mm.bonus })
    } else {
      setPicks([])
    }
  }

  function handleGenerateAnother() {
    if (!chart) return
    const nextIndex = picks.length
    const pb = generateAstrologyPick(chart, 'powerball', nextIndex)
    const mm = generateAstrologyPick(chart, 'megamillions', nextIndex)
    setPicks(prev => [...prev, { pb, mm, index: nextIndex }])
    savePick({ source: 'astrology', game: 'powerball', whites: pb.whites, bonus: pb.bonus })
    savePick({ source: 'astrology', game: 'megamillions', whites: mm.whites, bonus: mm.bonus })
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
        <DateInput value={birthDate} onChange={onBirthDateChange} label="Date of Birth" required />
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
          {isLoading ? 'Calculating...' : 'Generate My Pick/Charts'}
        </button>
      </div>

      <div className="flex flex-col gap-5">

        {/* Astrology Pick — auto-generated above natal chart */}
        {chart && picks.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-[10px] uppercase tracking-[3px] text-purple-400 text-center">Astrology Pick</p>
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
            </div>
            <div className="border-t border-white/10" />
          </>
        )}

        {/* Natal chart badges — only after chart is generated */}
        {chart && (
          <>
            <div>
              <p className="text-xs text-gray-300 mb-2 uppercase tracking-widest">Your Natal Chart</p>
              <div className="grid grid-cols-2 gap-3">
                {sun && <ChartBadge label="Sun" value={sun.sign} modernValue={sun.modernSign} planetSymbol="☀" symbolColor="text-yellow-400" />}
                {moon && <ChartBadge label="Moon" value={moon.sign} modernValue={moon.modernSign} planetSymbol="☽" symbolColor="text-blue-400" />}
                {chart.ascendant && <ChartBadge label="Rising" value={chart.ascendant.sign} modernValue={chart.ascendant.modernSign} planetSymbol="↑" />}
                <ChartBadge label="Moon Phase" value={chart.todayMoonPhaseName} />
              </div>
            </div>
            <div className="border-t border-white/10" />
          </>
        )}

        <LuckyCalendar
          title="Babylonian Lucky Calendar"
          description="Your luckiest days based on the Babylonian lunar calendar, ancient tablet lists of favorable days, and your birth chart. Each month runs from one first crescent to the next, and some years have a 13th month. The small number in each square is the regular date."
          chart={chart}
          scoreDays={scoreDays}
          monthAt={babylonianMonthAt}
          showRegularDate
        />

        <div className="border-t border-white/10" />

        <LuckyCalendar
          title="Modern Lucky Calendar"
          description="Your luckiest days based on lunar cycles, personal numerology, and planetary influences."
          chart={chart}
          scoreDays={scoreModernDays}
          monthAt={regularMonthAt}
        />

      </div>
    </section>
  )
}
