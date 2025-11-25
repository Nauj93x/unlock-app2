import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // 👈 importante

import { sendEmail, generateReservationEmail } from "./lib/email-service";

async function testSendEmail() {
  console.log("SMTP_USER:", process.env.SMTP_USER); // 👈 para verificar

  const emailData = {
    to: " juanpi240205@gmail.com",
    subject: "Correo de prueba de Nodemailer",
    html: generateReservationEmail("Juan Pérez", "Conferencia de Tecnología", 100000),
  };

  const result = await sendEmail(emailData);

  if (result.success) {
    console.log("Correo enviado exitosamente:", result.messageId);
  } else {
    console.error("Error al enviar correo:", result.error);
  }
}

testSendEmail();
