# Frontend development

Install dependencies with `npm install`.

On Windows, create and trust a local development certificate for `smart-it.local`:

```powershell
npm run setup:https
npm run dev
```

Add `127.0.0.1 smart-it.local` to the Windows hosts file using an elevated editor, then run the setup command above. Open `https://smart-it.local:5174/`. The certificate and private key are stored under the current user's Local AppData directory, not in the project. The setup script trusts the certificate for the current Windows user and restricts the private-key directory to that user.

The Vite development server listens only on loopback and accepts the `smart-it.local` hostname. The browser sends `/api` requests over HTTPS to Vite; Vite proxies them to the loopback-only API at `http://127.0.0.1:5000`. Set `VITE_API_URL` only when connecting directly to an API configured for the same HTTPS origin.
