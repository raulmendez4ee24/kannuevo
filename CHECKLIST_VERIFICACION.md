# ✅ Checklist de Verificación - Sistema de Pago Encriptado

## 🔒 Configuración de Seguridad

### Backend (Railway)

- [ ] **PAYMENT_ENCRYPTION_KEY** configurada
  - Generada con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Guardada de forma segura (gestor de contraseñas)
  - Agregada en Railway → Variables

### Email (Opcional pero Recomendado)

- [ ] **SMTP_HOST** configurado (`smtp.gmail.com` o tu proveedor)
- [ ] **SMTP_PORT** configurado (`587` para Gmail)
- [ ] **SMTP_USER** configurado (`kanlogic05@gmail.com`)
- [ ] **SMTP_PASS** configurado (contraseña de aplicación de Gmail)
  - Obtenida de: https://myaccount.google.com/apppasswords
  - Verificación en 2 pasos activada
  - Contraseña de 16 caracteres (sin espacios)

## 🗄️ Base de Datos

- [ ] Modelo `Payment` creado en Prisma
- [ ] Migración aplicada (`npx prisma db push` o `prisma migrate`)
- [ ] Tabla `Payment` existe en la base de datos

## 🧪 Pruebas

### Prueba Local (Opcional)

1. [ ] Iniciar servidor: `cd server && npm run dev`
2. [ ] Iniciar frontend: `cd app && npm run dev`
3. [ ] Abrir: http://localhost:5173
4. [ ] Ir a sección "Empleados Digitales"
5. [ ] Click en "CONTRATAR" en cualquier plan
6. [ ] Completar formulario de pago con datos de prueba:
   - Email: `test@example.com`
   - Tarjeta: `4242 4242 4242 4242`
   - Vencimiento: `12/25`
   - CVV: `123`
   - Titular: `TEST USER`
7. [ ] Verificar que se muestra mensaje de éxito
8. [ ] Verificar en logs del servidor que se creó el pago
9. [ ] Verificar que se envió email (o se mostró en logs si SMTP no está configurado)

### Prueba en Producción (Railway)

1. [ ] Desplegar cambios a Railway
2. [ ] Verificar que el servicio está corriendo
3. [ ] Abrir la aplicación en producción
4. [ ] Probar el flujo de pago completo
5. [ ] Verificar email recibido con detalles del pago

## 📧 Verificación de Emails

- [ ] Email de notificación recibido cuando hay un pago
- [ ] Email incluye:
  - ✅ ID del pago
  - ✅ Plan contratado
  - ✅ Monto y moneda
  - ✅ Información del cliente
  - ✅ Datos de pago completos

## 🔍 Verificación en Base de Datos

Ejecuta en Prisma Studio o con una query:

```sql
SELECT 
  "paymentId",
  "planName",
  amount,
  currency,
  status,
  "customerEmail",
  "customerName",
  "createdAt"
FROM "Payment"
ORDER BY "createdAt" DESC
LIMIT 10;
```

Verifica que:
- [ ] Los pagos se están guardando
- [ ] El campo `encryptedData` tiene datos (no está vacío)
- [ ] El `status` es `pending`
- [ ] Los datos del cliente están correctos

## 🚨 Problemas Comunes

### Si los pagos no se guardan:
- [ ] Verificar que la base de datos esté conectada
- [ ] Verificar que el modelo Payment existe
- [ ] Revisar logs del servidor para errores

### Si los emails no llegan:
- [ ] Verificar que SMTP_PASS esté configurado correctamente
- [ ] Verificar que SMTP_USER sea correcto
- [ ] Revisar logs del servidor (los emails se muestran ahí si SMTP falla)
- [ ] Verificar carpeta de spam

### Si la encriptación falla:
- [ ] Verificar que PAYMENT_ENCRYPTION_KEY tenga exactamente 64 caracteres hex
- [ ] Verificar que la clave no tenga espacios
- [ ] Verificar que la clave sea la misma en todos los despliegues

## ✅ Estado Final

- [ ] ✅ Backend compila sin errores
- [ ] ✅ Frontend compila sin errores
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Base de datos actualizada
- [ ] ✅ Prueba de pago exitosa
- [ ] ✅ Email recibido correctamente
- [ ] ✅ Datos guardados en BD

## 📝 Notas

- Los datos de pago están **encriptados** en la base de datos
- Solo tú puedes desencriptarlos con la clave `PAYMENT_ENCRYPTION_KEY`
- Los emails contienen los datos sin encriptar para que puedas procesarlos
- El sistema funciona **sin SMTP** pero solo mostrará los emails en logs

---

**Estado:** 🟢 Listo para producción (si todos los checks están marcados)
