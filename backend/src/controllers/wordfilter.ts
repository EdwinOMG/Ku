import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const getFilters = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id

  const { data: filters, error } = await supabase
    .from('word_filters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ filters })
}

export const addFilter = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { word } = req.body

  if (!word || word.trim().length === 0) {
    return res.status(400).json({ error: 'Word is required' })
  }

  const { data: filter, error } = await supabase
    .from('word_filters')
    .insert({ user_id: userId, word: word.toLowerCase().trim() })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(201).json({ filter })
}

export const removeFilter = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { word } = req.params

  const { error } = await supabase
    .from('word_filters')
    .delete()
    .eq('user_id', userId)
    .eq('word', word.toLowerCase())

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Filter removed' })
}