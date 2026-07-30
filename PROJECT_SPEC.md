# CafePOS — Master Build Spec
*Restaurant/Cafe POS · MERN Stack · Admin + Cashier roles*

This file has two jobs: (1) it's the full spec for what to build, and (2) it's the anchor that lets ANY coding session — different tool, different account, zero shared memory — pick up exactly where the last one stopped. Keep this file at the repo root. Never delete or shrink it mid-build.

## 🔁 SESSION PROTOCOL — read this every single session, first

**At the start of every session:**
1. Read `PROGRESS.md` in the repo root, completely. If it doesn't exist, this is session 1 — create it from the template near the bottom of this file, then start Phase 0.
2. Don't trust it blindly — spot-check: do the files it claims exist actually exist? Does `npm run dev` actually start clean? Docs go stale; code is the source of truth if they disagree.
3. Find the "Next Immediate Steps" section and resume exactly there. Don't redo finished phases. Don't jump ahead to a later phase while an earlier P0 phase is incomplete or shaky.

**While working:**
- One phase at a time, in order, unless PROGRESS.md says otherwise.
- Never mark something "done" without actually running it — start the server, hit the endpoint, load the UI, check the browser console for errors.
- No mock/placeholder data in real code paths — always wired to the actual DB.
- No silent TODOs disguised as finished work. If it's incomplete, say so in PROGRESS.md.
- Commit to git after every meaningful working chunk. Small, frequent commits, clear messages.
- Make reasonable calls yourself on implementation details. Only stop for things that genuinely need the user's real-world input (real business info, a product decision, credentials you don't have) — log those under "Questions for User" in PROGRESS.md instead of blocking.
- Running low on context/budget mid-task? Finish the smallest complete unit of work (one full endpoint, not half of one), then update PROGRESS.md with exact next steps before stopping.

**Before ending a session:**
1. Confirm the code is in a working, committed state — never leave it broken.
2. Update PROGRESS.md: what got done, what's verified working, what's next.
3. Give a short summary of what changed.

---

## PROJECT OVERVIEW

**CafePOS** — production POS for a single restaurant/cafe (not multi-tenant SaaS). Two roles:

- **Admin** — menu, categories, tables, cashier accounts, all order history, reports, settings.
- **Cashier** — POS/billing screen, taking orders, checkout, today's/own order history.

**Stack (don't deviate without asking):**
- Backend: Node.js + Express + MongoDB/Mongoose — plain JavaScript, not TypeScript
- Frontend: React + Vite + Tailwind CSS + React Router
- Auth: JWT (jsonwebtoken + bcryptjs), role middleware
- State: React Context for both auth and POS cart — no extra state library, keep dependencies minimal

Currency: PKR, whole rupees (no paisa in real usage). No payment gateway — payment method is just recorded (cash/card).

---

## PRIORITY LEVELS + PACING

- **P0** — MVP-critical. Not a usable POS without it. This is the actual 2-day target.
- **P1** — Important, build after P0 is fully solid and tested.
- **P2** — Stretch. Only touch if P0 and P1 are done with time to spare.

**Suggested pacing:** Day 1 = Phases 0–5 (setup through a fully working billing+receipt flow). Day 2 = Phases 6–8, then whatever's left of Phase 10 hardening, with buffer for bugs.

A system where Phases 0–5 work flawlessly and nothing else exists is a WIN. A system where all 10 phases were "attempted" but nothing works end-to-end is a LOSS. Depth over breadth — always.

---

## OUT OF SCOPE FOR V1 — do not build these

- Multi-tenant/multi-restaurant support
- Real payment gateway integration (JazzCash, EasyPaisa, Stripe, etc.) — record method only
- Thermal/ESC-POS printer integration — browser print (`window.print()` + print CSS) only
- Ingredient-level inventory/recipe costing — just an `isAvailable` toggle per menu item
- Adding items to an already-checked-out order, or reopening a completed order
- Split bill / merging bills
- SMS/email receipts, table reservations, offline mode, multi-language UI

If it's tempting to add one of these "since it's easy," don't — every hour here is an hour not spent making the core loop bulletproof.

---

## DATA MODELS (Mongoose)

**User** — `name`, `username` (unique), `password` (bcrypt hash), `role` (`admin`|`cashier`), `isActive` (default true), `createdAt`

**Category** — `name`, `sortOrder` (default 0)

**MenuItem** — `name`, `description`, `price` (Number, required), `category` (ref Category), `isAvailable` (default true), `imageUrl` (optional)

**Table** — `name` (e.g. "T1"), `section` (optional), `capacity` (optional), `status` (`available`|`occupied`, default `available`)

**Order** — `orderNumber` (unique, human-readable e.g. `250730-001`), `orderType` (`dine-in`|`takeaway`|`delivery`), `table` (ref Table, required if dine-in), `items: [{ menuItem: ref, name, price, quantity, notes }]` (name/price are a **snapshot** at order time — menu changes later must never alter old orders), `subtotal`, `discount` (flat amount, default 0), `tax`, `total`, `paymentMethod` (`cash`|`card`), `status` (`pending`|`preparing`|`served`|`completed`|`cancelled`), `cashier` (ref User), `createdAt`, `completedAt`

Totals formula (always server-computed, never trust client-sent totals):
```
subtotal = Σ(item.price × item.quantity)
afterDiscount = subtotal − discount
tax = afterDiscount × (settings.taxRatePercent / 100)
total = afterDiscount + tax
```

**Settings** (single document) — `restaurantName`, `address`, `phone`, `taxRatePercent`, `receiptFooter`

---

## CONVENTIONS

- API success: `{ success: true, data }`. API error: `{ success: false, message }`.
- REST routes, plural nouns: `/api/menu-items`, `/api/orders`, etc.
- Auth header: `Authorization: Bearer <token>`
- JWT payload: `{ id, role }`, ~12h expiry (covers a shift). Stored in localStorage for v1 — note in PROGRESS.md that httpOnly-cookie storage is the hardened upgrade if time allows later.
- No pagination needed for v1 (single-restaurant data volumes are small) — skip it.

---

## PHASE BREAKDOWN

### Phase 0 — Setup [P0]
- `/server`: Express app; `controllers/`, `models/`, `routes/`, `middleware/`, `config/`, `utils/`
- `/client`: Vite + React; `pages/`, `components/`, `context/`, `api/`, `utils/`
- Mongoose connected via `.env` (`MONGODB_URI`); `.env.example` documented, real `.env` gitignored
- CORS restricted to frontend origin, helmet, `express.json()`, central error handler
- `GET /api/health` → 200
- Git init + `.gitignore`; root `README.md` with run instructions
- Create `PROGRESS.md` from the template below

**Done when:** `npm run dev` starts both apps clean; `/api/health` returns 200 in browser.

### Phase 1 — Models & Seed [P0]
- All 6 schemas above, schema-level validation
- `npm run seed`: 1 admin, 1 cashier, 3–4 categories, 10–15 menu items, 6–8 tables, default settings
- Document seeded credentials in PROGRESS.md

**Done when:** seed runs clean; DB shows correct sample data.

### Phase 2 — Auth & RBAC [P0]
- `POST /api/auth/login`, `GET /api/auth/me`
- Auth middleware (verify JWT → `req.user`), role middleware (`requireRole('admin')`)
- bcrypt hashing; password hash never returned in any response
- Frontend: Login page, AuthContext, ProtectedRoute, role-based redirect (admin → `/admin`, cashier → `/pos`), logout

**Done when:** both seeded users log in and land correctly; admin API called with cashier token → 403; page refresh keeps session.

### Phase 3 — Menu Management (Admin) [P0]
- CRUD `/api/categories`, `/api/menu-items` (admin writes, authenticated reads)
- Admin UI: manage categories and items, availability toggle

**Done when:** admin fully manages menu via UI; cashier token gets 403 on write routes.

### Phase 4 — Table Management (Admin) [P0]
- CRUD `/api/tables`; Admin UI for the same

**Done when:** admin manages tables via UI, statuses visible.

### Phase 5 — POS / Billing (Cashier) — THE CORE FEATURE [P0]
- `POST /api/orders` (server computes all totals per the formula above), `GET /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`
- Cashier UI: order type → table picker (dine-in only, available tables only) → browse menu by category → cart (qty +/-, remove, per-item notes) → totals → checkout (payment method) → receipt
- Receipt: print-friendly (`@media print`), restaurant info from Settings, itemized lines, subtotal/discount/tax/total, cashier name, footer
- Dine-in order creation marks table `occupied`; completing/cancelling offers to free it

**Done when:** a cashier can log in, place a full dine-in order, see correct totals, check out, and print a correct receipt — start to finish, no manual DB fixes. This is the product. It must be flawless.

### Phase 6 — Order History & Kitchen View [P1]
- Order history (filter by date/status/type), order detail view
- Simple Kitchen View: pending/preparing orders, big readable item list, manual/auto refresh
- Status updates: preparing → served → completed

### Phase 7 — Dashboard & Reports (Admin) [P1]
- Today's sales total, order count, top 5 items; simple date-range report
- Admin dashboard UI: summary cards + basic table/chart

### Phase 8 — Cashier Management (Admin) [P1]
- CRUD `/api/users` (admin only); Admin UI: add cashier, activate/deactivate, reset password

### Phase 9 — Settings [P2]
- `/api/settings` GET/PUT (admin only); simple admin form

### Phase 10 — Hardening Pass [P1, even a partial pass matters]
- Validation audit on every endpoint
- Loading / error / empty states everywhere in the UI, not just the happy path
- Rate limiting on `/api/auth/login`
- Responsive check at tablet width (POS lives on tablets) and desktop
- Strip leftover `console.log`s
- Fresh clone → `npm install` → seed → run, zero manual fixes

---

## PROGRESS.md TEMPLATE — create this in Phase 0, keep it updated

```markdown
# CafePOS Progress

Last updated: [date/time] — [tool/account note]

## Phase Status
- [ ] Phase 0 — Setup
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
[specific task within current phase]

## Verified Working This Session
- ...

## Known Issues
- ...

## Next Immediate Steps
1. ...
2. ...

## How To Run
- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`
- Seed: `cd server && npm run seed`
- Logins: admin/[password], cashier/[password]

## Questions For User
- ...

## Decisions/Deviations From Spec
- ...
```

---

## GLOBAL RULES (apply to every phase, no exceptions)
1. Backend always recomputes totals — never trust client-sent prices.
2. Every write endpoint validates input and checks role.
3. Password hashes never appear in any API response.
4. Order items snapshot name/price at order time.
5. Test it before calling it done.
6. Update PROGRESS.md and commit before a session ends.
