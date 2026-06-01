import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import TopBar from '../components/layout/TopBar'

export default function ComposeOpenWrite() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!session) return
    setError('')

    if (content.trim().length === 0) {
      setError('write something first')
      return
    }

    setLoading(true)
    try {
      await api('/openwrites', {
        method: 'POST',
        body: JSON.stringify({ content, visibility })
      }, session.access_token)
      navigate(-1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cafe-bg max-w-lg mx-auto">
      <TopBar
        title="open write"
        showBack
        right={
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm text-amber-warm font-medium disabled:opacity-40"
          >
            {loading ? 'saving...' : 'save'}
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-cafe-card border border-cafe-border rounded-card p-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            placeholder="write freely..."
            className="w-full bg-transparent text-sm text-ink leading-relaxed resize-none focus:outline-none placeholder:text-ink-faint"
          />
          <p className="text-xs text-ink-faint text-right mt-2">{content.length} characters</p>
        </div>

        <div className="bg-cafe-card border border-cafe-border rounded-card p-4 flex flex-col gap-2">
          <label className="text-xs text-ink-secondary">visibility</label>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
            className="bg-cafe-bg border border-cafe-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
          >
            <option value="private">private — only you</option>
            <option value="friends">friends only</option>
            <option value="public">public</option>
          </select>
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center">{error}</p>
        )}
      </div>
    </div>
  )
}