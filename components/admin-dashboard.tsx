"use client"

// Determina el estado real del evento según fecha, hora y status
// Colombia está en UTC-5
function getEventStatus(event: any) {
  // Obtener la fecha y hora del evento en la zona horaria de Colombia
  const now = new Date();
  let eventDate: Date;
  if (event.date && event.time) {
    eventDate = new Date(`${event.date}T${event.time}:00-05:00`);
  } else if (event.date) {
    eventDate = new Date(`${event.date}T00:00:00-05:00`);
  } else {
    eventDate = now;
  }
  if (event.status === "cancelled") return "Cancelado";
  if (event.status === "inactive") return "Inactivo";
  // Si el evento ya pasó
  if (eventDate < now) return "Finalizado";
  // Si el evento está activo y la capacidad máxima se alcanzó
  if (event.status === "active" && event.current_capacity >= event.max_capacity) return "Cerrado";
  // Si el evento está activo y aún hay cupos y no ha pasado la fecha
  if (event.status === "active" && eventDate >= now && event.current_capacity < event.max_capacity) return "Disponible";
  return event.status;
}


import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, MapPin, Clock, Users, Bed, QrCode, CheckCircle } from "lucide-react"
import QRCode from "react-qr-code"

interface Event {
  id: string
  name: string
  description: string
  date: string
  time: string
  location: string
  max_capacity: number
  current_capacity: number
  status: string
  qr_code: string
}

interface Accommodation {
  id: string
  name: string
  type: string
  description: string
  capacity: number
  price_per_night: number
  amenities: string[]
  status: string
}

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface Reservation {
  id: string
  user_id: string
  event_id: string
  accommodation_id: string
  check_in_date: string
  check_out_date: string
  status: string
  qr_code: string
  total_amount: number
  events: Event
  accommodations: Accommodation
  profiles: User
}

interface Transaction {
  id: string
  user_id: string
  event_id: string
  accommodation_id: string
  fecha: string
  monto: number
  estado: string
  profiles: User
  events: Event
  accommodations: Accommodation
}

export function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const supabase = createClient()

  // Form states
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    max_capacity: "",
  })
  const [accommodationForm, setAccommodationForm] = useState({
    name: "",
    type: "",
    description: "",
    capacity: "",
    price_per_night: "",
    amenities: "",
  })

  // Edit states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null)
  const [showQRModal, setShowQRModal] = useState<string | null>(null)
  const [checkInCode, setCheckInCode] = useState("")

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: "default" | "destructive"
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showAccommodationDialog, setShowAccommodationDialog] = useState(false)
  const [showCheckInDialog, setShowCheckInDialog] = useState(false)

  // User management UI state
  const [showUserEditDialog, setShowUserEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<"cliente" | "administrador" | "">("")
  const [editPassword, setEditPassword] = useState("")
  const [inactivateLoading, setInactivateLoading] = useState(false)

  // Send email / reservations modal state
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false)
  const [userReservationsList, setUserReservationsList] = useState<Reservation[]>([])
  const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([])
  const [sendingEmails, setSendingEmails] = useState(false)

const fetchData = async () => {
  let timeoutId: any
  try {
    console.log("[v0] Fetching admin dashboard data")

    // safety timeout: if supabase calls hang, avoid keeping the UI in loading state forever
    const timeoutMs = 10000
    const timeoutId = setTimeout(() => {
      console.error("[v0] fetchData timeout")
      toast("Tiempo de espera agotado al cargar datos. Inténtalo de nuevo.")
      setLoading(false)
    }, timeoutMs)

    // Eventos
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true })

    if (eventsError) throw eventsError

    // Acomodaciones
    const { data: accommodationsData, error: accommodationsError } = await supabase
      .from("accommodations")
      .select("*")
      .order("name")

    if (accommodationsError) throw accommodationsError

    // Perfiles
    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (usersError) throw usersError

    // Reservas (con joins gracias a la FK recién creada)
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select(`
        *,
        event:events(*),
        accommodation:accommodations(*),
        user:profiles(*)
      `)
      .order("created_at", { ascending: false })

    if (reservationsError) {
      console.error("[v0] Error fetching reservations:", reservationsError)
    }

    console.log(
      "[v0] Admin data loaded - Events:",
      eventsData?.length,
      "Accommodations:",
      accommodationsData?.length,
      "Reservations:",
      reservationsData?.length
    )

    setEvents(eventsData || [])
    setAccommodations(accommodationsData || [])
    setUsers(usersData || [])
    setReservations(reservationsData || [])
  } catch (error) {
    console.error("[v0] Error fetching admin data:", error)
    toast("Error: No se pudieron cargar los datos. Inténtalo de nuevo.")
  } finally {
    // clear timeout to avoid leaking timers
    try {
      clearTimeout(timeoutId)
    } catch (e) {
      /* ignore */
    }

    setLoading(false)
  }
}



  const fetchTransactions = async () => {
    setLoadingTransactions(true)
    try {
      console.log("[v0] Fetching transactions")
      const response = await fetch("/api/transactions")
      const data = await response.json()

      if (response.ok) {
        setTransactions(data.transactions || [])
        console.log("[v0] Transactions loaded:", data.transactions?.length || 0)
      } else {
        console.error("[v0] Error fetching transactions:", data.error)
        toast("Error: No se pudieron cargar las transacciones")
      }
    } catch (error) {
      console.error("[v0] Error fetching transactions:", error)
      toast("Error de conexión al cargar transacciones")
    } finally {
      setLoadingTransactions(false)
    }
  }

  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      console.log("[v0] Updating transaction status:", transactionId, "to:", newStatus)
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: newStatus }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Transaction status updated successfully")
        toast(`Estado actualizado a ${newStatus}. Correo enviado al usuario.`)
        fetchTransactions() // Refresh the list
      } else {
        console.error("[v0] Error updating transaction:", data.error)
        toast(`Error: ${data.error || "No se pudo actualizar la transacción"}`)
      }
    } catch (error) {
      console.error("[v0] Error updating transaction:", error)
      toast("Error de conexión al actualizar transacción")
    }
  }

  const createEvent = async () => {
    try {
      console.log("[v0] Creating event:", eventForm)

      // Convertir la fecha a formato ISO (YYYY-MM-DD) para evitar problemas de zona horaria
      const localDate = new Date(eventForm.date)
      const isoDate = localDate.toISOString().split('T')[0]

      const { error } = await supabase.from("events").insert({
        ...eventForm,
        date: isoDate,
        max_capacity: Number.parseInt(eventForm.max_capacity),
        qr_code: `QR_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        created_by: user?.id,
        status: "active",
        current_capacity: 0,
      })

      if (error) throw error

      console.log("[v0] Event created successfully")
      setEventForm({ name: "", description: "", date: "", time: "", location: "", max_capacity: "" })
      setShowEventDialog(false)
      fetchData()

  toast("El evento ha sido creado exitosamente.")
    } catch (error) {
      console.error("[v0] Error creating event:", error)
  toast("No se pudo crear el evento. Inténtalo de nuevo.")
    }
  }

  const updateEvent = async () => {
    if (!editingEvent) return

    try {
      console.log("[v0] Updating event:", editingEvent.id)

      const { error } = await supabase
        .from("events")
        .update({
          ...eventForm,
          max_capacity: Number.parseInt(eventForm.max_capacity),
        })
        .eq("id", editingEvent.id)

      if (error) throw error

      console.log("[v0] Event updated successfully")
      setEventForm({ name: "", description: "", date: "", time: "", location: "", max_capacity: "" })
      setEditingEvent(null)
      setShowEventDialog(false)
      fetchData()

  toast("El evento ha sido actualizado exitosamente.")
    } catch (error) {
      console.error("[v0] Error updating event:", error)
  toast("No se pudo actualizar el evento. Inténtalo de nuevo.")
    }
  }

  const deleteEvent = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    if (!event) return

    setConfirmDialog({
      open: true,
      title: "Eliminar Evento",
      description: `¿Estás seguro de que quieres eliminar el evento "${event.name}"? Esta acción no se puede deshacer.`,
      variant: "destructive",
      onConfirm: async () => {
        try {
          console.log("[v0] Deleting event:", eventId)

          const { error } = await supabase.from("events").delete().eq("id", eventId)

          if (error) throw error

          console.log("[v0] Event deleted successfully")
          fetchData()

          toast("El evento ha sido eliminado exitosamente.")
        } catch (error) {
          console.error("[v0] Error deleting event:", error)
          toast("Error al eliminar evento. No se pudo eliminar el evento. Inténtalo de nuevo.")
        }
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  const createAccommodation = async () => {
    try {
      console.log("[v0] Creating accommodation:", accommodationForm)

      const { error } = await supabase.from("accommodations").insert({
        ...accommodationForm,
        capacity: Number.parseInt(accommodationForm.capacity),
        price_per_night: Number.parseFloat(accommodationForm.price_per_night),
        amenities: accommodationForm.amenities.split(",").map((a) => a.trim()),
        status: "available",
      })

      if (error) throw error

      console.log("[v0] Accommodation created successfully")
      setAccommodationForm({ name: "", type: "", description: "", capacity: "", price_per_night: "", amenities: "" })
      setShowAccommodationDialog(false)
      fetchData()

      toast("El alojamiento ha sido creado exitosamente.")
    } catch (error) {
      console.error("[v0] Error creating accommodation:", error)
      toast("Error al crear alojamiento. No se pudo crear el alojamiento. Inténtalo de nuevo.")
    }
  }

  const updateAccommodation = async () => {
    if (!editingAccommodation) return

    try {
      console.log("[v0] Updating accommodation:", editingAccommodation.id)

      const { error } = await supabase
        .from("accommodations")
        .update({
          ...accommodationForm,
          capacity: Number.parseInt(accommodationForm.capacity),
          price_per_night: Number.parseFloat(accommodationForm.price_per_night),
          amenities: accommodationForm.amenities.split(",").map((a) => a.trim()),
        })
        .eq("id", editingAccommodation.id)

      if (error) throw error

      console.log("[v0] Accommodation updated successfully")
      setAccommodationForm({ name: "", type: "", description: "", capacity: "", price_per_night: "", amenities: "" })
      setEditingAccommodation(null)
      setShowAccommodationDialog(false)
      fetchData()

      toast("El alojamiento ha sido actualizado exitosamente.")
    } catch (error) {
      console.error("[v0] Error updating accommodation:", error)
      toast("Error al actualizar alojamiento. No se pudo actualizar el alojamiento. Inténtalo de nuevo.")
    }
  }

  const deleteAccommodation = async (accommodationId: string) => {
    const accommodation = accommodations.find((a) => a.id === accommodationId)
    if (!accommodation) return

    setConfirmDialog({
      open: true,
      title: "Eliminar Alojamiento",
      description: `¿Estás seguro de que quieres eliminar el alojamiento "${accommodation.name}"? Esta acción no se puede deshacer.`,
      variant: "destructive",
      onConfirm: async () => {
        try {
          console.log("[v0] Deleting accommodation:", accommodationId)

          const { error } = await supabase.from("accommodations").delete().eq("id", accommodationId)

          if (error) throw error

          console.log("[v0] Accommodation deleted successfully")
          fetchData()

          toast("El alojamiento ha sido eliminado exitosamente.")
        } catch (error) {
          console.error("[v0] Error deleting accommodation:", error)
          toast("Error al eliminar alojamiento. No se pudo eliminar el alojamiento. Inténtalo de nuevo.")
        }
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  const performCheckIn = async (reservationId?: string) => {
    try {
      let reservation, error
      if (reservationId) {
        // Buscar por id
        const res = await supabase
          .from("reservations")
          .select(`*, events(*), accommodations(*), profiles(*)`)
          .eq("id", reservationId)
          .single()
        reservation = res.data
        error = res.error
      } else {
        // Buscar por código QR
        const res = await supabase
          .from("reservations")
          .select(`*, events(*), accommodations(*), profiles(*)`)
          .eq("qr_code", checkInCode)
          .single()
        reservation = res.data
        error = res.error
      }

      if (error || !reservation) {
        toast("Código no válido. No se encontró una reserva con este código QR.")
        return
      }

      if (reservation.status === "checked_in") {
        toast("Esta reserva ya tiene check-in realizado.")
        return
      }

      const { error: updateError } = await supabase
        .from("reservations")
        .update({ status: "checked_in" })
        .eq("id", reservation.id)

      if (updateError) throw updateError

      console.log("[v0] Check-in completed successfully")
      setCheckInCode("")
      setShowCheckInDialog(false)
      fetchData()

      toast(`Check-in realizado para ${reservation.profiles.full_name} - ${reservation.events.name}`)
    } catch (error) {
      console.error("[v0] Error performing check-in:", error)
      toast("Error en check-in. No se pudo realizar el check-in. Inténtalo de nuevo.")
    }
  }
  const startEditingEvent = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      max_capacity: event.max_capacity.toString(),
    })
    setShowEventDialog(true)
  }

  const startEditingAccommodation = (accommodation: Accommodation) => {
    setEditingAccommodation(accommodation)
    setAccommodationForm({
      name: accommodation.name,
      type: accommodation.type,
      description: accommodation.description,
      capacity: accommodation.capacity.toString(),
      price_per_night: accommodation.price_per_night.toString(),
      amenities: accommodation.amenities.join(", "),
    })
    setShowAccommodationDialog(true)
  }

  // User management helpers
  const openEditUser = (u: User) => {
    setSelectedUser(u)
    setEditRole((u.role as "cliente" | "administrador") || "")
    setEditPassword("")
    setShowUserEditDialog(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return
    try {
      const body: any = { userId: selectedUser.id }
      if (editRole) body.role = editRole
      if (editPassword) body.password = editPassword

      // Try to get the current session token and send it as Authorization header
      const { data: { session } = {} } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch("/api/admin/modify-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw data

      toast("Usuario actualizado correctamente")
      setShowUserEditDialog(false)
      setSelectedUser(null)
      fetchData()
    } catch (error) {
      console.error("[v0] Error updating user:", error)
      toast("Error al actualizar usuario. Revisa la consola.")
    }
  }

  const handleInactivateUser = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: "Inactivar usuario",
      description: "¿Deseas inactivar este usuario? No podrá iniciar sesión después.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          setInactivateLoading(true)
          const { data: { session } = {} } = await supabase.auth.getSession()
          const accessToken = session?.access_token
          const res = await fetch("/api/admin/modify-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({ userId, inactivate: true }),
          })
          const data = await res.json()
          if (!res.ok) throw data
          toast("Usuario inactivado correctamente")
          fetchData()
        } catch (error) {
          console.error("[v0] Error inactivating user:", error)
          toast("Error al inactivar usuario")
        } finally {
          setInactivateLoading(false)
          setConfirmDialog({ ...confirmDialog, open: false })
        }
      },
    })
  }

  // Send-email / reservations helpers
  const openSendEmailModal = async (u: User) => {
    setSelectedUser(u)
    setUserReservationsList([])
    setSelectedReservationIds([])
    try {
      // obtener reservas del usuario desde supabase (cliente con cookies)
      const { data: resData, error } = await supabase
        .from("reservations")
        .select(`*, events(*), accommodations(*), profiles(*)`)
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setUserReservationsList(resData || [])
      setSelectedReservationIds((resData || []).map((r: any) => r.id))
      setShowSendEmailDialog(true)
    } catch (error) {
      console.error("[v0] Error fetching user reservations:", error)
      toast("No se pudieron cargar las reservas del usuario")
    }
  }

  const toggleReservationSelection = (id: string) => {
    setSelectedReservationIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const handleSendEmails = async () => {
    if (!selectedUser) return
    try {
      setSendingEmails(true)
      const res = await fetch("/api/admin/send-user-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, reservationIds: selectedReservationIds }),
      })
      const data = await res.json()
      if (!res.ok) throw data
      toast("Correos enviados correctamente")
      setShowSendEmailDialog(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("[v0] Error sending reservation emails:", error)
      toast("Error al enviar correos")
    } finally {
      setSendingEmails(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter((e) => e.status === "active").length,
    finishedEvents: events.filter((e) => getEventStatus(e) === "Finalizado").length,
    cancelledEvents: events.filter((e) => getEventStatus(e) === "Cancelado").length,
    totalUsers: users.length,
    totalReservations: reservations.length,
    confirmedReservations: reservations.filter((r) => r.status === "confirmed").length,
    checkedInReservations: reservations.filter((r) => r.status === "checked_in").length,
  }
  // El return debe estar dentro de la función original
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">Unlock Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowCheckInDialog(true)}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-16 4" />
                </svg>
                Check-in
              </Button>
              <span className="text-sm text-gray-600">Hola, {profile?.full_name}</span>
              <Button variant="outline" onClick={signOut}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Administrador</h2>
          <p className="text-gray-600">Gestiona eventos, alojamientos, usuarios y reservas</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="accommodations">Alojamientos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="reservations">Reservas</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">{stats.activeEvents} activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registrados en la plataforma</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reservas</CardTitle>
                  <Bed className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReservations}</div>
                  <p className="text-xs text-muted-foreground">{stats.confirmedReservations} confirmadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.finishedEvents}</div>
                  <p className="text-xs text-muted-foreground">Eventos finalizados</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
                  <Calendar className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.cancelledEvents}</div>
                  <p className="text-xs text-muted-foreground">Eventos cancelados</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reservas Recientes</CardTitle>
                <CardDescription>Últimas reservas realizadas en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Alojamiento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.slice(0, 5).map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{reservation.profiles && reservation.profiles.full_name ? reservation.profiles.full_name : "Usuario eliminado"}</TableCell>
                        <TableCell>{reservation.events?.name || "-"}</TableCell>
                        <TableCell>{reservation.accommodations?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reservation.status === "confirmed"
                                ? "default"
                                : reservation.status === "pendiente"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{reservation.events?.date ? new Date(reservation.events.date).toLocaleDateString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="checkin" className="space-y-6">
            <h3 className="text-lg font-semibold">Sistema de Check-in</h3>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Check-in por QR</CardTitle>
                  <CardDescription>Escanea el código QR para realizar check-in</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                  <Button className="w-full">Activar Escáner QR</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Check-in Manual</CardTitle>
                  <CardDescription>Busca y realiza check-in manualmente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Buscar por nombre o código QR" value={checkInCode} onChange={e => setCheckInCode(e.target.value.toUpperCase())} />
                  <Button className="w-full" onClick={() => performCheckIn()} disabled={!checkInCode}>Buscar Reserva</Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reservas Confirmadas</CardTitle>
                <CardDescription>Reservas listas para check-in</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations
                      .filter((r) => r.status === "confirmed")
                      .map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell>{reservation.profiles && reservation.profiles.full_name ? reservation.profiles.full_name : "Usuario eliminado"}</TableCell>
                          <TableCell>{reservation.events?.name || "-"}</TableCell>
                          <TableCell className="font-mono text-xs">{reservation.qr_code}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => performCheckIn(reservation.id)}
                              className="bg-green-50 hover:bg-green-100"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Check-in
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gestión de Eventos</h3>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setEditingEvent(null)
                  setEventForm({ name: "", description: "", date: "", time: "", location: "", max_capacity: "" })
                  setShowEventDialog(true)
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Crear Evento
              </Button>
            </div>

            {/* Si quieres mostrar errores, usa toast destructivo en fetchData. Aquí solo muestra eventos o mensaje vacío. */}
            {(!events || events.length === 0) && <p>No hay eventos disponibles.</p>}
            {events && events.length > 0 && (
              <div className="grid gap-6">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{event.name}</CardTitle>
                          <CardDescription>{event.description}</CardDescription>
                        </div>
                        <Badge variant={getEventStatus(event) === "Disponible" ? "default" : "secondary"}>{getEventStatus(event)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {event.current_capacity}/{event.max_capacity}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => startEditingEvent(event)}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm8 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h11a2 2 0 012 2z"
                            />
                          </svg>
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowQRModal(event.qr_code)}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0a2 2 0 114 0m-4 0a2 2 0 014 0m-4 0a2 2 0 014 0"
                            />
                          </svg>
                          Ver QR
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 0v18m5-0v18M7 7h12"
                            />
                          </svg>
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accommodations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gestión de Alojamientos</h3>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setEditingAccommodation(null)
                  setAccommodationForm({
                    name: "",
                    type: "",
                    description: "",
                    capacity: "",
                    price_per_night: "",
                    amenities: "",
                  })
                  setShowAccommodationDialog(true)
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Crear Alojamiento
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accommodations.map((accommodation) => (
                <Card key={accommodation.id}>
                  <CardHeader>
                    <CardTitle>{accommodation.name}</CardTitle>
                    <CardDescription>{accommodation.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Capacidad: {accommodation.capacity}</span>
                      <span className="font-semibold">${accommodation.price_per_night}/noche</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {accommodation.amenities.map((amenity: string) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <Badge variant={accommodation.status === "available" ? "default" : "secondary"}>
                        {accommodation.status}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => startEditingAccommodation(accommodation)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm8 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h11a2 2 0 012 2z"
                            />
                          </svg>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAccommodation(accommodation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 0v18m5-0v18M7 7h12"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h3 className="text-lg font-semibold">Gestión de Usuarios</h3>
            <div className="grid gap-6">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{user.full_name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <Badge variant={user.role === "administrador" ? "default" : "secondary"} className="mt-1">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openSendEmailModal(user)}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8m0 0a9 9 0 1118 0 9 9 0 01-18 0zm7 14a2 2 0 01-2 2V6a2 2 0 012 2z"
                            />
                          </svg>
                          Enviar Email
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditUser(user)}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm8 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h11a2 2 0 012 2z"
                            />
                          </svg>
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            <h3 className="text-lg font-semibold">Gestión de Reservas</h3>
            <div className="grid gap-6">
              {reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{reservation.events?.name || "Evento eliminado"}</h4>
                        <p className="text-sm text-gray-600">
                          {reservation.accommodations?.name || "Alojamiento eliminado"}
                        </p>
                        <p className="text-sm">Cliente: {reservation.profiles && reservation.profiles.full_name ? reservation.profiles.full_name : "Usuario eliminado"}</p>
                        <div className="flex space-x-4 text-sm">
                          <span>Check-in: {new Date(reservation.check_in_date).toLocaleDateString()}</span>
                          <span>Check-out: {new Date(reservation.check_out_date).toLocaleDateString()}</span>
                        </div>
                        <p className="font-semibold">Total: ${reservation.total_amount}</p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge
                          variant={
                            reservation.status === "confirmed"
                              ? "default"
                              : reservation.status === "pendiente"
                                ? "secondary"
                                : reservation.status === "checked_in"
                                  ? "default"
                                  : "destructive"
                          }
                        >
                          {reservation.status === "confirmed"
                            ? "Confirmada"
                            : reservation.status === "pendiente"
                              ? "Pendiente"
                              : reservation.status === "checked_in"
                                ? "Check-in realizado"
                                : "Cancelada"}
                        </Badge>
                        {reservation.status === "confirmed" && (
                          <div className="text-center">
                            <QRCode value={reservation.qr_code} size={64} />
                            <div className="text-xs text-gray-600 mt-1">QR: {reservation.qr_code}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Gestión de Transacciones</h3>
              <Button onClick={fetchTransactions} variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h7.586a1 1 0 001.414-1.414L11.586 10H16V4a2 2 0 00-2-2H6a2 2 0 00-2 2z"
                  />
                </svg>
                Actualizar
              </Button>
            </div>

            {loadingTransactions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando transacciones...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {transactions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-600">No hay transacciones registradas</p>
                    </CardContent>
                  </Card>
                ) : (
                  transactions.map((transaction) => (
                    <Card key={transaction.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h4 className="font-semibold">{transaction.profiles?.full_name || "Usuario eliminado"}</h4>
                            <p className="text-sm text-gray-600">{transaction.profiles?.email}</p>
                            <p className="text-sm">
                              <strong>Evento:</strong> {transaction.events?.name || "Evento eliminado"}
                            </p>
                            {transaction.accommodations && (
                              <p className="text-sm">
                                <strong>Alojamiento:</strong> {transaction.accommodations.name}
                              </p>
                            )}
                            <p className="font-semibold text-lg">Monto: ${transaction.monto}</p>
                            <p className="text-xs text-gray-500">
                              Fecha: {new Date(transaction.fecha).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right space-y-3">
                            <Badge
                              variant={
                                transaction.estado === "pagado"
                                  ? "default"
                                  : transaction.estado === "pendiente"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {transaction.estado === "pagado"
                                ? "Pagado"
                                : transaction.estado === "pendiente"
                                  ? "Pendiente"
                                  : "Rechazado"}
                            </Badge>
                            <div className="space-y-2">
                              <Select
                                value={transaction.estado}
                                onValueChange={(newStatus) => updateTransactionStatus(transaction.id, newStatus)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendiente">Pendiente</SelectItem>
                                  <SelectItem value="pagado">Pagado</SelectItem>
                                  <SelectItem value="rechazado">Rechazado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Actualizar Evento" : "Crear Nuevo Evento"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Edita la información del evento" : "Completa la información del evento"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del evento</Label>
              <Input
                id="name"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={eventForm.time}
                  onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacidad máxima</Label>
              <Input
                id="capacity"
                type="number"
                value={eventForm.max_capacity}
                onChange={(e) => setEventForm({ ...eventForm, max_capacity: e.target.value })}
              />
            </div>
            <Button onClick={editingEvent ? updateEvent : createEvent} className="w-full">
              {editingEvent ? "Actualizar Evento" : "Crear Evento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accommodation Dialog */}
      <Dialog open={showAccommodationDialog} onOpenChange={setShowAccommodationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccommodation ? "Actualizar Alojamiento" : "Crear Nuevo Alojamiento"}</DialogTitle>
            <DialogDescription>
              {editingAccommodation
                ? "Edita la información del alojamiento"
                : "Completa la información del alojamiento"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="acc-name">Nombre</Label>
              <Input
                id="acc-name"
                value={accommodationForm.name}
                onChange={(e) => setAccommodationForm({ ...accommodationForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="acc-type">Tipo</Label>
              <Select
                value={accommodationForm.type}
                onValueChange={(value) => setAccommodationForm({ ...accommodationForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habitacion">Habitación</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="acc-description">Descripción</Label>
              <Textarea
                id="acc-description"
                value={accommodationForm.description}
                onChange={(e) => setAccommodationForm({ ...accommodationForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="acc-capacity">Capacidad</Label>
                <Input
                  id="acc-capacity"
                  type="number"
                  value={accommodationForm.capacity}
                  onChange={(e) => setAccommodationForm({ ...accommodationForm, capacity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="acc-price">Precio/noche</Label>
                <Input
                  id="acc-price"
                  type="number"
                  step="0.01"
                  value={accommodationForm.price_per_night}
                  onChange={(e) => setAccommodationForm({ ...accommodationForm, price_per_night: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="acc-amenities">Amenidades (separadas por coma)</Label>
              <Input
                id="acc-amenities"
                value={accommodationForm.amenities}
                onChange={(e) => setAccommodationForm({ ...accommodationForm, amenities: e.target.value })}
                placeholder="wifi, tv, minibar"
              />
            </div>
            <Button onClick={editingAccommodation ? updateAccommodation : createAccommodation} className="w-full">
              {editingAccommodation ? "Actualizar Alojamiento" : "Crear Alojamiento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-in de Reserva</DialogTitle>
            <DialogDescription>Escanea el código QR o ingresa el código manualmente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="checkin-code">Código QR</Label>
              <Input
                id="checkin-code"
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                placeholder="QR_XXXXXXXXX"
              />
            </div>
            <Button onClick={() => performCheckIn()} className="w-full" disabled={!checkInCode}>
              Realizar Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      {showQRModal && (
        <Dialog open={!!showQRModal} onOpenChange={() => setShowQRModal(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Código QR del Evento</DialogTitle>
              <DialogDescription>Código QR para el evento</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <QRCode value={showQRModal} size={200} />
              <p className="text-sm text-gray-600 text-center">Código: {showQRModal}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

        {/* Edit User Dialog */}
        <Dialog open={showUserEditDialog} onOpenChange={setShowUserEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Modifica rol o contraseña del usuario seleccionado</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input value={selectedUser?.full_name || ""} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={selectedUser?.email || ""} disabled />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nueva contraseña (opcional)</Label>
                <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveUser} className="flex-1">Guardar</Button>
                <Button variant="destructive" onClick={() => selectedUser && handleInactivateUser(selectedUser.id)} className="flex-1">Inactivar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Reservations / Email Dialog */}
        <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reservas de {selectedUser?.full_name}</DialogTitle>
              <DialogDescription>Selecciona las reservas a incluir en el correo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {userReservationsList.length === 0 ? (
                <p className="text-sm text-gray-600">No hay reservas para este usuario.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {userReservationsList.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-4">
                        <Checkbox checked={selectedReservationIds.includes(r.id)} onCheckedChange={() => toggleReservationSelection(r.id)} />
                        <div>
                          <div className="font-semibold">{r.events?.name || "Evento"}</div>
                          <div className="text-sm text-gray-600">{r.accommodations?.name || "Alojamiento"} • ${r.total_amount}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{new Date(r.check_in_date).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={handleSendEmails} disabled={sendingEmails || selectedReservationIds.length === 0} className="flex-1">
                  {sendingEmails ? "Enviando..." : "Enviar Correo"}
                </Button>
                <Button variant="outline" onClick={() => setShowSendEmailDialog(false)} className="flex-1">Cerrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

    </div>
  )
}
