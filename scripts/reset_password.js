/*
 reset_password.js

 Uso:
   En PowerShell:
     $env:SUPABASE_URL = "https://bsfldcboyootchbrstsj.supabase.co";
     $env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_...";
     node .\scripts\reset_password.js "user_email_or_id" "NewPassword123!"

  O en una sola línea:
     $env:SUPABASE_URL="https://bsfldcboyootchbrstsj.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."; node .\scripts\reset_password.js "user@example.com" "NewPassword123!"

 Nota importante:
  - Este script usa la llave `service_role` y debe correr solo en máquinas seguras (tu local).
  - No subas la `service_role` a repositorios públicos.
*/

const { createClient } = require('@supabase/supabase-js')

if (process.argv.length < 4) {
  console.error('Usage: node reset_password.js <user_id_or_email> <new_password>')
  process.exit(1)
}

const identifier = process.argv[2] // user id (uuid) o email
const newPassword = process.argv[3]

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function resetById(userId, password) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  })
  return { data, error }
}

async function resetByEmail(email, password) {
  const listResult = await supabase.auth.admin.listUsers({
    filter: `email.eq.${email}`,
  })

  // Debug log to inspect shape
  // console.log('listResult', JSON.stringify(listResult, null, 2))

  if (listResult.error) return { data: null, error: listResult.error }

  // listResult.data may be { users: [...] } or an array dependiente on SDK/version
  let users = null
  if (Array.isArray(listResult.data)) {
    users = listResult.data
  } else if (listResult.data && Array.isArray(listResult.data.users)) {
    users = listResult.data.users
  } else if (listResult.data && listResult.data.length) {
    users = listResult.data
  }

  if (!users || users.length === 0) return { data: null, error: new Error('Usuario no encontrado') }
  const userId = users[0].id
  return resetById(userId, password)
}

;(async () => {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    let res
    if (isUuid) {
      res = await resetById(identifier, newPassword)
    } else {
      res = await resetByEmail(identifier, newPassword)
    }
    if (res.error) {
      console.error('Error:', res.error)
      process.exit(1)
    }
    console.log('Contraseña reseteada correctamente para:', identifier)
    console.log('User data:', res.data)
  } catch (err) {
    console.error('Exception:', err)
    process.exit(1)
  }
})()
