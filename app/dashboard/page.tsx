import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientDashboard } from "@/components/client-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Render appropriate dashboard based on role
  if (profile.role === "administrador") {
    return <AdminDashboard />
  } else {
    return <ClientDashboard />
  }
}
