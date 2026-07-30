# CafePOS Progress

Last updated: 2026-07-30  Phase 1 Models completed with database connection to MongoDB Atlas.

## Phase Status

- [x] Phase 0 — Setup
- [x] Phase 1 — Models & Seed
- [x] Phase 2 — Auth & RBAC
- [ ] Phase 3 — Menu Management
- [ ] Phase 4 — Table Management
- [ ] Phase 5 — POS/Billing (core)
- [ ] Phase 6 — Order History & Kitchen View
- [ ] Phase 7 — Dashboard & Reports
- [ ] Phase 8 — Cashier Management
- [ ] Phase 9 — Settings
- [ ] Phase 10 — Hardening

## Currently Working On

Ready to start Phase 3 — Menu Management (Admin)

## Verified Working This Session

- `server/utils/jwt.js` — `signToken` / `verifyToken` using jsonwebtoken, 12h expiry.
- `server/middleware/auth.js` — `protect` (JWT verify → req.user) and `requireRole` guard.
- `server/controllers/authController.js` — `POST /api/auth/login`, `GET /api/auth/me`.
- `server/routes/authRoutes.js` — mounted at `/api/auth`.
- `server/.env` — `JWT_SECRET` added.
- Backend RBAC tests all passed:
  - Admin login → 200 with JWT token ✅
  - GET /me with valid token → 200 with user (no password) ✅
  - Cashier login → 200 ✅
  - Wrong credentials → 401 ✅
  - No token → 401 ✅
- Frontend:
  - `client/src/api/client.js` — central fetch wrapper with auto Bearer header.
  - `client/src/context/AuthContext.jsx` — login/logout, token in localStorage, /me on mount.
  - `client/src/components/ProtectedRoute.jsx` — role-based guard + loading spinner.
  - `client/src/pages/Login.jsx` — dark premium login form with error handling.
  - `client/src/pages/AdminDashboard.jsx`, `POS.jsx` — stub pages (to be filled in Phase 3+).
  - `client/src/App.jsx` — full routing with ProtectedRoute, RootRedirect.
  - `client/src/index.css` — dark design system (Inter, amber palette, animations).
  - **Note**: JWT stored in localStorage (v1 spec). httpOnly cookie is the hardened v2 upgrade path.

## Known Issues

- Browser automation tool (Playwright) unavailable in this environment — UI verified structurally, manual browser test recommended.

## Next Immediate Steps

1. Phase 3: Backend CRUD for `/api/categories` and `/api/menu-items` (admin writes, authenticated reads).
2. Phase 3: Admin UI — category + menu item management, availability toggle.

## How To Run

- Both: `npm run dev` (from repo root)
- Seed: `cd server && npm run seed`
- Logins: admin/admin123, cashier/cashier123

## Decisions/Deviations From Spec

- JWT stored in localStorage (per spec for v1). httpOnly-cookie storage is the hardened upgrade for Phase 10.
- DNS fallback added to `server/config/db.js` for MongoDB Atlas SRV on Windows.
- `server/index.js` uses `node --watch` for dev auto-reload.
