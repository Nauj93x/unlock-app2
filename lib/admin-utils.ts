import { createClient } from "@/lib/supabase/server"

// Server-side utility to check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return data.role === "administrador"
  } catch (error) {
    console.error("Error in isUserAdmin:", error)
    return false
  }
}

// Server-side utility to get all profiles (admin only)
export async function getAllProfiles(adminUserId: string) {
  const isAdmin = await isUserAdmin(adminUserId)

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const supabase = createClient()

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data
}

// Server-side utility to manage events (admin only)
export async function manageEvent(adminUserId: string, action: "create" | "update" | "delete", eventData: any) {
  const isAdmin = await isUserAdmin(adminUserId)

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const supabase = createClient()

  switch (action) {
    case "create":
      return await supabase.from("events").insert(eventData).select().single()
    case "update":
      return await supabase.from("events").update(eventData).eq("id", eventData.id).select().single()
    case "delete":
      return await supabase.from("events").delete().eq("id", eventData.id)
    default:
      throw new Error("Invalid action")
  }
}
