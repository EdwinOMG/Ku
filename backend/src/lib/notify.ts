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
  type: 'like' | 'comment' | 'follow' | 'daily_prompt' | 'comment_like' | 'reply'
  kuId?: string
  commentId?: string
}) => {
  if (userId === actorId) return

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      actor_id: actorId,
      type,
      ku_id: kuId || null,
      comment_id: commentId || null
    })

  if (error) {
    console.error('Failed to create notification:', error.message, { userId, actorId, type, kuId, commentId })
  }
}

export const broadcastNotification = async ({
  actorId,
  type,
}: {
  actorId: string
  type: 'daily_prompt'
}) => {
  // Get all users except the actor
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .neq('id', actorId)

  if (!users || users.length === 0) return

  const rows = users.map(u => ({
    user_id: u.id,
    actor_id: actorId,
    type,
    ku_id: null,
    comment_id: null
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) {
    console.error('Failed to broadcast notification:', error.message)
  }
}