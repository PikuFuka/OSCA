# OSCA Senior Citizen ID System

OSCA is a full-stack records management system for the Office of the Senior Citizen Affairs in Pagsanjan, Laguna. It handles registration, profile management, review and approval workflows, document storage, reporting, and audit logs.

This repository contains:

- Laravel 12 backend API in `backend/`
- React 19 + TypeScript frontend in `frontend/`
- Root scripts for local startup and frontend production build
- Windows launcher in `APP/start.bat`

## Repository Layout

```text
OSCA/
|-- APP/                     # Windows launcher
|   `-- start.bat
|-- backend/                 # Laravel API and production web entrypoint
|-- frontend/                # React app
|-- package.json             # Root helper scripts
|-- REQUIREMENTS.txt         # Short install checklist
`-- README.md
```

## Requirements

Install these before setup:

- XAMPP with Apache, MySQL, and PHP 8.2+
- Node.js 22 LTS+
- Composer 2.x
- Git (optional)

Required PHP extensions (typically available in XAMPP PHP):

- `pdo_mysql` or `pdo_sqlite`
- `mbstring`
- `openssl`
- `fileinfo`
- `gd` or `imagick`
- `zip`
- `xml`
- `tokenizer`

## Development Setup

### 1. Get the project

```bash
git clone https://github.com/PikuFuka/OSCA.git
cd OSCA
```

### 2. Install root dependencies

```bash
npm install
```

### 3. Install backend dependencies and create env

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

On macOS/Linux, use `cp .env.example .env`.

### 4. Configure database in backend/.env

Option A: MySQL (XAMPP)

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=osca_db
DB_USERNAME=root
DB_PASSWORD=
```

Create `osca_db` in phpMyAdmin first.

Option B: SQLite

```dotenv
DB_CONNECTION=sqlite
```

Then create an empty file at `backend/database/database.sqlite`.

### 5. Run schema and storage link

```bash
php artisan migrate
php artisan storage:link
php artisan db:seed
```

Seeding is optional.

### 6. Install frontend dependencies

```bash
cd ..\frontend
npm install
```

### 7. Start development servers

From project root:

```bash
cd ..
npm run dev
```

This root command starts:

- MySQL from `C:\xampp\mysql\bin\mysqld.exe` (hardcoded in root script)
- Laravel at `http://127.0.0.1:8000`
- Vite at `http://localhost:3000`

Development URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://127.0.0.1:8000/api`
- phpMyAdmin: `http://localhost/phpmyadmin`

## Apache/XAMPP Deployment (Recommended for LAN Access)

Use this mode when the app should be reachable from other devices in your local network.

### Deployment flow summary

1. Build frontend into `backend/public/app`
2. Serve Laravel from Apache document root `backend/public`
3. Let Laravel serve API and SPA routes
4. Access app via `/app` on your Apache host

### 1. One-time server preparation

1. Open XAMPP Control Panel.
2. Ensure Apache and MySQL are installed and can start.
3. In Apache config, ensure `mod_rewrite` is enabled.
4. Ensure Apache allows `.htaccess` overrides for your site (`AllowOverride All`).

### 2. Configure production env

Edit `backend/.env` and confirm at least:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=http://YOUR_HOST_OR_IP
```

Set database values for your MySQL server.

If you use Laravel config caching, run these after env edits:

```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

### 3. Install dependencies on target machine

From project root:

```bash
npm install
```

From `backend/`:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
```

Notes:

- Run `key:generate` only once per deployment environment.
- Do not rotate the key on a live system unless intentional.

### 4. Build frontend for Laravel/Apache

From project root:

```bash
npm run build:frontend
```

This writes the production frontend to `backend/public/app`.

### 5. Point Apache to Laravel public directory

Set Apache DocumentRoot to:

```text
.../OSCA/backend/public
```

Sample VirtualHost template:

- `backend/deploy/xampp-vhost.conf.example`

After updating Apache config:

1. Restart Apache.
2. Verify virtual host or localhost resolves correctly.

### 6. Verify route behavior

Current Laravel web routes are configured so that:

- `/` redirects to `/app`
- `/app` serves `backend/public/app/index.html`
- `/api/*` remains Laravel API routes

If `/app` returns HTTP 503, frontend build is missing. Re-run:

```bash
npm run build:frontend
```

### 7. Windows Firewall and LAN checks

1. Allow Apache through Windows Firewall (Private network at minimum).
2. Use your machine LAN IP to access the app from other devices.
3. Keep `APP_URL` consistent with the actual host/IP users access.

Example access URL from another device:

```text
http://192.168.x.x/app
```

### 8. Update deployment after frontend changes

Any React or Tailwind change requires a rebuild:

```bash
npm run build:frontend
```

Then reload Apache page.

## Root Scripts

From project root:

```bash
npm run dev
npm run build:frontend
npm run deploy:apache
```

## Backend Scripts

```bash
cd backend
php artisan serve
php artisan migrate
php artisan db:seed
php artisan test
```

## Frontend Scripts

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

## Default Seeded Accounts

If you run `php artisan db:seed`, these defaults are used unless changed in `backend/.env`:

- Admin email: `admin@osca.gov.ph`
- Admin password: `admin123`
- Staff email: `staff@osca.gov.ph`
- Staff password: `staff123`

Change default credentials immediately outside local testing.

## Troubleshooting

### composer is not recognized

Install Composer and ensure Composer bin is in PATH.

### php is not recognized

Add XAMPP PHP to PATH, commonly `C:\xampp\php`.

### Frontend production page returns 503

Build is missing from `backend/public/app`.

```bash
npm run build:frontend
```

### Uploaded files are missing

Run storage symlink command from `backend/`:

```bash
php artisan storage:link
```

### CORS errors in development

Use frontend on port 3000 and backend on port 8000 to match current CORS and proxy configuration.

## Notes

- This root README is the authoritative project setup and deployment guide.
- `backend/README.md` and `frontend/README.md` are framework boilerplate.

Last updated: March 22, 2026