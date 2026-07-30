# CafePOS

Production POS for a single restaurant/cafe (MERN stack). See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for the full build plan.

## Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (Cloud)

## Setup

1. Install dependencies (root, server, and client):

   ```bash
   npm run install:all
   ```

2. Configure the backend (optional if defaults are fine):

   ```bash
   copy server\.env.example server\.env
   ```

   Set `MONGODB_URI` in `server/.env` if your MongoDB URL or database name differ.

## Run (development)

Start local MongoDB, then from the repo root:

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
