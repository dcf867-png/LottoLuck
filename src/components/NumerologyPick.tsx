import { useState } from 'react'
import { GAME_CONFIG } from '../lib/types'
import { buildProfile, generateNumerologyPick, type NumerologyProfile } from '../lib/numerology'
import DateInput from './DateInput'
import { savePick } from '../lib/trackRecord'

interface PickPair {
  pb: { whites: number[]; bonus: number }
  mm: { whites: number[]; bonus: number }
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


interface Props {
  sharedBirthDate?: string
}

export default function NumerologyPick({ sharedBirthDate }: Props) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState(sharedBirthDate ?? '')

  // Sync shared birth date into local field if user hasn't set one yet
  const [prevShared, setPrevShared] = useState(sharedBirthDate)
  if (sharedBirthDate !== prevShared) {
    setPrevShared(sharedBirthDate)
    if (sharedBirthDate) setDob(sharedBirthDate)
  }
  const [profile, setProfile] = useState<NumerologyProfile | null>(null)
  const [picks, setPicks] = useState<PickPair[]>([])
  const [error, setError] = useState('')

  function handleGenerate() {
    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (!dob) { setError('Please enter your date of birth.'); return }
    setError('')
    const newProfile = buildProfile(name.trim(), dob)
    setProfile(newProfile)
    const pb = generateNumerologyPick(newProfile, 'powerball', 0)
    const mm = generateNumerologyPick(newProfile, 'megamillions', 0)
    setPicks([{ pb, mm, index: 0 }])
    savePick({ source: 'numerology', game: 'powerball', whites: pb.whites, bonus: pb.bonus })
    savePick({ source: 'numerology', game: 'megamillions', whites: mm.whites, bonus: mm.bonus })
  }

  function handleGenerateAnother() {
    if (!profile) return
    const nextIndex = picks.length
    const pb = generateNumerologyPick(profile, 'powerball', nextIndex)
    const mm = generateNumerologyPick(profile, 'megamillions', nextIndex)
    setPicks(prev => [...prev, { pb, mm, index: nextIndex }])
    savePick({ source: 'numerology', game: 'powerball', whites: pb.whites, bonus: pb.bonus })
    savePick({ source: 'numerology', game: 'megamillions', whites: mm.whites, bonus: mm.bonus })
  }

  return (
    <section className="panel">
      <h3 className="panel-title text-purple-400">
        <span className="dot" />Numerology Pick
      </h3>
      <p className="text-xs text-gray-400 mb-4">No personal data is collected or shared with anyone.</p>
      <p className="text-xs text-gray-300 mb-4">Enter your info to generate a personal pick based on your numerology profile.</p>

      <div className="flex flex-col gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-200 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Jane Marie Smith"
            className="w-full bg-black/40 text-white text-sm rounded-lg px-3 py-2 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-purple-500"
          />
        </div>
        <DateInput value={dob} onChange={setDob} label="Date of Birth" />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={handleGenerate}
          className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Generate My Pick
        </button>
      </div>

      {profile && picks.length > 0 && (
        <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
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
            {picks.map((pair, i) => (
              <div key={pair.index} className="flex flex-col gap-3 bg-black/25 rounded-lg py-3 px-2">
                <p className="text-xs text-gray-300 uppercase tracking-widest text-center">Pick {i + 1}</p>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-red-500">Powerball</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {pair.pb.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
                    <Ball num={pair.pb.bonus} color={GAME_CONFIG.powerball.bonusColor} />
                  </div>
                </div>

                <div className="border-t border-white/10" />

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-yellow-400">Mega Millions</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {pair.mm.whites.map(n => <Ball key={n} num={n} color="bg-gray-700" />)}
                    <Ball num={pair.mm.bonus} color={GAME_CONFIG.megamillions.bonusColor} />
                  </div>
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
    </section>
  )
}
