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
    <div className="bg-gray-900 rounded-xl p-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-red-400">{cfg.bonusLabel} Frequency</h3>
        <span className={`text-gray-400 text-xl leading-none transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
      </button>
      {open && (
        <div className="flex items-end gap-px h-24 overflow-x-auto mt-3">
          {sorted.map(s => {
            const pct = s.appearances / maxApp
            return (
              <div key={s.number} className="flex flex-col items-center gap-0.5 flex-1 min-w-[10px]">
                <div
                  className={`w-full ${cfg.bonusColor} rounded-t-sm opacity-80`}
                  style={{ height: `${Math.max(pct * 80, 2)}px` }}
                  title={`${s.number}: ${s.appearances}×`}
                />
                <span className="text-[12px] text-gray-400 leading-none">{s.number}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
