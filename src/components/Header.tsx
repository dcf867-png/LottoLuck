import type { Game, Tab } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  activeTab: Tab
  onTabChange: (t: Tab) => void
  onAuthClick: () => void
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

function tabActiveClass(tab: Tab, active: Tab): string {
  if (tab !== active) return 'bg-gray-800 text-gray-200 hover:bg-gray-700'
  if (tab === 'powerball') return 'bg-red-600 text-white'
  if (tab === 'megamillions') return 'bg-yellow-500 text-white'
  if (tab === 'recentdraws') return 'bg-orange-600 text-white'
  if (tab === 'trackrecord') return 'bg-teal-600 text-white'
  return 'bg-purple-600 text-white'
}

export default function Header({ activeTab, onTabChange, onAuthClick }: Props) {
  const { user, signOut } = useAuth()

  return (
    <header className="flex flex-col items-center gap-4 py-6 px-4">
      <div className="w-full flex items-center justify-end px-2 -mb-2">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</span>
            <button
              onClick={signOut}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full transition-colors"
          >
            Sign in
          </button>
        )}
      </div>
      <h1 className="logo-text">
        Lotto<span className="logo-glow">Pulse</span>
      </h1>
      <div className="flex flex-wrap justify-center gap-2">
        {(['powerball', 'megamillions', 'recentdraws', 'personal', 'trackrecord'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tabActiveClass(tab, activeTab)}`}
          >
            {tab === 'powerball' ? 'Powerball'
              : tab === 'megamillions' ? 'Mega Millions'
              : tab === 'recentdraws' ? 'Recent Draws'
              : tab === 'trackrecord' ? 'Track Record'
              : 'Lucky Star Picks'}
          </button>
        ))}
      </div>
      <div className="flex gap-4 text-xs">
        {(['powerball', 'megamillions'] as Game[]).map(game => (
          <div key={game} className="flex flex-col items-center gap-0.5 bg-black rounded-xl px-4 py-2">
            <span className={game === 'powerball' ? 'text-red-700' : 'text-yellow-400'}>{GAME_CONFIG[game].label}</span>
            <span className="font-semibold text-white">{getNextDrawDate(game)}</span>
          </div>
        ))}
      </div>
    </header>
  )
}
