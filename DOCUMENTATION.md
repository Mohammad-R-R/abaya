# Abaya Store Management System
## Complete Documentation

---

## 📁 Project Structure

```
abaya-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── migrations/
│   │       └── 001_init.sql       # Initial migration SQL
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── abaya.controller.js
│   │   │   ├── sale.controller.js
│   │   │   ├── expense.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── category.controller.js
│   │   │   └── import.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT authentication
│   │   │   ├── upload.middleware.js # Cloudinary + Multer
│   │   │   └── error.middleware.js # Global error handler
│   │   ├── routes/                # Express routers
│   │   └── utils/
│   │       ├── prisma.js          # Prisma client singleton
│   │       ├── helpers.js         # SKU / invoice generators
│   │       └── seed.js            # Database seeder
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Route-level components
│   │   ├── components/            # Reusable UI components
│   │   ├── store/                 # Zustand state (auth)
│   │   └── utils/                 # API client, formatters
│   ├── .env.example
│   └── package.json
│
├── render.yaml                    # Render.com deployment config
└── DOCUMENTATION.md               # This file
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Cloudinary account (free tier works)

### Step 1 — Clone & Install

```bash
# Install all dependencies
npm run install:all

# Or individually:
cd backend && npm install
cd ../frontend && npm install
```

### Step 2 — Configure Environment

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/abaya_store
JWT_SECRET=your-long-random-secret-here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3 — Database Setup

```bash
# Create the database
createdb abaya_store

# Generate Prisma client
cd backend && npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data + users
npm run db:seed
```

### Step 4 — Start Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## 🔐 Default Login Credentials

| User      | Email                       | Password     | Role  |
|-----------|-----------------------------|--------------|-------|
| Mohammad  | mohammad@abayastore.com     | Admin@2024   | Admin |
| Shatha    | shatha@abayastore.com       | Staff@2024   | Staff |

> ⚠️ **Change passwords immediately after first login in production!**

---

## ☁️ Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25GB storage)
2. Go to **Dashboard** → copy **Cloud Name**, **API Key**, **API Secret**
3. Paste into your `.env` file

---

## 🌐 Render.com Deployment (Step-by-Step)

### Option A — Using render.yaml (Recommended)

1. Push your code to a GitHub repository
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Render auto-detects `render.yaml` and creates all services
6. Fill in the missing env vars (Cloudinary, FRONTEND_URL)
7. Click **Apply**

### Option B — Manual Setup

#### 1. Create PostgreSQL Database
- Render Dashboard → **New** → **PostgreSQL**
- Name: `abaya-db`
- Region: Frankfurt (or nearest to you)
- Plan: Starter ($7/month)
- Copy the **Internal Database URL**

#### 2. Deploy Backend
- **New** → **Web Service**
- Connect GitHub repo
- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start Command: `npm start`
- Add environment variables:
  ```
  NODE_ENV=production
  DATABASE_URL=<paste from step 1>
  JWT_SECRET=<generate a random 64-char string>
  JWT_EXPIRES_IN=7d
  CLOUDINARY_CLOUD_NAME=<your value>
  CLOUDINARY_API_KEY=<your value>
  CLOUDINARY_API_SECRET=<your value>
  FRONTEND_URL=https://abaya-frontend.onrender.com
  ```

#### 3. Deploy Frontend
- **New** → **Static Site**
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Add environment variable:
  ```
  VITE_API_URL=https://abaya-backend.onrender.com/api
  ```
- Add redirect rule: `/* → /index.html` (for React Router)

#### 4. Run Database Seed
After backend deploys, open the **Shell** tab in Render for your backend service:
```bash
node src/utils/seed.js
```

---

## 📡 API Reference

Base URL: `https://your-backend.onrender.com/api`

All authenticated routes require:
```
Authorization: Bearer <jwt_token>
```

---

### Auth

| Method | Endpoint              | Auth | Description       |
|--------|-----------------------|------|-------------------|
| POST   | `/auth/login`         | ✗    | Login             |
| GET    | `/auth/me`            | ✓    | Get current user  |
| PATCH  | `/auth/change-password` | ✓  | Change password   |

**POST /auth/login**
```json
Request:  { "email": "mohammad@abayastore.com", "password": "Admin@2024" }
Response: { "token": "eyJ...", "user": { "id", "name", "email", "role" } }
```

---

### Inventory (Abayas)

| Method | Endpoint                      | Auth  | Role  | Description            |
|--------|-------------------------------|-------|-------|------------------------|
| GET    | `/abayas`                     | ✓     | Any   | List all (paginated)   |
| GET    | `/abayas/low-stock`           | ✓     | Any   | Low stock items        |
| GET    | `/abayas/:id`                 | ✓     | Any   | Single abaya detail    |
| POST   | `/abayas`                     | ✓     | Any   | Create abaya           |
| PUT    | `/abayas/:id`                 | ✓     | Any   | Update abaya           |
| DELETE | `/abayas/:id`                 | ✓     | Admin | Delete abaya           |
| DELETE | `/abayas/:id/images/:imageId` | ✓     | Any   | Delete image           |

**GET /abayas** Query Params:
- `page` (default: 1)
- `limit` (default: 20)
- `search` — name, SKU, description
- `categoryId` — filter by category UUID
- `lowStock=true` — only low stock items
- `sortBy` — name, quantity, sellingPrice, costPrice, createdAt
- `sortOrder` — asc | desc

**POST /abayas** (multipart/form-data):
```
name*         string
categoryId*   uuid
quantity*     integer
costPrice*    decimal
sellingPrice* decimal
nameAr        string (optional)
description   string (optional)
lowStockAlert integer (optional, default: 5)
images        file[] (optional, max 5)
```

---

### Categories

| Method | Endpoint          | Auth | Role  | Description       |
|--------|-------------------|------|-------|-------------------|
| GET    | `/categories`     | ✓    | Any   | List all          |
| POST   | `/categories`     | ✓    | Admin | Create            |
| PUT    | `/categories/:id` | ✓    | Admin | Update            |
| DELETE | `/categories/:id` | ✓    | Admin | Delete (if empty) |

---

### Sales

| Method | Endpoint         | Auth | Role  | Description          |
|--------|------------------|------|-------|----------------------|
| GET    | `/sales`         | ✓    | Any   | List (paginated)     |
| GET    | `/sales/summary` | ✓    | Any   | Today/month/year KPI |
| GET    | `/sales/:id`     | ✓    | Any   | Invoice detail       |
| POST   | `/sales`         | ✓    | Any   | Record new sale      |

**POST /sales**:
```json
{
  "items": [
    { "abayaId": "uuid", "quantity": 2 }
  ],
  "paymentMethod": "CASH",
  "discount": 50,
  "customerName": "Fatima",
  "customerPhone": "+966501234567",
  "notes": "Optional note"
}
```

Payment methods: `CASH` | `BANK_TRANSFER` | `CARD` | `OTHER`

---

### Expenses

| Method | Endpoint          | Auth | Role       | Description   |
|--------|-------------------|------|------------|---------------|
| GET    | `/expenses`       | ✓    | Any        | List all      |
| POST   | `/expenses`       | ✓    | Any        | Add expense   |
| PUT    | `/expenses/:id`   | ✓    | Own/Admin  | Update        |
| DELETE | `/expenses/:id`   | ✓    | Own/Admin  | Delete        |

Categories: `RENT` | `SHIPPING` | `SUPPLIES` | `UTILITIES` | `MARKETING` | `SALARIES` | `MAINTENANCE` | `OTHER`

---

### Dashboard

| Method | Endpoint                      | Auth | Role  | Description           |
|--------|-------------------------------|------|-------|-----------------------|
| GET    | `/dashboard/overview`         | ✓    | Any   | KPI summary           |
| GET    | `/dashboard/profit-loss`      | ✓    | Admin | Monthly P&L           |
| GET    | `/dashboard/sales-chart`      | ✓    | Any   | Daily sales chart     |
| GET    | `/dashboard/category-breakdown` | ✓  | Any   | Revenue by category   |

**GET /dashboard/overview** Params: `period=today|week|month|year`

**GET /dashboard/profit-loss** Params: `year=2024`

---

### Import

| Method | Endpoint           | Auth | Role  | Description              |
|--------|--------------------|------|-------|--------------------------|
| GET    | `/import/template` | ✗    | —     | Download Excel template  |
| POST   | `/import/preview`  | ✓    | Any   | Validate, don't save     |
| POST   | `/import/import`   | ✓    | Admin | Validate + save          |

Both preview and import accept `multipart/form-data` with field `file` (.xlsx, .xls, .csv).

---

## 📊 Excel Import Format

Required columns (exact names, case-insensitive):

| Column          | Type    | Required | Description                        |
|-----------------|---------|----------|------------------------------------|
| name            | text    | ✓        | English product name               |
| category        | text    | ✓        | Must match a category in the system|
| quantity        | integer | ✓        | Initial stock (≥ 0)                |
| cost_price      | decimal | ✓        | Purchase/cost price                |
| selling_price   | decimal | ✓        | Retail price                       |
| name_ar         | text    | ✗        | Arabic name (optional)             |
| description     | text    | ✗        | Product description                |
| low_stock_alert | integer | ✗        | Alert threshold (default: 5)       |

**Example rows:**
```
name,category,quantity,cost_price,selling_price,description
Classic Black Abaya,Classic,20,80,150,Elegant classic abaya
Luxury Pearl Abaya,Luxury,8,350,750,Premium pearl-detail abaya
```

---

## 🛡️ Security Features

- **JWT Authentication** — 7-day expiry, stateless
- **Bcrypt Password Hashing** — 12 rounds
- **Role-Based Access Control** — Admin vs Staff
- **Rate Limiting** — 300 req/15min globally, 20 req/15min on auth
- **Helmet.js** — HTTP security headers
- **CORS** — Restricted to frontend URL
- **SQL Injection Prevention** — Prisma ORM with parameterized queries
- **XSS Prevention** — No raw HTML output, Helmet CSP
- **File Upload Security** — Type whitelist, 5MB limit, Cloudinary storage
- **Input Validation** — Server-side validation on all endpoints
- **Soft Delete** — Abayas with sales history are soft-deleted (isActive: false)

---

## 👥 Role Permissions

| Feature              | Admin (Mohammad) | Staff (Shatha) |
|----------------------|:----------------:|:--------------:|
| View Dashboard       | ✓                | ✓              |
| View Inventory       | ✓                | ✓              |
| Add/Edit Abayas      | ✓                | ✓              |
| Delete Abayas        | ✓                | ✗              |
| Create Sales         | ✓                | ✓              |
| View Sales           | ✓                | ✓              |
| Add/Edit Expenses    | ✓                | ✓ (own only)   |
| Delete Expenses      | ✓                | ✗              |
| View Reports         | ✓                | ✗              |
| Import Data          | ✓                | ✗              |
| Manage Categories    | ✓                | ✗              |

---

## 💰 Sample Data

After running seed, you get:

**8 Abayas** across 6 categories, including:
- Classic Black Abaya — 25 units, SAR 150
- Luxury Pearl Abaya — 8 units, SAR 750
- Kids Pink Abaya — 20 units, SAR 100
- Premium Nida Abaya — 2 units (low stock!), SAR 950

**5 Sample Expenses:**
- Rent: SAR 5,000
- Utilities: SAR 450
- Shipping: SAR 320
- Marketing: SAR 800
- Supplies: SAR 200

---

## 🐛 Troubleshooting

**Database connection fails:**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify DATABASE_URL format
postgresql://USER:PASSWORD@HOST:PORT/DBNAME
```

**Cloudinary upload fails:**
- Verify all 3 env vars are set correctly
- Check Cloudinary dashboard for usage limits
- Ensure the `abaya-store` folder permissions are set to public

**Prisma migration errors:**
```bash
cd backend
npx prisma migrate reset  # WARNING: deletes all data
npx prisma migrate deploy
npm run db:seed
```

**JWT "invalid token" errors:**
- Ensure `JWT_SECRET` is identical between backend restarts
- On Render, never regenerate JWT_SECRET after users are created

**Build fails on Render:**
- Check Node version is 18+ in Render settings
- Ensure `prisma generate` runs before `prisma migrate deploy`

---

## 📦 Tech Stack Summary

| Layer       | Technology                    |
|-------------|-------------------------------|
| Backend     | Node.js + Express             |
| Database    | PostgreSQL                    |
| ORM         | Prisma                        |
| Auth        | JWT + bcryptjs                |
| File Upload | Multer + Cloudinary           |
| Excel       | xlsx (SheetJS)                |
| Frontend    | React 18 + Vite               |
| Styling     | Tailwind CSS                  |
| Charts      | Recharts                      |
| State       | Zustand + React Query         |
| Forms       | React Hook Form               |
| Deployment  | Render.com                    |

---

*Built for Abaya Store — Version 1.0.0*
