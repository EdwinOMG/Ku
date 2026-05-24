import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export function useWordFilter() {
  const { session } = useAuth()
  const [filters, setFilters] = useState<string[]>([])

  useEffect(() => {
    if (!session) return
    const fetchFilters = async () => {
      try {
        const data = await api('/wordfilter', {}, session.access_token)
        setFilters(data.filters.map((f: { word: string }) => f.word.toLowerCase()))
      } catch (err) {
        console.error(err)
      }
    }
    fetchFilters()
  }, [session])

  const filterKus = (kus: any[]) => {
    if (filters.length === 0) return kus
    return kus.filter(ku => {
      const text = `${ku.line1} ${ku.line2} ${ku.line3}`.toLowerCase()
      const tags = (ku.hashtags || []).join(' ').toLowerCase()
      return !filters.some(f => text.includes(f) || tags.includes(f))
    })
  }

  return { filterKus }
}