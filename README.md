# A.A Dynamic Computer Training Center - Node.js + React version

Full rewrite of the management system in **Node.js/Express (API) + React (frontend)**,
using the exact same Supabase Postgres database and schema as the Flask version —
your data, default accounts, and service price list are already there.

## Stack

- **Backend**: Express, `pg` (node-postgres), `pdfkit` + `qrcode` (certificates),
  `exceljs` (Excel reports), `multer` (photo uploads). Auth uses a small
  hand-rolled JWT implementation and password hashing, both built on Node's
  built-in `crypto` module — **no bcrypt or jsonwebtoken dependency needed**,
  and it stays compatible with the two default accounts already in Supabase.
- **Frontend**: React 18 + Vite + React Router, Chart.js for the dashboard chart,
  axios for API calls. Same green/gold split-screen design as before.

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env, paste your Supabase DB password into DATABASE_URL
npm start
```

The API runs at `http://localhost:4000`. Health check: `GET /api/health`.

Your existing Supabase data (Super Admin, Admin, 35 services) works immediately —
no need to run the seed script. `npm run seed` is there only if you ever point
this at a *different*, empty Supabase project.

## 2. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Visit **http://localhost:5173**. Vite's dev server proxies `/api`, `/verify`,
and `/uploads` requests to the backend on port 4000 (see `vite.config.js`), so
both can just run side by side with no CORS setup needed in dev.

### Default logins (already in your Supabase database)

| Role        | Email                        | Password         |
|-------------|-------------------------------|-------------------|
| Super Admin | superadmin@aadynamic.com      | SuperAdmin@123    |
| Admin       | admin@aadynamic.com           | Admin@123         |

## Project structure

```
aa_dynamic_mern/
├── server/                      Express API
│   ├── src/
│   │   ├── index.js              App entry point
│   │   ├── db.js                 Postgres connection pool (node-postgres)
│   │   ├── seed.js               Schema + default data (for a fresh project)
│   │   ├── middleware/
│   │   │   ├── auth.js            JWT verification, role checks
│   │   │   └── upload.js          Multer config for photo uploads
│   │   ├── routes/
│   │   │   ├── auth.js            Login/register/forgot-password, all 4 roles
│   │   │   ├── admin.js           Interns, attendance, services, customers,
│   │   │   │                     payments, certificates, notifications, reports
│   │   │   ├── superadmin.js      Admin account management, logs, settings
│   │   │   ├── intern.js          Intern self-service portal
│   │   │   ├── customer.js        Customer self-service portal
│   │   │   └── public.js          Certificate verification (no auth)
│   │   └── utils/
│   │       ├── password.js        crypto.scrypt hashing (Werkzeug-compatible)
│   │       ├── jwt.js              Hand-rolled HS256 JWT sign/verify
│   │       ├── audit.js            Audit log + notification helpers
│   │       ├── certificates.js     PDF certificate + embedded QR (pdfkit/qrcode)
│   │       └── reports.js          PDF/Excel report export (pdfkit/exceljs)
│   └── uploads/                  Photos + generated certificates (created at runtime)
│
└── client/                      React app (Vite)
    └── src/
        ├── main.jsx, App.jsx      Entry point, routing
        ├── api.js                 Axios instance with auth token handling
        ├── context/AuthContext.jsx
        ├── components/            DashboardLayout, BrandPanel, StatCard, etc.
        ├── pages/
        │   ├── auth/               Landing, Login, Register, ForgotPassword, VerifyLookup
        │   ├── admin/               Dashboard, Interns, Attendance, Services,
        │   │                       Customers, Payments, Certificates, Notifications, Reports
        │   ├── superadmin/          Dashboard, Admins, Logs, Settings
        │   ├── intern/              Dashboard, Profile, Attendance
        │   └── customer/            Dashboard, Services, Payments, Profile
        └── styles/theme.css        Green/gold theme, split-screen auth layout
```

## How authentication works

Unlike the Flask version (server-side sessions), this is a decoupled API +
SPA, so it uses **JWT bearer tokens**:

1. `POST /api/auth/login/:role` verifies the password and returns a signed token.
2. The React app stores it in `localStorage` and sends it as
   `Authorization: Bearer <token>` on every API call (see `src/api.js`).
3. File downloads (certificates, reports, receipts) use `window.open()`,
   which can't set custom headers — so those specific routes also accept the
   token as a `?token=` query parameter. Everything else requires the header.
4. Tokens expire after 7 days. Passwords are hashed with `crypto.scrypt` in
   the exact string format Werkzeug used, so your existing Supabase accounts
   authenticate without any changes.

## Verification performed in this environment

This sandbox has no internet access, so `npm install` can't be run here to
do a live end-to-end test. What **was** verified without needing any
installed packages:

- Every backend file (16 files) passed `node --check` (syntax validation).
- Every frontend file (38 files) was parsed with the TypeScript compiler's
  JSX parser — 0 syntax errors.
- Every relative `import` in the frontend resolves to a real file — 0 broken imports.
- The password hashing (`crypto.scrypt`) was tested end-to-end, including
  against the *actual* password hash already stored in your Supabase
  `super_admins` table — confirmed it verifies correctly.
- The hand-rolled JWT implementation was tested for all four core properties:
  valid sign/verify round-trip, tampered-token rejection, wrong-secret
  rejection, and expiry rejection.
- All 58 backend routes were cross-referenced against every API call made
  from the frontend — no mismatches.

What to double check once you have `npm install` working locally: the actual
end-to-end request/response cycle (this environment could verify the code is
correct but not literally run the two servers together talking over HTTP).
