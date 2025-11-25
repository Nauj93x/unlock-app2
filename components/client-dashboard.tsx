"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, Users, Bed, Wifi, Tv, Coffee, Car } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { QRCodeSVG as QRCode } from "qrcode.react"

interface Event {
  id: string
  name: string
  description: string
  date: string
  time: string
  location: string
  max_capacity: number
  current_capacity: number
  estado: string
  fecha_inicio: string
  fecha_fin: string
}

interface Accommodation {
  id: string
  name: string
  type: string
  description: string
  capacity: number
  capacidad_maxima: number
  price_per_night: number
  amenities: string[]
  status: string
  estado: string
}

interface Transaction {
  id: string
  user_id: string
  event_id: string
  accommodation_id: string
  amount: number
  status: string
  created_at: string
  updated_at: string
  expires_at: string | null
  events: Event
  accommodations: Accommodation
}


const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  tv: <Tv className="w-4 h-4" />,
  minibar: <Coffee className="w-4 h-4" />,
  balcón: <Car className="w-4 h-4" />,
  aire_acondicionado: <Car className="w-4 h-4" />,
  escritorio: <Car className="w-4 h-4" />,
  cocina: <Coffee className="w-4 h-4" />,
  sala: <Bed className="w-4 h-4" />,
}

export function ClientDashboard() {
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [processingReservation, setProcessingReservation] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

const fetchData = async () => {
  let timeoutId: any
  try {
    console.log("[v0] Fetching client dashboard data")
    // timeout to avoid UI hanging
    timeoutId = setTimeout(() => {
      console.error("[v0] fetchData timeout")
      toast({ variant: "destructive", title: "Error", description: "Tiempo de espera agotado al cargar datos." })
      setLoading(false)
    }, 10000)

    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .order("date", { ascending: true })

    console.log("[v0] events query finished")
    if (eventsError) throw eventsError

    // Transformamos los eventos y les añadimos el campo `estado`
    const mappedEvents = (eventsData || []).map((event) => {
      const now = new Date()
      const eventDateTime = new Date(`${event.date}T${event.time}`)

      let estado = "disponible"

      // Si ya alcanzó el cupo máximo
      if (event.current_capacity >= event.max_capacity) {
        estado = "cerrado"
      } 
      // Si la fecha y hora del evento ya pasaron
      else if (eventDateTime < now) {
        estado = "finalizado"
      }

      return {
        ...event,
        estado,
      }
    })


    const { data: accommodationsData, error: accommodationsError } = await supabase
      .from("accommodations")
      .select("*")
      .eq("status", "available")
      .order("name")

    console.log("[v0] accommodations query finished")
    if (accommodationsError) throw accommodationsError

    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select(`
        *,
        events(*),
        accommodations(*)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })

    console.log("[v0] transactions query finished")
    if (transactionsError) throw transactionsError

    console.log("[v0] Events loaded:", mappedEvents.length)
    console.log("[v0] Accommodations loaded:", accommodationsData?.length || 0)
    console.log("[v0] Transactions loaded:", transactionsData?.length || 0)

    setEvents(mappedEvents)
    setAccommodations(accommodationsData || [])
    setTransactions(transactionsData || [])
  } catch (error) {
    console.error("[v0] Error fetching data:", error)
    toast({
      variant: "destructive",
      title: "Error",
      description: "No se pudieron cargar los datos. Inténtalo de nuevo.",
    })
  } finally {
    try {
      if (timeoutId) clearTimeout(timeoutId)
    } catch (e) {
      /* ignore */
    }
    setLoading(false)
  }
}


  const makeReservation = async (eventId: string, accommodationId?: string) => {
    setProcessingReservation(true);
    try {
      console.log("[v0] Creating transaction for event:", eventId, "accommodation:", accommodationId);

      const event = events.find((e) => e.id === eventId);
      const accommodation = accommodationId ? accommodations.find((a) => a.id === accommodationId) : null;

      if (!event) {
        throw new Error("Evento no encontrado");
      }

      const { count: currentReservations } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("event_id", eventId)
        .in("status", ["pendiente", "pagado"]);

      if (currentReservations === null) {
        throw new Error("No se pudieron obtener las reservas actuales.");
      }



      // Calcular el costo total
      const baseEventCost = 100; // Costo base del evento
      const accommodationCost = accommodation ? accommodation.price_per_night * 2 : 0; // Costo de alojamiento
      const totalAmount = baseEventCost + accommodationCost;

      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 3);

      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user?.id,
          event_id: eventId,
          accommodation_id: accommodationId || null,
          amount: totalAmount,
          status: "pendiente",
          created_at: new Date().toISOString(),
          expires_at: expirationTime.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log("[v0] Transaction created successfully:", transaction.id);

      // Llamada a la API para enviar el correo de confirmación
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: profile?.email || user?.email || "",
          subject: `Reserva para ${event.name} - Pago Pendiente`,
          type: "reservation",
          data: {
            userName: profile?.full_name || "Usuario",
            eventName: event.name,
            amount: totalAmount,
            expirationTime: expirationTime.toLocaleString(),
          },
        }),
      });

      if (response.ok) {
        console.log("[v0] Reservation email sent successfully");
      }

      // Cerrar el modal y resetear la selección
      setShowReservationModal(false);
      setSelectedEvent(null);
      setSelectedAccommodation(null);
      fetchData();

      toast({
        title: "¡Reserva creada!",
        description: `Tu reserva ha sido creada. Tienes 3 minutos para realizar el pago de $${totalAmount}. Revisa tu correo.`,
      });
    } catch (error) {
      const e = error as Error; // Hacer un cast explícito
      console.error("[v0] Error creating reservation:", e.message);
      toast({
        variant: "destructive",
        title: "Error al crear reserva",
        description: e.message || "No se pudo crear la reserva. Inténtalo de nuevo.",
      });
    } finally {
      setProcessingReservation(false);
    }
  };


  const openReservationModal = (event: Event) => {
    if (event.estado === "cerrado") {
      toast({
        variant: "destructive",
        title: "Evento cerrado",
        description: "Este evento ya alcanzó su capacidad máxima.",
      })
      return
    }

    if (event.estado === "finalizado") {
      toast({
        variant: "destructive",
        title: "Evento finalizado",
        description: "Este evento ya ha terminado.",
      })
      return
    }

    setSelectedEvent(event)
    setShowReservationModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
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
              <span className="text-sm text-gray-600">Hola, {profile?.full_name}</span>
              <Button variant="outline" onClick={signOut} className="rounded-lg bg-transparent">
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard del Cliente</h2>
          <p className="text-gray-600">Gestiona tus reservas y explora eventos disponibles</p>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="accommodations">Alojamientos</TabsTrigger>
            <TabsTrigger value="transactions">Mis Transacciones</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {event.fecha_inicio
                          ? new Date(event.fecha_inicio).toLocaleDateString()
                          : new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.current_capacity || 0}/{event.max_capacity || 0} participantes
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge
                        variant={
                          event.estado === "disponible"
                            ? "default"
                            : event.estado === "cerrado"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {event.estado === "disponible"
                          ? "Disponible"
                          : event.estado === "cerrado"
                            ? "Cerrado"
                            : "Finalizado"}
                      </Badge>
                      <Button
                        onClick={() => openReservationModal(event)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={event.estado !== "disponible"}
                      >
                        {event.estado === "disponible"
                          ? "Reservar"
                          : event.estado === "cerrado"
                            ? "Lleno"
                            : "Finalizado"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="accommodations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accommodations.map((accommodation) => (
                <Card key={accommodation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{accommodation.name}</CardTitle>
                    <CardDescription>{accommodation.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Bed className="w-4 h-4" />
                      <span>Capacidad: {accommodation.capacity} personas</span>
                    </div>
                    <div className="text-lg font-semibold text-blue-600">${accommodation.price_per_night}/noche</div>
                    <div className="flex flex-wrap gap-2">
                      {accommodation.amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {amenityIcons[amenity] || <Coffee className="w-3 h-3" />}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                    <Badge variant={accommodation.status === "available" ? "default" : "secondary"}>
                      {accommodation.status === "available" ? "Disponible" : "No disponible"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid gap-6">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{transaction.events?.name || "Event deleted"}</CardTitle>
                        <CardDescription>{transaction.accommodations?.name || "No accommodation"}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          transaction.status === "pagado"
                            ? "default"
                            : transaction.status === "pendiente"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {transaction.status === "pagado"
                          ? "pagado"
                          : transaction.status === "pendiente"
                            ? "pendiente"
                            : transaction.status === "expired"
                              ? "Expired"
                              : "Rejected"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Reservation date:</span>
                        <br />
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                      {transaction.expires_at && transaction.status === "pendiente" && (
                        <div>
                          <span className="font-medium">Expires at:</span>
                          <br />
                          <span className="text-red-600">
                            {new Date(transaction.expires_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-semibold text-blue-600">Total: ${transaction.amount}</div>
                      {transaction.status === "pagado" && (
                        <div className="text-center">
                          <QRCode
                            value={`${transaction.user_id}-${transaction.event_id}-${transaction.id}`}
                            size={64}
                          />
                          <div className="text-xs text-gray-600 mt-1">Access QR</div>
                        </div>
                      )}
                    </div>
                    {transaction.status === "pendiente" && transaction.expires_at && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>pendiente payment:</strong> You have until{" "}
                          {new Date(transaction.expires_at).toLocaleString()} to make the payment.
                        </p>
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))}
              {transactions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">Aún no tienes ninguna transacción. Explora los eventos disponibles!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {showReservationModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Reservar para {selectedEvent.name}</h3>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Costo base del evento:</strong> $100
              </p>
              <p className="text-xs text-blue-600 mt-1">Puedes agregar alojamiento opcional (2 noches)</p>
            </div>

            <p className="text-gray-600 mb-4">Selecciona un alojamiento (opcional):</p>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              <div
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  !selectedAccommodation ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedAccommodation(null)}
              >
                <div className="font-medium">Solo evento (sin alojamiento)</div>
                <div className="text-sm text-gray-600">$100 total</div>
              </div>
              {accommodations.map((accommodation) => (
                <div
                  key={accommodation.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAccommodation?.id === accommodation.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedAccommodation(accommodation)}
                >
                  <div className="font-medium">{accommodation.name}</div>
                  <div className="text-sm text-gray-600">
                    ${accommodation.price_per_night * 2 + 100} total (evento + 2 noches)
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReservationModal(false)
                  setSelectedEvent(null)
                  setSelectedAccommodation(null)
                }}
                disabled={processingReservation}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  makeReservation(selectedEvent.id, selectedAccommodation?.id)
                }}
                disabled={processingReservation}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processingReservation ? "Procesando..." : "Confirmar Reserva"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
