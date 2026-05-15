import { Response } from 'express'
import { AuthRequest } from '../types'
import { supabase } from '../lib/supabase'

export const getProfile = async (req: AuthRequest, res: Response) => {
  const { username } = req.params
  const requesterId = req.user?.id

  // Get the profile
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, username, bio, avatar_url, role, created_at')
    .eq('username', username)
    .single()

  if (error || !profile) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Check if requester is friends with this user
  let isFriend = false
  if (requesterId) {
    const { data: friendship } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', requesterId)
      .eq('friend_id', profile.id)
      .single()
    isFriend = !!friendship
  }

  const isOwner = requesterId === profile.id

  // Get follower/following counts
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  // Get kus based on relationship
  let kuQuery = supabase
  .from('kus')
  .select('*, users(username, avatar_url)')
  .eq('user_id', profile.id)
  .order('created_at', { ascending: false })

  if (isOwner) {
    // See all your own kus
  } else if (isFriend) {
    kuQuery = kuQuery.in('visibility', ['public', 'friends'])
  } else {
    kuQuery = kuQuery.eq('visibility', 'public')
  }

  const { data: kus } = await kuQuery

  // Get open writes based on relationship
  let openWriteQuery = supabase
    .from('open_writes')
    .select('*, users(username, avatar_url)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (isOwner) {
    // See all your own open writes
  } else if (isFriend) {
    openWriteQuery = openWriteQuery.in('visibility', ['public', 'friends'])
  } else {
    openWriteQuery = openWriteQuery.eq('visibility', 'public')
  }

  const { data: openWrites } = await openWriteQuery

  // Get public collections
  let collectionsQuery = supabase
    .from('collections')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (isOwner) {
    // See all your own collections
  } else if (isFriend) {
    collectionsQuery = collectionsQuery.in('visibility', ['public', 'friends'])
  } else {
    collectionsQuery = collectionsQuery.eq('visibility', 'public')
  }

  const { data: collections } = await collectionsQuery

  return res.status(200).json({
    profile: {
      ...profile,
      followerCount,
      followingCount,
      isOwner,
      isFriend
    },
    kus,
    openWrites: isOwner || isFriend ? openWrites : openWrites,
    collections
  })
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { bio, username } = req.body

  if (username) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .neq('id', userId)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' })
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update({ bio, username })
    .eq('id', userId)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ profile: data })
}

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id
  const { base64, fileType } = req.body

  if (!base64 || !fileType) {
    return res.status(400).json({ error: 'Image data required' })
  }

  const buffer = Buffer.from(base64, 'base64')
  const fileName = `${userId}/avatar.${fileType}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, buffer, {
      contentType: `image/${fileType}`,
      upsert: true
    })

  if (uploadError) return res.status(400).json({ error: uploadError.message })

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', userId)

  if (updateError) return res.status(400).json({ error: updateError.message })

  return res.status(200).json({ avatar_url: urlData.publicUrl })
}