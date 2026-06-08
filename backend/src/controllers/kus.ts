import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

const validateKu = (line1: string, line2: string, line3: string) => {
  const countWords = (line: string) => line.trim().split(/\s+/).length

  if (!line1 || !line2 || !line3) return 'All three lines are required'
  if (countWords(line1) > 5) return 'Line 1 cannot exceed 5 words'
  if (countWords(line2) > 7) return 'Line 2 cannot exceed 7 words'
  if (countWords(line3) > 5) return 'Line 3 cannot exceed 5 words'

  return null
}

export const createKu = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { line1, line2, line3, visibility, hashtags, is_daily, prompt_id, sketch_url, note_color } = req.body

  const validationError = validateKu(line1, line2, line3)
  if (validationError) return res.status(400).json({ error: validationError })

  if (!['public', 'friends', 'private'].includes(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' })
  }

  // Create the ku
  const { data: ku, error } = await supabase
    .from('kus')
    .insert({
      user_id: userId,
      line1,
      line2,
      line3,
      visibility,
      is_daily: is_daily || false,
      prompt_id: prompt_id || null,
      sketch_url: sketch_url || null,
      note_color: note_color || '#FFE082'
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  // Handle hashtags
  if (hashtags && hashtags.length > 0) {
    for (const tag of hashtags) {
      const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '')

      // Upsert hashtag
      const { data: hashtag } = await supabase
        .from('hashtags')
        .upsert({ name: normalizedTag }, { onConflict: 'name' })
        .select()
        .single()

      if (hashtag) {
        await supabase
          .from('ku_hashtags')
          .insert({ ku_id: ku.id, hashtag_id: hashtag.id })
      }
    }
  }

  return res.status(201).json({ ku })
}

export const deleteKu = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params

  const { data: ku } = await supabase
    .from('kus')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!ku) return res.status(404).json({ error: 'Ku not found' })
  if (ku.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase
    .from('kus')
    .delete()
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Ku deleted' })
}

export const getHomeFeed = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { page = 1 } = req.query
  const limit = 20
  const offset = (Number(page) - 1) * limit

  // Get list of people the user follows
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (!follows || follows.length === 0) {
    return res.status(200).json({ kus: [] })
  }

  const followingIds = follows.map(f => f.following_id)

  // Get friends for friend-only content
  const { data: friends } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('user_id', userId)

  const friendIds = friends ? friends.map(f => f.friend_id) : []

  // Get public kus from following
  const { data: publicKus } = await supabase
    .from('kus')
    .select('*, users(username, avatar_url)')
    .in('user_id', followingIds)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Get friends-only kus from people who are also friends
  const { data: friendKus } = friendIds.length > 0 ? await supabase
    .from('kus')
    .select('*, users(username, avatar_url)')
    .in('user_id', friendIds)
    .eq('visibility', 'friends')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  : { data: [] }

  // Merge and sort by created_at
  const allKus = [...(publicKus || []), ...(friendKus || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)

  return res.status(200).json({ kus: allKus })
}

export const getExploreFeed = async (req: AuthRequest, res: Response) => {
  const { page = 1 } = req.query
  const limit = 20
  const offset = (Number(page) - 1) * limit

  const { data: kus, error } = await supabase
    .from('kus')
    .select('*, users(username, avatar_url)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ kus })
}

export const getDailyFeed = async (req: AuthRequest, res: Response) => {
  const { page = 1 } = req.query
  const limit = 20
  const offset = (Number(page) - 1) * limit

  // Get today's prompt
  const today = new Date().toISOString().split('T')[0]

  const { data: prompt } = await supabase
    .from('daily_prompts')
    .select('*')
    .eq('date', today)
    .single()

  if (!prompt) return res.status(200).json({ prompt: null, kus: [] })

  const { data: kus, error } = await supabase
    .from('kus')
    .select('*, users(username, avatar_url)')
    .eq('prompt_id', prompt.id)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ prompt, kus })
}

export const getKu = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  const { data: ku, error } = await supabase
  .from('kus')
  .select('*, users(username, avatar_url)')
  .eq('id', id)
  .single()

  if (error || !ku) return res.status(404).json({ error: 'Ku not found' })

  // Check visibility
  if (ku.visibility === 'private' && ku.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (ku.visibility === 'friends') {
    if (!userId) return res.status(403).json({ error: 'Forbidden' })

    const { data: friendship } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', ku.user_id)
      .single()

    if (!friendship && ku.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }

  // Get like count
  const { count: likeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('ku_id', id)

  // Get hashtags
  const { data: hashtags } = await supabase
    .from('ku_hashtags')
    .select('hashtags(name)')
    .eq('ku_id', id)

  return res.status(200).json({
    ku: {
      ...ku,
      likeCount,
      hashtags: hashtags?.map(h => (h.hashtags as any).name) || []
    }
  })
}