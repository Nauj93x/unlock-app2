import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    console.log("[v0] Fetching all transactions")

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        *,
        profiles:user_id (full_name, email),
        events:event_id (name, max_capacity, status, location, date, time),
        accommodations:accommodation_id (name, capacity, status, type, price_per_night)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching transactions:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Transactions loaded:", transactions?.length || 0)
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  try {
    const { user_id, event_id, accommodation_id, monto } = await request.json()

    console.log("[v0] Creating new transaction for user:", user_id, "event:", event_id)

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("name, max_capacity, status, location, date, time")
      .eq("id", event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
    }

    if (event.status !== "available") {
      return NextResponse.json(
        {
          error: event.status === "closed" ? "Este evento ya está cerrado" : "Este evento ya ha finalizado",
        },
        { status: 400 },
      )
    }

    const { count: currentReservations } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("event_id", event_id)
      .in("estado", ["pendiente", "pagado"])

    if (currentReservations >= event.max_capacity) {
      return NextResponse.json(
        {
          error: "Este evento ya alcanzó su capacidad máxima",
        },
        { status: 400 },
      )
    }

    if (accommodation_id) {
      const { data: accommodation, error: accError } = await supabase
        .from("accommodations")
        .select("name, capacity, status, type, price_per_night")
        .eq("id", accommodation_id)
        .single()

      if (accError || !accommodation) {
        return NextResponse.json({ error: "Alojamiento no encontrado" }, { status: 404 })
      }

      if (accommodation.status !== "available") {
        return NextResponse.json({ error: "Este alojamiento no está disponible" }, { status: 400 })
      }

      const { count: currentAccommodationReservations } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("accommodation_id", accommodation_id)
        .in("estado", ["pendiente", "pagado"])

      if (currentAccommodationReservations >= accommodation.capacity) {
        return NextResponse.json(
          {
            error: "Este alojamiento ya está lleno",
          },
          { status: 400 },
        )
      }
    }

    const expirationTime = new Date()
    expirationTime.setMinutes(expirationTime.getMinutes() + 3)

    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        user_id,
        event_id,
        accommodation_id,
        monto,
        estado: "pendiente",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating transaction:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Transaction created successfully:", transaction.id)
    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
