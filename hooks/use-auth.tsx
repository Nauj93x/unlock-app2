"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

interface Profile {
  id: string
  email: string
  full_name: string
  role: "cliente" | "administrador"
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    try {
      console.log("[v0] Fetching profile for user:", userId)

      // Direct query without any RLS complications
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.log("[v0] Profile error:", error.code, error.message)

        // If profile doesn't exist, create it directly
        if (error.code === "PGRST116") {
          console.log("[v0] Creating profile for new user")

          const { data: userData } = await supabase.auth.getUser()
          if (userData.user) {
            const newProfile = {
              id: userId,
              email: userData.user.email || "",
              full_name: userData.user.user_metadata?.full_name || userData.user.email?.split("@")[0] || "",
              role: "cliente" as const,
            }

            const { data: createdProfile, error: createError } = await supabase
              .from("profiles")
              .insert(newProfile)
              .select()
              .single()

            if (createError) {
              console.error("[v0] Error creating profile:", createError)
              setProfile(null)
              return
            }

            console.log("[v0] Profile created:", createdProfile)
            setProfile(createdProfile)
            return
          }
        }

        setProfile(null)
        return
      }

      console.log("[v0] Profile loaded:", data)
      setProfile(data)
    } catch (error) {
      console.error("[v0] Fetch profile exception:", error)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return

        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error("[v0] Init auth error:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("[v0] Auth event:", event)
      setUser(session?.user ?? null)

      if (session?.user && event !== "SIGNED_OUT") {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      // Call server-side logout to ensure SSR cookies are cleared
      const res = await fetch('/auth/logout', { method: 'POST' })
      if (!res.ok) {
        console.error('[v0] Server logout failed', res.status)
      }
      setUser(null)
      setProfile(null)
      router.push("/auth/login")
    } catch (error) {
      console.error("[v0] Error signing out:", error)
    }
  }

  const isAdmin = profile?.role === "administrador"
  const isClient = profile?.role === "cliente"

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        isAdmin,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
