# Heritage Craft Atlas

Heritage Craft Atlas is a geography-driven platform for discovering India's GI-tagged crafts and artisan products. The repository contains:

- `frontend/`: a React + TypeScript client
- `backend/`: a FastAPI + MongoDB API

## Project Structure

The frontend and backend are managed separately, but the repo root now includes an npm workspace so a fresh clone has a valid root-level Node setup.

## Prerequisites

- Node.js `20.x` or `22.x`
- npm `10+`
- Python `3.10+`
- MongoDB running locally, or a remote MongoDB connection string

## Quick Start

### 1. Install frontend dependencies

From the repository root on Windows PowerShell, use:

```powershell
npm.cmd install
```

Important:

- Use `npm.cmd` in PowerShell if script execution is restricted on your machine.
- Running plain `npm` may fail because PowerShell can block `npm.ps1`.

### 2. Start the backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 3. Start the frontend

In a new terminal:

```powershell
cd frontend
copy .env.example .env
npm.cmd start
```

The app will be available at `http://localhost:3000`.

## Environment Files

### Frontend

`frontend/.env`

```env
REACT_APP_API_URL=
```

Leave `REACT_APP_API_URL` empty in local development and the frontend will target `http://localhost:8000` automatically. Set it explicitly only when your API is hosted somewhere else.

### Backend

`backend/.env`

```env
MONGODB_URI=mongodb://localhost:27017/heritagecraft
DATABASE_NAME=heritagecraft
CORS_ORIGINS=http://localhost:3000
```

## Useful Commands

From the repo root:

```powershell
npm.cmd install
npm.cmd run start
npm.cmd run build
```

These root commands target the frontend workspace.

## Notes

- The backend requires MongoDB to return live product data.
- The frontend login is currently demo-only and uses local storage.
- If you use a newer experimental Node version, CRA-based tooling can become unreliable. Node `20.x` or `22.x` is the safest choice for this repo.
