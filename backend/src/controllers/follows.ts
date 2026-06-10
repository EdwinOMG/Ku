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

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', targetUser.id)
    .single()

  if (existing) return res.status(400).json({ error: 'Already following' })

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

  const { data: deleted, error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', targetUser.id)
    .select()

  if (error) {
    console.error('unfollowUser error:', error.message)
    return res.status(400).json({ error: error.message })
  }

  console.log('unfollowUser deleted rows:', deleted?.length || 0)

  return res.status(200).json({ message: 'Unfollowed successfully' })
}

export const getFollowers = async (req: AuthRequest, res: Response) => {
  const { username } = req.params

  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (!targetUser) return res.status(404).json({ error: 'User not found' })

  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, users!follows_follower_id_fkey(id, username, avatar_url)')
    .eq('following_id', targetUser.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({
    followers: data?.map(f => (f.users as any)) || []
  })
}

export const getFollowing = async (req: AuthRequest, res: Response) => {
  const { username } = req.params

  const { data: targetUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (!targetUser) return res.status(404).json({ error: 'User not found' })

  const { data, error } = await supabase
    .from('follows')
    .select('following_id, users!follows_following_id_fkey(id, username, avatar_url)')
    .eq('follower_id', targetUser.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({
    following: data?.map(f => (f.users as any)) || []
  })
}

export const removeFollower = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { username } = req.params

  const { data: followerUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (!followerUser) return res.status(404).json({ error: 'User not found' })

  console.log('removeFollower:', { follower: followerUser.id, following: userId, username })

  // Delete the follow where the target user is following the current user
  const { data: deleted, error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerUser.id)
    .eq('following_id', userId)
    .select()

  if (error) {
    console.error('removeFollower error:', error.message)
    return res.status(400).json({ error: error.message })
  }

  console.log('removeFollower deleted rows:', deleted?.length || 0)

  if (!deleted || deleted.length === 0) {
    return res.status(404).json({ error: 'Follow relationship not found' })
  }

  return res.status(200).json({ message: 'Follower removed' })
}
