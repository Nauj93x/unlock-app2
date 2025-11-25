import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_SECRET = process.env.ADMIN_ENDPOINT_SECRET || "dev-secret"

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-admin-secret")
    if (!secret || secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, password } = body as { userId?: string; password?: string }

    if (!userId || !password) {
      return NextResponse.json({ error: "Missing userId or password" }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Use the admin API to update user password by id
    // Note: method name may vary by supabase-js version; using admin.updateUserById
    // If not available, you can use `supabase.auth.admin.updateUserById`
    // Here we attempt both forms to be compatible.

    // Try direct admin namespace
    // @ts-ignore
    if (supabase.auth && (supabase.auth as any).admin && (supabase.auth as any).admin.updateUserById) {
      // @ts-ignore
      const result = await (supabase.auth as any).admin.updateUserById(userId, { password })
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, data: result.data })
    }

    // Fallback: try update via users table (may require adjusting)
    const { data, error } = await supabase.from("profiles").select("id").eq("id", userId).single()
    if (error || !data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Admin API not available in this SDK version" }, { status: 500 })
  } catch (err) {
    console.error("[admin] reset-password unexpected error:", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
