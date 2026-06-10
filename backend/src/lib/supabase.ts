import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!


if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env')
}

// Warn if the key is actually an anon key
try {
  const payload = JSON.parse(Buffer.from(supabaseServiceKey.split('.')[1], 'base64').toString())
  if (payload.role === 'anon') {
    console.warn('⚠️  WARNING: SUPABASE_SERVICE_KEY is an anon key, not a service_role key!')
    console.warn('   Notifications, deletes, and other operations will silently fail due to RLS.')
    console.warn('   Go to Supabase Dashboard → Settings → API → copy the service_role key.')
  }
} catch {}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})