import { useState, useCallback } from 'react'
import type { Draw, Game, SavedPick } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'
import {
  loadSavedPicks,
  deleteSavedPick,
  clearSavedPicks,
  matchPickAgainstDraws,
  prizeTier,
  type DrawResult,
} from '../lib/trackRecord'

const PB_TIERS = [
  { match: '5 + Powerball', prize: 'JACKPOT' },
  { match: '5', prize: '$1,000,000' },
  { match: '4 + Powerball', prize: '$50,000' },
  { match: '4', prize: '$100' },
  { match: '3 + Powerball', prize: '$100' },
  { match: '3', prize: '$7' },
  { match: '2 + Powerball', prize: '$7' },
  { match: '1 + Powerball', prize: '$4' },
  { match: 'Powerball only', prize: '$4' },
]

const MM_TIERS = [
  { match: '5 + Mega Ball', prize: 'JACKPOT' },
  { match: '5', prize: '$1,000,000' },
  { match: '4 + Mega Ball', prize: '$10,000' },
  { match: '4', prize: '$500' },
  { match: '3 + Mega Ball', prize: '$200' },
  { match: '3', prize: '$10' },
  { match: '2 + Mega Ball', prize: '$10' },
  { match: '1 + Mega Ball', prize: '$4' },
  { match: 'Mega Ball only', prize: '$2' },
]

function PrizeLegend() {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(o => !o), [])
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden mb-4">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
      >
        <span className="font-medium tracking-wide">Prize Tiers</span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Powerball */}
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5">Powerball</p>
              <div className="flex flex-col gap-1">
                {PB_TIERS.map(t => (
                  <div key={t.match} className="flex justify-between gap-2 text-[10px]">
                    <span className="text-gray-400">{t.match}</span>
                    <span className={t.prize === 'JACKPOT' ? 'text-yellow-400 font-bold' : 'text-white font-medium'}>{t.prize}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mega Millions */}
            <div>
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-1.5">Mega Millions</p>
              <div className="flex flex-col gap-1">
                {MM_TIERS.map(t => (
                  <div key={t.match} className="flex justify-between gap-2 text-[10px]">
                    <span className="text-gray-400">{t.match}</span>
                    <span className={t.prize === 'JACKPOT' ? 'text-yellow-400 font-bold' : 'text-white font-medium'}>{t.prize}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 text-center">Prizes shown are base amounts before Power Play / Megaplier.</p>
        </div>
      )}
    </div>
  )
}

interface Props {
  pbDraws: Draw[]
  mmDraws: Draw[]
}

function DrawRow({ result, pick }: { result: DrawResult; pick: SavedPick }) {
  const tier = prizeTier(pick.game, result.whiteMatches, result.bonusMatch)
  const gameConf = GAME_CONFIG[pick.game]
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/5 text-xs">
      <span className="text-gray-400 w-24 shrink-0">{result.draw.date}</span>
      <div className="flex gap-1 items-center flex-1">
        {result.draw.whites.map((w, i) => (
          <span
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              pick.whites.includes(w) ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {w}
          </span>
        ))}
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ml-1 ${
            result.bonusMatch ? `${gameConf.bonusColor} text-white` : 'bg-gray-700 text-gray-300'
          }`}
        >
          {result.draw.bonus}
        </span>
      </div>
      <span className={`shrink-0 text-right ${tier ? 'text-yellow-400 font-semibold' : 'text-gray-600'}`}>
        {tier ?? '—'}
      </span>
    </div>
  )
}

function PickCard({
  pick,
  draws,
  onDelete,
}: {
  pick: SavedPick
  draws: Draw[]
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const results = matchPickAgainstDraws(pick, draws)
  const bestWhites = results.reduce((max, r) => Math.max(max, r.whiteMatches), 0)
  const bestResult = results.find(r => r.whiteMatches === bestWhites && r.whiteMatches > 0)
  const hasPrize = results.some(r => prizeTier(pick.game, r.whiteMatches, r.bonusMatch) !== null)
  const gameConf = GAME_CONFIG[pick.game]

  return (
    <div className="bg-black/25 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              pick.source === 'astrology'
                ? 'bg-purple-800 text-purple-200'
                : pick.source === 'numerology'
                ? 'bg-blue-800 text-blue-200'
                : 'bg-emerald-800 text-emerald-200'
            }`}
          >
            {pick.source === 'astrology' ? '★ Astro' : pick.source === 'numerology' ? '# Num' : '📊 Stat'}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              pick.game === 'powerball'
                ? 'bg-red-900 text-red-200'
                : 'bg-yellow-900 text-yellow-200'
            }`}
          >
            {gameConf.label}
          </span>
          <span className="text-xs text-gray-400">saved {pick.savedAt}</span>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-600 hover:text-red-400 text-xs transition-colors ml-2 shrink-0"
          title="Delete pick"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap items-center">
        {pick.whites.map(n => (
          <span
            key={n}
            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white"
          >
            {n}
          </span>
        ))}
        <span
          className={`w-8 h-8 rounded-full ${gameConf.bonusColor} flex items-center justify-center text-sm font-bold text-white`}
        >
          {pick.bonus}
        </span>
        <span className="text-[10px] text-gray-500 ml-1">{gameConf.bonusLabel}</span>
      </div>

      {results.length > 0 ? (
        <div className="text-xs text-gray-400">
          {results.length} draw{results.length !== 1 ? 's' : ''} since saved ·{' '}
          <span
            className={
              hasPrize
                ? 'text-yellow-400 font-semibold'
                : bestWhites > 0
                ? 'text-green-400'
                : 'text-gray-500'
            }
          >
            Best: {bestWhites} white{bestWhites !== 1 ? 's' : ''}
            {bestResult?.bonusMatch ? ` + ${gameConf.bonusLabel}` : ''}
            {hasPrize ? ' 🎉' : ''}
          </span>
        </div>
      ) : (
        <div className="text-xs text-gray-500">No draws yet since this pick was saved.</div>
      )}

      {results.length > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors self-start"
        >
          {expanded ? 'Hide draws' : `View ${results.length} draw${results.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {expanded && (
        <div className="mt-1">
          <div className="flex items-center gap-2 py-1 text-[10px] text-gray-500 uppercase tracking-wider border-b border-white/10 mb-1">
            <span className="w-24 shrink-0">Date</span>
            <span className="flex-1">Drawn numbers (green = match)</span>
            <span className="shrink-0">Prize</span>
          </div>
          {results.map(r => (
            <DrawRow key={r.draw.date} result={r} pick={pick} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TrackRecord({ pbDraws, mmDraws }: Props) {
  const [picks, setPicks] = useState<SavedPick[]>(() =>
    [...loadSavedPicks()].reverse()
  )

  function handleDelete(id: string) {
    deleteSavedPick(id)
    setPicks(prev => prev.filter(p => p.id !== id))
  }

  function handleClearAll() {
    clearSavedPicks()
    setPicks([])
  }

  function getDraws(game: Game): Draw[] {
    return game === 'powerball' ? pbDraws : mmDraws
  }

  if (picks.length === 0) {
    return (
      <section className="panel">
        <h3 className="panel-title text-teal-400">
          <span className="dot" />Track Record
        </h3>
        <p className="text-xs text-gray-400 text-center py-6">
          No picks saved yet.
          <br />
          Head to <span className="text-purple-300">Lucky Star Picks</span> to generate and save
          picks to track.
        </p>
      </section>
    )
  }

  const allResults = picks.flatMap(p => matchPickAgainstDraws(p, getDraws(p.game)))
  const totalDrawsChecked = allResults.length
  const overallBest = allResults.reduce((max, r) => Math.max(max, r.whiteMatches), 0)
  const anyPrize = allResults.some(r => prizeTier(r.draw.game, r.whiteMatches, r.bonusMatch) !== null)

  return (
    <section className="panel">
      <div className="flex items-center justify-between mb-1">
        <h3 className="panel-title text-teal-400 mb-0">
          <span className="dot" />Track Record
        </h3>
        <button
          onClick={handleClearAll}
          className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>
      <p className="text-xs text-gray-300 mb-4">
        Comparing your saved picks against actual draws since each was saved.
      </p>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-black/30 rounded-lg py-2 text-center">
          <div className="text-lg font-bold text-white">{picks.length}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Picks</div>
        </div>
        <div className="flex-1 bg-black/30 rounded-lg py-2 text-center">
          <div className="text-lg font-bold text-white">{totalDrawsChecked}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Draws Checked</div>
        </div>
        <div className="flex-1 bg-black/30 rounded-lg py-2 text-center">
          <div
            className={`text-lg font-bold ${
              anyPrize ? 'text-yellow-400' : overallBest >= 3 ? 'text-green-400' : 'text-white'
            }`}
          >
            {overallBest}
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Best Whites</div>
        </div>
      </div>

      <PrizeLegend />

      <div className="flex flex-col gap-3">
        {picks.map(pick => (
          <PickCard
            key={pick.id}
            pick={pick}
            draws={getDraws(pick.game)}
            onDelete={() => handleDelete(pick.id)}
          />
        ))}
      </div>
    </section>
  )
}
