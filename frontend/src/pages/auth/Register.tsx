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
    if (username.length < 3) { setError('Username must be at least 3 characters'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers and underscores'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, username }) })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.session) {
        const { data: profile } = await supabase.from('users').select('username').eq('id', data.session.user.id).single()
        if (profile?.username) localStorage.setItem('ku_username', profile.username)
        navigate('/home')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cafe-glow" />
      <div className="absolute top-16 right-10 text-5xl opacity-[0.04] animate-sway select-none">🌱</div>
      <div className="absolute bottom-24 left-12 text-6xl opacity-[0.04] animate-float select-none">🌿</div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cafe-card shadow-warm-lg mb-4 animate-warm-glow">
            <span className="text-3xl font-display font-bold text-wood-dark">ku</span>
          </div>
          <p className="text-ink-muted text-sm font-display italic">find your quiet corner</p>
          <div className="vine-divider mt-4 mx-12" />
        </div>

        <div className="cozy-card p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <label className="text-xs text-ink-muted font-display">username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="cozy-input" placeholder="yourname" required />
            </div>
            <div className="flex flex-col gap-1.5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <label className="text-xs text-ink-muted font-display">email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="cozy-input" placeholder="you@example.com" required />
            </div>
            <div className="flex flex-col gap-1.5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <label className="text-xs text-ink-muted font-display">password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="cozy-input" placeholder="••••••••" required />
            </div>

            {error && (
              <p className="text-red-400/80 text-xs bg-red-50/50 rounded-lg py-2 px-3 animate-scale-in">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="btn-moss mt-1 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
              {loading ? 'planting your seed...' : 'create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-muted mt-5 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          already have an account?{' '}
          <Link to="/login" className="text-amber-warm font-medium hover:text-amber-mid transition-colors">sign in</Link>
        </p>
      </div>
    </div>
  )
}
