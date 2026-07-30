# CafePOS Progress

Last updated: 2026-07-30 — Cursor session 1 (Phase 0 complete)

## Phase Status
- [x] Phase 0 — Setup
- [ ] Phase 1 — Models & Seed
- [ ] Phase 2 — Auth & RBAC
- [ ] Phase 3 — Menu Management
- [ ] Phase 4 — Table Management
- [ ] Phase 5 — POS/Billing (core)
- [ ] Phase 6 — Order History & Kitchen View
- [ ] Phase 7 — Dashboard & Reports
- [ ] Phase 8 — Cashier Management
- [ ] Phase 9 — Settings
- [ ] Phase 10 — Hardening

## Currently Working On
Ready to start Phase 1 — Models & Seed

## Verified Working This Session
- `npm run install:all` — installs root, server, and client dependencies
- `npm run dev` — Vite on http://localhost:5173 and Express on http://localhost:5000
- `GET http://localhost:5000/api/health` → 200 `{"success":true,"data":{"status":"ok"}}`
- Frontend home page loads and calls health endpoint (CORS from `CLIENT_ORIGIN`)
- Repo layout: `server/{config,controllers,middleware,models,routes,utils}`, `client/src/{pages,components,context,api,utils}`
- `.gitignore`, `README.md`, `docker-compose.yml` (MongoDB 7), `server/.env.example`

## Known Issues
- MongoDB was not running on this machine during setup; server logs a clear error but still serves `/api/health`. Run `docker compose up -d` (or local MongoDB) before Phase 1 seed.

## Next Immediate Steps
1. Ensure MongoDB is up (`docker compose up -d`), confirm server log shows `MongoDB connected`
2. Phase 1: Mongoose models (User, Category, MenuItem, Table, Order, Settings), `npm run seed`, document credentials here

## How To Run
- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`
- Both: `npm run dev` (from repo root)
- MongoDB: `docker compose up -d` (from repo root)
- Seed: `cd server && npm run seed` (Phase 1)
- Logins: admin/[password], cashier/[password] (after Phase 1 seed)

## Questions For User
- None

## Decisions/Deviations From Spec
- Server entry: `server/index.js` (Express + listen)
- Root `npm run dev` uses `concurrently` for server + client
- HTTP server starts even if MongoDB is down (logs error); health route still works — start MongoDB before any DB work (Phase 1+)
