# OSCA Senior Citizen ID System

The **OSCA Senior Citizen ID System** is a platform designed to manage and streamline the record-keeping and processing of applications for Senior Citizen identification. It features a comprehensive dashboard, real-time activity logs, a member registry with family member management, and an archive system.

## 🚀 System Overview
- **Member Registry:** Manage senior citizen profiles, including family details and documents.
- **Approval Workflow:** Streamlined process for reviewing and approving member applications.
- **Dashboard & Analytics:** Visual insights into citizen statistics across different barangays.
- **Archive & Backup:** Secure storage for deleted/inactive records and a one-click database backup system.
- **History Logs:** Full traceability of all administrative actions.

---

## 📋 Prerequisites & Requirements

Before you begin, ensure you have the following installed on your local machine:

### 1. XAMPP (For PHP and Database)
- **PHP Version:** PHP 8.3 or higher recommended.
- **Download:** [https://www.apachefriends.org/download.html](https://www.apachefriends.org/download.html)
- **Includes:** Apache, MySQL, and PHP.

### 2. Node.js & npm (For Frontend)
- **Version:** v22.x (LTS) or higher recommended.
- **Download:** [https://nodejs.org/](https://nodejs.org/)

### 3. Composer (For Backend Dependencies)
- **Version:** v2.x
- **Download:** [https://getcomposer.org/download/](https://getcomposer.org/download/)

### 4. Git
- **Download:** [https://git-scm.com/downloads](https://git-scm.com/downloads)

---

## 🛠️ Installation & Setup

Follow these steps to get the project running locally.

### 1. Clone the Repository
```bash
git clone https://github.com/PikuFuka/OSCA.git
cd OSCA
```

### 2. Backend Setup (Laravel)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Prepare the environment file:
   - Create a copy of `.env.example` and name it `.env`.
   - Update the database credentials in `.env` if needed:
     ```dotenv
     DB_DATABASE=osca_db
     DB_USERNAME=root
     DB_PASSWORD=
     ```
4. Generate the application key:
   ```bash
   php artisan key:generate
   ```

### 3. Frontend Setup (React/Vite)
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```

### 4. Database Setup
1. Open the **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open your browser and go to [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/).
3. Create a new database named **`osca_db`**.
4. (Optional) In the root of the project folder, also run `npm install` to set up root tools.

### 5. Run Migrations
Go back to the `backend` directory and run:
```bash
php artisan migrate
```

---

## 🏃 Running the Application

You can start the Database, Backend, and Frontend simultaneously from the **root folder** of the project:

1. Open your terminal in the root `OSCA` folder.
2. Run:
   ```bash
   npm run dev
   ```
   *Note:* The root script is configured to use your XAMPP path to start the MySQL service automatically.

- **Frontend:** [http://localhost:3000/](http://localhost:3000/)
- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)

---
*Created and maintained by [PikuFuka](https://github.com/PikuFuka).*
