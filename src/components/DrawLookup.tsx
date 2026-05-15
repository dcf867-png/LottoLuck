import { useState, useEffect } from 'react'
import type { Game, Draw } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'

interface Props {
  game: Game
  draws: Draw[]
}

function Ball({ num, color }: { num: number; color: string }) {
  return (
    <div className={`${color} rounded-full w-12 h-12 flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
      {num}
    </div>
  )
}

export default function DrawLookup({ game, draws }: Props) {
  const [date, setDate] = useState('')
  const [result, setResult] = useState<Draw | null | 'not-found'>(null)
  const cfg = GAME_CONFIG[game]
  const titleColor = game === 'powerball' ? 'text-red-500' : 'text-yellow-400'

  useEffect(() => {
    if (date) {
      const found = draws.find(d => d.date === date)
      setResult(found ?? 'not-found')
    } else {
      setResult(null)
    }
  }, [game])

  function handleLookup() {
    if (!date) return
    const found = draws.find(d => d.date === date)
    setResult(found ?? 'not-found')
  }

  return (
    <section className="panel">
      <h2 className={`panel-title ${titleColor}`}>
        <span className="dot" />Draw Date Lookup
      </h2>
      <p className="text-xs text-gray-400 mb-3">Enter a draw date to see the winning numbers.</p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setResult(null) }}
            className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-500 pr-8"
          />
          {date && (
            <button
              onClick={() => { setDate(''); setResult(null) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none"
              aria-label="Clear date"
            >×</button>
          )}
        </div>
        <button
          onClick={handleLookup}
          disabled={!date}
          className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium px-4 rounded-lg transition-colors"
        >
          Look up
        </button>
      </div>

      {result === 'not-found' && (
        <p className="text-xs text-red-400 mt-3">No draw found for that date.</p>
      )}

      {result && result !== 'not-found' && (
        <div className="mt-4 flex flex-col items-center gap-2 bg-black/25 rounded-lg py-3 px-2">
          <p className="text-xs text-gray-300 uppercase tracking-widest">{result.date}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {result.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
            <Ball num={result.bonus} color={cfg.bonusColor} />
          </div>
          {result.multiplier && (
            <p className="text-xs text-gray-400">
              {game === 'powerball' ? 'Power Play' : 'Megaplier'}: <span className="text-lg text-white font-bold">{result.multiplier}×</span>
            </p>
          )}
        </div>
      )}
    </section>
  )
}
