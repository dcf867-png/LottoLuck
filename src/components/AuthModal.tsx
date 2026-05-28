import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onClose: () => void
}

type AuthView = 'signin' | 'signup' | 'forgot'

export default function AuthModal({ onClose }: Props) {
  const [view, setView] = useState<AuthView>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else onClose()
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMessage('Check your email for a confirmation link!')
    setLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) setError(error.message)
    else setMessage('Password reset link sent! Check your email.')
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {view === 'signin' ? 'Sign In' : view === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Success message */}
        {message && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm text-center">
            {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        {!message && (
          <form onSubmit={view === 'signin' ? handleSignIn : view === 'signup' ? handleSignUp : handleForgot}
            className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
            />
            {view !== 'forgot' && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
            >
              {loading ? 'Please wait...' : view === 'signin' ? 'Sign In' : view === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Footer links */}
        <div className="mt-4 flex flex-col items-center gap-2 text-xs text-gray-400">
          {view === 'signin' && (
            <>
              <button onClick={() => { setView('forgot'); setError(null) }} className="hover:text-white transition-colors">
                Forgot password?
              </button>
              <span>
                No account?{' '}
                <button onClick={() => { setView('signup'); setError(null) }} className="text-purple-400 hover:text-purple-300">
                  Sign up
                </button>
              </span>
            </>
          )}
          {view === 'signup' && (
            <span>
              Already have an account?{' '}
              <button onClick={() => { setView('signin'); setError(null) }} className="text-purple-400 hover:text-purple-300">
                Sign in
              </button>
            </span>
          )}
          {view === 'forgot' && (
            <button onClick={() => { setView('signin'); setError(null) }} className="hover:text-white transition-colors">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
