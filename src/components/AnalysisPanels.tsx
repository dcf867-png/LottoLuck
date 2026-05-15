import type { Game, Mode, AnalysisResult, NumberScore } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'

interface Props {
  game: Game
  mode: Mode
  result: AnalysisResult
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-purple-500 h-1.5 rounded-full"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  )
}

function ScoreTable({ scores, label, titleColor }: { scores: NumberScore[]; label: string; titleColor: string }) {
  const top = scores.slice(0, 10)
  return (
    <section className="panel">
      <h3 className={`panel-title ${titleColor}`}>
        <span className="dot" />{label} — Top 10
      </h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-300 text-left">
            <th className="pb-2 w-8">#</th>
            <th className="pb-2 w-12">Ball</th>
            <th className="pb-2">Freq</th>
            <th className="pb-2">Recent</th>
            <th className="pb-2">Gap</th>
            <th className="pb-2 text-right w-12">Score</th>
          </tr>
        </thead>
        <tbody>
          {top.map((s, i) => (
            <tr key={s.number} className="border-t border-white/5">
              <td className="py-1.5 text-gray-300">{i + 1}</td>
              <td className="py-1.5 font-bold text-white">{s.number}</td>
              <td className="py-1.5 pr-2"><ScoreBar value={s.freqScore} /></td>
              <td className="py-1.5 pr-2"><ScoreBar value={s.recencyScore} /></td>
              <td className="py-1.5 pr-2"><ScoreBar value={s.gapScore} /></td>
              <td className="py-1.5 text-right text-purple-300">{(s.combined * 100).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function PairsPanel({ pairs, titleColor }: { pairs: AnalysisResult['topPairs']; titleColor: string }) {
  if (pairs.length === 0) return null
  return (
    <section className="panel">
      <h3 className={`panel-title ${titleColor}`}>
        <span className="dot" />Top Co-occurring Pairs
      </h3>
      <div className="flex flex-wrap gap-2">
        {pairs.slice(0, 10).map(p => (
          <span key={`${p.a}-${p.b}`} className="bg-white/10 text-gray-100 text-xs px-2 py-1 rounded-md">
            {p.a} + {p.b} <span className="text-gray-300">({p.count}×)</span>
          </span>
        ))}
      </div>
    </section>
  )
}

export default function AnalysisPanels({ game, mode, result }: Props) {
  const cfg = GAME_CONFIG[game]
  const titleColor = game === 'powerball' ? 'text-red-500' : 'text-yellow-400'

  if (mode === 'bonus') {
    return (
      <div className="flex flex-col gap-3">
        <ScoreTable scores={result.bonusScores} label={`${cfg.bonusLabel} Scores`} titleColor={titleColor} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ScoreTable scores={result.whiteScores} label="White Ball Scores" titleColor={titleColor} />
      <ScoreTable scores={result.bonusScores} label={`${cfg.bonusLabel} Scores`} titleColor={titleColor} />
      <PairsPanel pairs={result.topPairs} titleColor={titleColor} />
    </div>
  )
}
