import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'

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

export default function HomeFeed() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [kus, setKus] = useState<Ku[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchKus = async (pageNum: number) => {
    if (!session) return
    try {
      const data = await api(
        `/kus/feed/home?page=${pageNum}`,
        {},
        session.access_token
      )
      if (pageNum === 1) {
        setKus(data.kus)
      } else {
        setKus(prev => [...prev, ...data.kus])
      }
      setHasMore(data.kus.length === 20)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKus(1)
  }, [session])

  const handleDelete = (id: string) => {
    setKus(prev => prev.filter(k => k.id !== id))
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchKus(next)
  }

  return (
    <Layout>
      <TopBar
        title="ku"
        right={
          <button
            onClick={() => navigate('/compose')}
            className="w-8 h-8 rounded-full bg-amber-warm text-paper-card flex items-center justify-center text-lg leading-none"
          >
            +
          </button>
        }
      />

      <div className="flex border-b border-paper-border bg-paper-nav">
        <button className="flex-1 py-2 text-xs font-medium text-amber-warm border-b border-amber-warm">
          following
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {!loading && kus.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm mb-1">nothing here yet</p>
            <p className="text-ink-faint text-xs">follow some writers to see their kus</p>
          </div>
        )}

        {kus.map(ku => (
          <KuCard key={ku.id} ku={ku} onDelete={handleDelete} />
        ))}

        {hasMore && !loading && kus.length > 0 && (
          <button
            onClick={loadMore}
            className="text-xs text-ink-muted text-center py-4"
          >
            load more
          </button>
        )}
      </div>
    </Layout>
  )
}