import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { username } = useAuth()

  const handleProfileClick = () => {
    const name = username || localStorage.getItem('ku_username')
    if (name && name !== 'null') {
      navigate(`/profile/${name}`)
    }
  }

  const navItems = [
    { path: '/home', icon: '⌂', label: 'home' },
    { path: '/explore', icon: '◎', label: 'explore' },
    { path: '/daily', icon: '☀', label: 'daily' },
    { path: '/search', icon: '⌕', label: 'search' },
  ]

  return (
    <div className="min-h-screen bg-paper-bg flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-paper-nav border-t border-paper-border">
        <div className="max-w-lg mx-auto flex justify-around items-center py-2 pb-4">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                  isActive ? 'text-amber-warm' : 'text-ink-faint'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={handleProfileClick}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              location.pathname.startsWith('/profile') ? 'text-amber-warm' : 'text-ink-faint'
            }`}
          >
            <span className="text-xl">◯</span>
            <span className="text-xs">profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}