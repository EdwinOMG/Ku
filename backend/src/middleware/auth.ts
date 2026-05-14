import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = data.user
  next()
}

export const requireMod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!data || !['mod', 'admin'].includes(data.role)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  next()
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]
  const { data } = await supabase.auth.getUser(token)

  if (data.user) req.user = data.user

  next()
}