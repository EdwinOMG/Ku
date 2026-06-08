import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { path: '/home', icon: '⌂', label: 'home' },
  { path: '/explore', icon: '◎', label: 'explore' },
  { path: '/daily', icon: '☀', label: 'daily' },
  { path: '/search', icon: '⌕', label: 'search' },
]

const LEAF_POOL = ['🍃', '🌿', '🍂', '🍃', '🌿', '🍂', '🍃', '🌿']

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { username } = useAuth()
  const handleProfileClick = () => {
    const name = username || localStorage.getItem('ku_username')
    if (name && name !== 'null') navigate(`/profile/${name}`)
  }

  return (
    <div className="min-h-screen bg-cafe-bg flex flex-col max-w-lg mx-auto relative overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
      </div>

      {/* Ambient leaves — more of them, varied timing */}
      {LEAF_POOL.map((emoji, i) => (
        <div
          key={i}
          className="leaf"
          style={{
            left: `${8 + i * 12}%`,
            ['--delay' as string]: `${i * 3.5}s`,
            ['--duration' as string]: `${11 + (i % 4) * 4}s`,
            ['--sway' as string]: `${15 + (i % 3) * 10}px`,
            fontSize: `${12 + (i % 3) * 4}px`,
          }}
        >
          {emoji}
        </div>
      ))}

      {/* Firefly particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`firefly-${i}`}
          className="firefly"
          style={{
            left: `${10 + i * 15}%`,
            top: `${20 + (i * 37) % 60}%`,
            ['--fly-delay' as string]: `${i * 2.2}s`,
            ['--fly-duration' as string]: `${6 + (i % 3) * 3}s`,
          }}
        />
      ))}

      <main className="flex-1 pb-20 relative z-10">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-cafe-border/50 z-30">
        <div className="max-w-lg mx-auto flex justify-around items-center py-2 pb-4">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  nav-item flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl
                  transition-all duration-300 relative
                  ${isActive
                    ? 'text-amber-warm nav-active'
                    : 'text-ink-faint hover:text-ink-muted'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-amber-light/40 rounded-xl animate-scale-in" />
                )}
                <span className={`text-xl relative z-10 transition-transform duration-500 ${isActive ? 'animate-bounce-subtle' : 'hover:animate-wiggle'}`}>{item.icon}</span>
                <span className={`text-[10px] font-display relative z-10 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={handleProfileClick}
            className={`
              nav-item flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl
              transition-all duration-300 relative
              ${location.pathname.startsWith('/profile')
                ? 'text-amber-warm nav-active'
                : 'text-ink-faint hover:text-ink-muted'
              }
            `}
          >
            {location.pathname.startsWith('/profile') && (
              <div className="absolute inset-0 bg-amber-light/40 rounded-xl animate-scale-in" />
            )}
            <span className={`text-xl relative z-10 transition-transform duration-500 ${location.pathname.startsWith('/profile') ? 'animate-bounce-subtle' : 'hover:animate-wiggle'}`}>◯</span>
            <span className="text-[10px] font-display relative z-10">profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
