import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'

interface Profile { id: string; username: string; bio?: string; avatar_url?: string; role: string; followerCount: number; followingCount: number; isOwner: boolean; isFriend: boolean; isFollowing: boolean }
interface Ku { id: string; user_id: string; line1: string; line2: string; line3: string; visibility: string; sketch_url?: string; created_at: string; users: { username: string; avatar_url?: string }; likeCount?: number; hashtags?: string[]; isLiked?: boolean; commentCount?: number }
interface OpenWrite { id: string; content: string; visibility: string; created_at: string }
interface Collection { id: string; name: string; visibility: string; created_at: string }
interface FollowUser { id: string; username: string; avatar_url?: string }
type Tab = 'kus' | 'writes' | 'collections'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { session} = useAuth()
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

  // Follower/following list state
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followerList, setFollowerList] = useState<FollowUser[]>([])
  const [followingList, setFollowingList] = useState<FollowUser[]>([])
  const [loadingList, setLoadingList] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await api(`/users/${username}`, {}, session?.access_token)
        setProfile(data.profile)
        setKus(data.kus || [])
        setOpenWrites(data.openWrites || [])
        setCollections(data.collections || [])
        setFollowing(data.profile.isFollowing || false)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    if (username) fetchProfile()
  }, [username, session])

  const handleFollow = async () => {
    if (!session || !profile) return
    try {
      if (following) {
        await api(`/follows/${profile.username}`, { method: 'DELETE' }, session.access_token)
        setFollowing(false)
        setProfile(p => p ? { ...p, followerCount: p.followerCount - 1 } : p)
      } else {
        await api(`/follows/${profile.username}`, { method: 'POST' }, session.access_token)
        setFollowing(true)
        setProfile(p => p ? { ...p, followerCount: p.followerCount + 1 } : p)
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

  const openFollowerList = async () => {
    if (!profile) return
    setShowFollowers(true)
    setLoadingList(true)
    try {
      const data = await api(`/follows/${profile.username}/followers`, {}, session?.access_token)
      setFollowerList(data.followers)
    } catch (err) { console.error(err) }
    finally { setLoadingList(false) }
  }

  const openFollowingList = async () => {
    if (!profile) return
    setShowFollowing(true)
    setLoadingList(true)
    try {
      const data = await api(`/follows/${profile.username}/following`, {}, session?.access_token)
      setFollowingList(data.following)
    } catch (err) { console.error(err) }
    finally { setLoadingList(false) }
  }

  const handleRemoveFollower = async (targetUsername: string) => {
    if (!session) return
    try {
      await api(`/follows/${targetUsername}/remove`, { method: 'DELETE' }, session.access_token)
      setFollowerList(prev => prev.filter(u => u.username !== targetUsername))
      setProfile(p => p ? { ...p, followerCount: p.followerCount - 1 } : p)
    } catch (err) { console.error(err) }
  }

  const handleUnfollowFromList = async (targetUsername: string) => {
    if (!session) return
    try {
      await api(`/follows/${targetUsername}`, { method: 'DELETE' }, session.access_token)
      setFollowingList(prev => prev.filter(u => u.username !== targetUsername))
      if (profile?.isOwner) {
        setProfile(p => p ? { ...p, followingCount: p.followingCount - 1 } : p)
      }
    } catch (err) { console.error(err) }
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
                {following ? 'unfollow' : 'follow'}
              </button>
            )}
          </div>

          <div className="flex gap-6 items-center">
            <button onClick={openFollowerList} className="text-center group">
              <p className="text-sm font-semibold text-ink font-display group-hover:text-amber-warm transition-colors">{profile.followerCount}</p>
              <p className="text-[10px] text-ink-ghost font-mono group-hover:text-ink-muted transition-colors">followers</p>
            </button>
            <button onClick={openFollowingList} className="text-center group">
              <p className="text-sm font-semibold text-ink font-display group-hover:text-amber-warm transition-colors">{profile.followingCount}</p>
              <p className="text-[10px] text-ink-ghost font-mono group-hover:text-ink-muted transition-colors">following</p>
            </button>
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

      {/* Followers modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowFollowers(false)}>
          <div className="bg-cafe-card w-full max-w-md max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-cafe-border">
              <p className="text-sm font-display font-semibold text-ink">followers</p>
              <button onClick={() => setShowFollowers(false)} className="text-ink-ghost hover:text-ink text-sm">✕</button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3">
              {loadingList ? (
                <p className="text-center text-ink-ghost text-xs py-8 italic font-display">loading...</p>
              ) : followerList.length === 0 ? (
                <p className="text-center text-ink-ghost text-xs py-8 italic font-display">no followers yet</p>
              ) : (
                followerList.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-2 py-2.5">
                    <Link to={`/profile/${u.username}`} onClick={() => setShowFollowers(false)} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-moss-light flex items-center justify-center text-xs font-semibold text-moss-deep overflow-hidden ring-1 ring-moss-sage/30 flex-shrink-0">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                          : u.username[0].toUpperCase()
                        }
                      </div>
                      <span className="text-sm text-ink font-display truncate">{u.username}</span>
                    </Link>
                    {profile.isOwner && (
                      <button onClick={() => handleRemoveFollower(u.username)}
                        className="text-[11px] text-ink-muted border border-cafe-border rounded-lg px-3 py-1.5 hover:text-clay-rust hover:border-clay-rust/30 transition-colors flex-shrink-0">
                        remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setShowFollowing(false)}>
          <div className="bg-cafe-card w-full max-w-md max-h-[70vh] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-cafe-border">
              <p className="text-sm font-display font-semibold text-ink">following</p>
              <button onClick={() => setShowFollowing(false)} className="text-ink-ghost hover:text-ink text-sm">✕</button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3">
              {loadingList ? (
                <p className="text-center text-ink-ghost text-xs py-8 italic font-display">loading...</p>
              ) : followingList.length === 0 ? (
                <p className="text-center text-ink-ghost text-xs py-8 italic font-display">not following anyone yet</p>
              ) : (
                followingList.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-2 py-2.5">
                    <Link to={`/profile/${u.username}`} onClick={() => setShowFollowing(false)} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-moss-light flex items-center justify-center text-xs font-semibold text-moss-deep overflow-hidden ring-1 ring-moss-sage/30 flex-shrink-0">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                          : u.username[0].toUpperCase()
                        }
                      </div>
                      <span className="text-sm text-ink font-display truncate">{u.username}</span>
                    </Link>
                    {profile.isOwner && (
                      <button onClick={() => handleUnfollowFromList(u.username)}
                        className="text-[11px] text-ink-muted border border-cafe-border rounded-lg px-3 py-1.5 hover:text-clay-rust hover:border-clay-rust/30 transition-colors flex-shrink-0">
                        unfollow
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
