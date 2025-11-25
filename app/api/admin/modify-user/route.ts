import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Try to authenticate caller via Authorization header (Bearer token)
    let currentUser: any | null = null
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1]
        // Call Supabase auth user endpoint with the provided token
        const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: SUPABASE_ANON_KEY,
          },
        })
        if (resp.ok) {
          const userJson = await resp.json()
          if (userJson && userJson.id) currentUser = userJson
        }
      } catch (e) {
        console.error("[admin] auth header validation error:", e)
      }
    }

    // If no Authorization header or validation failed, fall back to cookie-based session
    if (!currentUser) {
      const cookieStore = request.cookies
      const supabase = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      })

      const { data: { session } = {} } = await supabase.auth.getSession()
      const sessionUser = session?.user
      if (sessionUser) currentUser = sessionUser
    }

    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check caller role using service-role client (safe server-side)
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    const adminCheckClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: callerProfile } = await adminCheckClient.from("profiles").select("role").eq("id", currentUser.id).single()
    if (!callerProfile || callerProfile.role !== "administrador") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role, password, inactivate } = body as {
      userId?: string
      role?: string
      password?: string
      inactivate?: boolean
    }

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    // reuse adminCheckClient as admin for subsequent admin operations
    const admin = adminCheckClient

    // If inactivate requested, we mark role as 'cliente' and optionally remove sessions
    if (inactivate) {
      const { error: upErr } = await admin.from("profiles").update({ role: "cliente" }).eq("id", userId)
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "User inactivated" })
    }

    // Update role if provided
    if (role) {
      const { data, error } = await admin.from("profiles").update({ role }).eq("id", userId).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update password if provided (admin API)
    if (password) {
      // @ts-ignore
      if (admin.auth && (admin.auth as any).admin && (admin.auth as any).admin.updateUserById) {
        // @ts-ignore
        const res = await (admin.auth as any).admin.updateUserById(userId, { password })
        if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: "Admin auth API not available" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin] modify-user error:", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
