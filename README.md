# OSCA Senior Citizen ID System

The **OSCA Senior Citizen ID System** is a full-stack web application for the **Office of the Senior Citizen Affairs (OSCA) — Pagsanjan, Laguna**. It manages and streamlines record-keeping and ID generation for registered Senior Citizens under Republic Act No. 9257.

## 🚀 System Overview

| Feature | Description |
|---|---|
| **Member Registry** | Search, view, and manage senior citizen profiles |
| **ID Generation** | Generate and print official OSCA ID cards |
| **Approval Workflow** | Review and approve new member applications |
| **Dashboard & Analytics** | Barangay-level statistics and charts |
| **Document Management** | Upload and view supporting documents per member |
| **Archive & Backup** | Safe storage for inactive/deleted records with database backup |
| **History Logs** | Full audit trail of all administrative actions |
| **User Management** | Role-based access: Admin, Staff, and User |

---

## 📋 Requirements & Dependencies

### System Requirements

| Software | Version | Purpose | Download |
|---|---|---|---|
| **XAMPP** | 8.2+ (PHP 8.2 / 8.3) | PHP runtime & MySQL database | [apachefriends.org](https://www.apachefriends.org/download.html) |
| **Node.js** | v22.x LTS | Frontend build & dev server | [nodejs.org](https://nodejs.org/) |
| **Composer** | v2.x | PHP dependency manager | [getcomposer.org](https://getcomposer.org/download/) |
| **Git** | Latest | Version control (optional) | [git-scm.com](https://git-scm.com/downloads) |

### Required PHP Extensions (included in XAMPP)

- `php_pdo_sqlite` or `php_pdo_mysql` — Database driver
- `php_mbstring` — String handling
- `php_openssl` — Encryption (required by Laravel)
- `php_fileinfo` — File type detection
- `php_gd` or `php_imagick` — Image processing
- `php_zip` — Required by `maatwebsite/excel`
- `php_xml` — XML parsing
- `php_tokenizer` — PHP tokenizer

### Backend Dependencies (`backend/composer.json`)

| Package | Version | Purpose |
|---|---|---|
| `laravel/framework` | ^12.0 | Core PHP web framework |
| `laravel/sanctum` | ^4.3 | API token authentication |
| `laravel/tinker` | ^2.10.1 | Interactive REPL for debugging |
| `maatwebsite/excel` | ^3.1 | Excel/PDF export for reports |

#### Dev Dependencies (Backend)

| Package | Version | Purpose |
|---|---|---|
| `fakerphp/faker` | ^1.23 | Database seeding with fake data |
| `laravel/pail` | ^1.2.2 | Log viewer |
| `laravel/pint` | ^1.24 | Code style fixer |
| `phpunit/phpunit` | ^11.5.3 | Automated testing |
| `nunomaduro/collision` | ^8.6 | Better CLI error display |

### Frontend Dependencies (`frontend/package.json`)

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.4 | UI library |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `axios` | ^1.13.5 | HTTP client for API calls |
| `lucide-react` | ^0.563.0 | Icon library |
| `recharts` | ^3.7.0 | Charts and data visualization |

#### Dev Dependencies (Frontend)

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^6.2.0 | Build tool & dev server |
| `@vitejs/plugin-react` | ^5.0.0 | React plugin for Vite |
| `typescript` | ~5.8.2 | TypeScript compiler |
| `@types/node` | ^22.14.0 | Node.js type definitions |

### Root Dependencies (`package.json`)

| Package | Version | Purpose |
|---|---|---|
| `concurrently` | ^9.2.1 | Run multiple processes together |

---

## 🛠️ Step-by-Step Deployment

### Step 1 — Download & Install Required Software

1. **Install XAMPP** from [apachefriends.org](https://www.apachefriends.org/download.html).
   - During install, make sure **PHP**, **MySQL**, and **Apache** components are selected.
   - Default install path: `C:\xampp`

2. **Install Node.js** from [nodejs.org](https://nodejs.org/) (choose the LTS version).
   - Verify installation:
     ```bash
     node -v
     npm -v
     ```

3. **Install Composer** from [getcomposer.org](https://getcomposer.org/download/).
   - During setup, point it to your XAMPP PHP executable: `C:\xampp\php\php.exe`
   - Verify installation:
     ```bash
     composer -V
     ```

4. **Add PHP to your system PATH** (if not done automatically by XAMPP):
   - Go to **System Properties → Environment Variables → Path** and add `C:\xampp\php`.

---

### Step 2 — Get the Project Files

**Option A — Clone via Git:**
```bash
git clone https://github.com/PikuFuka/OSCA.git
cd OSCA
```

**Option B — Download ZIP:**
- Download and extract the project folder to a location of your choice (e.g., `C:\OSCA`).

---

### Step 3 — Backend Setup (Laravel)

Open a terminal and navigate to the `backend` folder:

```bash
cd backend
```

**3a. Install PHP dependencies:**
```bash
composer install
```

**3b. Create the environment file:**
```bash
copy .env.example .env
```
> On Mac/Linux: `cp .env.example .env`

**3c. Open `.env` and configure the database connection.**

- **Using SQLite (recommended for local setup — no XAMPP MySQL needed):**
  ```dotenv
  DB_CONNECTION=sqlite
  # Leave all DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD commented out
  ```
  Then create the SQLite database file:
  ```bash
  php -r "touch(database_path('database.sqlite'));"
  ```
  Or manually create an empty file at `backend/database/database.sqlite`.

- **Using MySQL via XAMPP:**
  ```dotenv
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=osca_db
  DB_USERNAME=root
  DB_PASSWORD=
  ```

**3d. Generate the application key:**
```bash
php artisan key:generate
```

**3e. Link the storage folder:**
```bash
php artisan storage:link
```

---

### Step 4 — Database Setup

#### If using MySQL (XAMPP):
1. Open **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Go to [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/).
3. Click **New** in the left sidebar and create a database named exactly: **`osca_db`**

#### Run Migrations (both SQLite and MySQL):
```bash
php artisan migrate
```

#### (Optional) Seed with test data:
```bash
php artisan db:seed
```

---

### Step 5 — Frontend Setup (React/Vite)

Open a new terminal in the `frontend` folder:

```bash
cd frontend
npm install
```

---

### Step 6 — Root Setup (One-time)

In the root `OSCA` folder, install the root tool dependencies:

```bash
cd ..
npm install
```

---

### Step 7 — Run the Application

From the **root `OSCA` folder**, run all services at once:

```bash
npm run dev
```

This command concurrently starts:
- **MySQL** service via XAMPP
- **Laravel Backend** at `http://127.0.0.1:8000`
- **React Frontend** at `http://localhost:3000`

> **Shortcut (Windows only):** Double-click `APP\start.bat` — it will auto-install dependencies on first run, wait for the backend to be ready, and open the browser automatically.

---

### Step 8 — Access the Application

| Service | URL |
|---|---|
| **Frontend (Main App)** | http://localhost:3000 |
| **Backend API** | http://127.0.0.1:8000 |
| **phpMyAdmin** | http://localhost/phpmyadmin/ |

Use the default admin credentials (if seeded) or register via the application.

---

## ❗ Troubleshooting — Common Errors & Solutions

### ❌ `composer: command not found` or `'composer' is not recognized`
**Cause:** Composer is not installed or not added to the system PATH.
**Fix:**
1. Download and re-run the Composer installer from [getcomposer.org](https://getcomposer.org/download/).
2. Ensure `C:\ProgramData\ComposerSetup\bin` is in your system **PATH**.
3. Close and reopen your terminal.

---

### ❌ `php: command not found` or `'php' is not recognized`
**Cause:** PHP (via XAMPP) is not in the system PATH.
**Fix:**
1. Go to **System Properties → Advanced → Environment Variables**.
2. Under **System Variables**, find `Path` and add `C:\xampp\php`.
3. Restart your terminal and verify: `php -v`

---

### ❌ `APP_KEY` is missing or empty
**Cause:** The `.env` file was not created, or `key:generate` was not run.
**Fix:**
```bash
copy backend\.env.example backend\.env
cd backend
php artisan key:generate
```

---

### ❌ `SQLSTATE[HY000] [2002] No connection` or `Access denied for user 'root'`
**Cause:** MySQL is not running, or the credentials in `.env` are wrong.
**Fix:**
1. Open XAMPP Control Panel and start **MySQL**.
2. Verify the database `osca_db` exists in phpMyAdmin.
3. Double-check `backend/.env`:
   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=osca_db
   DB_USERNAME=root
   DB_PASSWORD=
   ```

---

### ❌ `Base table or view not found` / `Table 'seniors' doesn't exist`
**Cause:** Migrations have not been run yet.
**Fix:**
```bash
cd backend
php artisan migrate
```
If you need to reset all tables and start fresh:
```bash
php artisan migrate:fresh
```

---

### ❌ `npm: command not found` or `'npm' is not recognized`
**Cause:** Node.js is not installed or not in PATH.
**Fix:**
1. Download and install Node.js from [nodejs.org](https://nodejs.org/).
2. Restart your terminal and verify: `node -v && npm -v`

---

### ❌ Frontend shows blank page or `Cannot GET /`
**Cause:** The React dev server is not running, or the Vite port is blocked.
**Fix:**
1. Make sure you ran `npm install` inside the `frontend` folder.
2. Start the frontend manually: `cd frontend && npm run dev`
3. Verify it is running at `http://localhost:3000`.
4. Check that no other app is using port **3000** (e.g., run `netstat -ano | findstr :3000`).

---

### ❌ API calls return `CORS` errors in the browser console
**Cause:** The Laravel backend is not running on port 8000, or CORS is misconfigured.
**Fix:**
1. Ensure the backend is running: `cd backend && php artisan serve`
2. Verify `backend/config/cors.php` has `'allowed_origins' => ['*']` or includes `http://localhost:3000`.
3. Clear config cache: `php artisan config:clear`

---

### ❌ `Class "Maatwebsite\Excel\ExcelServiceProvider" not found`
**Cause:** Composer dependencies were not installed or vendor folder is missing.
**Fix:**
```bash
cd backend
composer install
php artisan config:clear
php artisan cache:clear
```

---

### ❌ `storage/app/public` is not accessible (uploaded images not showing)
**Cause:** The storage symlink was not created.
**Fix:**
```bash
cd backend
php artisan storage:link
```

---

### ❌ `npm run dev` crashes immediately / MySQL not starting
**Cause:** XAMPP MySQL is already running as a Windows service, or the path in `package.json` is wrong.
**Fix:**
1. Open XAMPP Control Panel and check if MySQL shows as running.
2. If already running, run only the backend and frontend separately:
   ```bash
   # Terminal 1
   cd backend && php artisan serve

   # Terminal 2
   cd frontend && npm run dev
   ```
3. Alternatively, update the `mysql` script path in root `package.json` to match your XAMPP install path.

---

### ❌ `Port 8000 is already in use`
**Cause:** Another process (or a previous artisan instance) is occupying port 8000.
**Fix:**
```bash
# Find and kill the process on Windows
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```
Or start the backend on a different port:
```bash
php artisan serve --port=8001
```
Then update the proxy target in `frontend/vite.config.ts` to match.

---

### ❌ `php_zip` extension not loaded (Excel export fails)
**Cause:** The `zip` extension is disabled in `php.ini`.
**Fix:**
1. Open `C:\xampp\php\php.ini`.
2. Find `;extension=zip` and remove the semicolon: `extension=zip`
3. Restart Apache in XAMPP Control Panel.

---

## 📁 Project Structure

```
OSCA/
├── APP/                  # Startup batch script for Windows
│   └── start.bat         # One-click launcher (auto-opens browser)
├── backend/              # Laravel 12 API (PHP 8.2+)
│   ├── app/              # Controllers, Models, Exports
│   ├── database/         # Migrations and seeders
│   ├── routes/api.php    # All API endpoints
│   ├── .env              # Environment config (create from .env.example)
│   └── composer.json     # PHP dependencies
├── frontend/             # React 19 + TypeScript + Vite
│   ├── components/       # All UI components
│   ├── services/api.ts   # Axios API service layer
│   ├── types.ts          # Shared TypeScript types
│   └── package.json      # Node dependencies
├── package.json          # Root scripts (runs all services together)
└── README.md             # This file
```

---

## 🔑 Default Ports

| Service | Port |
|---|---|
| React Frontend (Vite) | 3000 |
| Laravel Backend | 8000 |
| MySQL (XAMPP) | 3306 |
| Apache (XAMPP) | 80 |

---

*Last Updated: March 6, 2026 — Maintained by [PikuFuka](https://github.com/PikuFuka)*
