import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:users!actor_id(id, username, avatar_url),
      ku:kus!ku_id(line1, line2, line3)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return res.status(400).json({ error: error.message })

  // For follow notifications, check if user follows back
  const followNotifs = notifications?.filter(n => n.type === 'follow') || []
  const actorIds = followNotifs.map(n => (n.actor as any)?.id).filter(Boolean)

  let followingBack: Set<string> = new Set()
  if (actorIds.length > 0) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .in('following_id', actorIds)

    follows?.forEach(f => followingBack.add(f.following_id))
  }

  const enriched = notifications?.map(n => ({
    ...n,
    isFollowingBack: n.type === 'follow' ? followingBack.has((n.actor as any)?.id) : undefined
  }))

  return res.status(200).json({ notifications: enriched })
}

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ count: count || 0 })
}

export const markRead = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Marked as read' })
}
