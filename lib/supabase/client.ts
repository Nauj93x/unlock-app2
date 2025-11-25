import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Do NOT persist session in localStorage. This prevents credentials from
  // surviving a browser/page restart during development and avoids leaking
  // service-like privileges in the client. Sessions will be transient.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}
