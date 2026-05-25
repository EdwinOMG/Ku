import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  username: string
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  username: '',
  loading: true,
  logout: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [username, setUsername] = useState(() => localStorage.getItem('ku_username') || '')
  const [loading, setLoading] = useState(true)

  const fetchAndStoreUsername = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single()
    if (data?.username) {
      setUsername(data.username)
      localStorage.setItem('ku_username', data.username)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', session.user.id)
          .single()

        if (!profile) {
          await supabase.auth.signOut()
          localStorage.removeItem('ku_username')
          setUser(null)
          setSession(null)
          setLoading(false)
          return
        }

        setUsername(profile.username)
        localStorage.setItem('ku_username', profile.username)
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchAndStoreUsername(session.user.id)
      } else {
        setUsername('')
        localStorage.removeItem('ku_username')
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUsername('')
    localStorage.removeItem('ku_username')
  }

  return (
    <AuthContext.Provider value={{ user, session, username, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)