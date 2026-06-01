import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'

interface UserResult { id: string; username: string; avatar_url?: string; bio?: string }
interface HashtagResult { id: string; name: string }

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
    setLoading(true); setSearched(true)
    try {
      const [userData, hashtagData] = await Promise.all([
        api(`/search/users?q=${encodeURIComponent(query)}`, {}, session?.access_token),
        api(`/search/hashtags?q=${encodeURIComponent(query.replace('#', ''))}`, {}, session?.access_token)
      ])
      setUsers(userData.users); setHashtags(hashtagData.hashtags)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <Layout>
      <TopBar title="search" />
      <div className="p-3 flex flex-col gap-3">
        <div className="flex gap-2 animate-fade-in-up">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="search users or #hashtags..."
            className="flex-1 cozy-input" />
          <button onClick={handleSearch} disabled={loading}
            className="btn-warm px-5 py-2.5 disabled:opacity-50">
            {loading ? '...' : 'go'}
          </button>
        </div>

        {searched && (
          <div className="tab-bar rounded-xl overflow-hidden animate-fade-in">
            <button onClick={() => setTab('users')} className={`tab-item ${tab === 'users' ? 'active' : ''}`}>
              users {users.length > 0 && `(${users.length})`}
            </button>
            <button onClick={() => setTab('hashtags')} className={`tab-item ${tab === 'hashtags' ? 'active' : ''}`}>
              hashtags {hashtags.length > 0 && `(${hashtags.length})`}
            </button>
          </div>
        )}

        <div className="stagger">
          {tab === 'users' && users.map(u => (
            <button key={u.id} onClick={() => navigate(`/profile/${u.username}`)}
              className="cozy-card p-3.5 flex items-center gap-3 text-left w-full mb-2 group animate-fade-in-up">
              <div className="w-10 h-10 rounded-xl bg-moss-light flex items-center justify-center text-sm font-semibold text-moss-deep flex-shrink-0 overflow-hidden ring-1 ring-moss-sage/20">
                {u.avatar_url ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-display font-medium text-ink group-hover:text-amber-warm transition-colors">{u.username}</p>
                {u.bio && <p className="text-xs text-ink-muted mt-0.5 italic">{u.bio}</p>}
              </div>
            </button>
          ))}

          {tab === 'hashtags' && hashtags.map(h => (
            <button key={h.id} onClick={() => navigate(`/hashtag/${h.name}`)}
              className="cozy-card p-3.5 flex items-center gap-2 text-left w-full mb-2 animate-fade-in-up">
              <span className="nature-tag">#{h.name}</span>
            </button>
          ))}
        </div>

        {searched && !loading && tab === 'users' && users.length === 0 && (
          <div className="text-center py-10 animate-fade-in-up">
            <div className="text-2xl mb-2 animate-float">🔍</div>
            <p className="text-ink-muted text-sm font-display italic">no users found</p>
            <p className="text-ink-ghost text-xs mt-1">try a different search</p>
          </div>
        )}
        {searched && !loading && tab === 'hashtags' && hashtags.length === 0 && (
          <div className="text-center py-10 animate-fade-in-up">
            <div className="text-2xl mb-2 animate-sway">🏷</div>
            <p className="text-ink-muted text-sm font-display italic">no hashtags found</p>
          </div>
        )}

        {!searched && (
          <div className="text-center py-16 animate-fade-in">
            <div className="relative inline-block mb-4">
              <div className="text-3xl animate-breathe">⌕</div>
              {[0,1,2].map(i => (
                <div key={i} className="absolute animate-drift opacity-30"
                  style={{ left: `${-20 + i * 20}px`, top: `${-10 + i * 8}px`, fontSize: '8px', animationDelay: `${i * 0.6}s` }}>
                  ✦
                </div>
              ))}
            </div>
            <p className="text-ink-ghost text-xs font-display italic">find writers & ideas</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
