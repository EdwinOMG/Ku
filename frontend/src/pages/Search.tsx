import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'

interface UserResult {
  id: string
  username: string
  avatar_url?: string
  bio?: string
}

interface HashtagResult {
  id: string
  name: string
}

export default function Search() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'users' | 'hashtags'>('users')
  const [users, setUsers] = useState<UserResult[]>([])
  const [hashtags, setHashtags] = useState<HashtagResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const [userData, hashtagData] = await Promise.all([
        api(`/search/users?q=${encodeURIComponent(query)}`, {}, session?.access_token),
        api(`/search/hashtags?q=${encodeURIComponent(query.replace('#', ''))}`, {}, session?.access_token)
      ])
      setUsers(userData.users)
      setHashtags(hashtagData.hashtags)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <Layout>
      <TopBar title="search" />

      <div className="p-3 flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="search users or #hashtags..."
            className="flex-1 bg-paper-card border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid placeholder:text-ink-faint"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-amber-warm text-paper-card rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? '...' : 'go'}
          </button>
        </div>

        {searched && (
          <div className="flex border-b border-paper-border">
            <button
              onClick={() => setTab('users')}
              className={`flex-1 py-2 text-xs font-medium ${
                tab === 'users'
                  ? 'text-amber-warm border-b border-amber-warm'
                  : 'text-ink-faint'
              }`}
            >
              users {users.length > 0 && `(${users.length})`}
            </button>
            <button
              onClick={() => setTab('hashtags')}
              className={`flex-1 py-2 text-xs font-medium ${
                tab === 'hashtags'
                  ? 'text-amber-warm border-b border-amber-warm'
                  : 'text-ink-faint'
              }`}
            >
              hashtags {hashtags.length > 0 && `(${hashtags.length})`}
            </button>
          </div>
        )}

        {tab === 'users' && users.map(u => (
          <button
            key={u.id}
            onClick={() => navigate(`/profile/${u.username}`)}
            className="bg-paper-card border border-paper-border rounded-card p-3 flex items-center gap-3 text-left w-full"
          >
            <div className="w-9 h-9 rounded-full bg-paper-muted flex items-center justify-center text-sm font-medium text-ink-secondary flex-shrink-0 overflow-hidden">
              {u.avatar_url
                ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                : u.username[0].toUpperCase()
              }
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{u.username}</p>
              {u.bio && <p className="text-xs text-ink-muted mt-0.5">{u.bio}</p>}
            </div>
          </button>
        ))}

        {tab === 'hashtags' && hashtags.map(h => (
          <button
            key={h.id}
            onClick={() => navigate(`/hashtag/${h.name}`)}
            className="bg-paper-card border border-paper-border rounded-card p-3 flex items-center gap-2 text-left w-full"
          >
            <span className="text-sm text-amber-mid bg-amber-light px-2 py-0.5 rounded-full">
              #{h.name}
            </span>
          </button>
        ))}

        {searched && !loading && tab === 'users' && users.length === 0 && (
          <p className="text-center text-ink-muted text-sm py-6">no users found</p>
        )}

        {searched && !loading && tab === 'hashtags' && hashtags.length === 0 && (
          <p className="text-center text-ink-muted text-sm py-6">no hashtags found</p>
        )}
      </div>
    </Layout>
  )
}