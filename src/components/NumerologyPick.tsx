import { useState } from 'react'
import type { Game } from '../lib/types'
import { GAME_CONFIG } from '../lib/types'
import { buildProfile, generateNumerologyPick, type NumerologyProfile } from '../lib/numerology'

interface Props {
  game: Game
}

interface GeneratedPick {
  whites: number[]
  bonus: number
  index: number
}

function Ball({ num, color }: { num: number; color: string }) {
  return (
    <div className={`${color} rounded-full w-12 h-12 flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
      {num}
    </div>
  )
}

function ProfileBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-300">{label}</span>
      <span className="text-lg font-bold text-purple-300">{value}</span>
    </div>
  )
}

export default function NumerologyPick({ game }: Props) {
  const cfg = GAME_CONFIG[game]
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [profile, setProfile] = useState<NumerologyProfile | null>(null)
  const [picks, setPicks] = useState<GeneratedPick[]>([])
  const [error, setError] = useState('')

  function handleGenerate() {
    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (!dob) { setError('Please enter your date of birth.'); return }
    setError('')
    const newProfile = buildProfile(name.trim(), dob)
    setProfile(newProfile)
    const first = generateNumerologyPick(newProfile, game, 0)
    setPicks([{ ...first, index: 0 }])
  }

  function handleGenerateAnother() {
    if (!profile) return
    const nextIndex = picks.length
    const next = generateNumerologyPick(profile, game, nextIndex)
    setPicks(prev => [...prev, { ...next, index: nextIndex }])
  }

  return (
    <div className="px-4 pb-8">
      <div className="bg-gray-900 rounded-xl p-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold text-yellow-400 underline underline-offset-2">Numerology Quick Pick</h3>
          <span className={`text-gray-400 text-xl leading-none transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>▾</span>
        </button>
        <p className="text-xs text-gray-400 mt-1">No personal data is collected or shared with anyone.</p>

        {open && (
          <>
            <p className="text-xs text-gray-300 mt-3 mb-4">Enter your info to generate a personal pick based on your numerology profile.</p>

            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-200 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Marie Smith"
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-200 mb-1">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-purple-500 pr-8"
                  />
                  {dob && (
                    <button
                      onClick={() => setDob('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white text-[12px] leading-none"
                      aria-label="Clear date"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleGenerate}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Generate My Pick
              </button>
            </div>

            {profile && picks.length > 0 && (
              <div className="border-t border-gray-800 pt-4 flex flex-col gap-4">
                <div>
                  <p className="text-xs text-gray-300 mb-2 uppercase tracking-widest">Your Numerology Profile</p>
                  <div className="flex justify-around flex-wrap gap-y-3">
                    <ProfileBadge label="Life Path" value={profile.lifePath} />
                    <ProfileBadge label="Expression" value={profile.expression} />
                    <ProfileBadge label="Soul Urge" value={profile.soulUrge} />
                    <ProfileBadge label="Birthday" value={profile.birthday} />
                    <ProfileBadge label="Pers. Year" value={profile.personalYear} />
                    <ProfileBadge label="Pers. Day" value={profile.personalDay} />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {picks.map((pick, i) => (
                    <div key={pick.index} className="flex flex-col items-center gap-2 bg-gray-800 rounded-lg py-3 px-2">
                      <p className="text-xs text-gray-300 uppercase tracking-widest">Pick {i + 1}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {pick.whites.map(n => (
                          <Ball key={n} num={n} color="bg-gray-700" />
                        ))}
                        <Ball num={pick.bonus} color={cfg.bonusColor} />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGenerateAnother}
                  className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors text-center"
                >
                  Generate another
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
