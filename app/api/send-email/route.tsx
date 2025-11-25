import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { to, subject, type, data } = await request.json()

    let html = ""

    if (type === "reservation") {
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">¡Reserva Creada Exitosamente!</h2>
          <p>Hola ${data.userName},</p>
          <p>Tu reserva para <strong>${data.eventName}</strong> ha sido creada exitosamente.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Detalles de la Reserva:</h3>
            <p><strong>Evento:</strong> ${data.eventName}</p>
            <p><strong>Monto Total:</strong> $${data.amount}</p>
            <p><strong>Estado:</strong> Pago Pendiente</p>
            <p><strong>Tiempo límite para pago:</strong> ${data.expirationTime}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h4 style="color: #92400e; margin-top: 0;">⚠️ Importante - Instrucciones de Pago</h4>
            <p style="color: #92400e;">Tienes <strong>3 minutos</strong> para realizar el pago. Después de este tiempo, tu reserva expirará automáticamente.</p>
            <p style="color: #92400e;">Para completar tu pago, contacta al administrador o utiliza los métodos de pago disponibles.</p>
          </div>

          <p>Una vez confirmado el pago, recibirás un correo de confirmación con tu código QR de acceso.</p>
          
          <p>¡Gracias por tu reserva!</p>
          <p><strong>Equipo Unlock</strong></p>
        </div>
      `
    } else if (type === "payment_confirmed") {
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">¡Pago Confirmado!</h2>
          <p>Hola ${data.userName},</p>
          <p>Tu pago para <strong>${data.eventName}</strong> ha sido confirmado exitosamente.</p>
          
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">✅ Reserva Confirmada</h3>
            <p><strong>Evento:</strong> ${data.eventName}</p>
            <p><strong>Monto Pagado:</strong> $${data.amount}</p>
            <p><strong>Estado:</strong> Pagado</p>
          </div>

          <p>Tu reserva está confirmada. Presenta tu código QR al momento del evento para el acceso.</p>
          
          <p>¡Nos vemos en el evento!</p>
          <p><strong>Equipo Unlock</strong></p>
        </div>
      `
    } else if (type === "payment_rejected") {
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Pago Rechazado</h2>
          <p>Hola ${data.userName},</p>
          <p>Lamentamos informarte que tu pago para <strong>${data.eventName}</strong> ha sido rechazado.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #991b1b; margin-top: 0;">❌ Pago No Procesado</h3>
            <p><strong>Evento:</strong> ${data.eventName}</p>
            <p><strong>Monto:</strong> $${data.amount}</p>
            <p><strong>Estado:</strong> Rechazado</p>
          </div>

          <p>Si crees que esto es un error, por favor contacta al administrador para más información.</p>
          
          <p><strong>Equipo Unlock</strong></p>
        </div>
      `
    }

    else if (type === "reset_password") {
      const confirmationUrl = data?.confirmationUrl || data?.ConfirmationURL || data?.confirmationURL || "#"

      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Password</h2>
          <p>Follow this link to reset the password for your user:</p>
          <p><a href="${confirmationUrl}">Reset Password</a></p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p><strong>Equipo Unlock</strong></p>
        </div>
      `
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    }

    await transporter.sendMail(mailOptions)
    console.log("[v0] Email sent successfully to:", to)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
