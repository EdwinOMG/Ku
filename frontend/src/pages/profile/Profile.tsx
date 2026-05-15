import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'

interface Profile {
  id: string
  username: string
  bio?: string
  avatar_url?: string
  role: string
  followerCount: number
  followingCount: number
  isOwner: boolean
  isFriend: boolean
}

interface Ku {
  id: string
  user_id: string
  line1: string
  line2: string
  line3: string
  visibility: string
  sketch_url?: string
  created_at: string
  users: {
    username: string
    avatar_url?: string
  }
  likeCount?: number
  hashtags?: string[]
  isLiked?: boolean
}

interface OpenWrite {
  id: string
  content: string
  visibility: string
  created_at: string
}

interface Collection {
  id: string
  name: string
  visibility: string
  created_at: string
}

type Tab = 'kus' | 'writes' | 'collections'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { session, user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [kus, setKus] = useState<Ku[]>([])
  const [openWrites, setOpenWrites] = useState<OpenWrite[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [tab, setTab] = useState<Tab>('kus')
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const data = await api(
          `/users/${username}`,
          {},
          session?.access_token
        )
        setProfile(data.profile)
        setKus(data.kus || [])
        setOpenWrites(data.openWrites || [])
        setCollections(data.collections || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (username) fetchProfile()
  }, [username, session])

  const handleFollow = async () => {
    if (!session) return
    try {
      if (following) {
        await api(`/follows/${username}`, { method: 'DELETE' }, session.access_token)
        setFollowing(false)
        setProfile(p => p ? { ...p, followerCount: p.followerCount - 1 } : p)
      } else {
        await api(`/follows/${username}`, { method: 'POST' }, session.access_token)
        setFollowing(true)
        setProfile(p => p ? { ...p, followerCount: p.followerCount + 1 } : p)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteKu = (id: string) => {
    setKus(prev => prev.filter(k => k.id !== id))
  }

  if (loading) return (
    <Layout>
      <p className="text-center text-ink-muted text-sm py-12">loading...</p>
    </Layout>
  )

  if (!profile) return (
    <Layout>
      <p className="text-center text-ink-muted text-sm py-12">user not found</p>
    </Layout>
  )

  return (
    <Layout>
      <TopBar
        title={profile.username}
        showBack
        right={
          profile.isOwner ? (
            <button
              onClick={() => navigate('/settings')}
              className="text-xs text-ink-muted"
            >
              settings
            </button>
          ) : null
        }
      />

      <div className="bg-paper-card border-b border-paper-border px-4 py-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-paper-muted flex items-center justify-center text-xl font-medium text-ink-secondary overflow-hidden">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              : profile.username[0].toUpperCase()
            }
          </div>
          <div className="flex-1">
            <p className="font-medium text-ink">{profile.username}</p>
            {profile.bio && <p className="text-xs text-ink-muted mt-0.5">{profile.bio}</p>}
          </div>
          {!profile.isOwner && session && (
            <button
              onClick={handleFollow}
              className={`text-xs px-4 py-1.5 rounded-full border ${
                following
                  ? 'border-paper-border text-ink-muted'
                  : 'border-amber-warm text-amber-warm'
              }`}
            >
              {following ? 'following' : 'follow'}
            </button>
          )}
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-ink">{profile.followerCount}</p>
            <p className="text-xs text-ink-muted">followers</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-ink">{kus.length}</p>
            <p className="text-xs text-ink-muted">kus</p>
          </div>
          {profile.isFriend && (
            <div className="text-center">
              <p className="text-xs text-amber-warm bg-amber-light px-2 py-0.5 rounded-full">friends</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-paper-border bg-paper-nav">
        {(['kus', 'writes', 'collections'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium ${
              tab === t
                ? 'text-amber-warm border-b border-amber-warm'
                : 'text-ink-faint'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-3 flex flex-col gap-3">
        {tab === 'kus' && (
          kus.length === 0
            ? <p className="text-center text-ink-muted text-sm py-8">no kus yet</p>
            : kus.map(ku => (
                <KuCard key={ku.id} ku={ku} onDelete={handleDeleteKu} />
              ))
        )}

        {tab === 'writes' && (
          openWrites.length === 0
            ? <p className="text-center text-ink-muted text-sm py-8">no open writes yet</p>
            : openWrites.map(write => (
                <div key={write.id} className="bg-paper-card border border-paper-border rounded-card p-4">
                  <p className="text-sm text-ink leading-relaxed">{write.content}</p>
                  <p className="text-xs text-ink-faint mt-2">{write.visibility}</p>
                </div>
              ))
        )}

        {tab === 'collections' && (
          collections.length === 0
            ? <p className="text-center text-ink-muted text-sm py-8">no collections yet</p>
            : collections.map(col => (
                <div key={col.id} className="bg-paper-card border border-paper-border rounded-card p-4">
                  <p className="text-sm font-medium text-ink">{col.name}</p>
                  <p className="text-xs text-ink-faint mt-1">{col.visibility}</p>
                </div>
              ))
        )}
      </div>
    </Layout>
  )
}