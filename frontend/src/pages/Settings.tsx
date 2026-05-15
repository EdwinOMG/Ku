import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import TopBar from '../components/layout/TopBar'
import Layout from '../components/layout/Layout'

export default function Settings() {
  const { user, session, logout } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('users')
      .select('username, bio')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username)
          setBio(data.bio || '')
        }
      })
  }, [user])

  const handleSave = async () => {
    if (!session) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ username, bio })
      }, session.access_token)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <Layout>
      <TopBar title="settings" showBack />

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-paper-card border border-paper-border rounded-card p-4 flex flex-col gap-4">
          <p className="text-xs font-medium text-ink-secondary">profile</p>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted">bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-amber-mid"
              placeholder="say something about yourself..."
            />
            <p className="text-xs text-ink-faint text-right">{bio.length}/160</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-green-600">saved successfully</p>}

          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-amber-warm text-paper-card rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'saving...' : 'save changes'}
          </button>
        </div>

        <div className="bg-paper-card border border-paper-border rounded-card p-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-ink-secondary">word filter</p>
          <p className="text-xs text-ink-muted">block words or hashtags from appearing in your feeds</p>
          <button
            onClick={() => navigate('/settings/filters')}
            className="text-xs text-amber-warm text-left"
          >
            manage filters →
          </button>
        </div>

        <div className="bg-paper-card border border-paper-border rounded-card p-4">
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 w-full text-left"
          >
            sign out
          </button>
        </div>
      </div>
    </Layout>
  )
}