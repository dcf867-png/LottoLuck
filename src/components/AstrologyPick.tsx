import { useState } from 'react'
import { GAME_CONFIG } from '../lib/types'
import type { NatalChart } from '../lib/astrology'
import { generateAstrologyPick } from '../lib/astroLucky'

interface PickPair {
  pb: { whites: number[]; bonus: number }
  mm: { whites: number[]; bonus: number }
  index: number
}

interface Props {
  chart: NatalChart | null
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

export default function AstrologyPick({ chart }: Props) {
  const [picks, setPicks] = useState<PickPair[]>([])

  function handleGenerate() {
    if (!chart) return
    setPicks([{
      pb: generateAstrologyPick(chart, 'powerball', 0),
      mm: generateAstrologyPick(chart, 'megamillions', 0),
      index: 0,
    }])
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

  // Reset picks when chart changes
  const [prevChart, setPrevChart] = useState<NatalChart | null>(null)
  if (chart !== prevChart) {
    setPrevChart(chart)
    if (picks.length > 0) setPicks([])
  }

  const sun = chart?.planets.find(p => p.name === 'Sun')
  const moon = chart?.planets.find(p => p.name === 'Moon')

  return (
    <section className="panel">
      <h3 className="panel-title text-purple-400">
        <span className="dot" />Astrology Pick
      </h3>
      <p className="text-xs text-gray-300 mb-4">
        Generate a pick from your natal chart and today's planetary transits.
      </p>

      {!chart && (
        <p className="text-xs text-gray-500 text-center py-4">Enter your birth info above to generate a pick.</p>
      )}

      {chart && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-300 mb-2 uppercase tracking-widest">Your Natal Chart</p>
            <div className="grid grid-cols-2 gap-3">
              {sun && <ChartBadge label="Sun" value={sun.sign} />}
              {moon && <ChartBadge label="Moon" value={moon.sign} />}
              {chart.ascendant && <ChartBadge label="Rising" value={chart.ascendant.sign} />}
              <ChartBadge label="Moon Phase" value={chart.todayMoonPhaseName} />
            </div>
          </div>

          {picks.length === 0 && (
            <button
              onClick={handleGenerate}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
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
    </section>
  )
}
