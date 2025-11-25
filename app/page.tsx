import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Bed, QrCode, Shield, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Unlock</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-lg bg-transparent">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="rounded-lg bg-blue-600 hover:bg-blue-700">Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Plataforma de gestión de eventos
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
              Gestiona eventos y alojamientos con{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Unlock</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto text-pretty">
              La solución completa para organizar eventos, gestionar reservas y realizar check-ins con códigos QR. Todo
              en una plataforma moderna y fácil de usar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 py-4 text-lg rounded-xl bg-blue-600 hover:bg-blue-700">
                Comenzar gratis
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg rounded-xl bg-transparent">
                Ver demo
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Gestión de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Crea y administra eventos con facilidad. Control total sobre fechas, ubicaciones y capacidad.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Bed className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Alojamientos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Administra habitaciones, suites y apartamentos. Precios, amenidades y disponibilidad en tiempo real.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Check-in QR</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Sistema de check-in automático con códigos QR. Rápido, seguro y sin contacto.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Administra clientes y personal. Roles diferenciados con permisos específicos para cada usuario.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Autenticación segura y protección de datos. Cumplimiento con estándares de seguridad modernos.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Tiempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Actualizaciones en tiempo real. Ve cambios instantáneamente sin necesidad de recargar la página.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
              <p className="text-xl mb-8 text-blue-100">
                Únete a cientos de organizadores que ya confían en Unlock para gestionar sus eventos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="px-8 py-4 text-lg rounded-xl bg-white text-blue-600 hover:bg-gray-100">
                    Crear cuenta gratis
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg rounded-xl border-white text-white hover:bg-white/10 bg-transparent"
                  >
                    Iniciar sesión
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Unlock</span>
            </div>
            <p className="text-gray-600 text-sm">© 2024 Unlock. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
