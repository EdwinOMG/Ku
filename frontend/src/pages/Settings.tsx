import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { supabase } from '../lib/supabase'
import TopBar from '../components/layout/TopBar'
import Layout from '../components/layout/Layout'
import AvatarPicker from '../components/ui/AvatarPicker'

export default function Settings() {
  const { user, session, logout } = useAuth()
  const navigate = useNavigate()
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('users').select('username, bio, role, avatar_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) { setUsername(data.username); setBio(data.bio || ''); setRole(data.role); setAvatarUrl(data.avatar_url || ''); setPreviewUrl(data.avatar_url || '') }
      })
  }, [user])

  const handleAvatarSelect = (url: string) => { setPreviewUrl(url); setAvatarUrl(url); setShowAvatarPicker(false) }

  const handleSave = async () => {
    if (!session || !user) return
    setLoading(true); setError(''); setSuccess(false)
    try {
      let finalAvatarUrl = avatarUrl
      if (avatarUrl.startsWith('data:')) {
        const res = await fetch(avatarUrl)
        const blob = await res.blob()
        const ext = blob.type === 'image/png' ? 'png' : 'jpg'
        const fileName = `${user.id}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: blob.type, upsert: true })
        if (uploadError) throw new Error(uploadError.message)
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = urlData.publicUrl
      }
      await api('/users/profile', { method: 'PUT', body: JSON.stringify({ bio, avatar_url: finalAvatarUrl }) }, session.access_token)
      setAvatarUrl(finalAvatarUrl); setPreviewUrl(finalAvatarUrl); setSuccess(true)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <Layout>
      <TopBar title="settings" showBack />
      <div className="p-4 flex flex-col gap-4 stagger">
        {/* Profile card */}
        <div className="cozy-card p-5 flex flex-col gap-4 animate-fade-in-up">
          <p className="text-xs font-display font-semibold text-ink-secondary tracking-wide">profile</p>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-moss-light overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-moss-sage/30 shadow-warm">
              {previewUrl
                ? <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl text-ink-ghost">◯</span>
              }
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-display font-semibold text-ink">{username}</p>
              <Link to={`/profile/${username}`} className="text-xs text-amber-warm hover:text-amber-mid transition-colors font-display">
                view your profile →
              </Link>
              <button onClick={() => setShowAvatarPicker(s => !s)}
                className="text-xs text-ink-muted text-left hover:text-ink transition-colors">
                {showAvatarPicker ? 'cancel' : 'change picture'}
              </button>
            </div>
          </div>

          {showAvatarPicker && (
            <div className="animate-slide-up"><AvatarPicker current={previewUrl} onSelect={handleAvatarSelect} /></div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs text-ink-muted font-display">bio</label>
              <span className="text-[10px] text-ink-ghost font-mono">{bio.length}/160</span>
            </div>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={160}
              className="cozy-input resize-none" placeholder="say something about yourself..." />
          </div>

          {error && <p className="text-xs text-red-400 animate-scale-in">{error}</p>}
          {success && <p className="text-xs text-moss-deep animate-scale-in">✓ saved successfully</p>}

          <button onClick={handleSave} disabled={loading} className="btn-warm">
            {loading ? 'saving...' : 'save changes'}
          </button>
        </div>

        {/* Word filter */}
        <div className="cozy-card p-5 flex flex-col gap-2 animate-fade-in-up">
          <p className="text-xs font-display font-semibold text-ink-secondary">word filter</p>
          <p className="text-xs text-ink-muted italic">block words or hashtags from your feeds</p>
          <button onClick={() => navigate('/settings/filters')}
            className="text-xs text-amber-warm text-left font-display hover:text-amber-mid transition-colors mt-1">
            manage filters →
          </button>
        </div>

        {/* Mod */}
        {['mod', 'admin'].includes(role) && (
          <div className="cozy-card p-5 animate-fade-in-up">
            <button onClick={() => navigate('/mod')}
              className="text-sm text-ink-secondary w-full text-left font-display hover:text-ink transition-colors">
              🌿 mod dashboard →
            </button>
          </div>
        )}

        {/* Sign out */}
        <div className="cozy-card p-5 animate-fade-in-up">
          <button onClick={handleLogout}
            className="text-sm text-clay-rust w-full text-left font-display hover:text-red-500 transition-colors">
            sign out
          </button>
        </div>
      </div>
    </Layout>
  )
}
