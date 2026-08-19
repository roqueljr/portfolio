# Post-migration production check

Run these commands after copying your existing `.env` and imported `uploads/` directory into this cleaned project:

```bash
npm install
npm run verify
npm audit
npm run lint
npm run build
```

`npm run verify` checks the required MySQL tables, content counts, an active admin account, SiteSettings cardinality, old Base44 media URLs, and local upload files.

Before production deployment, set `NODE_ENV=production`, use an HTTPS `PUBLIC_URL`, and set a unique `AUTH_SECRET` of at least 32 characters.

The one-time Base44 exporter/importer scripts and migration credential placeholders have been removed. The legacy `base44_id` database columns may remain as inert historical identifiers; the application does not call Base44 at runtime.
