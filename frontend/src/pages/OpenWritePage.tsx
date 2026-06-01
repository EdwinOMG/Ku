import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'

interface OpenWrite {
  id: string
  content: string
  visibility: string
  created_at: string
  user_id: string
  users: {
    username: string
    avatar_url?: string
  }
}

export default function OpenWritePage() {
  const { id } = useParams<{ id: string }>()
  const { session, user } = useAuth()
  const navigate = useNavigate()
  const [write, setWrite] = useState<OpenWrite | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api(`/openwrites/${id}`, {}, session?.access_token)
        setWrite(data.openWrite)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetch()
  }, [id, session])

  const handleDelete = async () => {
    if (!session) return
    try {
      await api(`/openwrites/${id}`, { method: 'DELETE' }, session.access_token)
      navigate(-1)
    } catch (err) {
      console.error(err)
    }
  }

  const isOwner = user?.id === write?.user_id

  return (
    <Layout>
      <TopBar
        title="open write"
        showBack
        right={
          isOwner ? (
            <button onClick={handleDelete} className="text-xs text-red-400">
              delete
            </button>
          ) : null
        }
      />

      <div className="p-4">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {write && (
          <div className="bg-cafe-card border border-cafe-border rounded-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-medium text-ink-secondary">
                {write.users?.username}
              </p>
              <span className="text-xs text-ink-faint ml-auto">{write.visibility}</span>
            </div>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {write.content}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}