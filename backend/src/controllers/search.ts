import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const searchUsers = async (req: AuthRequest, res: Response) => {
  const q = req.query.q as string

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' })
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, bio, avatar_url')
    .ilike('username', `%${q}%`)
    .limit(20)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ users })
}

export const searchHashtags = async (req: AuthRequest, res: Response) => {
  const q = req.query.q as string

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' })
  }

  const { data: hashtags, error } = await supabase
    .from('hashtags')
    .select('id, name')
    .ilike('name', `%${q}%`)
    .limit(20)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ hashtags })
}