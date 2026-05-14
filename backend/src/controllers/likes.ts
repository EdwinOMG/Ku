import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const likeKu = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { kuId } = req.params

  const { data: ku } = await supabase
    .from('kus')
    .select('id')
    .eq('id', kuId)
    .single()

  if (!ku) return res.status(404).json({ error: 'Ku not found' })

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, ku_id: kuId })

  if (error) return res.status(400).json({ error: error.message })

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