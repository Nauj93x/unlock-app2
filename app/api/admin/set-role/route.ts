import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Simple admin endpoint to change a user's role. This endpoint must only be
// used server-side and requires `SUPABASE_SERVICE_ROLE_KEY` in env.

const ADMIN_SECRET = process.env.ADMIN_ENDPOINT_SECRET || "dev-secret"

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-admin-secret")
    if (!secret || secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, role } = body as { userId?: string; role?: "cliente" | "administrador" }

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase.from("profiles").update({ role }).eq("id", userId).select().single()

    if (error) {
      console.error("[admin] set-role error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (err) {
    console.error("[admin] set-role unexpected error:", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
