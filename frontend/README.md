# Frontend development

Install dependencies with `npm install`.

On Windows, create and trust a local development certificate for `127.0.0.1`:

```powershell
npm run setup:https
npm run dev
```

Open `https://127.0.0.1:5174/`. The certificate and private key are stored under the current user's Local AppData directory, not in the project. The setup script trusts the certificate for the current Windows user and restricts the private-key directory to that user.

The browser sends `/api` requests over HTTPS to Vite; Vite proxies them to the local API at `http://localhost:5000`. Set `VITE_API_URL` only when connecting directly to an API configured for the same HTTPS origin.
