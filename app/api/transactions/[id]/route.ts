import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { sendEmail, generatePaymentConfirmationEmail } from "@/lib/email-service"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  // Use the PUBLIC anon key here so the created server client respects the
  // user's session cookies and RLS policies. The service role key must NOT
  // be passed to createServerClient that uses cookie-based sessions.
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const { estado } = await request.json()
    const transactionId = params.id

    console.log("[v0] Updating transaction status:", transactionId, "to:", estado)

    // Get transaction details for email
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select(`
        *,
        profiles:user_id (full_name, email),
        events:event_id (name)
      `)
      .eq("id", transactionId)
      .single()

    if (fetchError || !transaction) {
      return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 })
    }

    // Update transaction status
    const { data: updatedTransaction, error } = await supabase
      .from("transactions")
      .update({ estado })
      .eq("id", transactionId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating transaction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send notification email
    try {
      const emailHtml = generatePaymentConfirmationEmail(
        transaction.profiles.full_name,
        transaction.events.name,
        estado,
      )

      await sendEmail({
        to: transaction.profiles.email,
        subject: estado === "pagado" ? "¡Pago Confirmado!" : "Pago Rechazado",
        html: emailHtml,
      })

      console.log("[v0] Notification email sent to:", transaction.profiles.email)
    } catch (emailError) {
      console.error("[v0] Error sending notification email:", emailError)
    }

    console.log("[v0] Transaction status updated successfully")
    return NextResponse.json({ transaction: updatedTransaction })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
