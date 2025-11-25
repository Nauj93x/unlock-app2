import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">¡Registro exitoso!</CardTitle>
            <CardDescription className="text-gray-600 text-lg">Verifica tu correo electrónico</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">
              Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada y haz clic en el
              enlace para activar tu cuenta.
            </p>
            <Button asChild className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
