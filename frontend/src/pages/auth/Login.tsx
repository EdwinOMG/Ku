import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      localStorage.removeItem('ku_username')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.session) {
        const { data: profile } = await supabase
          .from('users').select('username').eq('id', data.session.user.id).single()
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
      {/* Ambient background */}
      <div className="absolute inset-0 bg-cafe-glow" />
      <div className="absolute top-10 left-10 text-6xl opacity-[0.04] animate-sway select-none">🌿</div>
      <div className="absolute bottom-20 right-8 text-5xl opacity-[0.04] animate-float select-none">🍂</div>
      <div className="absolute top-1/3 right-12 text-4xl opacity-[0.03] animate-breathe select-none">🍃</div>

      {/* Fireflies on login */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="firefly" style={{
          left: `${20 + i * 20}%`, top: `${25 + (i * 29) % 50}%`,
          ['--fly-delay' as string]: `${i * 1.5}s`, ['--fly-duration' as string]: `${5 + i * 2}s`,
        }} />
      ))}

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cafe-card shadow-warm-lg mb-4 animate-warm-glow">
            <span className="text-3xl font-display font-bold text-wood-dark">ku</span>
          </div>
          <p className="text-ink-muted text-sm font-display italic">write something small</p>
          <div className="vine-divider mt-4 mx-12" />
        </div>

        {/* Card */}
        <div className="cozy-card p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <label className="text-xs text-ink-muted font-display">email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="cozy-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <label className="text-xs text-ink-muted font-display">password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="cozy-input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400/80 text-xs bg-red-50/50 rounded-lg py-2 px-3 animate-scale-in">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-warm mt-1 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              {loading ? 'settling in...' : 'sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-muted mt-5 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          no account?{' '}
          <Link to="/register" className="text-moss-deep font-medium hover:text-moss-dark transition-colors">
            join ku
          </Link>
        </p>
      </div>
    </div>
  )
}
