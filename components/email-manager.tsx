"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Send, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface EmailManagerProps {
  users: User[]
}

export function EmailManager({ users }: EmailManagerProps) {
  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
    recipients: "all" as "all" | "clients" | "admins" | "custom",
    customEmails: "",
  })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  const handleSendEmail = async () => {
    setSending(true)
    try {
      let recipientEmails: string[] = []

      switch (emailForm.recipients) {
        case "all":
          recipientEmails = users.map((user) => user.email)
          break
        case "clients":
          recipientEmails = users.filter((user) => user.role === "cliente").map((user) => user.email)
          break
        case "admins":
          recipientEmails = users.filter((user) => user.role === "administrador").map((user) => user.email)
          break
        case "custom":
          recipientEmails = emailForm.customEmails.split(",").map((email) => email.trim())
          break
      }

      // Here you would integrate with your email service (SendGrid, Resend, etc.)
      console.log("Sending email to:", recipientEmails)
      console.log("Subject:", emailForm.subject)
      console.log("Message:", emailForm.message)

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert(`Email enviado exitosamente a ${recipientEmails.length} destinatarios`)
      setEmailForm({ subject: "", message: "", recipients: "all", customEmails: "" })
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Error al enviar el email")
    } finally {
      setSending(false)
    }
  }

  const getRecipientCount = () => {
    switch (emailForm.recipients) {
      case "all":
        return users.length
      case "clients":
        return users.filter((user) => user.role === "cliente").length
      case "admins":
        return users.filter((user) => user.role === "administrador").length
      case "custom":
        return emailForm.customEmails.split(",").filter((email) => email.trim()).length
      default:
        return 0
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Envío de Correos Masivos</span>
        </CardTitle>
        <CardDescription>Envía correos electrónicos a usuarios registrados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Asunto del correo</Label>
            <Input
              id="subject"
              placeholder="Ingresa el asunto del correo"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              placeholder="Escribe tu mensaje aquí..."
              rows={6}
              value={emailForm.message}
              onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="recipients">Destinatarios</Label>
            <Select
              value={emailForm.recipients}
              onValueChange={(value: any) => setEmailForm({ ...emailForm, recipients: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona los destinatarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                <SelectItem value="clients">Solo clientes</SelectItem>
                <SelectItem value="admins">Solo administradores</SelectItem>
                <SelectItem value="custom">Correos personalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {emailForm.recipients === "custom" && (
            <div>
              <Label htmlFor="customEmails">Correos personalizados</Label>
              <Textarea
                id="customEmails"
                placeholder="email1@example.com, email2@example.com, ..."
                rows={3}
                value={emailForm.customEmails}
                onChange={(e) => setEmailForm({ ...emailForm, customEmails: e.target.value })}
              />
              <p className="text-sm text-gray-600 mt-1">Separa los correos con comas</p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Destinatarios seleccionados:</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{getRecipientCount()}</span>
          </div>

          <Button
            onClick={handleSendEmail}
            disabled={sending || !emailForm.subject || !emailForm.message || getRecipientCount() === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Correo
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
