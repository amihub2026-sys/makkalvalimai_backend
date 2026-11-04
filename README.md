# Makkal Valimai — Node / MongoDB / Cloudflare R2 backend

Separate model, controller, service and route files for news, public issues, alerts, polls, advertisements, settings, authentication and media.

## Setup (Windows PowerShell)

```powershell
npm install
Copy-Item .env.example .env
```

Set MongoDB Atlas URI, CLIENT_ORIGIN and secure randomly generated SESSION_SECRET; set the four R2 variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME). Keep bucket PRIVATE. Create R2 credentials with object read/write access scoped to the bucket. **Never paste R2 secret keys into Angular or Git.**

```powershell
npm run create-admin
npm run dev
npm run check
npm test
```

`npm run create-admin` needs ADMIN_EMAIL and ADMIN_PASSWORD (14+ characters) in .env temporarily; remove ADMIN_PASSWORD after account creation. Check `http://localhost:5000/api/health`.

## Upload flow

- Admin uploads using `POST /api/admin/media` multipart `file`; response `{id,url,kind}`. Store returned `/api/public/media/:id` in the article's `image`, `video`, `audio.ta`, `audio.en`, or section audio.
- R2 bucket remains private: public endpoint streams only approved/public Media records; never expose R2 secret credentials or objects directly.
- Resident issue form sends `POST /api/public/issues` multipart fields `title`, `description`, `category`, `area`, optional `street`, and optional `file` image. Server creates status `pending` and saves file as PRIVATE R2 object.
- Admin reviews `/api/admin/issues`, sees `privateMediaId`. To inspect a photo, authenticated admin calls `GET /api/admin/media/private/:id`. `PATCH /api/admin/issues/:id` with `{status:'approved'}` makes the already uploaded media publicly accessible. Solved requires `{status:'solved',resolution:'verified details 15+ chars',afterPhoto:'/api/public/media/...'}`.
- MP3, MP4 and photos are stored in R2. Images are normalized to WebP to strip EXIF; MP3/MP4 file signatures and sizes are checked. Add malware/video transcoding as an explicit production hardening step.
- Article publishing uses `PUT /api/admin/articles/:id`, date archive `GET /api/public/articles?kind=madurai&date=2026-10-15`. Data stays MongoDB; binary media stays R2.

## Authentication

POST `/api/admin/auth/login` with email/password returns `{user,csrfToken}` and a server-side HttpOnly cookie. Pass cookie and `X-CSRF-Token` for subsequent authenticated writes. `GET /api/admin/auth/me` and POST logout. Frontend demo auth/localStorage must be replaced with real API services; running two projects alone does not connect them.

## Production notes

- Use HTTPS same-origin reverse proxy for `/api`; ensure session cookie secure and trusted proxy configured.
- The current architecture is a developer starter, not independently verified live deployment. In-memory uploads are limited to 60MB; prefer streaming multipart or presigned uploads for large videos at scale.
- Poll participation is limited by a visitor cookie and rate limits; this is not one vote per person. All real crime items require a source.
- Add S3/R2 orphan cleanup and MongoDB transaction/outbox retries around multi-system operations, image moderation and malware scanning before production.
- A production news site needs SSR/prerendered Open Graph metadata for rich WhatsApp previews; the article URL still works without it.
