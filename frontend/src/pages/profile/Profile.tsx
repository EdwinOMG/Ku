import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'

interface Profile { id: string; username: string; bio?: string; avatar_url?: string; role: string; followerCount: number; followingCount: number; isOwner: boolean; isFriend: boolean }
interface Ku { id: string; user_id: string; line1: string; line2: string; line3: string; visibility: string; sketch_url?: string; created_at: string; users: { username: string; avatar_url?: string }; likeCount?: number; hashtags?: string[]; isLiked?: boolean }
interface OpenWrite { id: string; content: string; visibility: string; created_at: string }
interface Collection { id: string; name: string; visibility: string; created_at: string }
type Tab = 'kus' | 'writes' | 'collections'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [kus, setKus] = useState<Ku[]>([])
  const [openWrites, setOpenWrites] = useState<OpenWrite[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [tab, setTab] = useState<Tab>('kus')
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionVisibility, setNewCollectionVisibility] = useState('private')
  const [creatingCollection, setCreatingCollection] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await api(`/users/${username}`, {}, session?.access_token)
        setProfile(data.profile); setKus(data.kus || []); setOpenWrites(data.openWrites || []); setCollections(data.collections || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    if (username) fetchProfile()
  }, [username, session])

  const handleFollow = async () => {
    if (!session) return
    try {
      if (following) {
        await api(`/follows/${username}`, { method: 'DELETE' }, session.access_token)
        setFollowing(false); setProfile(p => p ? { ...p, followerCount: p.followerCount - 1 } : p)
      } else {
        await api(`/follows/${username}`, { method: 'POST' }, session.access_token)
        setFollowing(true); setProfile(p => p ? { ...p, followerCount: p.followerCount + 1 } : p)
      }
    } catch (err) { console.error(err) }
  }

  const handleDeleteKu = (id: string) => setKus(prev => prev.filter(k => k.id !== id))

  const handleCreateCollection = async () => {
    if (!session || !newCollectionName.trim()) return
    setCreatingCollection(true)
    try {
      const data = await api('/collections', { method: 'POST', body: JSON.stringify({ name: newCollectionName, visibility: newCollectionVisibility }) }, session.access_token)
      setCollections(prev => [data.collection, ...prev]); setNewCollectionName(''); setNewCollectionVisibility('private'); setShowCreateCollection(false)
    } catch (err) { console.error(err) }
    finally { setCreatingCollection(false) }
  }

  if (loading) return <Layout><div className="text-center py-12 animate-fade-in"><div className="text-2xl mb-2 animate-float">🌿</div><p className="text-ink-muted text-sm font-display italic">loading...</p></div></Layout>
  if (!profile) return <Layout><div className="text-center py-12"><p className="text-ink-muted text-sm font-display">user not found</p></div></Layout>

  const tabs: Tab[] = ['kus', 'writes', 'collections']

  return (
    <Layout>
      <TopBar title={profile.username} showBack
        right={profile.isOwner ? <button onClick={() => navigate('/settings')} className="text-xs text-ink-muted hover:text-ink transition-colors font-display">settings</button> : null}
      />

      {/* Profile header */}
      <div className="bg-cafe-card border-b border-cafe-border px-5 py-6 animate-fade-in relative overflow-hidden">
        <div className="absolute inset-0 bg-cafe-glow opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-moss-light flex items-center justify-center text-xl font-display font-bold text-moss-deep overflow-hidden ring-2 ring-moss-sage/30 shadow-warm">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                : profile.username[0].toUpperCase()
              }
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-ink text-lg">{profile.username}</p>
              {profile.bio && <p className="text-xs text-ink-muted mt-0.5 italic leading-relaxed">{profile.bio}</p>}
            </div>
            {!profile.isOwner && session && (
              <button onClick={handleFollow}
                className={`text-xs px-5 py-2 rounded-xl font-medium transition-all duration-300 ${
                  following ? 'bg-cafe-muted text-ink-muted border border-cafe-border' : 'btn-moss'
                }`}>
                {following ? 'following' : 'follow'}
              </button>
            )}
          </div>

          <div className="flex gap-6 items-center">
            <div className="text-center">
              <p className="text-sm font-semibold text-ink font-display">{profile.followerCount}</p>
              <p className="text-[10px] text-ink-ghost font-mono">followers</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-ink font-display">{kus.length}</p>
              <p className="text-[10px] text-ink-ghost font-mono">kus</p>
            </div>
            {profile.isFriend && (
              <span className="nature-tag text-[10px] ml-auto">🌿 friends</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      <div className="p-3 flex flex-col gap-3 stagger">
        {tab === 'kus' && (
          kus.length === 0
            ? <p className="text-center text-ink-muted text-sm py-10 font-display italic">no kus yet</p>
            : kus.map(ku => <KuCard key={ku.id} ku={ku} onDelete={handleDeleteKu} />)
        )}

        {tab === 'writes' && (
          <>
            {profile.isOwner && (
              <button onClick={() => navigate('/write')}
                className="cozy-card p-4 text-xs text-moss-deep text-left hover:text-moss-dark transition-colors font-display">
                + new open write
              </button>
            )}
            {openWrites.length === 0 && <p className="text-center text-ink-muted text-sm py-10 font-display italic">no open writes yet</p>}
            {openWrites.map(write => (
              <div key={write.id} className="cozy-card p-4 cursor-pointer" onClick={() => navigate(`/write/${write.id}`)}>
                <p className="text-sm text-ink leading-relaxed line-clamp-3 font-body">{write.content}</p>
                <p className="text-[10px] text-ink-ghost mt-2 font-mono">{write.visibility}</p>
              </div>
            ))}
          </>
        )}

        {tab === 'collections' && (
          <>
            {profile.isOwner && (
              <div className="cozy-card p-4">
                {showCreateCollection ? (
                  <div className="flex flex-col gap-3 animate-slide-up">
                    <input type="text" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)}
                      placeholder="collection name..." className="cozy-input" />
                    <select value={newCollectionVisibility} onChange={e => setNewCollectionVisibility(e.target.value)} className="cozy-input">
                      <option value="private">private</option>
                      <option value="friends">friends only</option>
                      <option value="public">public</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleCreateCollection} disabled={creatingCollection || !newCollectionName.trim()}
                        className="flex-1 btn-warm text-xs py-2">{creatingCollection ? 'creating...' : 'create'}</button>
                      <button onClick={() => setShowCreateCollection(false)} className="text-xs text-ink-muted px-3">cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowCreateCollection(true)} className="text-xs text-moss-deep w-full text-left font-display hover:text-moss-dark transition-colors">+ new collection</button>
                )}
              </div>
            )}
            {collections.length === 0 && <p className="text-center text-ink-muted text-sm py-10 font-display italic">no collections yet</p>}
            {collections.map(col => (
              <button key={col.id} onClick={() => navigate(`/collections/${col.id}`)} className="cozy-card p-4 text-left w-full group">
                <p className="text-sm font-display font-medium text-ink group-hover:text-amber-warm transition-colors">{col.name}</p>
                <p className="text-[10px] text-ink-ghost font-mono mt-1">{col.visibility}</p>
              </button>
            ))}
          </>
        )}
      </div>
    </Layout>
  )
}
