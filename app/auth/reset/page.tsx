"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const supabase = createClient()
        // Try to get session from URL (Supabase puts tokens in the callback)
        // First, attempt the SDK helper to parse the URL (covers access_token flow)
        try {
          if ((supabase.auth as any).getSessionFromUrl) {
            const result = await (supabase.auth as any).getSessionFromUrl()
            if (result?.data?.session) {
              if (mounted) setSessionReady(true)
              return
            }
          }
        } catch (e) {
          // ignore and continue to other flows
        }

        // Support PKCE/code flow: if the provider sent a `code` param, exchange it
        // for a session using the SDK's exchangeCodeForSession method.
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        if (code && (supabase.auth as any).exchangeCodeForSession) {
          try {
            const exchange = await (supabase.auth as any).exchangeCodeForSession(code)
            if (exchange?.data?.session) {
              // remove code from URL
              const url = new URL(window.location.href)
              url.searchParams.delete("code")
              window.history.replaceState(window.history.state, "", url.toString())
              if (mounted) setSessionReady(true)
              return
            }
          } catch (e) {
            console.warn("PKCE exchange failed:", e)
          }
        }

        // Fallback: check for access_token/type in query (older flows)
        const type = params.get("type")
        const accessToken = params.get("access_token")
        if (type === "recovery" && accessToken) {
          if (mounted) setSessionReady(true)
        }
      } catch (err) {
        console.error("Error initializing reset page:", err)
        setMessage("No se pudo procesar el enlace de reinicio. Intenta solicitar otro enlace.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!newPassword || newPassword.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    try {
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword } as any)
      if (error) throw error
      setMessage("Contraseña actualizada correctamente. Serás redirigido al dashboard.")
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Error al actualizar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">Restablecer contraseña</h2>
          {loading && <div className="p-2 mb-4 text-sm text-gray-600">Procesando enlace...</div>}

          {message && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 mb-4">
              <p className="text-sm text-yellow-800">{message}</p>
            </div>
          )}

          {sessionReady ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-xl border-gray-200 h-12 px-3"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </form>
          ) : (
            <div>
              <p className="text-sm text-gray-700 mb-4">El enlace no es válido o expiró. Como alternativa introduce tu correo y una nueva contraseña para restablecer (sólo en entorno de desarrollo).</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setMessage(null)
                  if (!newPassword || newPassword.length < 6) {
                    setMessage("La contraseña debe tener al menos 6 caracteres.")
                    return
                  }
                  // Show an inline email input in this form instead of using prompt
                  const form = e.target as HTMLFormElement
                  const formData = new FormData(form)
                  const email = formData.get("email") as string
                  if (!email) {
                    setMessage("Email requerido para resetear contraseña.")
                    return
                  }
                  try {
                    setLoading(true)
                    const res = await fetch('/api/admin/reset-password-by-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, password: newPassword }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw data
                    setMessage('Contraseña actualizada correctamente (vía admin). Serás redirigido al login.')
                    setTimeout(() => router.push('/auth/login'), 1500)
                  } catch (err:any) {
                    console.error('Fallback reset error:', err)
                    setMessage(err?.error || err?.message || 'No se pudo resetear la contraseña')
                  } finally {
                    setLoading(false)
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email del usuario</label>
                  <input name="email" type="email" className="mt-1 block w-full rounded-xl border-gray-200 h-12 px-3" placeholder="usuario@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-xl border-gray-200 h-12 px-3"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Procesando...' : 'Resetear contraseña (dev)'}</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
