"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Camera, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface QRScannerProps {
  onScanSuccess: (qrCode: string, reservation: any) => void
  onScanError: (error: string) => void
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const supabase = createClient()

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (error) {
      onScanError("No se pudo acceder a la cámara")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const processQRCode = async (qrCode: string) => {
    setLoading(true)
    try {
      // Search for reservation by QR code
      const { data: reservation, error } = await supabase
        .from("reservations")
        .select(`
          *,
          profiles(*),
          events(*),
          accommodations(*)
        `)
        .eq("qr_code", qrCode)
        .single()

      if (error || !reservation) {
        onScanError("Código QR no válido o reserva no encontrada")
        return
      }

      if (reservation.status === "checked_in") {
        onScanError("Esta reserva ya tiene check-in realizado")
        return
      }

      if (reservation.status !== "confirmed") {
        onScanError("La reserva debe estar confirmada para realizar check-in")
        return
      }

      onScanSuccess(qrCode, reservation)
    } catch (error) {
      onScanError("Error al procesar el código QR")
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      processQRCode(manualCode.trim())
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Escáner QR</span>
          </CardTitle>
          <CardDescription>Escanea el código QR de la reserva para realizar check-in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Presiona el botón para activar la cámara</p>
                </div>
              </div>
              <Button onClick={startCamera} className="w-full bg-blue-600 hover:bg-blue-700">
                <Camera className="w-4 h-4 mr-2" />
                Activar Cámara
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-black rounded-lg object-cover" />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
                </div>
              </div>
              <Button onClick={stopCamera} variant="outline" className="w-full bg-transparent">
                <X className="w-4 h-4 mr-2" />
                Detener Cámara
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingreso Manual</CardTitle>
          <CardDescription>Ingresa el código QR manualmente si no puedes escanearlo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Ingresa el código QR (ej: QR_ABC123)"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" disabled={loading || !manualCode.trim()} className="w-full">
              {loading ? "Procesando..." : "Verificar Código"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
