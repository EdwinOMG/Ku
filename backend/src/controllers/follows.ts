import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/notify'

export const followUser = async (req: AuthRequest, res: Response) => {
  const followerId = req.user!.id
  const { username } = req.params

  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (!targetUser) return res.status(404).json({ error: 'User not found' })
  if (targetUser.id === followerId) return res.status(400).json({ error: 'You cannot follow yourself' })

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: targetUser.id })

  if (error) return res.status(400).json({ error: error.message })

  await createNotification({
    userId: targetUser.id,
    actorId: followerId,
    type: 'follow'
  })

  return res.status(200).json({ message: 'Followed successfully' })
}

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  const followerId = req.user!.id
  const { username } = req.params

  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (!targetUser) return res.status(404).json({ error: 'User not found' })

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', targetUser.id)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Unfollowed successfully' })
}