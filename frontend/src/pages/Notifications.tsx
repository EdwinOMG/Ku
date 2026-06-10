import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'daily_prompt' | 'comment_like' | 'reply'
  read: boolean
  created_at: string
  actor: { id: string; username: string; avatar_url?: string }
  ku?: { line1: string; line2: string; line3: string }
  ku_id?: string
  isFollowingBack?: boolean
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

const ICONS = { like: '♥', comment: '◎', follow: '🌿', daily_prompt: '✦', comment_like: '♥', reply: '↩' }
const LABELS = { like: 'liked your ku', comment: 'commented on your ku', follow: 'followed you', daily_prompt: 'posted a new daily prompt', comment_like: 'liked your comment', reply: 'replied to your comment' }

export default function Notifications() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [followingBack, setFollowingBack] = useState<Set<string>>(new Set())
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!session) return
    const fetchNotifications = async () => {
      try {
        const data = await api('/notifications', {}, session.access_token)
        setNotifications(data.notifications)
        // Initialize follow-back state from API
        const alreadyFollowing = new Set<string>()
        data.notifications.forEach((n: Notification) => {
          if (n.type === 'follow' && n.isFollowingBack) {
            alreadyFollowing.add(n.actor.username)
          }
        })
        setFollowingBack(alreadyFollowing)
        await api('/notifications/read', { method: 'PUT' }, session.access_token)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchNotifications()
  }, [session])

  const handleClick = (n: Notification) => {
    if (n.type === 'follow') navigate(`/profile/${n.actor.username}`)
    else if (n.type === 'daily_prompt') navigate('/daily')
    else if (n.ku_id) navigate(`/ku/${n.ku_id}`)
  }

  const handleFollowBack = async (e: React.MouseEvent, username: string) => {
    e.stopPropagation()
    if (!session || followLoading.has(username)) return

    setFollowLoading(prev => new Set(prev).add(username))
    try {
      if (followingBack.has(username)) {
        await api(`/follows/${username}`, { method: 'DELETE' }, session.access_token)
        setFollowingBack(prev => { const next = new Set(prev); next.delete(username); return next })
      } else {
        await api(`/follows/${username}`, { method: 'POST' }, session.access_token)
        setFollowingBack(prev => new Set(prev).add(username))
      }
    } catch (err) { console.error(err) }
    finally {
      setFollowLoading(prev => { const next = new Set(prev); next.delete(username); return next })
    }
  }

  return (
    <Layout>
      <TopBar title="notifications" />
      <div className="flex flex-col">
        {loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="relative inline-block mb-3">
              <div className="text-2xl animate-sway" style={{ transformOrigin: 'top center' }}>🍃</div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-amber-glow/20 rounded-full blur-sm animate-breathe" />
            </div>
            <div className="shimmer-text">
              <p className="text-ink-muted text-sm font-display italic">checking the mailbox...</p>
            </div>
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="relative inline-block mb-4">
              <div className="text-4xl animate-sway" style={{ transformOrigin: 'bottom center', animationDuration: '6s' }}>🍂</div>
              {[0,1,2].map(i => (
                <div key={i} className="absolute animate-drift opacity-25"
                  style={{ left: `${-15 + i * 15}px`, top: `${-10 + i * 8}px`, fontSize: '6px', animationDelay: `${i * 0.7}s` }}>✦</div>
              ))}
            </div>
            <p className="text-ink-muted text-sm font-display">no notifications yet</p>
            <p className="text-ink-ghost text-xs mt-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>all quiet in the garden</p>
          </div>
        )}
        <div className="stagger">
          {notifications.map(n => (
            <button key={n.id} onClick={() => handleClick(n)}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-cafe-border/50 text-left w-full transition-all duration-200 hover:bg-cafe-warm animate-fade-in-up ${
                !n.read ? 'bg-amber-light/40' : 'bg-cafe-card'
              }`}>
              <div className="w-9 h-9 rounded-xl bg-moss-light overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold text-moss-deep ring-1 ring-moss-sage/20">
                {n.actor?.avatar_url
                  ? <img src={n.actor.avatar_url} alt={n.actor.username} className="w-full h-full object-cover" />
                  : n.actor?.username?.[0]?.toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink font-body">
                  <span className="text-amber-warm mr-1.5">{ICONS[n.type]}</span>
                  <span className="font-display font-semibold">{n.actor?.username}</span>{' '}
                  <span className="text-ink-muted">{LABELS[n.type]}</span>
                </p>
                {n.ku && (
                  <p className="text-xs text-ink-ghost mt-0.5 truncate italic font-body">
                    {n.ku.line1} / {n.ku.line2} / {n.ku.line3}
                  </p>
                )}
                <p className="text-[10px] text-ink-ghost mt-0.5 font-mono">{timeAgo(n.created_at)}</p>
              </div>

              {/* Follow back button */}
              {n.type === 'follow' && (
                <div
                  onClick={(e) => handleFollowBack(e, n.actor.username)}
                  className={`text-[11px] px-3.5 py-1.5 rounded-xl font-medium transition-all duration-300 flex-shrink-0 cursor-pointer ${
                    followingBack.has(n.actor.username)
                      ? 'bg-cafe-muted text-ink-muted border border-cafe-border'
                      : 'btn-moss'
                  }`}
                >
                  {followLoading.has(n.actor.username)
                    ? '...'
                    : followingBack.has(n.actor.username)
                      ? 'following'
                      : 'follow back'
                  }
                </div>
              )}

              {/* Unread dot */}
              {!n.read && n.type !== 'follow' && (
                <div className="relative flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-moss-deep animate-scale-in" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-moss-deep/40 animate-ping-slow" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
