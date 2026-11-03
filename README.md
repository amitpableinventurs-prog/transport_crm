# Transport ERP

Starter project with a React (JavaScript) frontend, an Express API, and a local MongoDB connection.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- MongoDB Community Server running locally

## Setup

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Create the server environment file:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   The example URI connects to `mongodb://127.0.0.1:27017/transport_erp`. Change `MONGODB_URI` in `server/.env` if your local MongoDB uses a different address.

   Set unique random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (at least 32 characters each), then set `ADMIN_LOGIN_ID` and `ADMIN_PASSWORD` (8+ characters). On first start the server creates the super admin login from these values; after that, change the password from the app (the `.env` value is not read again).

   Keep secrets out of source control.

3. Start MongoDB Community Server if it is not already running.

4. Start the frontend and backend together:

   ```bash
   npm run dev
   ```

   Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The Express API runs at `http://localhost:5000`, and `GET /api/health` reports API and database status.

## Other commands

- `npm run build` — build the React frontend
- `npm start` — start the API server (MongoDB must be running)

The Vite development server proxies `/api` requests to Express. The app uses one MongoDB collection, `transport_records`; records can share it and use the required `type` field to distinguish their kinds.

## Logins and roles

Everyone signs in at `/login` with a **login ID and password**. The account's role decides which panel opens; it can't be switched in the UI.

| Role | Who creates the login | Access |
| --- | --- | --- |
| Super Admin | Created on first start from `ADMIN_LOGIN_ID` / `ADMIN_PASSWORD` | Everything, including **System Settings → Manager Accounts** |
| Transport Manager | Super admin: add the manager under Manager Accounts, then **Login** on the row | Customers, bookings, fleet, drivers, reports. No system settings |
| Driver | Super admin or manager: **Driver Management → Driver Registration → Login** on the row | View-only access to their own attendance, licences, documents and salary |
| Customer | Self-registration at `/register` (mobile number becomes the login ID), or staff via **Customer Accounts → customer → Login access** | Their own profile/KYC, bookings and shipments |

- Passwords are at least 8 characters and stored as bcrypt hashes. Login IDs are case-insensitive.
- 5 wrong passwords lock that login for 15 minutes.
- Anyone signed in can change their own password (key icon in the top bar). Forgotten passwords are reset by staff from the **Login** dialog.
- Resetting a password, disabling a login, or setting a manager to Inactive signs that person out immediately.
- Sessions are stored per browser tab, so you can be signed in as different roles in different tabs.

API: `POST /api/v1/auth/login` `{ loginId, password }`, `POST /api/v1/auth/register`, `GET /api/v1/auth/session`, `POST /api/v1/auth/change-password`, and `GET`/`PUT /api/v1/auth/accounts/:role/:profileId` for staff-managed logins. Role checks live in each route file (`requireRole`).

## Customer management API

- Sign in with `POST /api/v1/auth/login`; super admin and manager tokens can use the routes below.
- Admin bearer tokens can access `GET /api/v1/customers/management/summary`, customer list/detail, profile/status updates, and `PATCH /api/v1/customers/management/:id/kyc`.
- Customers submit their current profile for review with `POST /api/v1/customers/portal/kyc/submit`.
- Admin activity history is available at `GET`/`POST /api/v1/customers/management/:id/activities`; follow-ups can be completed with `PATCH /api/v1/customers/management/:id/activities/:activityId/complete`.

KYC currently tracks profile identity data and its review state; binary document upload/storage is not configured in this project yet.

## Driver management API

Driver management endpoints require an admin bearer token:

- `/api/v1/drivers` supports driver registration, filtered/paginated listing, detail, profile updates, status updates, and soft deletion.
- `/api/v1/drivers/licenses`, `/documents`, `/attendance`, and `/payments` provide CRUD for driver compliance records, attendance, and pay periods.
- `/api/v1/drivers/performance` and `/api/v1/reports/driver` report real driver counts and attendance metrics. Trip-based performance is not available until trip records are implemented.
- Driver document records accept a URL; binary driver-document upload/storage is not configured.

## UI and backend libraries

- Tailwind CSS v4 is enabled through the Vite plugin; use utility classes in React components.
- Lucide React provides the frontend icon set.
- The server includes Zod for request validation, `jsonwebtoken` for JWTs, and `bcrypt` for password hashing.
