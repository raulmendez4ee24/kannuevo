import nodemailer from 'nodemailer';

const RECIPIENT_EMAIL = 'kanlogic05@gmail.com';

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
