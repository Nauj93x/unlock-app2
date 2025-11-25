import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

// Función para generar un token único basado en UUID
export function generateUniqueToken(transactionId: string): string {
  return `${transactionId}-${uuidv4()}`;
}

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Crear el transportador de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { to, subject, type, data } = await request.json();

    // Crear un enlace único para el pago con el token generado
    const paymentLink = `https://localhost:3000/api/confirm-payment?transaction_id=${data.transaction_id}&token=${generateUniqueToken(data.transaction_id)}`;

    let html = "";

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
            <p style="color: #92400e;">Para completar tu pago, haz clic en el siguiente enlace:</p>
            <a href="${paymentLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmar Pago</a>
          </div>

          <p>Una vez confirmado el pago, recibirás un correo de confirmación con tu código QR de acceso.</p>
          
          <p>¡Gracias por tu reserva!</p>
          <p><strong>Equipo Unlock</strong></p>
        </div>
      `;
    }

    // Configuración del correo
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);
    console.log("[v0] Email sent successfully to:", to);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error sending email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
