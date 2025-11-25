"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, User, Calendar } from "lucide-react"

interface CheckInSuccessProps {
  reservation: any
  onNewCheckIn: () => void
}

export function CheckInSuccess({ reservation, onNewCheckIn }: CheckInSuccessProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <CardTitle className="text-3xl text-green-600">¡Check-in Exitoso!</CardTitle>
        <CardDescription>El check-in se ha realizado correctamente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="p-6 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <User className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-lg">{reservation.profiles.full_name}</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-green-700">{reservation.events.name}</span>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Hora de check-in: {new Date().toLocaleString()}</p>
            <p>Código QR: {reservation.qr_code}</p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button onClick={onNewCheckIn} className="flex-1 bg-blue-600 hover:bg-blue-700">
            Realizar Otro Check-in
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
