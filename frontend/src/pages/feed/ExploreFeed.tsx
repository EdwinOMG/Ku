import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import Layout from '../../components/layout/Layout'
import TopBar from '../../components/layout/TopBar'
import KuCard from '../../components/ku/KuCard'
import { useWordFilter } from '../../hooks/useWordFilter'

interface Ku {
  id: string; user_id: string; line1: string; line2: string; line3: string
  visibility: string; sketch_url?: string; created_at: string
  users: { username: string; avatar_url?: string }
  likeCount?: number; hashtags?: string[]; isLiked?: boolean; commentCount?: number
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
      const data = await api(`/kus/feed/explore?page=${pageNum}`, {}, session?.access_token)
      if (pageNum === 1) setKus(data.kus)
      else setKus(prev => [...prev, ...data.kus])
      setHasMore(data.kus.length === 20)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchKus(1) }, [])
  const loadMore = () => { const next = page + 1; setPage(next); fetchKus(next) }

  return (
    <Layout>
      <TopBar title="explore" />
      <div className="p-3 flex flex-col gap-3 stagger">
        {loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="relative inline-block mb-4">
              <div className="text-2xl animate-float">🌿</div>
              <div className="absolute -left-3 top-0 text-sm animate-float" style={{ animationDelay: '0.4s' }}>✦</div>
              <div className="absolute -right-3 top-1 text-sm animate-float" style={{ animationDelay: '0.8s' }}>✦</div>
            </div>
            <div className="shimmer-text">
              <p className="text-ink-muted text-sm font-display italic">wandering the garden...</p>
            </div>
            <div className="mt-6 space-y-3">
              {[0,1].map(i => (
                <div key={i} className="skeleton-card animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="skeleton-circle w-8 h-8" />
                    <div className="skeleton-line w-20 h-3" />
                  </div>
                  <div className="space-y-2 px-2">
                    <div className="skeleton-line w-4/5 h-3" />
                    <div className="skeleton-line w-3/5 h-3 ml-3" />
                    <div className="skeleton-line w-4/5 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!loading && kus.length === 0 && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="relative inline-block mb-4">
              <div className="text-4xl animate-sway" style={{ transformOrigin: 'bottom center' }}>🍂</div>
              {[0,1,2].map(i => (
                <div key={i} className="absolute animate-drift text-[8px] opacity-30"
                  style={{ left: `${-10 + i * 20}px`, top: `${-5 + i * 8}px`, animationDelay: `${i * 0.6}s` }}>
                  ✦
                </div>
              ))}
            </div>
            <p className="text-ink-muted text-sm font-display">no kus yet</p>
            <p className="text-ink-ghost text-xs mt-1 animate-fade-in" style={{ animationDelay: '0.5s' }}>the garden is waiting to bloom</p>
          </div>
        )}
        {filterKus(kus).map(ku => <KuCard key={ku.id} ku={ku} />)}
        {hasMore && !loading && kus.length > 0 && (
          <button onClick={loadMore}
            className="text-xs text-ink-muted text-center py-5 hover:text-amber-warm transition-colors font-display italic">
            load more
          </button>
        )}
      </div>
    </Layout>
  )
}
