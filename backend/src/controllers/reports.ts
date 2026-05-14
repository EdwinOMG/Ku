import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const submitReport = async (req: AuthRequest, res: Response) => {
  const reporterId = req.user!.id
  const { reported_user_id, reported_ku_id, reported_comment_id, reason } = req.body

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Reason is required' })
  }

  if (!reported_user_id && !reported_ku_id && !reported_comment_id) {
    return res.status(400).json({ error: 'Must report something' })
  }

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_user_id: reported_user_id || null,
      reported_ku_id: reported_ku_id || null,
      reported_comment_id: reported_comment_id || null,
      reason
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(201).json({ report })
}

export const getReports = async (req: AuthRequest, res: Response) => {
  const { status = 'pending' } = req.query

  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reporter_id(username),
      reported_user:users!reported_user_id(username),
      reported_ku:kus!reported_ku_id(line1, line2, line3),
      reported_comment:comments!reported_comment_id(content)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ reports })
}

export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { status } = req.body

  if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const { data: report, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ report })
}