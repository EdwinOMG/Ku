import { supabase } from './supabase'

export const createNotification = async ({
  userId,
  actorId,
  type,
  kuId,
  commentId
}: {
  userId: string
  actorId: string
  type: 'like' | 'comment' | 'follow'
  kuId?: string
  commentId?: string
}) => {
  if (userId === actorId) return

  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      actor_id: actorId,
      type,
      ku_id: kuId || null,
      comment_id: commentId || null
    })
}