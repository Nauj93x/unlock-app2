import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    console.log("[v0] CRON: Starting maintenance tasks")

    // Run the maintenance function that handles both expiration and state updates
    const { data, error } = await supabase.rpc("run_maintenance")

    if (error) {
      console.error("[v0] CRON: Maintenance error", error)
      return NextResponse.json({ error: "Maintenance failed", details: error }, { status: 500 })
    }

    console.log("[v0] CRON: Maintenance completed successfully")
    return NextResponse.json({
      success: true,
      message: "Maintenance completed",
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[v0] CRON: Unexpected error", err)
    return NextResponse.json({ error: "Unexpected maintenance error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Maintenance endpoint is active" })
}
