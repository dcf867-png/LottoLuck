import { useState } from 'react'

interface Props {
  value: string
  onChange: (iso: string) => void
  label?: string
  required?: boolean
  optionalLabel?: string
}

function formatAsTyped(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDate(s: string): string | null {
  s = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00')
    if (!isNaN(d.getTime())) return s
  }
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const [, m, d, y] = slash
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    const date = new Date(iso + 'T00:00:00')
    if (!isNaN(date.getTime())) return iso
  }
  return null
}

function toDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

export default function DateInput({ value, onChange, label, required, optionalLabel }: Props) {
  const [text, setText] = useState(() => toDisplay(value))
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setText(toDisplay(value))
  }

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatAsTyped(e.target.value)
    setText(formatted)
    if (!formatted) { onChange(''); return }
    const parsed = parseDate(formatted)
    if (parsed) onChange(parsed)
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value
    if (!iso) { onChange(''); setText(''); return }
    onChange(iso)
    setText(toDisplay(iso))
  }

  function handleClear() {
    setText('')
    onChange('')
  }

  return (
    <div>
      {label && (
        <label className="block text-xs text-gray-200 mb-1">
          {label}
          {required && <span className="text-purple-400"> *</span>}
          {optionalLabel && <span className="text-gray-400"> ({optionalLabel})</span>}
        </label>
      )}
      <div className="flex gap-2 items-stretch">
        {/* Typeable text field */}
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="MM/DD/YYYY"
            className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-purple-500 pr-8"
          />
          {text && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-[13px] leading-none"
              aria-label="Clear date"
            >×</button>
          )}
        </div>

        {/* Calendar button — hidden date input overlaid for native picker */}
        <div className="relative flex-shrink-0">
          <div className="bg-black/40 border border-white/10 rounded-lg px-3 h-full flex items-center text-gray-400 hover:text-purple-400 hover:border-purple-500 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <input
            type="date"
            value={value}
            onChange={handlePickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
            aria-label="Pick date from calendar"
          />
        </div>
      </div>
    </div>
  )
}
