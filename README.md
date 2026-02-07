# Maxoy

TR: Maxoy, Next.js tabanli bir e-ticaret projesidir. Bu repository hem aktif uygulamayi hem de bazi yardimci dosyalari icerir.  
EN: Maxoy is a Next.js based e-commerce project. This repository contains the active app and some helper files.

## Hizli Baslangic / Quick Start

TR: Ana uygulama klasoru `Maxoy/` altindadir.  
EN: The main application lives in `Maxoy/`.

```powershell
cd .\Maxoy
npm install
docker compose up -d
Copy-Item .env.example .env.local
npx prisma generate
npx prisma migrate dev -n init
npx prisma db seed
npm run dev
```

TR: Uygulama acildiktan sonra:  
EN: After startup:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`
- Health: `http://localhost:3000/admin/health`

## Varsayilan Giris / Default Admin Login

- Email: `admin@maxoy.local`
- Password: `ChangeMe123!`

TR: Ortam degiskenleri ile ezebilirsiniz.  
EN: You can override these with environment variables.

## Proje Yapisi / Project Structure

- `Maxoy/`: TR: Ana Next.js uygulamasi. EN: Main Next.js application.
- `Maxoy/docs/`: TR: Teknik notlar ve operasyon dokumanlari. EN: Technical and operational docs.
- `Maxoy/prisma/`: TR: Veritabani semasi, migration ve seed. EN: Database schema, migrations, and seed.
- `dev.ps1`: TR: Workspace seviyesinde gelistirme yardimci scripti. EN: Workspace-level helper script.
- `kubernetes.yml`, `terraform-aws.tf`: TR: Altyapi ornek dosyalari. EN: Infrastructure examples.

## Docker ve Veritabani / Docker and Database

TR: Varsayilan Docker Postgres ayarlari `Maxoy/docker-compose.yml` icindedir.  
EN: Default Docker Postgres settings are in `Maxoy/docker-compose.yml`.

- user/password/db: `maxoy`
- `DATABASE_URL` example:

```env
DATABASE_URL="postgresql://maxoy:maxoy@localhost:5432/maxoy?schema=public"
```

## Medya Depolama / Media Storage

TR: Varsayilan olarak local depolama kullanilir ve dosyalar `Maxoy/public/uploads` altina yazilir.  
EN: Local storage is used by default and files are written to `Maxoy/public/uploads`.

TR: S3/R2 icin `S3_*` degiskenlerini ayarlayin.  
EN: For S3/R2, configure the `S3_*` variables.

## Notlar / Notes

TR: `.next`, `node_modules`, `coverage` gibi build ve cache klasorleri kaynak kod degildir, commit edilmemelidir.  
EN: Build/cache directories like `.next`, `node_modules`, and `coverage` are not source code and should not be committed.
