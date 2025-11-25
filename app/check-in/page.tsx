"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { QRScanner } from "@/components/qr-scanner"
import { CheckInConfirmation } from "@/components/check-in-confirmation"
import { CheckInSuccess } from "@/components/check-in-success"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type CheckInStep = "scan" | "confirm" | "success"

export default function CheckInPage() {
  const [currentStep, setCurrentStep] = useState<CheckInStep>("scan")
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScanSuccess = (qrCode: string, reservation: any) => {
    setSelectedReservation(reservation)
    setCurrentStep("confirm")
    setError(null)
  }

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage)
    setTimeout(() => setError(null), 5000)
  }

  const handleConfirmCheckIn = () => {
    setCurrentStep("success")
  }

  const handleNewCheckIn = () => {
    setCurrentStep("scan")
    setSelectedReservation(null)
    setError(null)
  }

  const handleCancel = () => {
    setCurrentStep("scan")
    setSelectedReservation(null)
    setError(null)
  }

  return (
    <AuthGuard requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Sistema de Check-in</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {currentStep === "scan" && <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />}

          {currentStep === "confirm" && selectedReservation && (
            <CheckInConfirmation
              reservation={selectedReservation}
              onConfirm={handleConfirmCheckIn}
              onCancel={handleCancel}
            />
          )}

          {currentStep === "success" && selectedReservation && (
            <CheckInSuccess reservation={selectedReservation} onNewCheckIn={handleNewCheckIn} />
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
