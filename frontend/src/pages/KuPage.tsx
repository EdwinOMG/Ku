import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Layout from '../components/layout/Layout'
import TopBar from '../components/layout/TopBar'
import KuCard from '../components/ku/KuCard'

interface Reply {
  id: string; content: string; created_at: string; user_id: string; parent_id: string
  users: { username: string; avatar_url?: string }
  likeCount: number; isLiked: boolean
}

interface Comment {
  id: string; content: string; created_at: string; user_id: string; parent_id?: string
  users: { username: string; avatar_url?: string }
  likeCount: number; isLiked: boolean; replyCount: number; replies: Reply[]
}

interface Ku {
  id: string; user_id: string; line1: string; line2: string; line3: string
  visibility: string; sketch_url?: string; created_at: string
  users: { username: string; avatar_url?: string }
  likeCount?: number; hashtags?: string[]; isLiked?: boolean; commentCount?: number
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

function CommentItem({
  comment,
  isReply,
  onLike,
  onReply,
  onDelete,
  userId
}: {
  comment: Comment | Reply
  isReply?: boolean
  onLike: (id: string, liked: boolean) => void
  onReply?: (id: string, username: string) => void
  onDelete: (id: string) => void
  userId?: string
}) {
  return (
    <div className={`flex gap-2.5 animate-fade-in-up ${isReply ? 'ml-9' : ''}`}>
      <Link to={`/profile/${comment.users?.username}`} className="flex-shrink-0 mt-0.5">
        <div className={`${isReply ? 'w-6 h-6 text-[9px]' : 'w-7 h-7 text-[10px]'} rounded-lg bg-moss-light flex items-center justify-center font-semibold text-moss-deep overflow-hidden ring-1 ring-moss-sage/20`}>
          {comment.users?.avatar_url
            ? <img src={comment.users.avatar_url} alt={comment.users.username} className="w-full h-full object-cover" />
            : comment.users?.username?.[0]?.toUpperCase()
          }
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Link to={`/profile/${comment.users?.username}`} className="text-xs font-display font-medium text-ink-secondary hover:text-ink transition-colors">
            {comment.users?.username}
          </Link>
          <span className="text-[10px] text-ink-ghost font-mono">{timeAgo(comment.created_at)}</span>
          {userId === comment.user_id && (
            <button onClick={() => onDelete(comment.id)}
              className="text-[10px] text-red-400/70 ml-auto hover:text-red-400 transition-colors">delete</button>
          )}
        </div>
        <p className="text-sm text-ink leading-relaxed font-body">{comment.content}</p>

        {/* Like and reply actions */}
        <div className="flex items-center gap-4 mt-1.5">
          <button
            onClick={() => onLike(comment.id, comment.isLiked)}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              comment.isLiked ? 'text-amber-warm' : 'text-ink-ghost hover:text-ink-muted'
            }`}
          >
            <span className="text-xs">{comment.isLiked ? '♥' : '♡'}</span>
            {comment.likeCount > 0 && <span className="font-mono">{comment.likeCount}</span>}
          </button>
          {!isReply && onReply && (
            <button
              onClick={() => onReply(comment.id, comment.users?.username)}
              className="text-[11px] text-ink-ghost hover:text-ink-muted transition-colors"
            >
              reply
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KuPage() {
  const { id } = useParams<{ id: string }>()
  const { session, user } = useAuth()
  const [ku, setKu] = useState<Ku | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  // Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)

  // Track which comments have expanded replies
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchKu = async () => {
      setLoading(true)
      try {
        const [kuData, commentData] = await Promise.all([
          api(`/kus/${id}`, {}, session?.access_token),
          api(`/comments/${id}`, {}, session?.access_token)
        ])
        setKu(kuData.ku)
        setComments(commentData.comments)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    if (id) fetchKu()
  }, [id, session])

  const handleComment = async () => {
    if (!session || !newComment.trim()) return
    setPosting(true); setError('')
    try {
      const body: any = { content: newComment }
      if (replyingTo) body.parent_id = replyingTo.id

      const data = await api(`/comments/${id}`, { method: 'POST', body: JSON.stringify(body) }, session.access_token)

      if (replyingTo) {
        // Add reply to the parent comment
        setComments(prev => prev.map(c => {
          if (c.id === replyingTo.id) {
            return {
              ...c,
              replyCount: c.replyCount + 1,
              replies: [...c.replies, data.comment]
            }
          }
          return c
        }))
        // Auto-expand replies for this comment
        setExpandedReplies(prev => new Set(prev).add(replyingTo.id))
        setReplyingTo(null)
      } else {
        setComments(prev => [...prev, data.comment])
      }
      setNewComment('')
    } catch (err: any) { setError(err.message) }
    finally { setPosting(false) }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!session) return
    try {
      await api(`/comments/${commentId}`, { method: 'DELETE' }, session.access_token)
      // Remove from top-level or from replies
      setComments(prev => {
        // Check if it's a top-level comment
        if (prev.some(c => c.id === commentId)) {
          return prev.filter(c => c.id !== commentId)
        }
        // Otherwise remove from replies
        return prev.map(c => ({
          ...c,
          replies: c.replies.filter(r => r.id !== commentId),
          replyCount: c.replies.some(r => r.id === commentId) ? c.replyCount - 1 : c.replyCount
        }))
      })
    } catch (err) { console.error(err) }
  }

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!session) return
    try {
      if (isLiked) {
        await api(`/comments/${commentId}/like`, { method: 'DELETE' }, session.access_token)
      } else {
        await api(`/comments/${commentId}/like`, { method: 'POST' }, session.access_token)
      }
      // Update like state in top-level or replies
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return { ...c, isLiked: !isLiked, likeCount: c.likeCount + (isLiked ? -1 : 1) }
        }
        return {
          ...c,
          replies: c.replies.map(r =>
            r.id === commentId
              ? { ...r, isLiked: !isLiked, likeCount: r.likeCount + (isLiked ? -1 : 1) }
              : r
          )
        }
      }))
    } catch (err) { console.error(err) }
  }

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username })
    setNewComment('')
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev)
      if (next.has(commentId)) next.delete(commentId)
      else next.add(commentId)
      return next
    })
  }

  const totalComments = comments.reduce((sum, c) => sum + 1 + c.replyCount, 0)

  return (
    <Layout>
      <TopBar title="ku" showBack />
      <div className="p-3 flex flex-col gap-3">
        {loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-2xl mb-2 animate-float">🍃</div>
            <p className="text-ink-muted text-sm font-display italic">loading...</p>
          </div>
        )}

        {ku && <KuCard ku={ku} />}

        {!loading && (
          <div className="cozy-card p-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs font-display font-medium text-ink-secondary mb-3">
              {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
            </p>

            {totalComments === 0 && (
              <p className="text-xs text-ink-ghost mb-3 italic font-display">no comments yet — be the first</p>
            )}

            <div className="flex flex-col gap-3 mb-4 stagger">
              {comments.map(comment => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    onLike={handleLikeComment}
                    onReply={handleReply}
                    onDelete={handleDeleteComment}
                    userId={user?.id}
                  />

                  {/* Show replies toggle */}
                  {comment.replyCount > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="ml-9 mt-1.5 text-[11px] text-ink-ghost hover:text-ink-muted transition-colors font-display flex items-center gap-1"
                    >
                      <span className="w-4 h-px bg-ink-ghost/40 inline-block" />
                      {expandedReplies.has(comment.id)
                        ? 'hide replies'
                        : `view ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`
                      }
                    </button>
                  )}

                  {/* Replies */}
                  {expandedReplies.has(comment.id) && comment.replies.length > 0 && (
                    <div className="flex flex-col gap-2.5 mt-2">
                      {comment.replies.map(reply => (
                        <CommentItem
                          key={reply.id}
                          comment={reply as any}
                          isReply
                          onLike={handleLikeComment}
                          onDelete={handleDeleteComment}
                          userId={user?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {session && (
              <div className="pt-3 relative">
                <div className="vine-divider mb-3" />

                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2 animate-slide-up">
                    <span className="text-[11px] text-ink-muted font-display">
                      replying to <span className="font-semibold text-ink-secondary">{replyingTo.username}</span>
                    </span>
                    <button onClick={() => setReplyingTo(null)}
                      className="text-[10px] text-ink-ghost hover:text-ink-muted transition-colors">✕ cancel</button>
                  </div>
                )}

                <div className="flex gap-2">
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                    rows={2} maxLength={280}
                    placeholder={replyingTo ? `reply to ${replyingTo.username}...` : 'leave a comment...'}
                    className="flex-1 cozy-input text-sm resize-none" />
                  <button onClick={handleComment} disabled={posting || !newComment.trim()}
                    className="text-xs text-amber-warm font-display font-medium self-end pb-2 disabled:opacity-40 hover:text-amber-mid transition-colors">
                    {posting ? '...' : replyingTo ? 'reply' : 'post'}
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-400 mt-2 animate-scale-in">{error}</p>}
          </div>
        )}
      </div>
    </Layout>
  )
}
