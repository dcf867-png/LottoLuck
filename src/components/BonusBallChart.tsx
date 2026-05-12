import { useState } from 'react'
import type { Game, NumberScore } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'

interface Props {
  game: Game
  scores: NumberScore[]
}

export default function BonusBallChart({ game, scores }: Props) {
  const [open, setOpen] = useState(false)
  const cfg = GAME_CONFIG[game]
  const sorted = [...scores].sort((a, b) => a.number - b.number)
  const maxApp = Math.max(...sorted.map(s => s.appearances), 1)

  return (
    <div>
      <div className="bg-gray-900 rounded-xl py-2 px-3 w-fit mx-auto">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 text-left"
        >
          <h3 className={`text-sm font-semibold ${game === 'powerball' ? 'text-red-500' : 'text-blue-400'}`}>{cfg.bonusLabel} Frequency</h3>
          <span className={`text-gray-400 text-xl leading-none transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
        </button>
      </div>

      {open && (
        <div className="mt-2">
          <div className="flex items-end gap-px h-24 overflow-x-auto">
            {sorted.map(s => {
              const pct = s.appearances / maxApp
              return (
                <div key={s.number} className="flex flex-col items-center gap-0.5 flex-1 min-w-[10px]">
                  <div
                    className={`w-full ${cfg.bonusColor} rounded-t-sm opacity-80 flex items-end justify-center`}
                    style={{ height: `${Math.max(pct * 80, 10)}px` }}
                    title={`${s.number}: ${s.appearances}×`}
                  >
                    <span className="text-[12px] text-black font-bold leading-none mb-0.5">{s.appearances}</span>
                  </div>
                  <span className="text-[12px] text-gray-400 leading-none">{s.number}</span>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">Includes all draws from the current era up to the most recent available.</p>
        </div>
      )}
    </div>
  )
}
