# IT Asset Management

This repository contains the complete application in two independent project folders:

```text
backend/    Express API, PostgreSQL/Prisma schema, migrations, and tests
frontend/   React/Vite web application
```

Run the commands below from this repository's root directory.

## Install

```powershell
npm run install:all
```

## Configure and start

1. Copy `backend/.env.example` to `backend/.env` and set strong, unique values for the database password, JWT secret, and administrator password. The example intentionally leaves secrets blank; do not use placeholder or default passwords.
2. Start PostgreSQL and apply the backend migrations. For Docker, run `docker compose -f backend/docker-compose.yml up --build` from the repository root. For an existing local PostgreSQL server, ensure it listens only on loopback, then run:

   ```powershell
   Push-Location backend
   npx prisma migrate deploy
   Pop-Location
   ```
3. In one terminal, start the API:

   ```powershell
   npm run dev:backend
   ```

4. On Windows, set up the local HTTPS certificate once, then start the frontend in another terminal:

   ```powershell
   npm run setup:https
   npm run dev:frontend
   ```

5. Map `smart-it.local` to `127.0.0.1` in the Windows hosts file, run `npm run setup:https`, then open `https://smart-it.local:5174/`. Vite proxies `/api` requests to the backend at `http://127.0.0.1:5000`. Both local development servers are restricted to loopback; do not expose them directly to the internet.

See [backend/README.md](backend/README.md) for API configuration and administration, and [frontend/README.md](frontend/README.md) for HTTPS details.

## Hosting

The monorepo can be imported into Vercel as two projects using the same GitHub repository: set the backend project's root directory to `backend` and the frontend project's root directory to `frontend`. Configure the frontend's `VITE_API_URL` to the deployed backend HTTPS origin and set the backend's `FRONTEND_ORIGINS` to the deployed frontend HTTPS origin. The API also requires `DATABASE_URL` pointing to a separately hosted PostgreSQL database and a strong, unique `JWT_SECRET`; do not use the local `.env` file or local database as a production service.

## Build and test

Run both production builds and the backend integration tests from the repository root:

```powershell
npm run build
npm test
```

The backend tests require PostgreSQL to be available via `DATABASE_URL`.
