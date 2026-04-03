# Deployment Guide

## GitHub

The repository already has a GitHub remote configured:

```powershell
git remote -v
```

Push your current branch with:

```powershell
git push -u origin main
```

If you still need to create a local commit first:

```powershell
git add .
git commit -m "Prepare app for deployment"
git push -u origin main
```

## Backend on Render

Create a new Render Web Service from this repository and use:

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

Set these environment variables in Render:

- `MONGODB_URI`
- `DATABASE_NAME=heritagecraft`
- `CORS_ORIGINS=https://your-frontend-url`
- `FRONTEND_BASE_URL=https://your-frontend-url`

Test after deploy:

```text
https://your-render-service.onrender.com/health
```

## Frontend on Vercel

Import this repository into Vercel and use:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `build`

Set this environment variable in Vercel:

- `REACT_APP_API_URL=https://your-render-service.onrender.com`

The `frontend/vercel.json` file is included so React Router routes like `/map` and `/products/:id` load correctly on refresh.

## Final Wiring

After Vercel gives you the frontend URL, update Render:

- `CORS_ORIGINS=https://your-app.vercel.app`
- `FRONTEND_BASE_URL=https://your-app.vercel.app`

Then redeploy the backend.
