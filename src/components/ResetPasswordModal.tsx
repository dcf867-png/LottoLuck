import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPasswordModal() {
  const { clearPasswordRecovery, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setLoading(false)
    }
  }

  const handleDone = async () => {
    clearPasswordRecovery()
    // Sign out so user logs in fresh with their new password
    await signOut()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">Set New Password</h2>
        <p className="text-xs text-gray-400 mb-6">Choose a strong password for your account.</p>

        {done ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm text-center">
              Password updated successfully!
            </div>
            <p className="text-xs text-gray-400 text-center">You'll be signed out so you can log in with your new password.</p>
            <button
              onClick={handleDone}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Sign In Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none ${
                  mismatch ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-purple-500'
                }`}
              />
              {mismatch && <p className="text-xs text-red-400">Passwords don't match</p>}
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || mismatch || !password || !confirm}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
