# Deploy a Railway (Docker + Postgres)

## 1) Sube el proyecto a GitHub
```bash
cd "Kimi_Agent_Empleados digitales 24_7"
git init
git add .
git commit -m "Deploy ready"
git branch -M main
git remote add origin <TU_REPO_GITHUB>
git push -u origin main
```

## 2) Crea el proyecto en Railway
1. Railway → **New Project** → **Deploy from GitHub Repo**
2. Selecciona tu repo
3. Railway detecta el `Dockerfile` del root y construye el servicio.

## 3) Agrega Postgres y conéctalo
1. En tu proyecto → **Add** → **Database** → **PostgreSQL**
2. Railway crea el servicio PostgreSQL
3. **IMPORTANTE**: Conecta PostgreSQL a tu servicio principal:
   - Ve a tu servicio principal (el que ejecuta tu código)
   - Haz clic en la pestaña **"Variables"**
   - Haz clic en **"New Variable"** o **"Reference Variable"**
   - Selecciona el servicio PostgreSQL
   - Selecciona la variable `DATABASE_URL`
   - O simplemente haz clic en el servicio PostgreSQL → **"Connect"** → selecciona tu servicio principal
4. Verifica que `DATABASE_URL` aparezca en las variables de tu servicio principal

## 4) Variables de entorno recomendadas (Service → Variables)
- `COOKIE_SECURE=true`
- `SESSION_TTL_DAYS=7`
- `SEED_DEMO=true` (ponlo en `false` cuando ya no quieras datos demo)
- `APP_ORIGIN=https://<tu-dominio-railway>` (solo si tu frontend vive en otro dominio; si sirve el mismo servicio, puedes omitirlo)

## 5) Abre el dashboard
- Railway → tu Service → **Domains** → abre el dominio.
- Login demo:
  - `admin@kanlogic.systems` / `admin123`
  - `demo@empresa.com` / `demo123`
  - `user@empresa.com` / `user123`

## Debug
- OTP y token de reset se imprimen en **Logs** del servicio.

