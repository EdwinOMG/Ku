import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const createOpenWrite = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { content, visibility } = req.body

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' })
  }

  if (!['private', 'friends', 'public'].includes(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' })
  }

  const { data, error } = await supabase
    .from('open_writes')
    .insert({ user_id: userId, content, visibility })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(201).json({ openWrite: data })
}

export const getOpenWrite = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  const { data: write, error } = await supabase
    .from('open_writes')
    .select('*, users(username, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !write) return res.status(404).json({ error: 'Not found' })

  if (write.visibility === 'private' && write.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (write.visibility === 'friends') {
    if (!userId) return res.status(403).json({ error: 'Forbidden' })
    const { data: friendship } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', write.user_id)
      .single()
    if (!friendship && write.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }

  return res.status(200).json({ openWrite: write })
}

export const updateOpenWrite = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params
  const { content, visibility } = req.body

  const { data: write } = await supabase
    .from('open_writes')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!write) return res.status(404).json({ error: 'Not found' })
  if (write.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabase
    .from('open_writes')
    .update({ content, visibility })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ openWrite: data })
}

export const deleteOpenWrite = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params

  const { data: write } = await supabase
    .from('open_writes')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!write) return res.status(404).json({ error: 'Not found' })
  if (write.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase
    .from('open_writes')
    .delete()
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Deleted' })
}