import { useEffect, useState } from 'react'
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
  users: { username: string; avatar_url?: string }
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

function Avatar({ username, avatarUrl }: { username: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className="w-8 h-8 rounded-full object-cover ring-2 ring-cafe-border/30" />
  }
  return (
    <div className="w-8 h-8 rounded-full bg-moss-light flex items-center justify-center text-xs font-semibold text-moss-deep ring-2 ring-moss-sage/30">
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
  const [userCollections, setUserCollections] = useState<{ id: string; name: string }[]>([])
  const [collecting, setCollecting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)
  const [hashtags, setHashtags] = useState<string[]>(ku.hashtags || [])
  const [likeAnim, setLikeAnim] = useState(false)

  const isOwner = user?.id === ku.user_id

  useEffect(() => {
    if (ku.hashtags && ku.hashtags.length > 0) return
    api(`/kus/${ku.id}`, {}, session?.access_token)
      .then(data => setHashtags(data.ku.hashtags || []))
      .catch(console.error)
  }, [ku.id])

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
        setLikeAnim(true)
        setTimeout(() => setLikeAnim(false), 600)
      }
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => {
    if (!session || !isOwner) return
    try {
      await api(`/kus/${ku.id}`, { method: 'DELETE' }, session.access_token)
      onDelete?.(ku.id)
    } catch (err) { console.error(err) }
    setShowMenu(false)
  }

  const handleCollect = async () => {
    if (!session) return
    if (!showCollect) {
      try {
        const data = await api('/collections/mine', {}, session.access_token)
        setUserCollections(data.collections)
      } catch (err) { console.error(err) }
    }
    setShowCollect(s => !s)
  }

  const addToCollection = async (collectionId: string) => {
    if (!session) return
    setCollecting(true)
    try {
      await api(`/collections/${collectionId}/kus/${ku.id}`, { method: 'POST' }, session.access_token)
      setShowCollect(false)
    } catch (err) { console.error(err) }
    finally { setCollecting(false) }
  }

  const handleReport = async () => {
    if (!session || !reportReason.trim()) return
    setReporting(true)
    try {
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify({ reported_ku_id: ku.id, reason: reportReason })
      }, session.access_token)
      setShowReport(false)
      setReportReason('')
    } catch (err) { console.error(err) }
    finally { setReporting(false) }
  }

  return (
    <div className="cozy-card p-4 paper-texture animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        {ku.users && (
          <Link to={`/profile/${ku.users.username}`}><Avatar username={ku.users.username} avatarUrl={ku.users.avatar_url} /></Link>
        )}
        {ku.users && (
          <Link to={`/profile/${ku.users.username}`} className="text-xs font-semibold text-ink-secondary hover:text-ink transition-colors font-display">
            {ku.users.username}
          </Link>
        )}
        <span className="text-[10px] text-ink-ghost ml-auto font-mono">{timeAgo(ku.created_at)}</span>
        {(isOwner || session) && (
          <div className="relative">
            <button onClick={() => setShowMenu(s => !s)} className="text-ink-ghost hover:text-ink-muted text-xs px-1 transition-colors">···</button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-cafe-card border border-cafe-border rounded-xl shadow-warm-lg z-10 overflow-hidden animate-scale-in min-w-[100px]">
                {isOwner ? (
                  <button onClick={handleDelete} className="block px-4 py-2.5 text-xs text-red-400 hover:bg-cafe-muted w-full text-left transition-colors">delete</button>
                ) : (
                  <button onClick={() => { setShowMenu(false); setShowReport(true) }} className="block px-4 py-2.5 text-xs text-ink hover:bg-cafe-muted w-full text-left transition-colors">report</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Poem */}
      <div className="py-4 mb-3 relative">
        <div className="vine-divider mb-4" />
        <div className="px-2 space-y-0.5">
          <p className="text-[15px] text-ink leading-[1.9] font-body animate-word-appear" style={{ animationDelay: '0.1s' }}>{ku.line1}</p>
          <p className="text-[15px] text-ink leading-[1.9] font-body pl-3 animate-word-appear" style={{ animationDelay: '0.2s' }}>{ku.line2}</p>
          <p className="text-[15px] text-ink leading-[1.9] font-body animate-word-appear" style={{ animationDelay: '0.3s' }}>{ku.line3}</p>
        </div>
        <div className="vine-divider mt-4" />
      </div>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hashtags.map(tag => (
            <Link key={tag} to={`/hashtag/${tag}`} className="nature-tag">#{tag}</Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs transition-all duration-300 group ${liked ? 'text-amber-warm' : 'text-ink-ghost hover:text-ink-muted'}`}
        >
          <span className={`text-sm transition-all duration-300 ${likeAnim ? 'animate-like-burst scale-125' : 'scale-100'} group-hover:scale-110`}>
            {liked ? '♥' : '♡'}
          </span>
          {likeCount > 0 && <span className={`font-mono text-[11px] transition-all duration-300 ${likeAnim ? 'animate-counter-pulse' : ''}`}>{likeCount}</span>}
        </button>
        <Link to={`/ku/${ku.id}`} className="flex items-center gap-1.5 text-xs text-ink-ghost hover:text-ink-muted transition-all duration-300 group">
          <span className="text-sm group-hover:animate-wiggle">◎</span> <span className="group-hover:tracking-wide transition-all duration-300">comment</span>
        </Link>
        <div className="relative ml-auto">
          <button onClick={handleCollect} className="text-xs text-ink-ghost hover:text-ink-muted transition-all duration-300 hover:tracking-wide">⊕ collect</button>
          {showCollect && (
            <div className="absolute bottom-7 right-0 bg-cafe-card border border-cafe-border rounded-xl shadow-warm-lg z-10 min-w-44 overflow-hidden animate-scale-in">
              {userCollections.length === 0 && <p className="text-xs text-ink-ghost px-3 py-2.5 italic">no collections yet</p>}
              {userCollections.map(col => (
                <button key={col.id} onClick={() => addToCollection(col.id)} disabled={collecting}
                  className="block w-full text-left px-3 py-2.5 text-xs text-ink hover:bg-cafe-muted transition-colors">{col.name}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowShare(true)} className="text-xs text-ink-ghost hover:text-ink-muted transition-colors">↗ share</button>
      </div>

      {/* Sketch */}
      {ku.sketch_url && (
        <div className="mt-3 pt-3">
          <div className="vine-divider mb-3" />
          <img src={ku.sketch_url} alt="sketch" className="w-full rounded-xl" />
        </div>
      )}

      {/* Report */}
      {showReport && (
        <div className="mt-3 pt-3 flex flex-col gap-2 animate-slide-up">
          <div className="vine-divider mb-1" />
          <p className="text-xs font-display text-ink-secondary italic">report this ku</p>
          <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} rows={2}
            placeholder="reason for reporting..."
            className="cozy-input text-xs resize-none" />
          <div className="flex gap-2">
            <button onClick={handleReport} disabled={reporting || !reportReason.trim()}
              className="flex-1 btn-warm text-xs py-1.5">{reporting ? 'reporting...' : 'submit report'}</button>
            <button onClick={() => setShowReport(false)} className="text-xs text-ink-muted px-3 hover:text-ink transition-colors">cancel</button>
          </div>
        </div>
      )}

      {showShare && <ShareCard ku={ku} onClose={() => setShowShare(false)} />}
    </div>
  )
}
