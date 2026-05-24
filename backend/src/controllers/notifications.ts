import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:users!actor_id(username, avatar_url),
      ku:kus!ku_id(line1, line2, line3)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ notifications })
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