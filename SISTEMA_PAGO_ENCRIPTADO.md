# Sistema de Pago Encriptado Propio

Este sistema captura los datos de pago de forma segura, los encripta con AES-256-GCM y te envía una notificación por email con todos los detalles para que puedas procesar el pago manualmente o integrarlo con tu banco/procesador preferido.

## 🔒 Seguridad

- **Encriptación AES-256-GCM**: Todos los datos sensibles se encriptan antes de guardarse
- **Sin dependencias externas**: No necesitas Stripe ni otros servicios
- **Datos seguros**: Los datos de tarjeta nunca se almacenan en texto plano
- **Notificaciones inmediatas**: Recibes un email con todos los detalles del pago

## ⚙️ Configuración

### 1. Generar Clave de Encriptación

Ejecuta este comando para generar una clave segura:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto generará una clave de 64 caracteres hexadecimales. **Guárdala de forma segura** - la necesitarás para desencriptar los datos.

### 2. Configurar Variable de Entorno

En Railway → Tu Servicio Backend → Variables, agrega:

```
PAYMENT_ENCRYPTION_KEY=e60683acab41dd80a7261fce391472c37a28eb85d662bd5e90e0de5e1e1561ab
```

**⚠️ IMPORTANTE**: 
- Usa la clave que generaste (no la del ejemplo)
- Esta clave debe mantenerse secreta
- Si la pierdes, no podrás desencriptar los datos existentes
- Guárdala en un lugar seguro (gestor de contraseñas)

### 3. Configurar Email (Opcional pero Recomendado)

Para recibir notificaciones de pagos, configura SMTP en Railway:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=kanlogic05@gmail.com
SMTP_PASS=tu_app_password_de_gmail
```

## 📧 Notificaciones de Pago

Cuando un cliente realiza un pago, recibirás un email con:

- ✅ ID del pago único
- ✅ Plan contratado
- ✅ Monto y moneda
- ✅ Información del cliente (nombre, email)
- ✅ **Datos de pago completos** (tarjeta, titular, vencimiento, CVV)

El email incluye todos los datos necesarios para procesar el pago manualmente.

## 💳 Procesar Pagos

Tienes varias opciones para procesar los pagos:

### Opción 1: Procesamiento Manual
1. Revisa el email de notificación
2. Usa los datos de tarjeta para procesar el pago en tu terminal punto de venta, portal bancario, o sistema preferido
3. Marca el pago como "completado" en tu sistema

### Opción 2: Integración con tu Banco
- Contacta a tu banco para obtener su API de pagos
- Usa los datos desencriptados para procesar el pago automáticamente

### Opción 3: Integración con Procesador de Pagos
- Puedes integrar con cualquier procesador (Mercado Pago, PayPal, etc.)
- Los datos están listos para usar

## 🔍 Ver Pagos en la Base de Datos

Los pagos se guardan en la tabla `Payment` con:

- `paymentId`: ID único del pago (ej: `pay_abc123...`)
- `status`: Estado (`pending`, `processing`, `completed`, `failed`, `canceled`)
- `encryptedData`: Datos encriptados (solo desencriptables con la clave)
- `amount`: Monto en centavos
- `customerEmail`: Email del cliente
- `planName`: Nombre del plan

## 🛠️ Desencriptar Datos (Solo para Desarrollo/Admin)

Si necesitas desencriptar los datos manualmente (solo para administración):

```typescript
import { decryptPaymentObject } from './server/src/security.js';

const encryptedData = '...'; // Del campo encryptedData en la BD
const decrypted = decryptPaymentObject(encryptedData);
console.log(decrypted);
// { cardNumber: '...', cardHolder: '...', expiry: '...', cvv: '...', timestamp: '...' }
```

**⚠️ Solo haz esto en un entorno seguro y nunca expongas estos datos.**

## 📊 Flujo del Sistema

1. **Cliente ingresa datos** → Formulario seguro en el frontend
2. **Datos se envían al servidor** → HTTPS encriptado
3. **Servidor encripta los datos** → AES-256-GCM
4. **Se guarda en la BD** → Solo datos encriptados
5. **Se envía email** → Con todos los detalles para procesar
6. **Tú procesas el pago** → Manualmente o con integración

## ✅ Ventajas de este Sistema

- ✅ **Sin comisiones de terceros**: No pagas comisiones a Stripe u otros
- ✅ **Control total**: Tú decides cómo procesar los pagos
- ✅ **Seguridad**: Encriptación de grado militar
- ✅ **Flexibilidad**: Puedes integrar con cualquier procesador
- ✅ **Privacidad**: Los datos nunca salen de tu servidor (excepto el email)

## ⚠️ Consideraciones

- **Procesamiento manual**: Requiere que proceses cada pago manualmente
- **Responsabilidad PCI**: Asegúrate de cumplir con estándares de seguridad
- **Backup de clave**: Guarda la clave de encriptación de forma segura
- **Monitoreo**: Revisa los emails regularmente para no perder pagos

## 🚀 Próximos Pasos

1. ✅ Genera tu clave de encriptación
2. ✅ Configúrala en Railway
3. ✅ Configura SMTP para recibir emails
4. ✅ Prueba un pago de prueba
5. ✅ Revisa el email de notificación
6. ✅ Procesa el pago según tu método preferido

¡Listo! Tu sistema de pagos encriptado está funcionando. 🎉
