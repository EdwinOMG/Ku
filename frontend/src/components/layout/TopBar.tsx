import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

interface TopBarProps {
  title?: string
  showBack?: boolean
  right?: React.ReactNode
}

export default function TopBar({ title = 'ku', showBack = false, right }: TopBarProps) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { unreadCount } = useNotifications()

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
            className="relative text-ink-muted hover:text-ink transition-all duration-200 group"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:scale-110">
              <path
                d="M12 3C10.5 3 9.2 3.7 8.3 4.8C6.5 5.4 5.2 7.1 5.2 9.1V13.5L3.7 16.2C3.4 16.7 3.8 17.3 4.4 17.3H19.6C20.2 17.3 20.6 16.7 20.3 16.2L18.8 13.5V9.1C18.8 7.1 17.5 5.4 15.7 4.8C14.8 3.7 13.5 3 12 3Z"
                fill="currentColor"
                opacity="0.15"
              />
              <path
                d="M12 3C10.5 3 9.2 3.7 8.3 4.8C6.5 5.4 5.2 7.1 5.2 9.1V13.5L3.7 16.2C3.4 16.7 3.8 17.3 4.4 17.3H19.6C20.2 17.3 20.6 16.7 20.3 16.2L18.8 13.5V9.1C18.8 7.1 17.5 5.4 15.7 4.8C14.8 3.7 13.5 3 12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9.5 17.3C9.5 18.7 10.6 19.8 12 19.8C13.4 19.8 14.5 18.7 14.5 17.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16.5 4.5C17.2 3.8 18.5 3.5 19 4C19.5 4.5 19.2 5.8 18.5 6.5C17.8 7.2 16.5 6.2 16.5 4.5Z" fill="currentColor" opacity="0.4" />
            </svg>
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-amber-warm rounded-full text-cafe-latte text-[10px] flex items-center justify-center leading-none animate-grow-in font-mono px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-amber-warm/40 rounded-full animate-ping-slow" />
              </>
            )}
          </button>
        )}
        {right && <div>{right}</div>}
      </div>
    </div>
  )
}
