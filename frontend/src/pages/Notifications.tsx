import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow'
  read: boolean
  created_at: string
  actor: {
    username: string
    avatar_url?: string
  }
  ku?: {
    line1: string
    line2: string
    line3: string
  }
  ku_id?: string
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function NotificationMessage({ n }: { n: Notification }) {
  if (n.type === 'like') return (
    <p className="text-sm text-ink">
      <span className="font-medium">{n.actor.username}</span> liked your ku
    </p>
  )
  if (n.type === 'comment') return (
    <p className="text-sm text-ink">
      <span className="font-medium">{n.actor.username}</span> commented on your ku
    </p>
  )
  if (n.type === 'follow') return (
    <p className="text-sm text-ink">
      <span className="font-medium">{n.actor.username}</span> followed you
    </p>
  )
  return null
}

export default function Notifications() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session) return
      try {
        const data = await api('/notifications', {}, session.access_token)
        setNotifications(data.notifications)

        // mark all as read
        await api('/notifications/read', { method: 'PUT' }, session.access_token)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [session])

  const handleClick = (n: Notification) => {
    if (n.type === 'follow') {
      navigate(`/profile/${n.actor.username}`)
    } else if (n.ku_id) {
      navigate(`/ku/${n.ku_id}`)
    }
  }

  return (
    <Layout>
      <TopBar title="notifications" />

      <div className="flex flex-col">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm">no notifications yet</p>
          </div>
        )}

        {notifications.map(n => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`flex items-start gap-3 px-4 py-3 border-b border-paper-border text-left w-full ${
              !n.read ? 'bg-amber-light' : 'bg-paper-card'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-paper-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-medium text-ink-secondary">
              {n.actor.avatar_url
                ? <img src={n.actor.avatar_url} alt={n.actor.username} className="w-full h-full object-cover" />
                : n.actor.username[0].toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <NotificationMessage n={n} />
              {n.ku && (
                <p className="text-xs text-ink-faint mt-0.5 truncate">
                  {n.ku.line1} / {n.ku.line2} / {n.ku.line3}
                </p>
              )}
              <p className="text-xs text-ink-faint mt-0.5">{timeAgo(n.created_at)}</p>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-amber-warm flex-shrink-0 mt-1.5" />
            )}
          </button>
        ))}
      </div>
    </Layout>
  )
}