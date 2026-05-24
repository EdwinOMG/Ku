import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/notify'

export const getComments = async (req: AuthRequest, res: Response) => {
  const { kuId } = req.params

  const { data: comments, error } = await supabase
    .from('comments')
    .select('*, users(username, avatar_url)')
    .eq('ku_id', kuId)
    .order('created_at', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ comments })
}

export const addComment = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const kuId = req.params.kuId as string
  const { content } = req.body

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment cannot be empty' })
  }

  if (content.length > 280) {
    return res.status(400).json({ error: 'Comment cannot exceed 280 characters' })
  }

  const { data: ku } = await supabase
    .from('kus')
    .select('user_id')
    .eq('id', kuId)
    .single()

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, ku_id: kuId, content })
    .select('*, users(username, avatar_url)')
    .single()

  if (error) return res.status(400).json({ error: error.message })

  if (ku) {
    await createNotification({
      userId: ku.user_id,
      actorId: userId,
      type: 'comment',
      kuId,
      commentId: comment.id
    })
  }

  return res.status(201).json({ comment })
}

export const deleteComment = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params

  const { data: comment } = await supabase
    .from('comments')
    .select('user_id, ku_id')
    .eq('id', id)
    .single()

  if (!comment) return res.status(404).json({ error: 'Comment not found' })

  // Allow comment owner or mod to delete
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  const isMod = user && ['mod', 'admin'].includes(user.role)

  if (comment.user_id !== userId && !isMod) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Comment deleted' })
}