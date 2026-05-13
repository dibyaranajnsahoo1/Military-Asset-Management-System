# Military Asset Management System (MAMS)

MAMS is a secure, full-stack enterprise web application designed to streamline the logistics and asset tracking for military installations. Built with modern web technologies, it replaces manual tracking mechanisms with a robust, database-driven dashboard featuring high-level analytics, real-time inventory adjustments, and stringent role-based access control.

## 🚀 Features

- **Centralized Dashboard Analytics:** Interactive data visualizations (powered by Recharts) showing 6-month historical trends, net movements, and real-time inventory valuations segmented by bases.
- **Secure Authentication & Sessions:** Utlizes HTTP-only cookies to thwart Cross-Site Scripting (XSS) attacks, protecting JWT authentication tokens natively.
- **Role-Based Access Control (RBAC):**
  - **Admin:** Full system oversight across all bases, comprehensive user management, and audit logging.
  - **Base Commander:** Operations management confined exclusively to their assigned base.
  - **Logistics Officer:** Inventory tracking (purchases, transfers, assignments) for their assigned base.
- **End-to-End Asset Tracking:** Modules to manage Purchases (inbound), Transfers (base-to-base), Assignments (deployment), and Expenditures (consumption/loss).
- **Backend Driven Architecture:** Fully integrates a MongoDB database with Express to persist all application states, removing all reliance on client-side caching or mock arrays.
- **Robust Security Middleware:** Express-rate-limit prevents brute-force login attacks, while proper proxy configurations (`trust proxy`) maintain traffic legitimacy behind Reverse Proxies.

## 🛠️ Technology Stack

- **Frontend:** React (Create React App), Vanilla CSS, Recharts (Data Visualization), Lucide React (Iconography).
- **Backend:** Node.js, Express.js, MongoDB (Mongoose ORM).
- **Security:** `cookie-parser` for secure session handling, `express-validator` for strict payload validation, `express-rate-limit` for DDoS mitigation, and `helmet` for HTTP header security.

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)

### 2. Backend Configuration
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<your_cluster_uri>
   JWT_SECRET=super_secret_key_mams
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:3000
   ```
4. **Seed the database** (Creates default demo accounts and assets):
   ```bash
   node seed.js
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration
1. Open a new terminal and navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will automatically proxy API requests to `http://localhost:5000` as configured in the `package.json`.

## 🔐 Default Demo Accounts
(Generated after running `seed.js`)
- **Admin:** `admin@military.gov` / `admin123`
- **Base Commander:** `commander@alpha.mil` / `commander123`
- **Logistics Officer:** `logistics@bravo.mil` / `logistics123`

## 🛡️ Recent Security Enhancements
- Fully migrated from `localStorage` JWT storage to secure **HTTP-Only Cookies**, preventing local script extraction.
- Hardened API Validation ensures robust parsing (e.g., rigid 8-character password enforcement).
- Corrected Proxy Trust settings to ensure accurate IP identification during rate limiting.

## 📂 Project Structure

```text
MAMS_Project/
├── backend/                  # Express.js REST API
│   ├── config/               # Database and Logger configurations
│   ├── middleware/           # RBAC, Authentication, Error Handling
│   ├── models/               # Mongoose Schemas (User, Asset, Base, etc.)
│   ├── routes/               # API endpoint definitions
│   ├── seed.js               # Database population script
│   └── server.js             # Express application entry point
│
├── frontend/                 # React SPA (Create React App)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── api.js            # Centralized API service with credential handling
│   │   ├── components/       # Reusable UI components (Sidebar, Navbar, Modal)
│   │   ├── pages/            # View-level components (Dashboard, Purchases, Users)
│   │   ├── App.jsx           # Main router and global state provider
│   │   └── index.css         # Global vanilla CSS stylesheets
│   └── package.json          # Proxies API traffic to backend
│
├── .gitignore                # Root gitignore
└── README.md                 # Project documentation
```

## 📋 Implementation Plan (Migration to Backend)

The application was built out in systematic phases to ensure a robust, database-driven architecture:

### Phase 1: Foundation & Modeling
- Designed and initialized MongoDB schemas using Mongoose for `User`, `Base`, `Asset`, `Purchase`, `Transfer`, `Assignment`, and `Expenditure`.
- Created robust Express REST API routes with input validation (`express-validator`).

### Phase 2: Security & Authentication Hardening
- Replaced insecure `localStorage` JWT handling with **HTTP-Only Cookies**.
- Implemented `express-rate-limit` for endpoint protection.
- Configured Role-Based Access Control (RBAC) middleware to strictly enforce `Admin`, `BaseCommander`, and `LogisticsOfficer` privileges.

### Phase 3: Frontend Integration
- Created a centralized `api.js` to manage all external requests and intercept 401 Unauthorized errors globally.
- Systematically stripped out all static mock data arrays (`data.js`) across all frontend pages (`Dashboard`, `Purchases`, `Assignments`, `Transfers`, `Users`).
- Refactored frontend state management to asynchronously fetch, post, and immediately reflect changes from the live database.

### Phase 4: Polish & Refinement
- Fine-tuned Recharts components on the Dashboard to accurately compute monthly aggregates and movement metrics directly from backend data.
- Added comprehensive error-handling and Toast notification feedback loops.
- Ensured strict password enforcement (minimum 8 characters) during user creation.

---
*Developed for Military Logistics Readiness & Operations.*
