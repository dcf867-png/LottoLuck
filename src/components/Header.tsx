import type { Game } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'

interface Props {
  activeGame: Game
  onGameChange: (g: Game) => void
}

// Powerball: Mon(1), Wed(3), Sat(6) — Mega Millions: Tue(2), Fri(5)
const DRAW_DAYS: Record<Game, number[]> = {
  powerball: [1, 3, 6],
  megamillions: [2, 5],
}

function getNextDrawDate(game: Game): string {
  const days = DRAW_DAYS[game]
  const today = new Date().getDay()
  let daysUntil = 7
  for (const d of days) {
    let diff = d - today
    if (diff < 0) diff += 7
    if (diff < daysUntil) daysUntil = diff
  }
  if (daysUntil === 0) return 'Tonight'
  const next = new Date()
  next.setDate(next.getDate() + daysUntil)
  return next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Header({ activeGame, onGameChange }: Props) {
  return (
    <header className="flex flex-col items-center gap-4 py-6 px-4">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Lotto<span className="text-purple-400">Pulse</span>
      </h1>
      <div className="flex gap-2">
        {(['powerball', 'megamillions'] as Game[]).map(game => (
          <button
            key={game}
            onClick={() => onGameChange(game)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeGame === game
                ? `${GAME_CONFIG[game].tabColor} text-white`
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
          >
            {GAME_CONFIG[game].label}
          </button>
        ))}
      </div>
      <div className="flex gap-4 text-xs">
        {(['powerball', 'megamillions'] as Game[]).map(game => (
          <div key={game} className="flex flex-col items-center gap-0.5 bg-black rounded-xl px-4 py-2">
            <span className={game === 'powerball' ? 'text-red-700' : 'text-blue-400'}>{GAME_CONFIG[game].label}</span>
            <span className="font-semibold text-white">{getNextDrawDate(game)}</span>
          </div>
        ))}
      </div>
    </header>
  )
}
