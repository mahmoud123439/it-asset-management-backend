# AssetFlow · IT Asset & License Management

AssetFlow is an internal operations console for hardware inventory, employee assignments, software seat allocation, maintenance, procurement, and expiry alerts. The monorepo runs NestJS/PostgreSQL and React/Vite behind Docker Compose.

## Start in development

1. Copy `.env.example` to `.env` and replace JWT secrets and the license encryption key for any shared environment. The compose defaults are for local development only.
2. Run `docker compose up --build` from the repository root.
3. Open [http://localhost:8080](http://localhost:8080); API docs are at [http://localhost:3000/api/docs](http://localhost:3000/api/docs), and Mailhog is at [http://localhost:8025](http://localhost:8025).

Dev admin: `admin@assetflow.local` / `ChangeMe123!`. A seeded IT manager is `manager@assetflow.local` / `ChangeMe123!`. Change or remove these credentials before any non-local deployment.

Compose waits for PostgreSQL, executes TypeORM migrations (with schema synchronization disabled), then idempotently seeds the initial workspace. Uploaded attachments persist in the `uploads` volume. SMTP is wired to Mailhog in compose; outside compose, absent SMTP configuration logs expiry alert counts.

## Local development

Requires Node 20+, npm, Docker and Docker Compose. Start PostgreSQL and Mailhog with `docker compose up postgres mailhog`, set a local `DATABASE_URL` in `backend/.env` or your shell, then use `npm install`, `npm run dev`. For production-shaped local startup use compose.

## Security and operation

- Access JWTs expire after 15 minutes; refresh tokens are rotated and only SHA-256 hashes are stored.
- License keys use AES-256-GCM. Set `LICENSE_ENCRYPTION_KEY` to exactly 32 bytes of secret material and retain it securely; losing it prevents key recovery.
- Role gates are enforced in the API. `VIEWER` is read-only; `TECHNICIAN` operates assets and maintenance; `IT_MANAGER` runs operations; `ADMIN` manages users and audit data.
- Set `FRONTEND_URL` to the exact trusted origin(s). Use TLS termination and managed secrets for deployment.
- Health check: `GET /api/health`. Swagger: `/api/docs`.

## Workspace

`backend/` NestJS API and TypeORM migration/seed; `frontend/` React UI; `docs/` implementation decisions. See [docs/DECISIONS.md](docs/DECISIONS.md) for scope notes and design choices.
