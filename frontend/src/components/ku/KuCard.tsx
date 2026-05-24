import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import ShareCard from './ShareCard'


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

interface KuCardProps {
  ku: Ku
  onDelete?: (id: string) => void
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function Avatar({ username, avatarUrl }: { username: string, avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className="w-7 h-7 rounded-full object-cover" />
  }
  return (
    <div className="w-7 h-7 rounded-full bg-paper-muted flex items-center justify-center text-xs font-medium text-ink-secondary">
      {username[0].toUpperCase()}
    </div>
  )
}

export default function KuCard({ ku, onDelete }: KuCardProps) {
  const { user, session } = useAuth()
  const [liked, setLiked] = useState(ku.isLiked || false)
  const [likeCount, setLikeCount] = useState(ku.likeCount || 0)
  const [showMenu, setShowMenu] = useState(false)
  const [showCollect, setShowCollect] = useState(false)
  const [userCollections, setUserCollections] = useState<{ id: string, name: string }[]>([])
  const [collecting, setCollecting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const isOwner = user?.id === ku.user_id

  const handleLike = async () => {
    if (!session) return
    try {
      if (liked) {
        await api(`/likes/${ku.id}`, { method: 'DELETE' }, session.access_token)
        setLiked(false)
        setLikeCount(c => c - 1)
      } else {
        await api(`/likes/${ku.id}`, { method: 'POST' }, session.access_token)
        setLiked(true)
        setLikeCount(c => c + 1)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!session || !isOwner) return
    try {
      await api(`/kus/${ku.id}`, { method: 'DELETE' }, session.access_token)
      onDelete?.(ku.id)
    } catch (err) {
      console.error(err)
    }
    setShowMenu(false)
  }

  const handleCollect = async () => {
    if (!session) return
    if (!showCollect) {
      try {
        const data = await api('/collections/mine', {}, session.access_token)
        setUserCollections(data.collections)
      } catch (err) {
        console.error(err)
      }
    }
    setShowCollect(s => !s)
  }

  const addToCollection = async (collectionId: string) => {
    if (!session) return
    setCollecting(true)
    try {
      await api(`/collections/${collectionId}/kus/${ku.id}`, {
        method: 'POST'
      }, session.access_token)
      setShowCollect(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCollecting(false)
    }
  }

  return (
    <div className="bg-paper-card border border-paper-border rounded-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {ku.users && (
          <Link to={`/profile/${ku.users.username}`}>
            <Avatar username={ku.users.username} avatarUrl={ku.users.avatar_url} />
          </Link>
        )}
        {ku.users && (
          <Link to={`/profile/${ku.users.username}`} className="text-xs font-medium text-ink-secondary hover:text-ink">
            {ku.users.username}
          </Link>
        )}
        <span className="text-xs text-ink-faint ml-auto">{timeAgo(ku.created_at)}</span>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(s => !s)}
              className="text-ink-faint text-xs px-1"
            >
              ···
            </button>
            {showMenu && (
              <div className="absolute right-0 top-5 bg-paper-card border border-paper-border rounded-lg shadow-sm z-10 overflow-hidden">
                <button
                  onClick={handleDelete}
                  className="block px-4 py-2 text-xs text-red-500 hover:bg-paper-muted w-full text-left"
                >
                  delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-b border-paper-muted py-3 mb-3">
        <p className="text-sm text-ink leading-relaxed">{ku.line1}</p>
        <p className="text-sm text-ink leading-relaxed">{ku.line2}</p>
        <p className="text-sm text-ink leading-relaxed">{ku.line3}</p>
      </div>

      {ku.hashtags && ku.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ku.hashtags.map(tag => (
            <Link
              key={tag}
              to={`/hashtag/${tag}`}
              className="text-xs text-amber-mid bg-amber-light px-2 py-0.5 rounded-full"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-xs ${liked ? 'text-amber-warm' : 'text-ink-faint'}`}
        >
          {liked ? '♥' : '♡'} {likeCount > 0 && likeCount}
        </button>
        <Link
          to={`/ku/${ku.id}`}
          className="flex items-center gap-1 text-xs text-ink-faint"
        >
          ◎ comment
        </Link>
        <div className="relative ml-auto">
          <button
            onClick={handleCollect}
            className="text-xs text-ink-faint"
          >
            ⊕ collect
          </button>
          {showCollect && (
            <div className="absolute bottom-6 right-0 bg-paper-card border border-paper-border rounded-lg z-10 min-w-40 overflow-hidden">
              {userCollections.length === 0 && (
                <p className="text-xs text-ink-faint px-3 py-2">no collections yet</p>
              )}
              {userCollections.map(col => (
                <button
                  key={col.id}
                  onClick={() => addToCollection(col.id)}
                  disabled={collecting}
                  className="block w-full text-left px-3 py-2 text-xs text-ink hover:bg-paper-muted"
                >
                  {col.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="text-xs text-ink-faint">
          ↗ share
        </button>
      </div>

      {ku.sketch_url && (
        <div className="mt-3 border-t border-paper-muted pt-3">
          <img src={ku.sketch_url} alt="sketch" className="w-full rounded-lg" />
        </div>
      )}


      <button
        onClick={() => setShowShare(true)}
        className="text-xs text-ink-faint"
      >
        ↗ share
      </button>

      {showShare && (
        <ShareCard ku={ku} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}