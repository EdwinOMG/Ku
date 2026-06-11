import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import type { User } from '@supabase/supabase-js'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

const jwksClient = jwksRsa({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000,
})

const getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    callback(null, key?.getPublicKey())
  })
}

const verifyToken = (token: string): Promise<string | null> =>
  new Promise((resolve) => {
    jwt.verify(token, getKey, { algorithms: ['RS256', 'ES256'] }, (err, decoded) => {
      if (err || !decoded || typeof decoded === 'string') return resolve(null)
      resolve((decoded as { sub: string }).sub ?? null)
    })
  })

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = await verifyToken(authHeader.split(' ')[1])
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' })

  req.user = { id: userId } as User
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

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return next()

  const userId = await verifyToken(authHeader.split(' ')[1])
  if (userId) req.user = { id: userId } as User

  next()
}
