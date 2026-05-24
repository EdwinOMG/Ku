import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'

interface Collection {
  id: string
  name: string
  visibility: string
  created_at: string
}

export default function Collections() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newVisibility, setNewVisibility] = useState('private')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const fetchCollections = async () => {
      if (!session) return
      try {
        const data = await api('/collections/mine', {}, session.access_token)
        setCollections(data.collections)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCollections()
  }, [session])

  const handleCreate = async () => {
    if (!session || !newName.trim()) return
    setCreating(true)
    try {
      const data = await api('/collections', {
        method: 'POST',
        body: JSON.stringify({ name: newName, visibility: newVisibility })
      }, session.access_token)
      setCollections(prev => [data.collection, ...prev])
      setNewName('')
      setNewVisibility('private')
      setShowCreate(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const visibilityLabel = (v: string) => {
    if (v === 'public') return '◉ public'
    if (v === 'friends') return '◎ friends'
    return '○ private'
  }

  return (
    <Layout>
      <TopBar
        title="collections"
        right={
          <button
            onClick={() => setShowCreate(s => !s)}
            className="text-xs text-amber-warm font-medium"
          >
            + new
          </button>
        }
      />

      {showCreate && (
        <div className="bg-paper-card border-b border-paper-border p-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-ink-secondary">new collection</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="collection name..."
            className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
          />
          <select
            value={newVisibility}
            onChange={e => setNewVisibility(e.target.value)}
            className="bg-paper-bg border border-paper-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
          >
            <option value="private">private</option>
            <option value="friends">friends only</option>
            <option value="public">public</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="bg-amber-warm text-paper-card rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {creating ? 'creating...' : 'create'}
          </button>
        </div>
      )}

      <div className="p-3 flex flex-col gap-2">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {!loading && collections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm mb-1">no collections yet</p>
            <p className="text-ink-faint text-xs">create one to start saving kus</p>
          </div>
        )}

        {collections.map(col => (
          <button
            key={col.id}
            onClick={() => navigate(`/collections/${col.id}`)}
            className="bg-paper-card border border-paper-border rounded-card p-4 text-left w-full"
          >
            <p className="text-sm font-medium text-ink mb-1">{col.name}</p>
            <p className="text-xs text-ink-faint">{visibilityLabel(col.visibility)}</p>
          </button>
        ))}
      </div>
    </Layout>
  )
}