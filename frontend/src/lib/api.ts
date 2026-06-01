const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export const api = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  const url = `${API_URL}${endpoint}`

  const res = await fetch(url, {
    ...options,
    headers
  })

  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Session expired, please log in again')
  }

  const data = await res.json()

  if (!res.ok) throw new Error(data.error || 'Something went wrong')

  return data
}