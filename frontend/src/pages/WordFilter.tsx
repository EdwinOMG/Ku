import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'

interface Filter {
  id: string
  word: string
  created_at: string
}

export default function WordFilter() {
  const { session } = useAuth()
  const [filters, setFilters] = useState<Filter[]>([])
  const [newWord, setNewWord] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFilters = async () => {
      if (!session) return
      try {
        const data = await api('/wordfilter', {}, session.access_token)
        setFilters(data.filters)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchFilters()
  }, [session])

  const handleAdd = async () => {
    if (!session || !newWord.trim()) return
    setAdding(true)
    setError('')
    try {
      const data = await api('/wordfilter', {
        method: 'POST',
        body: JSON.stringify({ word: newWord.trim() })
      }, session.access_token)
      setFilters(prev => [data.filter, ...prev])
      setNewWord('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (word: string) => {
    if (!session) return
    try {
      await api(`/wordfilter/${encodeURIComponent(word)}`, {
        method: 'DELETE'
      }, session.access_token)
      setFilters(prev => prev.filter(f => f.word !== word))
    } catch (err) {
      console.error(err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <Layout>
      <TopBar title="word filter" showBack />

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-cafe-card border border-cafe-border rounded-card p-4 flex flex-col gap-3">
          <p className="text-xs text-ink-muted">
            words and hashtags you add here will be hidden from your feeds
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="word or #hashtag..."
              className="flex-1 bg-cafe-bg border border-cafe-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid placeholder:text-ink-faint"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newWord.trim()}
              className="bg-amber-warm text-cafe-latte rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {adding ? '...' : 'add'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="bg-cafe-card border border-cafe-border rounded-card divide-y divide-cafe-muted">
          {loading && (
            <p className="text-center text-ink-muted text-sm py-6">loading...</p>
          )}

          {!loading && filters.length === 0 && (
            <p className="text-center text-ink-muted text-sm py-6">no filters yet</p>
          )}

          {filters.map(filter => (
            <div key={filter.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-ink">{filter.word}</span>
              <button
                onClick={() => handleRemove(filter.word)}
                className="text-xs text-red-400"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}