import { useState } from 'react'
import type { Game, Mode, AnalysisResult } from '../lib/types'
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

export default function SuggestedPick({ game, mode, result }: Props) {
  const [open, setOpen] = useState(false)
  const cfg = GAME_CONFIG[game]
  const { pick, bonusPick } = result
  const title = mode === 'bonus' ? `${cfg.bonusLabel} Pick` : 'Suggested Pick'

  return (
    <section className="px-4 mb-4">
      <div className="bg-gray-900 rounded-xl p-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-sm font-medium text-emerald-400 uppercase tracking-widest">{title}</h2>
          <span className={`text-gray-400 text-xl leading-none transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
        </button>
        {open && (
          <div className="flex flex-col items-center gap-3 pt-4">
            {mode === 'bonus' ? (
              <>
                <Ball num={bonusPick.bonus} color={cfg.bonusColor} />
                <p className="text-xs text-gray-300">Confidence {bonusPick.confidence}%</p>
              </>
            ) : (
              <>
                <div className="flex flex-wrap justify-center gap-2">
                  {pick.whites.map(n => (
                    <Ball key={n} num={n} color="bg-gray-700" />
                  ))}
                  <Ball num={pick.bonus} color={cfg.bonusColor} />
                </div>
                <p className="text-xs text-gray-300">Confidence {pick.confidence}%</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
