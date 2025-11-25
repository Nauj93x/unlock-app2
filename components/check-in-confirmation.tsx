"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, User, Calendar, MapPin, Bed } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CheckInConfirmationProps {
  reservation: any
  onConfirm: () => void
  onCancel: () => void
}

export function CheckInConfirmation({ reservation, onConfirm, onCancel }: CheckInConfirmationProps) {
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleConfirmCheckIn = async () => {
    setLoading(true)
    try {
      // Update reservation status
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ status: "checked_in" })
        .eq("id", reservation.id)

      if (reservationError) throw reservationError

      // Create check-in record
      const { error: checkInError } = await supabase.from("check_ins").insert({
        reservation_id: reservation.id,
        user_id: reservation.user_id,
        event_id: reservation.event_id,
        check_in_method: "qr_code",
        notes: notes || "Check-in realizado via QR",
      })

      if (checkInError) throw checkInError

      onConfirm()
    } catch (error) {
      console.error("Error performing check-in:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">Confirmar Check-in</CardTitle>
        <CardDescription>Verifica los datos antes de confirmar el check-in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">{reservation.profiles.full_name}</p>
              <p className="text-sm text-gray-600">{reservation.profiles.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">{reservation.events.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(reservation.events.date).toLocaleDateString()} - {reservation.events.time}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">{reservation.events.location}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Bed className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium">{reservation.accommodations.name}</p>
              <p className="text-sm text-gray-600">{reservation.accommodations.type}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <span className="font-medium">Estado actual:</span>
          <Badge variant="default">Confirmada</Badge>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <span className="font-medium">Código QR:</span>
          <span className="font-mono text-sm">{reservation.qr_code}</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas adicionales (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Agregar notas sobre el check-in..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex space-x-4">
          <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent">
            Cancelar
          </Button>
          <Button onClick={handleConfirmCheckIn} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
            {loading ? "Procesando..." : "Confirmar Check-in"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
