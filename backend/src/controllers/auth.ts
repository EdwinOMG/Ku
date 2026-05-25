import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password and username are required' })
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' })
  }

  if (username.length > 20) {
    return res.status(400).json({ error: 'Username must be under 20 characters' })
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  // check username taken
  const { data: existingUser } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    return res.status(400).json({ error: 'Username already taken' })
  }

  // create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }
    return res.status(400).json({ error: error.message })
  }

  // create public profile
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      username,
      avatar_url: '/icons/avatar-1.svg'
    })

  if (profileError) {
    // clean up auth user if profile fails
    await supabase.auth.admin.deleteUser(data.user.id)
    console.error('Profile insert error:', profileError)
    return res.status(400).json({ error: profileError.message })
  }

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

  if (error) {
    if (error.message.toLowerCase().includes('invalid')) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }
    return res.status(400).json({ error: error.message })
  }

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