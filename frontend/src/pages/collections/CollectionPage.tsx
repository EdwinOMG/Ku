import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'

interface Collection {
  id: string
  name: string
  visibility: string
  user_id: string
  users: {
    username: string
  }
}

interface Ku {
  id: string
  user_id: string
  line1: string
  line2: string
  line3: string
  visibility: string
  sketch_url?: string
  created_at: string
  users: {
    username: string
    avatar_url?: string
  }
  likeCount?: number
  hashtags?: string[]
  isLiked?: boolean
}

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>()
  const { session, user } = useAuth()
  const navigate = useNavigate()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [kus, setKus] = useState<Ku[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editVisibility, setEditVisibility] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true)
      try {
        const data = await api(`/collections/${id}`, {}, session?.access_token)
        setCollection(data.collection)
        setEditName(data.collection.name)
        setEditVisibility(data.collection.visibility)
        setKus(data.kus?.map((k: any) => k.kus) || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchCollection()
  }, [id, session])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      const data = await api(`/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, visibility: editVisibility })
      }, session.access_token)
      setCollection(data.collection)
      setShowEdit(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!session) return
    try {
      await api(`/collections/${id}`, { method: 'DELETE' }, session.access_token)
      navigate('/collections')
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveKu = async (kuId: string) => {
    if (!session) return
    try {
      await api(`/collections/${id}/kus/${kuId}`, { method: 'DELETE' }, session.access_token)
      setKus(prev => prev.filter(k => k.id !== kuId))
    } catch (err) {
      console.error(err)
    }
  }

  const isOwner = user?.id === collection?.user_id

  return (
    <Layout>
      <TopBar
        title={collection?.name || 'collection'}
        showBack
        right={
          isOwner ? (
            <button
              onClick={() => setShowEdit(s => !s)}
              className="text-xs text-ink-muted"
            >
              edit
            </button>
          ) : null
        }
      />

      {showEdit && (
        <div className="bg-cafe-card border-b border-cafe-border p-4 flex flex-col gap-3">
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="bg-cafe-bg border border-cafe-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
          />
          <select
            value={editVisibility}
            onChange={e => setEditVisibility(e.target.value)}
            className="bg-cafe-bg border border-cafe-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-amber-mid"
          >
            <option value="private">private</option>
            <option value="friends">friends only</option>
            <option value="public">public</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-warm text-cafe-latte rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'saving...' : 'save'}
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-500 text-center py-1"
          >
            delete collection
          </button>
        </div>
      )}

      <div className="p-3 flex flex-col gap-3">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {!loading && kus.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm">no kus in this collection yet</p>
          </div>
        )}

        {kus.map(ku => (
          <div key={ku.id} className="relative">
            <KuCard ku={ku} />
            {isOwner && (
              <button
                onClick={() => handleRemoveKu(ku.id)}
                className="absolute top-3 right-3 text-xs text-red-400"
              >
                remove
              </button>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}