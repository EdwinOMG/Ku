import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  if (username.length < 3) {
    setError('Username must be at least 3 characters')
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    setError('Username can only contain letters, numbers and underscores')
    return
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters')
    return
  }

  setLoading(true)
  try {
    // register via backend to create public profile
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username })
    })

    // sign in directly via supabase client instead of backend
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    if (data.session) {
      navigate('/home')
    }
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-paper-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-ink mb-1">ku</h1>
          <p className="text-ink-muted text-sm">write something small</p>
        </div>

        <div className="bg-paper-card border border-paper-border rounded-card p-6">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-secondary">username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
                placeholder="yourname"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-secondary">email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-secondary">password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-amber-warm text-paper-card rounded-lg py-2 text-sm font-medium mt-1 disabled:opacity-50"
            >
              {loading ? 'creating account...' : 'create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-muted mt-4">
          already have an account?{' '}
          <Link to="/login" className="text-amber-warm underline">
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}