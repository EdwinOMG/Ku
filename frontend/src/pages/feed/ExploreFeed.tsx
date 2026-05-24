import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'
import { useWordFilter } from '../../hooks/useWordFilter'

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

export default function ExploreFeed() {
  const { session } = useAuth()
  const [kus, setKus] = useState<Ku[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { filterKus } = useWordFilter()

  const fetchKus = async (pageNum: number) => {
    try {
      const data = await api(
        `/kus/feed/explore?page=${pageNum}`,
        {},
        session?.access_token
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
  }, [])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchKus(next)
  }

  return (
    <Layout>
      <TopBar title="explore" />

      <div className="p-3 flex flex-col gap-3">
        {loading && (
          <p className="text-center text-ink-muted text-sm py-8">loading...</p>
        )}

        {!loading && kus.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink-muted text-sm">no kus yet</p>
          </div>
        )}

        {filterKus(kus).map(ku => (
          <KuCard key={ku.id} ku={ku} />
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