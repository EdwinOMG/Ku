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
    supabase
      .from('users')
      .select('username, bio, role, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username)
          setBio(data.bio || '')
          setRole(data.role)
          setAvatarUrl(data.avatar_url || '')
          setPreviewUrl(data.avatar_url || '')
        }
      })
  }, [user])

  const handleAvatarSelect = (url: string) => {
    setPreviewUrl(url)
    setAvatarUrl(url)
    setShowAvatarPicker(false)
  }

  const handleSave = async () => {
    if (!session || !user) return
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      let finalAvatarUrl = avatarUrl

      if (avatarUrl.startsWith('data:')) {
        const res = await fetch(avatarUrl)
        const blob = await res.blob()
        const ext = blob.type === 'image/png' ? 'png' : 'jpg'
        const fileName = `${user.id}/avatar.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { contentType: blob.type, upsert: true })

        if (uploadError) throw new Error(uploadError.message)

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        finalAvatarUrl = urlData.publicUrl
      }

      await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ bio, avatar_url: finalAvatarUrl })
      }, session.access_token)

      setAvatarUrl(finalAvatarUrl)
      setPreviewUrl(finalAvatarUrl)
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

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-paper-muted overflow-hidden flex items-center justify-center flex-shrink-0">
              {previewUrl
                ? <img src={previewUrl} alt="avatar preview" className="w-full h-full object-cover" />
                : <span className="text-2xl text-ink-faint">◯</span>
              }
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-ink">{username}</p>
              <Link
                to={`/profile/${username}`}
                className="text-xs text-amber-warm"
              >
                view your profile →
              </Link>
              <button
                onClick={() => setShowAvatarPicker(s => !s)}
                className="text-xs text-ink-muted text-left"
              >
                {showAvatarPicker ? 'cancel' : 'change picture'}
              </button>
            </div>
          </div>

          {showAvatarPicker && (
            <AvatarPicker
              current={previewUrl}
              onSelect={handleAvatarSelect}
            />
          )}

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-ink-muted">bio</label>
              <span className="text-xs text-ink-faint">{bio.length}/160</span>
            </div>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-amber-mid"
              placeholder="say something about yourself..."
            />
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

        {['mod', 'admin'].includes(role) && (
          <div className="bg-paper-card border border-paper-border rounded-card p-4">
            <button
              onClick={() => navigate('/mod')}
              className="text-sm text-ink-secondary w-full text-left"
            >
              mod dashboard →
            </button>
          </div>
        )}

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