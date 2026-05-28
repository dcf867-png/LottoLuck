import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type ProfileTab = 'profile' | 'security'

interface Profile {
  full_name: string | null
  birth_date: string | null
  birth_time: string | null
  birth_city: string | null
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

export default function UserProfile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')

  // Profile state
  const [profile, setProfile] = useState<Profile>({
    full_name: '', birth_date: '', birth_time: '', birth_city: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Security state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('full_name, birth_date, birth_time, birth_city')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
        setLoading(false)
      })
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: profile.full_name || null,
      birth_date: profile.birth_date || null,
      birth_time: profile.birth_time || null,
      birth_city: profile.birth_city || null,
    })
    setMessage(error
      ? { type: 'error', text: 'Failed to save. Please try again.' }
      : { type: 'success', text: 'Profile saved!' }
    )
    setSaving(false)
  }

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPwMessage({ type: 'error', text: 'Passwords do not match.' }); return }
    if (newPassword.length < 6) { setPwMessage({ type: 'error', text: 'Password must be at least 6 characters.' }); return }
    setChangingPw(true)
    setPwMessage(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPwMessage({ type: 'error', text: error.message })
    } else {
      setPwMessage({ type: 'success', text: 'Password updated!' })
      setNewPassword('')
      setConfirmPassword('')
      setShowNewPw(false)
      setShowConfirmPw(false)
    }
    setChangingPw(false)
  }, [newPassword, confirmPassword])

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase.rpc('delete_user')
    if (error) { setDeleteError('Failed to delete account. Please try again.'); setDeleting(false); return }
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div className="panel flex items-center justify-center py-8">
      <span className="text-gray-400 text-sm">Loading profile...</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <section className="panel">
        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-black/30 rounded-lg p-1">
          {([['profile', '👤 Profile'], ['security', '🔒 Security']] as [ProfileTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? tab === 'profile' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <>
            <h2 className="panel-title text-purple-400">
              <span className="dot" />My Profile
            </h2>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
                <p className="text-sm text-gray-300">{user?.email}</p>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Full Name</label>
                <input type="text" placeholder="Your name" value={profile.full_name ?? ''}
                  onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">Date of Birth</label>
                <input type="date" value={profile.birth_date ?? ''}
                  onChange={e => setProfile(p => ({ ...p, birth_date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">
                  Time of Birth <span className="text-gray-600 normal-case">(optional)</span>
                </label>
                <input type="time" value={profile.birth_time ?? ''}
                  onChange={e => setProfile(p => ({ ...p, birth_time: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider">
                  Birth City <span className="text-gray-600 normal-case">(optional)</span>
                </label>
                <input type="text" placeholder="e.g. New York, NY" value={profile.birth_city ?? ''}
                  onChange={e => setProfile(p => ({ ...p, birth_city: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </>
        )}

        {/* ── Security tab ── */}
        {activeTab === 'security' && (
          <div className="flex flex-col gap-6">
            {/* Change password */}
            <div>
              <h2 className="panel-title text-blue-400">
                <span className="dot" />Change Password
              </h2>

              {pwMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
                  pwMessage.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}>
                  {pwMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input type={showNewPw ? 'text' : 'password'} placeholder="At least 6 characters" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required minLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500" />
                    <button type="button" onClick={() => setShowNewPw(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}>
                      <EyeIcon open={showNewPw} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <input type={showConfirmPw ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} required
                      className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 pr-10 text-white placeholder-gray-500 text-sm focus:outline-none ${
                        confirmPassword.length > 0 && newPassword !== confirmPassword
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-white/10 focus:border-blue-500'
                      }`} />
                    <button type="button" onClick={() => setShowConfirmPw(v => !v)} tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label={showConfirmPw ? 'Hide password' : 'Show password'}>
                      <EyeIcon open={showConfirmPw} />
                    </button>
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords don't match</p>
                  )}
                </div>
                <button type="submit"
                  disabled={changingPw || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                  {changingPw ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Account deletion */}
            <div className="border border-red-900/40 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Account Deletion</h3>
              <p className="text-xs text-gray-400 mb-3">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 px-4 py-2 rounded-lg transition-colors">
                  Delete My Account
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
                    ⚠️ This will permanently delete your account and all saved data. Are you sure?
                  </p>
                  {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleDeleteAccount} disabled={deleting}
                      className="flex-1 text-xs bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                      {deleting ? 'Deleting...' : 'Yes, delete my account'}
                    </button>
                    <button onClick={() => { setConfirmDelete(false); setDeleteError('') }} disabled={deleting}
                      className="flex-1 text-xs bg-white/10 hover:bg-white/20 disabled:opacity-50 text-gray-300 px-4 py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
