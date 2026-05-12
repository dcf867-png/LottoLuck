import { useState } from 'react'
import type { Game, Mode, AnalysisResult, Pick } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'

interface Props {
  game: Game
  mode: Mode
  result: AnalysisResult
}

function Ball({ num, color }: { num: number; color: string }) {
  return (
    <div className={`${color} rounded-full w-12 h-12 flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
      {num}
    </div>
  )
}

function generateAlternatePick(result: AnalysisResult, variation: number): Pick {
  const pool = result.whiteScores.slice(0, 10)

  // Seeded Fisher-Yates shuffle so same variation always gives same pick
  let seed = variation * 1664525 + 1013904223
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const chosen = shuffled.slice(0, 5)
  const whites = chosen.map(s => s.number).sort((a, b) => a - b)
  const bonus = result.bonusScores[variation % Math.min(5, result.bonusScores.length)].number
  const confidence = Math.round(chosen.reduce((s, n) => s + n.combined, 0) / 5 * 100)
  return { whites, bonus, confidence }
}

export default function SuggestedPick({ game, mode, result }: Props) {
  const [open, setOpen] = useState(false)
  const [extraPicks, setExtraPicks] = useState<Pick[]>([])
  const cfg = GAME_CONFIG[game]
  const { pick, bonusPick } = result
  const title = mode === 'bonus' ? `${cfg.bonusLabel} Pick` : 'Suggested Pick'

  function handleGenerateAnother() {
    const variation = extraPicks.length + 1
    setExtraPicks(prev => [...prev, generateAlternatePick(result, variation)])
  }

  return (
    <section className="px-4 mb-4">
      <div className="bg-gray-900 rounded-xl py-2 px-3 w-fit mx-auto">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 text-left"
        >
          <h2 className={`text-sm font-medium uppercase tracking-widest underline underline-offset-2 ${game === 'powerball' ? 'text-red-500' : 'text-yellow-400'}`}>{title}</h2>
          <span className={`text-gray-400 text-xl leading-none transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
        </button>
      </div>

      {open && (
        <div className="flex flex-col items-center gap-3 pt-4">
          {mode === 'bonus' ? (
            <>
              <Ball num={bonusPick.bonus} color={cfg.bonusColor} />
              <p className="text-xs text-gray-300">Confidence {bonusPick.confidence}%</p>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col items-center gap-2 bg-gray-800 rounded-lg py-3 px-2">
                  <p className="text-xs text-gray-300 uppercase tracking-widest">Pick 1</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {pick.whites.map(n => (
                      <Ball key={n} num={n} color="bg-gray-700" />
                    ))}
                    <Ball num={pick.bonus} color={cfg.bonusColor} />
                  </div>
                  <p className="text-xs text-gray-400">Confidence {pick.confidence}%</p>
                </div>

                {extraPicks.map((p, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 bg-gray-800 rounded-lg py-3 px-2">
                    <p className="text-xs text-gray-300 uppercase tracking-widest">Pick {i + 2}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {p.whites.map(n => (
                        <Ball key={n} num={n} color="bg-gray-700" />
                      ))}
                      <Ball num={p.bonus} color={cfg.bonusColor} />
                    </div>
                    <p className="text-xs text-gray-400">Confidence {p.confidence}%</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateAnother}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                Generate another
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
