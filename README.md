# CafePOS

Production POS for a single restaurant/cafe (MERN stack). See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for the full build plan.

## Prerequisites

- Node.js 18+
- MongoDB: run locally or start with `docker compose up -d` from the repo root

## Setup

1. Install dependencies (root, server, and client):

   ```bash
   npm run install:all
   ```

2. Configure the backend:

   ```bash
   copy server\.env.example server\.env
   ```

   Edit `server/.env` if your MongoDB URL or ports differ.

3. Start MongoDB (if you do not already have it on `localhost:27017`):

   ```bash
   docker compose up -d
   ```

## Run (development)

From the repo root:

```bash
npm run dev
```

- **API:** http://localhost:5000  
- **Health check:** http://localhost:5000/api/health  
- **Frontend:** http://localhost:5173  

Or run separately:

```bash
cd server && npm run dev
cd client && npm run dev
```

## Progress

Build status and next steps: [PROGRESS.md](./PROGRESS.md)
