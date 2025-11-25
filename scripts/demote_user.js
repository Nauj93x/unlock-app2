/* Demote a user to cliente by email (DEV ONLY)

Usage:
  node scripts/demote_user.js user@example.com

This script reads `.env.local` (simple parser) and uses the SUPABASE_SERVICE_ROLE_KEY to update
the `profiles` table. Only use in development.
*/

const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Simple .env.local parser (same approach as promote_user.js)
function loadEnv(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8')
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx)
      let value = trimmed.slice(idx + 1)
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  } catch (e) {
    // ignore
  }
}

loadEnv(path.resolve(__dirname, '..', '.env.local'))

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node scripts/demote_user.js <email>')
    process.exit(1)
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    console.log(`Looking up profile for ${email}...`)
    const { data: profile, error: findErr } = await supabase
      .from('profiles')
      .select('id,email,role')
      .eq('email', email)
      .maybeSingle()

    if (findErr) throw findErr
    if (!profile) {
      console.error('Profile not found for', email)
      process.exit(2)
    }

    console.log('Current role:', profile.role, 'id:', profile.id)
    if (profile.role === 'cliente') {
      console.log('User already a cliente')
      process.exit(0)
    }

    const { data: updated, error: upErr } = await supabase
      .from('profiles')
      .update({ role: 'cliente' })
      .eq('id', profile.id)
      .select()
      .single()

    if (upErr) throw upErr
    console.log('Profile updated:', updated)
    process.exit(0)
  } catch (e) {
    console.error('Error demoting user:', e.message || e)
    process.exit(3)
  }
}

main()
