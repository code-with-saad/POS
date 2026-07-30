# CafePOS Progress

Last updated: 2026-07-30  Phase 4 Table Management completed with full CRUD, RBAC guards, and Admin UI.

## Phase Status

- [x] Phase 0 — Setup
- [x] Phase 1 — Models & Seed
- [x] Phase 2 — Auth & RBAC
- [x] Phase 3 — Menu Management
- [x] Phase 4 — Table Management
- [ ] Phase 5 — POS/Billing (core)
- [ ] Phase 6 — Order History & Kitchen View
- [ ] Phase 7 — Dashboard & Reports
- [ ] Phase 8 — Cashier Management
- [ ] Phase 9 — Settings
- [ ] Phase 10 — Hardening

## Currently Working On

Ready to start Phase 5 — POS / Billing (Cashier) — THE CORE FEATURE [P0]

## Verified Working This Session

- `server/controllers/tableController.js` & `tableRoutes.js`:
  - `GET /api/tables` (authenticated reads, optional section/status filters)
  - `POST /api/tables` (admin create)
  - `PUT /api/tables/:id` (admin update)
  - `PATCH /api/tables/:id/status` (authenticated status update: `available` | `occupied`)
  - `DELETE /api/tables/:id` (admin delete)
- Backend API tests verified:
  - Admin list & create table ✅
  - Cashier write attempt blocked with 403 Forbidden ✅
  - Toggle table status to `occupied` ✅
  - Delete table ✅
- Frontend UI:
  - `TablesPage.jsx` — visual card grid of tables, color-coded status badges, section filters, capacity tags, status toggle actions, Add/Edit table modals.
  - Linked in `AdminLayout` sidebar and `App.jsx` routes at `/admin/tables`.

## Known Issues

- None

## Next Immediate Steps

1. Phase 5: Implement `POST /api/orders` (server computes subtotal, tax, discount, total formula), `GET /api/orders`, `PATCH /api/orders/:id/status`.
2. Phase 5 Cashier UI: Order type selection (`dine-in`, `takeaway`, `delivery`), Table selector for dine-in, menu browser by category, Cart (qty +/-, remove, per-item notes), Checkout modal with payment method, and Print-friendly Receipt template (`window.print()`).

## How To Run

- Both: `npm run dev` (from repo root)
- Seed: `cd server && npm run seed`
- Logins: admin/admin123, cashier/cashier123

## Decisions/Deviations From Spec

- Seating capacity and section indicators are visually displayed on each table card with quick status toggle buttons.
