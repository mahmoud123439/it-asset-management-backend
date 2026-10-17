# IT Asset Management

The application is maintained as one GitHub repository with the backend API and frontend UI in separate folders:

- `backend/` — Node.js, TypeScript, Express, and Prisma API.
- `frontend/` — React and Vite web application.

## Development

Install dependencies in each application directory:

```powershell
Set-Location backend
npm ci
```

```powershell
Set-Location ..\frontend
npm ci
```

Follow each folder's README for environment configuration and startup instructions. The frontend README includes the local HTTPS setup.

## Validation

Run the backend build and tests from `backend/`, and the frontend production build from `frontend/`:

```powershell
npm run build
npm test -- --runInBand
```

```powershell
npm run build
```
