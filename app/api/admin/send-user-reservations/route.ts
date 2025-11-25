import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { sendEmail, generateReservationEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    // Ensure caller is authenticated and an admin
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData?.data?.session?.user
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()
    if (!callerProfile || callerProfile.role !== "administrador") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await request.json()
    const { userId, reservationIds } = body as { userId?: string; reservationIds?: string[] }
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    // Fetch reservations for the user (using server session/privileges)
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select(`*, events(*), accommodations(*), profiles(*)`)
      .eq("user_id", userId)

    if (resError) return NextResponse.json({ error: resError.message }, { status: 500 })

    const toSend = reservationIds && reservationIds.length > 0 ? reservations.filter((r: any) => reservationIds.includes(r.id)) : reservations

    // Use SMTP service to send emails (server-side)
    for (const r of toSend) {
      const html = generateReservationEmail(r.profiles.full_name, r.events?.name || "Evento", r.total_amount || 0)
      await sendEmail({ to: r.profiles.email, subject: `Reserva para ${r.events?.name || "evento"}`, html })
    }

    return NextResponse.json({ success: true, sent: (toSend || []).length })
  } catch (err) {
    console.error("[admin] send-user-reservations error:", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
