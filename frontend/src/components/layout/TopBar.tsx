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
    <div className="sticky top-0 z-20 glass border-b border-cafe-border/50 px-4 py-3 flex items-center justify-between animate-fade-in-down">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="text-ink-muted text-sm hover:text-ink transition-colors duration-200 flex items-center gap-1.5 group"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span>
            back
          </button>
        )}
        <span className="text-lg font-display font-semibold text-ink tracking-wide">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {session && (
          <button
            onClick={() => navigate('/notifications')}
            className="relative text-ink-muted text-lg hover:text-ink transition-all duration-200 hover:scale-110"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4.5 h-4.5 bg-moss-deep rounded-full text-cafe-latte text-[10px] flex items-center justify-center leading-none animate-grow-in font-mono">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4.5 h-4.5 bg-moss-deep/50 rounded-full animate-ping-slow" />
            )}
          </button>
        )}
        {right && <div>{right}</div>}
      </div>
    </div>
  )
}
