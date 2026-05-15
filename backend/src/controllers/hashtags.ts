import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const getHashtag = async (req: AuthRequest, res: Response) => {
  const name = req.params.name as string
  const { page = 1 } = req.query
  const limit = 20
  const offset = (Number(page) - 1) * limit

  const { data: hashtag } = await supabase
    .from('hashtags')
    .select('id, name')
    .eq('name', name.toLowerCase())
    .single()

  if (!hashtag) return res.status(404).json({ error: 'Hashtag not found' })

  const { data: kus, error } = await supabase
    .from('ku_hashtags')
    .select('kus(*, users(username, avatar_url))')
    .eq('hashtag_id', hashtag.id)
    .range(offset, offset + limit - 1)

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({
    hashtag,
    kus: kus?.map(k => k.kus) || []
  })
}