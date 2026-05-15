import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user } = useAuth()
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setUsername(data.username)
      })
  }, [user])

  const navItems = [
    { path: '/home', icon: '⌂', label: 'home' },
    { path: '/explore', icon: '◎', label: 'explore' },
    { path: '/daily', icon: '☀', label: 'daily' },
    { path: '/collections', icon: '⊞', label: 'collections' },
    { path: `/profile/${username}`, icon: '◯', label: 'profile' },
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
        </div>
      </nav>
    </div>
  )
}