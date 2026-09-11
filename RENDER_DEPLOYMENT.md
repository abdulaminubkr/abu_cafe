# Render Deployment

This project is configured to deploy the React frontend and Express backend as one Render Web Service.

## Build command

```bash
npm install --prefix server && npm install --prefix client && npm run build --prefix client
```

## Start command

```bash
npm start --prefix server
```

## Render environment variables

Set these in Render:

- `DATABASE_URL` — your existing Supabase PostgreSQL connection string
- `JWT_SECRET` — a strong secret value

Do not upload or commit `.env` files containing secrets.

`PORT` is supplied by Render automatically.

## After deployment

Check:

```text
https://YOUR-RENDER-DOMAIN/api/health
```

Then open:

```text
https://YOUR-RENDER-DOMAIN/
```

The Express server serves the production React build, so the frontend and API use the same domain.

## Important

The current application stores uploaded files on the local filesystem. Render Free uses an ephemeral filesystem, so uploaded photos/certificates can be lost after a restart, redeploy, or spin-down. Persistent object storage should be added later if permanent uploads are required.
