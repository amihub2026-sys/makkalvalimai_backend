# Cloudflare R2 setup — Madurai Makkal Valimai

1. Cloudflare dashboard → R2 Object Storage → open your bucket **makkal-valimai-media**. Keep its public access disabled.
2. R2 → Manage R2 API Tokens → Create API token with **Object Read & Write** scoped to this bucket.
3. Note Account ID, Access Key ID, Secret Access Key and bucket name. Put them in backend `.env` only. **Do not paste these into a chat or commit them to Git.**
4. MongoDB Atlas is needed too; fill `MONGODB_URI`. Generate a random `SESSION_SECRET` (32+ characters).
5. In Windows VS Code terminal: `npm install`, `Copy-Item .env.example .env`, configure values, `npm run create-admin`, `npm run dev`.
6. Test `http://localhost:5000/api/health`. To test actual uploads, connect real admin session and send `X-CSRF-Token` header when POSTing `file` to `/api/admin/media`.

## Frontend URLs
Angular frontend uses `/api` endpoint via dev proxy or same-origin reverse proxy. Upload saves MongoDB media ID and R2 key; client gets `/api/public/media/{id}`. Images, MP3 and MP4 can be served through this backend while bucket remains private. The current Angular prototype still uses browser-local storage and demo admin login, so it must be integrated separately.

## Editorial privacy rule
Citizen uploads go into `private/` prefix and stay behind server authorization. The issue must be approved before its media is available through the public endpoint. Never expose R2 credentials to Angular. Note: prefixes are organizational; **the real access boundary is R2 bucket privacy plus the server's Media.visibility check**, not the name of the prefix.

## Production follow-up
Add proper content moderation, image scanning, video scanning/transcoding, lifecycle cleanup for orphan objects, durable backups, runtime monitoring, robust audit logs, and integration/e2e tests. Use an R2 public domain/CDN only for truly published objects when a more scalable serving approach is required.
