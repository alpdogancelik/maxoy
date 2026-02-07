# Maxoy Admin + Storefront

TR: Bu uygulama Next.js 14 + TypeScript + Prisma + Postgres (Docker) stack'i ile calisir.  
EN: This app runs on Next.js 14 + TypeScript + Prisma + Postgres (Docker).

## Kurulum / Setup (Windows PowerShell)

TR: Bu komutlari `Maxoy/` klasorunde calistirin.  
EN: Run these commands inside the `Maxoy/` directory.

```powershell
npm install
docker compose up -d
Copy-Item .env.example .env.local
npx prisma generate
npx prisma migrate dev -n init
npx prisma db seed
npm run dev
```

TR: Acilacak adresler:  
EN: Endpoints after startup:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`
- Health: `http://localhost:3000/admin/health`

## Varsayilan Admin / Default Admin

- Email: `admin@maxoy.local`
- Password: `ChangeMe123!`

TR: `.env.local` ile degistirebilirsiniz.  
EN: You can override via `.env.local`.

```env
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="YourPasswordHere"
```

## Veritabani / Database

TR: Docker Postgres varsayilanlari `docker-compose.yml` icindedir.  
EN: Docker Postgres defaults are defined in `docker-compose.yml`.

- container: `maxoy_db`
- user/password/db: `maxoy`

```env
DATABASE_URL="postgresql://maxoy:maxoy@localhost:5432/maxoy?schema=public"
```

## Medya / Media

TR: Varsayilan `MEDIA_STORAGE="local"` oldugu icin yuklenen dosyalar `public/uploads` altina yazilir.  
EN: With default `MEDIA_STORAGE="local"`, uploaded files are saved under `public/uploads`.

TR: S3/R2 kullanmak icin `S3_*` degiskenlerini ayarlayin.  
EN: For S3/R2, configure `S3_*` environment variables.
