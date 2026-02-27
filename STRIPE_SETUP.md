# Configuración de Stripe para Pagos

Este proyecto usa Stripe para procesar pagos de forma segura. Sigue estos pasos para configurarlo:

## 1. Crear cuenta en Stripe

1. Ve a [https://stripe.com](https://stripe.com) y crea una cuenta
2. Completa la verificación de tu cuenta (puedes usar modo de prueba inicialmente)

## 2. Obtener las claves de API

### Modo de Prueba (Testing)

1. Ve al [Dashboard de Stripe](https://dashboard.stripe.com/test/apikeys)
2. Copia tu **Publishable Key** (empieza con `pk_test_`)
3. Copia tu **Secret Key** (empieza con `sk_test_`)

### Modo de Producción

1. Cambia a modo "Live" en el dashboard
2. Ve a [API Keys](https://dashboard.stripe.com/apikeys)
3. Copia tu **Publishable Key** (empieza con `pk_live_`)
4. Copia tu **Secret Key** (empieza con `sk_live_`)

## 3. Configurar variables de entorno

### Backend (Railway o servidor)

Agrega estas variables en Railway → Variables:

```bash
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
```

### Frontend (Vite)

Crea un archivo `.env` en la carpeta `app/`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui
```

**Nota:** En producción, usa las claves `live` en lugar de `test`.

## 4. Configurar Webhook de Stripe

Los webhooks permiten que Stripe notifique a tu servidor cuando un pago se completa.

### En Railway:

1. Ve a tu proyecto en Railway
2. Copia la URL de tu API (ej: `https://tu-app.up.railway.app`)
3. Ve a [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
4. Click en "Add endpoint"
5. URL del endpoint: `https://tu-app.up.railway.app/api/payment/webhook`
6. Selecciona estos eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
7. Copia el **Signing secret** (empieza con `whsec_`)
8. Agrégala como `STRIPE_WEBHOOK_SECRET` en Railway

### En desarrollo local:

Usa [Stripe CLI](https://stripe.com/docs/stripe-cli) para reenviar webhooks a tu servidor local:

```bash
stripe listen --forward-to localhost:3001/api/payment/webhook
```

Esto te dará un `whsec_...` que puedes usar como `STRIPE_WEBHOOK_SECRET` en desarrollo.

## 5. Tarjetas de prueba

Para probar pagos en modo de prueba, usa estas tarjetas:

- **Pago exitoso:** `4242 4242 4242 4242`
- **Pago rechazado:** `4000 0000 0000 0002`
- **3D Secure requerido:** `4000 0027 6000 3184`

Cualquier fecha futura y cualquier CVC funcionan.

## 6. Verificar que funciona

1. Abre la aplicación
2. Ve a la sección "Empleados Digitales"
3. Click en "CONTRATAR" en cualquier plan
4. Ingresa una tarjeta de prueba
5. Completa el pago

Si todo está configurado correctamente, deberías ver:
- El pago se procesa exitosamente
- Recibes un email de confirmación (si configuraste SMTP)
- El pago aparece en el dashboard de Stripe

## Solución de problemas

### Error: "PAYMENT_NOT_CONFIGURED"

- Verifica que `STRIPE_SECRET_KEY` esté configurado en el backend
- Reinicia el servidor después de agregar la variable

### Error: "El sistema de pagos no está configurado"

- Verifica que `VITE_STRIPE_PUBLISHABLE_KEY` esté en el `.env` del frontend
- Reconstruye la aplicación frontend después de agregar la variable

### Webhook no funciona

- Verifica que la URL del webhook sea accesible públicamente
- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado correctamente
- Revisa los logs del servidor para ver errores de verificación

### Pagos no aparecen en la base de datos

- Verifica que el webhook esté configurado correctamente
- Revisa los logs del servidor para errores al procesar webhooks
- Verifica que la base de datos tenga el modelo `Payment` generado (`npx prisma generate`)

## Migración a Producción

Cuando estés listo para aceptar pagos reales:

1. Cambia a modo "Live" en Stripe Dashboard
2. Actualiza todas las variables de entorno con claves `live`
3. Configura el webhook de producción con la URL de producción
4. Prueba con una tarjeta real de bajo monto primero
5. Verifica que los pagos aparezcan correctamente en Stripe y en tu base de datos
