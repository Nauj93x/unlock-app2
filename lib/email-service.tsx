import nodemailer from "nodemailer"

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailData {
  to: string
  subject: string
  html: string
}

export async function sendEmail(emailData: EmailData) {
  try {
    console.log("[v0] Sending email to:", emailData.to)

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    })

    console.log("[v0] Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return { success: false, error: error.message }
  }
}

export function generateReservationEmail(userName: string, eventName: string, amount: number) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">¡Gracias por tu reserva!</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Hemos recibido tu reserva para el evento <strong>${eventName}</strong>.</p>
      <p><strong>Monto a pagar:</strong> $${amount}</p>
      <p>Para confirmar tu reserva, realiza el pago con Visa/Mastercard usando el siguiente enlace:</p>
      <a href="https://payment-simulator.example.com/pay?amount=${amount}" 
         style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Realizar Pago
      </a>
      <p style="margin-top: 20px;">Una vez confirmado el pago, recibirás un correo de confirmación.</p>
      <p>Saludos,<br>Equipo Unlock</p>
    </div>
  `
}

export function generatePaymentConfirmationEmail(userName: string, eventName: string, status: string) {
  const isApproved = status === "pagado"
  const title = isApproved ? "¡Pago Confirmado!" : "Pago Rechazado"
  const message = isApproved
    ? `Tu pago fue confirmado exitosamente. Tu reserva para el evento <strong>${eventName}</strong> está activa.`
    : `Tu pago fue rechazado. Por favor, intenta realizar el pago nuevamente.`

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isApproved ? "#28a745" : "#dc3545"};">${title}</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>${message}</p>
      ${isApproved ? "<p>¡Nos vemos en el evento!</p>" : "<p>Si tienes problemas, contacta con nuestro soporte.</p>"}
      <p>Saludos,<br>Equipo Unlock</p>
    </div>
  `
}
