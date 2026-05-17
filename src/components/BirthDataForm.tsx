interface Props {
  birthDate: string
  birthTime: string
  cityState: string
  onBirthDateChange: (v: string) => void
  onBirthTimeChange: (v: string) => void
  onCityStateChange: (v: string) => void
  onGenerate: () => void
  isLoading: boolean
  error: string
}

export default function BirthDataForm({
  birthDate, birthTime, cityState,
  onBirthDateChange, onBirthTimeChange, onCityStateChange,
  onGenerate, isLoading, error,
}: Props) {
  return (
    <section className="panel">
      <h3 className="panel-title text-purple-400">
        <span className="dot" />Birth Info
      </h3>
      <p className="text-xs text-gray-400 mb-4">No personal data is collected or shared with anyone.</p>

      <div className="flex flex-col gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-200 mb-1">
            Date of Birth <span className="text-purple-400">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={birthDate}
              onChange={e => onBirthDateChange(e.target.value)}
              className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-500 pr-8"
            />
            {birthDate && (
              <button
                onClick={() => onBirthDateChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none"
                aria-label="Clear date"
              >×</button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-200 mb-1">
            Birth Time <span className="text-gray-400">(optional — enables rising sign)</span>
          </label>
          <div className="relative">
            <input
              type="time"
              value={birthTime}
              onChange={e => onBirthTimeChange(e.target.value)}
              className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-500 pr-8"
            />
            {birthTime && (
              <button
                onClick={() => onBirthTimeChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none"
                aria-label="Clear time"
              >×</button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-200 mb-1">
            Birth City / State <span className="text-gray-400">(optional — for rising sign accuracy)</span>
          </label>
          <input
            type="text"
            value={cityState}
            onChange={e => onCityStateChange(e.target.value)}
            placeholder="e.g. Boise, Idaho"
            className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-purple-500"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {isLoading ? 'Calculating...' : 'Generate My Charts'}
        </button>
      </div>
    </section>
  )
}
