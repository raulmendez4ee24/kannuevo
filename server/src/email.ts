import nodemailer from 'nodemailer';

const RECIPIENT_EMAIL = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || 'mendez@kanlogic.lat';

// Create transporter (using Gmail SMTP by default, can be configured via env vars)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || RECIPIENT_EMAIL,
    pass: process.env.SMTP_PASS || '', // App password for Gmail
  },
});

export async function sendContactEmail(data: {
  name: string;
  email: string;
  message: string;
}) {
  const mailOptions = {
    from: `"${data.name}" <${process.env.SMTP_USER || RECIPIENT_EMAIL}>`,
    to: RECIPIENT_EMAIL,
    replyTo: data.email,
    subject: `Nuevo mensaje de contacto - ${data.name}`,
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `,
    text: `
Nuevo mensaje de contacto

Nombre: ${data.name}
Email: ${data.email}

Mensaje:
${data.message}
    `,
  };

  try {
    if (!process.env.SMTP_PASS) {
      // In development/demo mode, just log
      console.log('[EMAIL] Contact form submission:', JSON.stringify(data, null, 2));
      console.log('[EMAIL] Would send to:', RECIPIENT_EMAIL);
      return { success: true, sent: false };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Contact email sent:', info.messageId);
    return { success: true, sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending contact email:', error);
    throw error;
  }
}

export async function sendAuditEmail(data: {
  email: string;
  whatsapp?: string;
  businessName: string;
  businessType: string;
  priorities: string[];
  monthlyLeads?: string;
  monthlyRevenue?: string;
  selectedPlan?: string;
}) {
  const mailOptions = {
    from: `"Kan Logic" <${process.env.SMTP_USER || RECIPIENT_EMAIL}>`,
    to: RECIPIENT_EMAIL,
    replyTo: data.email,
    subject: `Nueva auditoría IA solicitada - ${data.businessName}`,
    html: `
      <h2>Nueva solicitud de auditoría IA</h2>
      <h3>Información de contacto</h3>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.whatsapp ? `<p><strong>WhatsApp:</strong> ${data.whatsapp}</p>` : ''}
      
      <h3>Información del negocio</h3>
      <p><strong>Nombre:</strong> ${data.businessName}</p>
      <p><strong>Tipo:</strong> ${data.businessType}</p>
      <p><strong>Plan de interés:</strong> ${data.selectedPlan || 'No especificado'}</p>
      
      <h3>Prioridades</h3>
      <ul>
        ${data.priorities.map(p => `<li>${p}</li>`).join('')}
      </ul>
      
      <h3>Números</h3>
      <p><strong>Leads mensuales:</strong> ${data.monthlyLeads || 'No especificado'}</p>
      <p><strong>Ingreso mensual:</strong> ${data.monthlyRevenue || 'No especificado'}</p>
    `,
    text: `
Nueva solicitud de auditoría IA

Información de contacto:
Email: ${data.email}
${data.whatsapp ? `WhatsApp: ${data.whatsapp}` : ''}

Información del negocio:
Nombre: ${data.businessName}
Tipo: ${data.businessType}
Plan de interés: ${data.selectedPlan || 'No especificado'}

Prioridades:
${data.priorities.map(p => `- ${p}`).join('\n')}

Números:
Leads mensuales: ${data.monthlyLeads || 'No especificado'}
Ingreso mensual: ${data.monthlyRevenue || 'No especificado'}
    `,
  };

  try {
    if (!process.env.SMTP_PASS) {
      // In development/demo mode, just log
      console.log('[EMAIL] Audit form submission:', JSON.stringify(data, null, 2));
      console.log('[EMAIL] Would send to:', RECIPIENT_EMAIL);
      return { success: true, sent: false };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Audit email sent:', info.messageId);
    return { success: true, sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending audit email:', error);
    throw error;
  }
}

export async function sendPaymentNotification(data: {
  paymentId: string;
  planName: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  paymentData: {
    maskedCard: string;
    cardLast4: string;
    cardHolder: string;
    expiry: string;
  };
}) {
  const amountFormatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: data.currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(data.amount / 100);

  const mailOptions = {
    from: `"Sistema de Pagos Kan Logic" <${process.env.SMTP_USER || RECIPIENT_EMAIL}>`,
    to: RECIPIENT_EMAIL,
    replyTo: data.customerEmail,
    subject: `💰 NUEVO PAGO RECIBIDO - ${data.planName} - ${amountFormatted}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00F0FF;">💰 NUEVO PAGO RECIBIDO</h2>
        
        <div style="background: #0a0a0f; padding: 20px; border-radius: 8px; border: 1px solid #00F0FF; margin: 20px 0;">
          <h3 style="color: #00F0FF; margin-top: 0;">Información del Pago</h3>
          <p><strong style="color: #ffffff;">ID de Pago:</strong> <code style="background: #1a1a2e; padding: 2px 6px; border-radius: 4px;">${data.paymentId}</code></p>
          <p><strong style="color: #ffffff;">Plan:</strong> ${data.planName}</p>
          <p><strong style="color: #ffffff;">Monto:</strong> <span style="color: #00FF88; font-size: 1.2em; font-weight: bold;">${amountFormatted}</span></p>
          <p><strong style="color: #ffffff;">Moneda:</strong> ${data.currency.toUpperCase()}</p>
        </div>

        <div style="background: #0a0a0f; padding: 20px; border-radius: 8px; border: 1px solid #00F0FF; margin: 20px 0;">
          <h3 style="color: #00F0FF; margin-top: 0;">Información del Cliente</h3>
          <p><strong style="color: #ffffff;">Nombre:</strong> ${data.customerName}</p>
          <p><strong style="color: #ffffff;">Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #00F0FF;">${data.customerEmail}</a></p>
        </div>

        <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; border: 1px solid #ff4444; margin: 20px 0;">
          <h3 style="color: #ff4444; margin-top: 0;">⚠️ RESUMEN DE PAGO (DATOS SENSIBLES PROTEGIDOS)</h3>
          <p><strong style="color: #ffffff;">Tarjeta (enmascarada):</strong> <code style="background: #0a0a0f; padding: 2px 6px; border-radius: 4px;">${data.paymentData.maskedCard}</code></p>
          <p><strong style="color: #ffffff;">Últimos 4:</strong> ${data.paymentData.cardLast4}</p>
          <p><strong style="color: #ffffff;">Titular:</strong> ${data.paymentData.cardHolder}</p>
          <p><strong style="color: #ffffff;">Vencimiento:</strong> ${data.paymentData.expiry}</p>
          <p style="color: #ffaa00; font-size: 0.9em; margin-top: 15px;">
            <strong>⚠️ IMPORTANTE:</strong> El sistema no almacena ni envía CVV.
            Verifica la acreditación bancaria antes de activar el servicio.
          </p>
        </div>

        <div style="background: #0a4d0a; padding: 20px; border-radius: 8px; border: 1px solid #00FF88; margin: 20px 0; text-align: center;">
          <h3 style="color: #00FF88; margin-top: 0;">CUENTA DONDE CAE EL DINERO</h3>
          <p style="color: #ffffff; font-size: 1.2em; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">Santander: 0143 2020 0145 9890 15</p>
          <p style="color: #cccccc; font-size: 0.9em; margin: 0;">CLABE: 014320200145989015</p>
        </div>

        <div style="background: #0a0a0f; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #ffffff; margin: 0;">
            <strong>Acción requerida:</strong> Revisa el pago en el panel de administración. El servicio se activa cuando los fondos estén acreditados en la cuenta Santander.
          </p>
        </div>

        <p style="color: #888; font-size: 0.85em; margin-top: 30px;">
          Este es un email automático del sistema de pagos de Kan Logic.<br>
          Los datos sensibles están protegidos con encriptación AES-256-GCM.
        </p>
      </div>
    `,
    text: `
💰 NUEVO PAGO RECIBIDO

Información del Pago:
ID de Pago: ${data.paymentId}
Plan: ${data.planName}
Monto: ${amountFormatted}
Moneda: ${data.currency.toUpperCase()}

Información del Cliente:
Nombre: ${data.customerName}
Email: ${data.customerEmail}

⚠️ RESUMEN DE PAGO (DATOS SENSIBLES PROTEGIDOS):
Tarjeta (enmascarada): ${data.paymentData.maskedCard}
Últimos 4: ${data.paymentData.cardLast4}
Titular: ${data.paymentData.cardHolder}
Vencimiento: ${data.paymentData.expiry}
⚠️ IMPORTANTE: El sistema no almacena ni envía CVV.
Verifica la acreditación bancaria antes de activar el servicio.

CUENTA DONDE CAE EL DINERO:
Santander: 0143 2020 0145 9890 15
CLABE: 014320200145989015

Acción requerida: Revisa el pago en el panel de administración. El servicio se activa cuando los fondos estén acreditados en la cuenta Santander.
    `,
  };

  try {
    if (!process.env.SMTP_PASS) {
      console.log('[EMAIL] Payment notification:', JSON.stringify(data, null, 2));
      console.log('[EMAIL] Would send to:', RECIPIENT_EMAIL);
      return { success: true, sent: false };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Payment notification sent:', info.messageId);
    return { success: true, sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] Error sending payment notification:', error);
    throw error;
  }
}
