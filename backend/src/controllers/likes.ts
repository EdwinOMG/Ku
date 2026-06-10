import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/notify'

export const likeKu = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const kuId = req.params.kuId as string


  const { data: ku } = await supabase
    .from('kus')
    .select('id, user_id')
    .eq('id', kuId)
    .single()

  if (!ku) return res.status(404).json({ error: 'Ku not found' })

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, ku_id: kuId })

  if (error) return res.status(400).json({ error: error.message })

  await createNotification({
    userId: ku.user_id,
    actorId: userId,
    type: 'like',
    kuId
  })

  return res.status(200).json({ message: 'Liked' })
}

export const unlikeKu = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { kuId } = req.params

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('ku_id', kuId)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Unliked' })
}

export const getLikers = async (req: AuthRequest, res: Response) => {
  const { kuId } = req.params

  const { data, error } = await supabase
    .from('likes')
    .select('created_at, users(id, username, avatar_url)')
    .eq('ku_id', kuId)
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({
    likers: data?.map(l => (l.users as any)) || []
  })
}