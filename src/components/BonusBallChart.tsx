import type { Game, NumberScore } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'

interface Props {
  game: Game
  scores: NumberScore[]
}

export default function BonusBallChart({ game, scores }: Props) {
  const cfg = GAME_CONFIG[game]
  const sorted = [...scores].sort((a, b) => a.number - b.number)
  const maxApp = Math.max(...sorted.map(s => s.appearances), 1)
  const titleColor = game === 'powerball' ? 'text-red-500' : 'text-yellow-400'

  return (
    <section className="panel">
      <h2 className={`panel-title ${titleColor}`}>
        <span className="dot" />{cfg.bonusLabel} Frequency
      </h2>

      <div className="flex items-end gap-px h-24 overflow-x-auto pb-1">
        {sorted.map(s => {
          const pct = s.appearances / maxApp
          return (
            <div key={s.number} className="flex flex-col items-center gap-0.5 min-w-[20px]">
              <div
                className={`w-full ${cfg.bonusColor} rounded-t-sm opacity-80 flex items-end justify-center`}
                style={{ height: `${Math.max(pct * 80, 10)}px` }}
                title={`${s.number}: ${s.appearances}×`}
              >
                <span className="text-[9px] text-black font-bold leading-none mb-0.5">{s.appearances}</span>
              </div>
              <span className="text-[9px] text-gray-300 leading-none">{s.number}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-2 text-center">Includes all draws from the current era up to the most recent available.</p>
    </section>
  )
}
