# Guía Completa: Configurar Railway con PostgreSQL

## Paso 1: Crear el Proyecto en Railway

1. Ve a [Railway](https://railway.app) e inicia sesión
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub Repo"**
4. Conecta tu cuenta de GitHub si es necesario
5. Selecciona el repositorio `raulmendez4ee24/kannuevo`
6. Railway detectará el `Dockerfile` y comenzará el build

## Paso 2: Agregar PostgreSQL

1. En tu proyecto de Railway, haz clic en **"+ New"** o **"Add Service"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway creará el servicio PostgreSQL automáticamente

## Paso 3: CONECTAR PostgreSQL al Servicio Principal (CRÍTICO)

Este es el paso más importante que falta. Tienes dos opciones:

### Opción A: Usar "Connect" (Recomendado)

1. Haz clic en el servicio **PostgreSQL** en tu proyecto
2. Ve a la pestaña **"Settings"** o busca el botón **"Connect"**
3. En la sección **"Connect to other services"**, selecciona tu servicio principal (el que ejecuta tu código)
4. Railway automáticamente compartirá `DATABASE_URL` con tu servicio principal

### Opción B: Referenciar Variable Manualmente

1. Ve a tu **servicio principal** (el que ejecuta tu código)
2. Haz clic en la pestaña **"Variables"**
3. Haz clic en **"New Variable"** o **"Reference Variable"**
4. En el campo **"Variable"**, escribe: `DATABASE_URL`
5. En lugar de escribir un valor, haz clic en **"Reference"** o busca el servicio PostgreSQL
6. Selecciona el servicio PostgreSQL y la variable `DATABASE_URL`
7. Guarda los cambios

### Opción C: Copiar y Pegar Manualmente (Si las anteriores no funcionan)

1. Ve al servicio **PostgreSQL**
2. Haz clic en la pestaña **"Variables"**
3. Copia el valor completo de `DATABASE_URL` (debería verse como: `postgresql://postgres:password@host:port/railway`)
4. Ve a tu **servicio principal**
5. Haz clic en **"Variables"** → **"New Variable"**
6. Nombre: `DATABASE_URL`
7. Valor: Pega el valor que copiaste
8. Guarda los cambios

## Paso 4: Verificar Variables de Entorno

En tu servicio principal, asegúrate de tener estas variables:

```
DATABASE_URL=<debe estar presente y conectado>
COOKIE_SECURE=true
SESSION_TTL_DAYS=7
SEED_DEMO=true
PORT=3001
APP_ORIGIN=https://tu-dominio.up.railway.app
```

## Paso 5: Verificar el Despliegue

1. Ve a la pestaña **"Deployments"** de tu servicio principal
2. Verifica que el build se complete correctamente
3. Ve a **"Logs"** y verifica que no aparezca el error de `DATABASE_URL`
4. Si todo está bien, deberías ver: `[boot] DATABASE_URL is set, proceeding with database setup`

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**Solución**: Asegúrate de haber completado el Paso 3. Railway NO comparte automáticamente las variables entre servicios. Debes conectarlos manualmente.

### ¿Cómo verificar que DATABASE_URL está configurada?

1. Ve a tu servicio principal → **"Variables"**
2. Busca `DATABASE_URL` en la lista
3. Si no está, sigue el Paso 3

### El servicio PostgreSQL no aparece en "Connect"

1. Asegúrate de que ambos servicios estén en el mismo proyecto
2. Intenta usar la Opción B o C del Paso 3

## Notas Importantes

- Railway NO comparte automáticamente las variables de entorno entre servicios
- Debes conectar manualmente PostgreSQL a tu servicio principal
- La variable `DATABASE_URL` debe estar presente antes de que el contenedor inicie
- Si cambias la configuración de PostgreSQL, puede que necesites actualizar `DATABASE_URL`
