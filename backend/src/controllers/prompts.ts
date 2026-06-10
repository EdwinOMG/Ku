import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'
import { broadcastNotification } from '../lib/notify'

export const setDailyPrompt = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { prompt } = req.body

  if (!prompt || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  const today = new Date().toISOString().split('T')[0]

  // Check if prompt already exists for today
  const { data: existing } = await supabase
    .from('daily_prompts')
    .select('id')
    .eq('date', today)
    .single()

  if (existing) {
    return res.status(400).json({ error: 'A prompt has already been set for today' })
  }

  const { data, error } = await supabase
    .from('daily_prompts')
    .insert({ prompt: prompt.trim(), date: today })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  // Notify all users about the new daily prompt
  await broadcastNotification({ actorId: userId, type: 'daily_prompt' })

  return res.status(201).json({ prompt: data })
}