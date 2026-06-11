import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../lib/api'

interface NotificationContextType {
  unreadCount: number
  clearCount: () => void
  refresh: () => void
}

const NotificationContext = createContext<NotificationContextType>({ unreadCount: 0, clearCount: () => {}, refresh: () => {} })

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchCount = useCallback(async () => {
    if (!session) return
    try {
      const data = await api('/notifications/unread', {}, session.access_token)
      setUnreadCount(data.count)
    } catch {}
  }, [session])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  const clearCount = () => setUnreadCount(0)

  return (
    <NotificationContext.Provider value={{ unreadCount, clearCount, refresh: fetchCount }}>
      {children}
    </NotificationContext.Provider>
  )
}
