# IT Asset Management System

Backend API for tracking IT assets, users, departments and asset assignments, with JWT authentication and role-based authorization.

## Features

- JWT authentication (register, login, current user)
- Role-based authorization: `ADMIN`, `IT_ENGINEER`, `IT_SUPPORT`, `MANAGER`, `EMPLOYEE`
- Assets: CRUD with pagination, search, filters and sorting
- Device inventory: hardware specifications, Windows edition/license assignment, antivirus product, and multiple software licenses per device
- Software license tracking: Microsoft 365 assignment per user
- Work groups: IT, managers, and employees, automatically mapped from user roles
- Employee device onboarding: create a password-protected employee account, store the employee name/job title, assign a device, and record the IT issuer in one transaction
- Printable device handover form with employee, job title, device specifications, licenses, and employee/IT signature fields
- Assignments: assign, return and history (transactional, race-safe)
- Departments: CRUD (IT group only)
- Dashboard statistics
- Request validation (Zod), rate limiting, Helmet, request logging (Winston + Morgan)
- Swagger UI at `/api-docs`

## Tech Stack

Node.js, Express 5, TypeScript, PostgreSQL, Prisma, Zod, JWT, bcryptjs, Jest + Supertest, Docker.

## Getting Started

```bash
npm ci
cp .env.example .env        # then edit the values
npx prisma migrate deploy
npx prisma generate
npm run seed:admin          # provisions the IT administrator from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                 # http://localhost:5000
```

With Docker: `docker compose up --build` (needs a `.env` file; the container reads it via `env_file`). Before starting, set non-empty, strong, unique values for `POSTGRES_PASSWORD` and `JWT_SECRET` in `.env`; use a password manager or cryptographically secure generator. The example intentionally leaves secrets blank, and Compose refuses to start without a database password. The API and PostgreSQL ports are published on `127.0.0.1` only; other devices cannot connect through those host ports. When run directly with `npm run dev`, the API also binds to `127.0.0.1` by default. For a production deployment, place the API behind a properly configured HTTPS reverse proxy rather than exposing the development server.

### Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string (URL-encode special characters in the password) |
| `JWT_SECRET` | yes | Long random secret used to sign tokens |
| `PORT` | no | Defaults to `5000` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only for `seed:admin` | Password must be at least 8 characters |
| `ADMIN_RESET_PASSWORD` | optional for `seed:admin` | Set to `true` to also reset the password when promoting an existing user; defaults to leaving it unchanged |

### Creating the first admin

`POST /api/auth/register` always creates an `EMPLOYEE`. `npm run seed:admin` provisions an `ADMIN` in the IT group. Only IT-group members can create users, provision employee devices, and manage organization data.

## Authentication

Send `Authorization: Bearer <token>` on every route except `/api/auth/register` and `/api/auth/login`. Tokens contain `{ userId, role }` and expire after 1 day. There is no refresh token.

## Roles

| Access | IT group (`ADMIN`, `IT_ENGINEER`, `IT_SUPPORT`) | `MANAGER` | `EMPLOYEE` |
|---|:-:|:-:|:-:|
| View all assets, users, groups, departments, and assignments | yes | no | no |
| Create and modify devices, users, departments, assignments, and licenses | yes | no | no |
| View own currently assigned devices and assignment history | yes | yes | yes |

## API

### Response conventions

- Errors: `{ "message": "..." }`. Validation errors: `{ "message": "Validation failed", "errors": [ZodIssue] }` (400).
- Paginated lists (`/api/assets`, `/api/assignments`, `/api/users`) return `{ "data": [...], "meta": { "page", "limit", "total", "totalPages" } }`. Defaults: `page=1`, `limit=10` (max 100). Empty query values such as `?search=` are ignored.
- `GET /api/departments` returns a plain array (small lookup list).
- Duplicate unique values return `409`, unknown ids return `404`, malformed ids return `400`.
- Rate limit: 100 requests per 15 minutes per IP (`429`).

### Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password }` creates an EMPLOYEE |
| POST | `/api/auth/login` | returns `{ token }` |
| GET | `/api/auth/me` | current user's profile, department, work-group memberships, and assigned-device history (no password or other users' data) |
| GET | `/api/users` | query: `page, limit, search, role, departmentId` |
| GET | `/api/users/groups` | IT group only. Returns work groups and their members |
| POST | `/api/users` | IT group only. `{ email, password, role?, departmentId?, microsoft365LicenseAssigned? }`, password is hashed |
| PATCH | `/api/users/:id/licenses/microsoft-365` | IT group only. `{ assigned: boolean }` updates Microsoft 365 license assignment |
| GET | `/api/departments` | IT group only; includes `_count.users` |
| POST | `/api/departments` | IT group only. `{ name }` |
| PUT | `/api/departments/:id` | IT group only. `{ name }` |
| DELETE | `/api/departments/:id` | IT group only. Blocked (409) while the department has users |
| GET | `/api/assets` | query: `page, limit, search, status, category, sortBy, order` |
| GET | `/api/assets/:id` | |
| POST | `/api/assets` | `{ name, serialNumber, category, status?, softwareLicenses? }`, status can be AVAILABLE, MAINTENANCE or RETIRED; software licenses is a list of names |
| PUT | `/api/assets/:id` | full object, including optional `softwareLicenses` list. `ASSIGNED` is only reachable via assignments |
| POST | `/api/device-requests` | Any signed-in user may request a replacement or hardware upgrade for an asset currently assigned to them |
| GET | `/api/device-requests` | Employees see only their requests; IT group members can review all requests or pass `scope=mine` for their own |
| PATCH | `/api/device-requests/:id` | IT group only. `PENDING` requests can be approved/rejected; approved requests can be completed |
| PATCH | `/api/assets/:id/licenses/windows` | IT group only. `{ assigned: boolean }` updates Windows license assignment |
| POST | `/api/onboarding/device` | IT group only. `{ email, password, employeeName, jobTitle, issuedByName, asset: { ..., softwareLicenses: string[] } }` creates an EMPLOYEE account and assigns the new device; response includes employee, asset, assignment, and issuing IT user |
| DELETE | `/api/assets/:id` | blocked (409) while assigned or when it has assignment history |
| GET | `/api/assignments` | query: `page, limit, userId, assetId, active=true\|false` |
| POST | `/api/assignments` | IT group only. `{ userId, assetId }`, 400 if asset is not AVAILABLE |
| POST | `/api/assignments/return` | IT group only. `{ assetId }`, 404 if there is no active assignment |
| POST | `/api/assignments/replace-requested` | IT group only. `{ requestId, replacementAssetId, originalAssetStatus?, issuedByName?, resolutionNote? }` atomically returns the old device (to maintenance by default), assigns the available replacement, and completes the approved request |
| GET | `/api/dashboard/stats` | IT gets organization totals; employees/managers get personal totals |

Assets track RAM (`memoryGb`) and storage capacity/type (`storageGb`, `storageType`). IT can update these through `PUT /api/assets/:id`; employees submit requests instead of changing inventory records themselves.

Full interactive docs: `/api-docs`.

### Asset status rules

- New assets can start as `AVAILABLE`, `MAINTENANCE` or `RETIRED`.
- `ASSIGNED` is set by `POST /api/assignments` or atomic employee-device onboarding, and cleared only by `POST /api/assignments/return`.
- While an asset is `ASSIGNED`, its status cannot be changed through `PUT`; return it first.

## Data model

`Department 1-* User 1-* AssetAssignment *-1 Asset`. Each user is assigned to a work group based on their role: `ADMIN`/`IT_ENGINEER`/`IT_SUPPORT` to IT, `MANAGER` to managers, and `EMPLOYEE` to employees. Only IT members can view all records; other users can only access their own active device assignments and assignment history.

## Project structure

```
src/
  app.ts, server.ts, prisma.ts, logger.ts, swagger.ts
  controllers/   request handlers
  routes/        route definitions + Swagger annotations
  middlewares/   auth, role, validation, error handling
  validations/   Zod schemas (bodies and query strings)
  utils/         errors (HttpError, Prisma error mapping), query helpers
  scripts/       create-admin.ts
prisma/          schema and migrations
tests/           Jest + Supertest integration tests (need a database)
```

## Testing

```bash
npm test
```

The tests are integration tests and require a reachable PostgreSQL database configured through `DATABASE_URL`.

## Security notes

- Passwords are hashed with bcrypt in both `register` and `POST /api/users`.
- Never commit `.env`. Rotate any secret that was ever committed.
- Users created through the old, unhashed `POST /api/users` cannot log in. Recreate them or reset their password.
