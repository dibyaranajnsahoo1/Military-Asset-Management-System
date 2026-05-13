# 🪖 Military Asset Management System (MAMS)

A full-stack web application for managing military assets across multiple bases with role-based access control.

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Data Models / Schema](#data-models--schema)
4. [RBAC Explanation](#rbac-explanation)
5. [API Logging](#api-logging)
6. [Setup Instructions](#setup-instructions)
7. [API Endpoints](#api-endpoints)
8. [Login Credentials](#login-credentials)

---

## 1. Project Overview

MAMS enables commanders and logistics personnel to manage military equipment (weapons, vehicles, ammunition) across multiple army bases.

### Features
- ✅ **Dashboard** — Opening/Closing balance, Net Movement (clickable breakdown popup), Assigned & Expended metrics, 6-month bar chart, asset inventory table
- ✅ **Purchases** — Record acquisitions, view history with filters
- ✅ **Transfers** — Move assets between bases, full transfer history
- ✅ **Assignments & Expenditures** — Assign to personnel, log consumption/damage
- ✅ **User Management** — Create/manage users (Admin only)
- ✅ **RBAC** — Three roles with different access levels
- ✅ **Audit Logging** — Every mutation is logged with user, timestamp, and payload
- ✅ **BONUS** — Net Movement popup with Purchases / Transfer In / Transfer Out tabs

### Assumptions
- Opening balance represents inventory at system setup; it doesn't auto-update
- "Closing Balance = Opening + Purchases + TransfersIn − TransfersOut − Assigned − Expended"
- Transfers deduct from source base's `currentQty` automatically
- The frontend demo runs fully in-memory (no backend required to view)

### Limitations
- No real-time sync between browser tabs (would need WebSocket)
- Password reset flow not implemented (out of scope)
- No file upload for asset documentation

---

## 2. Tech Stack & Architecture

### Frontend
| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | React 18 | Component reuse, hooks for state |
| Styling | Tailwind CSS + Inline styles | Rapid utility styling |
| Charts | Recharts | Lightweight, responsive bar charts |
| Icons | Lucide React | Consistent icon set |
| Font | Inter | Professional, highly legible |

### Backend
| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | Node.js + Express | Fast, non-blocking I/O; huge ecosystem |
| Database | MongoDB + Mongoose | Flexible document model; easy JSON mapping |
| Auth | JWT (jsonwebtoken) | Stateless; scales horizontally |
| Password | bcryptjs | Industry-standard hashing |
| Logging | Winston | Structured logs with log levels |
| Security | Helmet + CORS + rate-limit | Defence in depth |

### Architecture
```
Browser (React SPA)
    │  HTTPS
    ▼
Express.js API Server
    │
    ├── /api/auth           → Login, me, logout
    ├── /api/dashboard      → Metrics + chart data
    ├── /api/purchases      → CRUD
    ├── /api/transfers      → CRUD
    ├── /api/assignments    → CRUD
    ├── /api/expenditures   → CRUD
    ├── /api/users          → Admin CRUD
    └── /api/audit-logs     → Admin read-only
         │
         ▼
    MongoDB (mams database)
    Collections: users, bases, assets, purchases, transfers,
                 assignments, expenditures, auditlogs
```

---

## 3. Data Models / Schema

### users
```js
{ name, email, passwordHash, role, baseId, isActive, lastLogin }
```

### bases
```js
{ name, location, code, isActive }
```

### assets
```js
{ name, type, baseId, openingQty, currentQty, unit, description }
```

### purchases
```js
{ assetId, baseId, quantity, purchaseDate, supplier, notes, addedBy }
```

### transfers
```js
{ assetId, fromBaseId, toBaseId, quantity, transferDate, status, notes, initiatedBy }
```

### assignments
```js
{ assetId, baseId, quantity, assignedTo, assignmentDate, returnDate, status, notes, createdBy }
```

### expenditures
```js
{ assetId, baseId, quantity, reason, dateExpended, notes, createdBy }
```

### auditlogs
```js
{ action, entity, entityId, userId, userName, userRole, baseId, details, ipAddress, userAgent, createdAt }
```

---

## 4. RBAC Explanation

| Role | Pages | Capabilities |
|------|-------|-------------|
| **Admin** | All | Full CRUD on everything; all bases |
| **BaseCommander** | Dashboard, Purchases, Transfers, Assignments | CRUD limited to their base |
| **LogisticsOfficer** | Purchases, Transfers | Read + create only; limited to their base |

**Enforcement:**
- **JWT middleware** (`protect`) decodes the token and attaches `req.user`
- **`authorize(...roles)`** middleware rejects any request from a non-matching role with HTTP 403
- **`scopeToBase`** middleware sets `req.baseScope` — non-admins can only query/write their own base's data
- Frontend hides pages based on `ROLE_ACCESS` map (defence in depth; real security is server-side)

---

## 5. API Logging

Every successful **POST / PUT / PATCH / DELETE** request is captured by the `auditLog` middleware wrapper:

```
What's stored:
  action     → e.g. "CREATE_PURCHASE"
  entity     → e.g. "Purchase"
  entityId   → MongoDB ObjectId of created/modified document
  userId     → Who made the request
  userName   → Display name
  userRole   → Their role at time of action
  details    → Full request body + response data snapshot
  ipAddress  → Client IP
  userAgent  → Browser/client string
  createdAt  → Automatic timestamp
```

Admin users can query all audit logs via `GET /api/audit-logs`.

Application-level logs (server start, DB connection, errors) are written by **Winston** to:
- `stdout` (console, colorized in dev)
- `logs/combined.log`
- `logs/error.log` (errors only)

---

## 6. Setup Instructions

### Prerequisites
- Node.js ≥ 18
- MongoDB ≥ 6 (local or Atlas)
- npm ≥ 9

### Backend Setup

```bash
# 1. Enter backend directory
cd mams-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env → set MONGODB_URI to your connection string

# 4. Seed the database
npm run seed

# 5. Start the server
npm run dev          # development (nodemon)
npm start            # production
```

Server starts on: `http://localhost:5000`

### Frontend Setup (React App)

```bash
# 1. Enter frontend directory
cd mams-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

App opens on: `http://localhost:3000`

> **Note:** The `MilitaryAMS.jsx` artifact is a standalone demo that works without a backend.  
> For a full-stack setup, replace mock data with API calls using `fetch` or `axios`.

---

## 7. API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | All | Current user profile |
| POST | `/api/auth/logout` | All | Logout (audit logged) |
| POST | `/api/auth/change-password` | All | Change own password |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/metrics` | All | Opening, Closing, Net, Assigned, Expended |
| GET | `/api/dashboard/chart` | All | Monthly data for bar chart |

Query params: `dateFrom`, `dateTo`, `baseId` (Admin only), `assetType`

### Purchases
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/purchases` | All | List with filters |
| POST | `/api/purchases` | Admin, BC, LO | Create purchase |
| DELETE | `/api/purchases/:id` | Admin | Delete |

### Transfers
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/transfers` | All | List with filters |
| POST | `/api/transfers` | Admin, BC, LO | Initiate transfer |

### Assignments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/assignments` | All | List with filters |
| POST | `/api/assignments` | Admin, BC | Create assignment |

### Expenditures
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/expenditures` | All | List with filters |
| POST | `/api/expenditures` | Admin, BC | Record expenditure |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Deactivate user |

### Audit Logs (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs` | List audit trail |

---

## 8. Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@military.gov | admin123 |
| **Base Commander** (Alpha) | commander@alpha.mil | commander123 |
| **Logistics Officer** (Bravo) | logistics@bravo.mil | logistics123 |
| **Base Commander** (Charlie) | commander@charlie.mil | commander456 |

---

*© 2025 Military Asset Management System*
