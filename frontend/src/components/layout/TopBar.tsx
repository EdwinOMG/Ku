import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

interface TopBarProps {
  title?: string
  showBack?: boolean
  right?: React.ReactNode
}

export default function TopBar({ title = 'ku', showBack = false, right }: TopBarProps) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session) return
    const fetchUnread = async () => {
      try {
        const data = await api('/notifications', {}, session.access_token)
        setUnreadCount(data.notifications.filter((n: any) => !n.read).length)
      } catch (err) {
        console.error(err)
      }
    }
    fetchUnread()
  }, [session])

  return (
    <div className="sticky top-0 z-10 bg-paper-nav border-b border-paper-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="text-ink-muted text-sm">
            ← back
          </button>
        )}
        <span className="text-lg font-medium text-ink">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {session && (
          <button
            onClick={() => navigate('/notifications')}
            className="relative text-ink-muted text-lg"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-warm rounded-full text-paper-card text-xs flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
        {right && <div>{right}</div>}
      </div>
    </div>
  )
}