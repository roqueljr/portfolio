# Portfolio CMS — MySQL Migration

This project has been migrated away from the Base44 runtime. The React/Vite UI is retained, while data, authentication, uploads, and contact handling now use a self-hosted Node.js API with MySQL.

## Stack

- React + Vite frontend
- Node.js + Express API
- MySQL 8 / MariaDB
- Cookie-based authenticated sessions
- Local upload storage (`uploads/`)
- Optional SMTP email and Google OAuth

## 1. Install

```bash
npm install
```

Copy the environment template:

**Windows CMD**
```bat
copy .env.example .env
```

**PowerShell**
```powershell
Copy-Item .env.example .env
```

Edit `.env` and set your MySQL connection and a long random `AUTH_SECRET`.

## 2. Create the MySQL database

Start MySQL (for example through XAMPP), then run:

```bash
npm run db:init
```

Alternatively, import `database/schema.sql` in phpMyAdmin.

## 3. Create the CMS administrator

```bash
npm run admin:create -- admin@example.com "YourStrongPassword"
```

This creates the account if it does not exist, or promotes/resets the existing account to `admin`.

## 4. Run locally

```bash
npm run dev
```

Default URL: `http://localhost:5173`

The same Node process serves the `/api` backend and Vite development frontend, so there is no Base44 proxy or App ID.

## 5. Build for production

```bash
npm run build
npm start
```

Set `NODE_ENV=production`, `PUBLIC_URL`, production database credentials, and a strong `AUTH_SECRET` on the hosting service.

## Post-migration verification

After your imported database and `uploads/` files are in place, run:

```bash
npm run verify
npm run lint
npm run build
```

See `POST_MIGRATION_CHECK.md` for the checks performed and production settings.

## Important deployment note for uploads

The default storage driver uses the local `uploads/` directory. On a hosting platform with an ephemeral filesystem, attach persistent storage or replace local uploads with object storage (S3-compatible storage, Cloudinary, etc.).
