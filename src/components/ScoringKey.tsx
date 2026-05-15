const SIGNALS = [
  { icon: '📈', label: 'Frequency', weight: '35%', desc: 'All-time appearances in current era' },
  { icon: '⚡', label: 'Recency', weight: '35%', desc: 'Hits in the last 104 draws (~1 year)' },
  { icon: '⏳', label: 'Gap', weight: '30%', desc: 'How overdue vs. its own average' },
]

export default function ScoringKey() {
  return (
    <section className="panel">
      <p className="text-xs uppercase tracking-[3px] text-center text-purple-400 mb-4">
        ★ How picks are generated
      </p>
      <div className="grid grid-cols-3 gap-3">
        {SIGNALS.map(s => (
          <div key={s.label} className="text-center px-2">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xs font-bold text-white">{s.label}</div>
            <div className="text-[10px] tracking-wider text-purple-300">{s.weight}</div>
            <div className="text-[10px] text-white/50 mt-1 leading-snug">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
