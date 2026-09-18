# ChitFund Pro — Kameti Management System

A modern, transparent, and secure ChitFund / Kameti Management System built with **Node.js (Express) backend**, **React.js (Vite + Tailwind CSS) frontend**, and **MySQL database**.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MySQL running locally on port 3306 (XAMPP or standalone) with database `kameti_db`

### 1. Start Node.js Backend Server
```bash
cd node-backend
npm install   # If not already installed
npm run dev
```
*Backend runs on `http://localhost:5001`*

### 2. Start React.js Frontend App
```bash
cd react-frontend
npm install   # If not already installed
npm run dev
```
*Frontend opens on `http://localhost:5173`*

---

## 🔑 Default Login Credentials

### Administrator:
- **Email / Phone**: `admin@kameti.com` or `9999999999`
- **Password**: `admin123`

### Member Example:
- **Phone**: `7014965700` (`akshay sharma ji`)
- **Password**: `akshay123`

---

## 📦 Project Structure

```
.
├── node-backend/               # Node.js + Express API Server
│   ├── src/
│   │   ├── config/db.js        # MySQL2 Connection Pool
│   │   ├── middleware/auth.js  # JWT Auth & Role Authorization
│   │   ├── services/formula.js # ChitFund calculation engine
│   │   ├── controllers/        # Auth, Committees, Members, Payments, Bidding, Export
│   │   ├── routes/             # Express API Routes
│   │   └── server.js           # Express App Entry Point
│   ├── kameti_db_backup.sql    # Full Database Schema & Data Backup
│   ├── package.json
│   └── .env
│
├── react-frontend/             # React.js SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/client.js       # Axios client with interceptors
│   │   ├── context/AuthContext # Session state management
│   │   ├── components/         # Navbar, PayoutModal, WinnerModal, BiddingModal
│   │   ├── pages/              # Committees, Members, Payments, Live Auction, Print
│   │   ├── App.jsx             # Route definitions & Role Guards
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── package.json                # Root convenience scripts
```

---

## 🛡️ Database Backup
A full standalone backup of the database structure and existing records is saved at:
`node-backend/kameti_db_backup.sql`
