# 🔧 SOLUCIÓN: Error DATABASE_URL en Railway

## ⚠️ PROBLEMA ACTUAL
Tu servicio está fallando porque `DATABASE_URL` no está configurada. Railway NO comparte automáticamente las variables entre servicios.

## ✅ SOLUCIÓN PASO A PASO

### Método 1: Copiar DATABASE_URL Manualmente (MÁS FÁCIL)

1. **Abre Railway** → Tu proyecto

2. **Haz clic en el servicio PostgreSQL** (el servicio de base de datos)
   - Debería tener un nombre como "Postgres" o "PostgreSQL"

3. **Ve a la pestaña "Variables"** (en la parte superior)

4. **Busca `DATABASE_URL`** en la lista de variables
   - Debería verse algo como: `postgresql://postgres:password@host:port/railway`

5. **Copia TODO el valor** de `DATABASE_URL`
   - Haz clic en el valor o en el ícono de copiar

6. **Ahora ve a tu servicio principal** (el que ejecuta tu código)
   - Este es el servicio que está fallando con el error

7. **Haz clic en la pestaña "Variables"**

8. **Haz clic en "New Variable"** (botón azul/verde)

9. **Llena el formulario:**
   - **Variable Name:** `DATABASE_URL`
   - **Value:** Pega el valor que copiaste en el paso 5
   - **Deja "Secret" marcado** (si está disponible)

10. **Haz clic en "Add" o "Save"**

11. **Railway reiniciará automáticamente** tu servicio

12. **Ve a "Logs"** y verifica que el error desapareció

---

### Método 2: Usar "Reference Variable" (RECOMENDADO)

1. **Ve a tu servicio principal** → Pestaña **"Variables"**

2. **Haz clic en "New Variable"**

3. **En el campo "Variable Name"**, escribe: `DATABASE_URL`

4. **En lugar de escribir un valor**, busca un botón que diga:
   - **"Reference"** o
   - **"Select from service"** o
   - Un ícono de conexión/link

5. **Selecciona tu servicio PostgreSQL** de la lista

6. **Selecciona la variable `DATABASE_URL`**

7. **Guarda los cambios**

8. **Railway reiniciará automáticamente**

---

### Método 3: Usar "Connect" (Si está disponible)

1. **Haz clic en el servicio PostgreSQL**

2. **Busca un botón "Connect"** o "Connect to Service"

3. **Selecciona tu servicio principal** de la lista

4. **Railway compartirá automáticamente `DATABASE_URL`**

---

## 🔍 VERIFICACIÓN

Después de configurar `DATABASE_URL`, verifica en los logs:

✅ **ÉXITO:** Deberías ver:
```
[boot] DATABASE_URL is set, proceeding with database setup
[boot] prisma db push
```

❌ **ERROR:** Si aún ves:
```
[error] DATABASE_URL environment variable is not set
```
Significa que no se configuró correctamente. Revisa los pasos anteriores.

---

## 📋 CHECKLIST

- [ ] Tengo un servicio PostgreSQL creado en Railway
- [ ] Copié el valor de `DATABASE_URL` del servicio PostgreSQL
- [ ] Agregué `DATABASE_URL` como variable en mi servicio principal
- [ ] El servicio se reinició automáticamente
- [ ] Los logs muestran que `DATABASE_URL` está configurada

---

## 🆘 SI NADA FUNCIONA

1. **Verifica que ambos servicios estén en el mismo proyecto**
2. **Intenta eliminar y recrear la variable `DATABASE_URL`**
3. **Verifica que el servicio PostgreSQL esté funcionando** (debería estar en estado "Active")
4. **Contacta el soporte de Railway** si el problema persiste

---

## 📸 UBICACIÓN EN RAILWAY

```
Railway Dashboard
└── Tu Proyecto
    ├── Servicio Principal (tu código) ← AQUÍ agregas DATABASE_URL
    └── PostgreSQL (base de datos) ← AQUÍ copias DATABASE_URL
```

---

## 💡 NOTA IMPORTANTE

Railway **NO comparte automáticamente** las variables de entorno entre servicios. Debes hacerlo manualmente usando uno de los métodos anteriores.
