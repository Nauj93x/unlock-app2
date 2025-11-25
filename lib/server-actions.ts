"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper function to check if user is admin
async function requireAdmin() {
  const supabase = createClient()

  const {
    data: { user },
  } = await (await supabase).auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data: profile, error } = await (await supabase).from("profiles").select("role").eq("id", user.id).single()

  if (error || profile?.role !== "administrador") {
    throw new Error("Admin access required")
  }

  return { user, supabase }
}

// Admin: Get all profiles
export async function getAllProfiles() {
  const { supabase } = await requireAdmin()

  const { data, error } = await (await supabase).from("profiles").select("*").order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  return data
}

// Admin: Update user role
export async function updateUserRole(userId: string, newRole: "cliente" | "administrador") {
  const { supabase } = await requireAdmin()

  const { data, error } = await (await supabase).from("profiles").update({ role: newRole }).eq("id", userId).select().single()

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  revalidatePath("/dashboard")
  return data
}

// Admin: Create event
export async function createEvent(eventData: {
  name: string
  description?: string
  date: string
  time: string
  location: string
  max_capacity?: number
}) {
  const { user, supabase } = await requireAdmin()

  const { data, error } = await (await supabase)
    .from("events")
    .insert({
      ...eventData,
      created_by: user.id,
      qr_code: `event_${Date.now()}`,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`)
  }

  revalidatePath("/dashboard")
  return data
}

// Admin: Get all events
export async function getAllEvents() {
  const { supabase } = await requireAdmin()

  const { data, error } = await (await supabase).from("events").select("*").order("date", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`)
  }

  return data
}

// Admin: Get all reservations
export async function getAllReservations() {
  const { supabase } = await requireAdmin()

  const { data, error } = await (await supabase)
    .from("reservations")
    .select(
      `
      *,
      profiles:user_id (full_name, email),
      events:event_id (name, date),
      accommodations:accommodation_id (name, type)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch reservations: ${error.message}`)
  }

  return data
}


// User: Get own reservations
export async function getUserReservations() {
  const supabase = createClient()

  const {
    data: { user },
  } = await (await supabase).auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await (await supabase)
    .from("reservations")
    .select(
      `
      *,
      events:event_id (name, date, time, location),
      accommodations:accommodation_id (name, type, description)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch reservations: ${error.message}`)
  }

  return data
}

// Obtener todos los eventos activos (sin requerir admin)
export async function getPublicEvents() {
  const supabase = createClient()
  const { data, error } = await (await supabase)
    .from("events")
    .select("*")
    .eq("status", "active")
    .order("date", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`)
  }

  return data
}
