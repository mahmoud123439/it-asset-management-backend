# IT Asset Management System

Backend API for tracking IT assets, users, departments and asset assignments, with JWT authentication and role-based authorization.

## Features

- JWT authentication (register, login, current user)
- Role-based authorization: `ADMIN`, `IT_ENGINEER`, `IT_SUPPORT`, `EMPLOYEE`
- Assets: CRUD with pagination, search, filters and sorting
- Assignments: assign, return and history (transactional, race-safe)
- Departments: CRUD (ADMIN only for writes)
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
npm run seed:admin          # creates the first ADMIN from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                 # http://localhost:5000
```

With Docker: `docker compose up --build` (needs a `.env` file; the container reads it via `env_file`).

### Environment variables

| Name | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string (URL-encode special characters in the password) |
| `JWT_SECRET` | yes | Long random secret used to sign tokens |
| `PORT` | no | Defaults to `5000` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only for `seed:admin` | Password must be at least 8 characters |

### Creating the first admin

`POST /api/auth/register` always creates an `EMPLOYEE`, and only an `ADMIN` can create other users or change roles through `POST /api/users`. Use `npm run seed:admin` once to bootstrap the first admin. If the email already exists, the user is promoted to `ADMIN` and the password is left untouched.

## Authentication

Send `Authorization: Bearer <token>` on every route except `/api/auth/register` and `/api/auth/login`. Tokens contain `{ userId, role }` and expire after 1 day. There is no refresh token.

## Roles

| Action | ADMIN | IT_ENGINEER | IT_SUPPORT | EMPLOYEE |
|---|:-:|:-:|:-:|:-:|
| View assets, assignments, departments, dashboard | yes | yes | yes | yes |
| Create / update / delete assets | yes | yes | no | no |
| Assign / return assets | yes | yes | no | no |
| List users | yes | yes | yes | no |
| Create users | yes | no | no | no |
| Create / update / delete departments | yes | no | no | no |

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
| GET | `/api/auth/me` | current user `{ id, email, role, createdAt, department }` |
| GET | `/api/users` | query: `page, limit, search, role, departmentId` |
| POST | `/api/users` | ADMIN. `{ email, password, role?, departmentId? }`, password is hashed |
| GET | `/api/departments` | includes `_count.users` |
| POST | `/api/departments` | ADMIN. `{ name }` |
| PUT | `/api/departments/:id` | ADMIN. `{ name }` |
| DELETE | `/api/departments/:id` | ADMIN. Blocked (409) while the department has users |
| GET | `/api/assets` | query: `page, limit, search, status, category, sortBy, order` |
| GET | `/api/assets/:id` | |
| POST | `/api/assets` | `{ name, serialNumber, category, status? }`, status can be AVAILABLE, MAINTENANCE or RETIRED |
| PUT | `/api/assets/:id` | full object. `ASSIGNED` is only reachable via assignments |
| DELETE | `/api/assets/:id` | blocked (409) while assigned or when it has assignment history |
| GET | `/api/assignments` | query: `page, limit, userId, assetId, active=true\|false` |
| POST | `/api/assignments` | `{ userId, assetId }`, 400 if asset is not AVAILABLE |
| POST | `/api/assignments/return` | `{ assetId }`, 404 if there is no active assignment |
| GET | `/api/dashboard/stats` | `{ totalUsers, totalAssets, availableAssets, assignedAssets }` |

Full interactive docs: `/api-docs`.

### Asset status rules

- New assets can start as `AVAILABLE`, `MAINTENANCE` or `RETIRED`.
- `ASSIGNED` is set only by `POST /api/assignments` and cleared only by `POST /api/assignments/return`.
- While an asset is `ASSIGNED`, its status cannot be changed through `PUT`; return it first.

## Data model

`Department 1-* User 1-* AssetAssignment *-1 Asset`. An assignment with `returnedAt = null` is currently active.

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
