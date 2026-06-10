import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/notify'

export const getComments = async (req: AuthRequest, res: Response) => {
  const { kuId } = req.params
  const userId = req.user?.id

  const { data: allComments, error } = await supabase
    .from('comments')
    .select('*, users(username, avatar_url)')
    .eq('ku_id', kuId)
    .order('created_at', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })

  if (!allComments || allComments.length === 0) {
    return res.status(200).json({ comments: [] })
  }

  // Get like counts for all comments
  const commentIds = allComments.map(c => c.id)

  const { data: likeCounts } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .in('comment_id', commentIds)

  const likeCountMap: Record<string, number> = {}
  likeCounts?.forEach(l => {
    likeCountMap[l.comment_id] = (likeCountMap[l.comment_id] || 0) + 1
  })

  // Get current user's likes
  let userLikes: Set<string> = new Set()
  if (userId) {
    const { data: liked } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds)
    liked?.forEach(l => userLikes.add(l.comment_id))
  }

  // Get reply counts for top-level comments
  const replyCountMap: Record<string, number> = {}
  allComments.forEach(c => {
    if (c.parent_id) {
      replyCountMap[c.parent_id] = (replyCountMap[c.parent_id] || 0) + 1
    }
  })

  // Build threaded structure
  const topLevel = allComments.filter(c => !c.parent_id)
  const replies = allComments.filter(c => c.parent_id)

  const replyMap: Record<string, any[]> = {}
  replies.forEach(r => {
    if (!replyMap[r.parent_id]) replyMap[r.parent_id] = []
    replyMap[r.parent_id].push({
      ...r,
      likeCount: likeCountMap[r.id] || 0,
      isLiked: userLikes.has(r.id)
    })
  })

  const enriched = topLevel.map(c => ({
    ...c,
    likeCount: likeCountMap[c.id] || 0,
    isLiked: userLikes.has(c.id),
    replyCount: replyCountMap[c.id] || 0,
    replies: replyMap[c.id] || []
  }))

  return res.status(200).json({ comments: enriched })
}

export const addComment = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const kuId = req.params.kuId as string
  const { content, parent_id } = req.body

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment cannot be empty' })
  }

  if (content.length > 280) {
    return res.status(400).json({ error: 'Comment cannot exceed 280 characters' })
  }

  // If replying, verify parent exists and belongs to same ku
  if (parent_id) {
    const { data: parent } = await supabase
      .from('comments')
      .select('id, ku_id, user_id')
      .eq('id', parent_id)
      .single()

    if (!parent) return res.status(404).json({ error: 'Parent comment not found' })
    if (parent.ku_id !== kuId) return res.status(400).json({ error: 'Parent comment belongs to a different ku' })
  }

  const { data: ku } = await supabase
    .from('kus')
    .select('user_id')
    .eq('id', kuId)
    .single()

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      ku_id: kuId,
      content,
      parent_id: parent_id || null
    })
    .select('*, users(username, avatar_url)')
    .single()

  if (error) return res.status(400).json({ error: error.message })

  if (parent_id) {
    // Notify the parent comment author about the reply
    const { data: parent } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', parent_id)
      .single()

    if (parent) {
      await createNotification({
        userId: parent.user_id,
        actorId: userId,
        type: 'reply',
        kuId,
        commentId: comment.id
      })
    }
  } else if (ku) {
    // Notify the ku author about the top-level comment
    await createNotification({
      userId: ku.user_id,
      actorId: userId,
      type: 'comment',
      kuId,
      commentId: comment.id
    })
  }

  return res.status(201).json({ comment: { ...comment, likeCount: 0, isLiked: false, replyCount: 0, replies: [] } })
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

export const likeComment = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const commentId = req.params.commentId as string

  const { data: comment } = await supabase
    .from('comments')
    .select('id, user_id, ku_id')
    .eq('id', commentId)
    .single()

  if (!comment) return res.status(404).json({ error: 'Comment not found' })

  const { error } = await supabase
    .from('comment_likes')
    .insert({ user_id: userId, comment_id: commentId })

  if (error) return res.status(400).json({ error: error.message })

  await createNotification({
    userId: comment.user_id,
    actorId: userId,
    type: 'comment_like',
    kuId: comment.ku_id,
    commentId
  })

  return res.status(200).json({ message: 'Comment liked' })
}

export const unlikeComment = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const commentId = req.params.commentId as string

  const { error } = await supabase
    .from('comment_likes')
    .delete()
    .eq('user_id', userId)
    .eq('comment_id', commentId)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Comment unliked' })
}
