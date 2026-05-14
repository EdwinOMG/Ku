import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password and username are required' })
  }

  // Check username is taken
  const { data: existingUser } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    return res.status(400).json({ error: 'Username already taken' })
  }

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) return res.status(400).json({ error: error.message })

  // Create public profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      username
    })

  if (profileError) return res.status(400).json({ error: profileError.message })

  return res.status(201).json({ message: 'Account created successfully' })
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({
    user: data.user,
    session: data.session
  })
}

export const logout = async (req: Request, res: Response) => {
  const { error } = await supabase.auth.signOut()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Logged out successfully' })
}