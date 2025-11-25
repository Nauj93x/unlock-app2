import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_SECRET = process.env.ADMIN_ENDPOINT_SECRET || "dev-secret"

export async function POST(request: Request) {
  try {
    // In production require an admin secret header. In development allow it for convenience.
    const secret = request.headers.get("x-admin-secret")
    if (process.env.NODE_ENV !== "development") {
      if (!secret || secret !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Parse JSON body with fallback logging for debugging malformed requests
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      const text = await request.text().catch(() => "<no body>")
      console.error("[admin] reset-password-by-email bad json:", text)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { email, password } = body as { email?: string; password?: string }
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find profile/user by email in profiles table
    const { data: profile, error: profileError } = await supabase.from("profiles").select("id,email").eq("email", email).maybeSingle()
    if (profileError) {
      console.error("[admin] error finding profile:", profileError)
      return NextResponse.json({ error: "Error finding user" }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = (profile as any).id

    // Try admin SDK method
    // @ts-ignore
    if (supabase.auth && (supabase.auth as any).admin && (supabase.auth as any).admin.updateUserById) {
      try {
        // @ts-ignore
        const result = await (supabase.auth as any).admin.updateUserById(userId, { password })
        if (result.error) {
          console.error("[admin] admin.updateUserById error:", result.error)
          return NextResponse.json({ error: result.error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      } catch (e) {
        console.error("[admin] admin update exception:", e)
        return NextResponse.json({ error: "Admin update failed" }, { status: 500 })
      }
    }

    // If admin API not available, return error with guidance
    return NextResponse.json({ error: "Admin API not available in this SDK version" }, { status: 500 })
  } catch (err) {
    console.error("[admin] reset-password-by-email unexpected error:", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
