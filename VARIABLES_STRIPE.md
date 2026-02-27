# Variables de Stripe para Configurar

## Backend (Railway)

Agrega estas variables en Railway → Tu Servicio Backend → Variables:

```
STRIPE_SECRET_KEY=sk_test_TU_SECRET_KEY_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI
```

**Nota:** `STRIPE_WEBHOOK_SECRET` lo obtienes después de configurar el webhook en Stripe Dashboard.

## Frontend (Local o Railway)

### Si estás desarrollando localmente:

Crea/edita el archivo `app/.env`:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_TU_PUBLISHABLE_KEY_AQUI
```

### Si estás en Railway:

Agrega esta variable en Railway → Tu Servicio Frontend → Variables:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_TU_PUBLISHABLE_KEY_AQUI
```

## Pasos Rápidos

1. ✅ Agrega `STRIPE_SECRET_KEY` en Railway (backend)
2. ✅ Agrega `VITE_STRIPE_PUBLISHABLE_KEY` en Railway (frontend) o en `app/.env` (local)
3. ⏳ Configura el webhook en Stripe Dashboard
4. ⏳ Agrega `STRIPE_WEBHOOK_SECRET` en Railway (backend)
5. ✅ Reinicia los servicios en Railway

## Verificar que Funciona

1. Abre tu aplicación
2. Ve a la sección "Empleados Digitales"
3. Click en "CONTRATAR" en cualquier plan
4. Ingresa tu email y nombre
5. Usa una tarjeta de prueba: `4242 4242 4242 4242`
6. Cualquier fecha futura y cualquier CVC funcionan

Si ves el formulario de pago de Stripe, ¡está funcionando! 🎉
