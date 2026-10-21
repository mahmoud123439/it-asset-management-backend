# AssetFlow implementation decisions

## Product and architecture

- Product name: **AssetFlow**. The monorepo has separate NestJS and Vite/React applications, with PostgreSQL as the source of record.
- TypeORM schema synchronization is disabled. `InitialSchema` is an explicit migration, executed before the idempotent first-run seed.
- UUID identifiers, API pagination defaults of 20 (maximum 100), asset/employee/license search, status/category filters, and column-checked sorting are used consistently.
- English is the default UI language. Arabic resources are provided and set RTL direction when selected.
- Asset records begin in stock. Assignment and return endpoints own the `ASSIGNED` and `IN_STOCK` transitions; repair and retirement are status updates. Asset assignment and license-seat allocation use database locks to prevent concurrent over-allocation.

## Security and operations

- Access JWTs expire after 15 minutes. Refresh tokens expire after 7 days, rotate on use, and are stored as SHA-256 hashes.
- AES-256-GCM encrypts software license keys; list and export views mask the key. Key reveal is limited to ADMIN and IT_MANAGER and generates an audit event.
- Uploads are limited to 10 MB, accepted by declared MIME type and matching extension, then checked against PDF/image signatures. Files are stored under random names in the persistent `uploads` volume.
- Nest applies a global request rate limit, a stricter login limit, Helmet, configured CORS, validated DTOs, a global exception filter, and Swagger at `/api/docs`.
- Expiry scans run at 08:00 Cairo time daily. The manual endpoint uses the same scanner, de-duplicates each item/threshold, and emails admins when SMTP is configured.
- Compose uses demo-only credentials to make local startup straightforward. Change the seeded password and replace all secrets before deployment.

## Reports and demo data

- XLSX exports use ExcelJS; PDFs use PDFKit; QR PNGs use `qrcode`. CSV import validates every row and returns per-row errors without stopping subsequent rows.
- Initial seed: five departments, 40 employees, 150 assets, 20 encrypted demo licenses with allocated seats, asset assignment history, maintenance records, procurement records, and notifications.
- Demo license keys are synthetic strings encrypted during seeding with the configured key. They are not real software credentials.

## Verification notes

- `npm run build` compiles the strict TypeScript backend and frontend.
- `docker compose config --quiet` validates the compose file.
- The Docker Engine was unavailable on the authoring machine, so containers, database migrations, email delivery, and HTTP endpoints could not be smoke-tested here. Run `docker compose up --build` on a machine with Docker Engine to verify the full runtime path.
- Vite reports a large dashboard bundle because charting and icon libraries are included in the initial route; it does not fail the production build.
