import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const getCollection = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  const { data: collection, error } = await supabase
    .from('collections')
    .select('*, users(username, avatar_url)')
    .eq('id', id)
    .single()

  if (error || !collection) return res.status(404).json({ error: 'Collection not found' })

  const isOwner = userId === collection.user_id

  // Check visibility
  if (collection.visibility === 'private' && !isOwner) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (collection.visibility === 'friends') {
    if (!userId) return res.status(403).json({ error: 'Forbidden' })

    const { data: friendship } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', collection.user_id)
      .single()

    if (!friendship && !isOwner) return res.status(403).json({ error: 'Forbidden' })
  }

  // Get kus in collection
  const { data: kus } = await supabase
    .from('collection_kus')
    .select('*, kus(*, users(username, avatar_url))')
    .eq('collection_id', id)
    .order('added_at', { ascending: false })

  return res.status(200).json({ collection, kus })
}

export const createCollection = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { name, visibility } = req.body

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Collection name is required' })
  }

  if (!['private', 'friends', 'public'].includes(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' })
  }

  const { data: collection, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name, visibility })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(201).json({ collection })
}

export const updateCollection = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params
  const { name, visibility } = req.body

  const { data: collection } = await supabase
    .from('collections')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!collection) return res.status(404).json({ error: 'Collection not found' })
  if (collection.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  if (visibility && !['private', 'friends', 'public'].includes(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility' })
  }

  const { data: updated, error } = await supabase
    .from('collections')
    .update({ name, visibility })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ collection: updated })
}

export const deleteCollection = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id } = req.params

  const { data: collection } = await supabase
    .from('collections')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!collection) return res.status(404).json({ error: 'Collection not found' })
  if (collection.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Collection deleted' })
}

export const addKuToCollection = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id, kuId } = req.params

  const { data: collection } = await supabase
    .from('collections')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!collection) return res.status(404).json({ error: 'Collection not found' })
  if (collection.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase
    .from('collection_kus')
    .insert({ collection_id: id, ku_id: kuId })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Ku added to collection' })
}

export const removeKuFromCollection = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { id, kuId } = req.params

  const { data: collection } = await supabase
    .from('collections')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!collection) return res.status(404).json({ error: 'Collection not found' })
  if (collection.user_id !== userId) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase
    .from('collection_kus')
    .delete()
    .eq('collection_id', id)
    .eq('ku_id', kuId)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Ku removed from collection' })
}