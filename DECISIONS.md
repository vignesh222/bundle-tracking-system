# Architecture & Design Decisions

## Stack Choice

**Backend: Node.js + Express + MongoDB (Mongoose)**
- Express 5 for its async-native error handling (no need to wrap every route in try/catch wrappers or use `express-async-errors`)
- MongoDB because the data is naturally document-shaped (bundles carry their full style ref, transitions carry a snapshot) and the schema can evolve without migrations during early build
- Mongoose for schema validation at the ODM layer — enforces `{ $gte: 0 }` on `StockItem.quantity` even if the application layer has a bug

**Web: React + Vite**  
- Vite's instant HMR kept feedback loops tight during development  
- React Router v7 for client-side routing, no SSR needed for an internal dashboard  
- No CSS framework — custom CSS variables let me build a consistent design system in one `index.css` without a build-time dependency

**Mobile: Expo + React Native**  
- Expo managed workflow means operators can open the app via Expo Go without an APK install, which is ideal for a demo
- `expo-camera` for barcode/QR scanning with a clean permission model
- `@react-native-community/netinfo` for real-time connectivity detection
- `@react-native-async-storage/async-storage` for the offline queue

**Monorepo: flat workspace**  
- Three sibling directories (`backend/`, `web/`, `mobile/`) rather than a pnpm/Turborepo workspace. Simpler for a time-boxed build; a real product would add a `packages/shared` layer for types and the axios config.

---

## Data Model

```
users          — _id, name, email, passwordHash, role('manager'|'operator'), timestamps
styles         — _id, name, code(SKU prefix, unique), description, createdBy(→User), timestamps
bundles        — _id, bundleId(unique), styleId(→Style), quantity, currentStage, status('wip'|'packed'), timestamps
stageTransitions — bundleId(→Bundle), fromStage, toStage, operatorId(→User), notes, timestamp
stockItems     — styleId(→Style), location('factory'|'dispatch'), quantity(≥0), UNIQUE(styleId+location)
stockMovements — type('in'|'transfer'|'out'), styleId, fromLoc, toLoc, quantity, doneBy(→User), timestamp
```

**Key design choices:**
- `bundleId` is a human-readable string (e.g. `CK001-B001`) so operators can type it without looking at MongoDB `_id`s
- `stageTransitions` is append-only — full audit trail, never updated
- `stockMovements` is append-only — immutable ledger; current stock is always derived from `stockItems` (the running total), not re-aggregated from movements
- `stockItems` has a compound unique index `{styleId, location}` so upserts are safe and there is exactly one balance per style per location

---

## Atomicity & No-Negative-Stock

**Stage transitions** use `session.withTransaction` pattern:
1. Fetch bundle inside session
2. `findOneAndUpdate` with `{ currentStage: fromStage }` as the filter — if another request already moved the stage this update returns `null`, triggering a 409 Conflict (optimistic lock)
3. Create `StageTransition` record in the same session
4. On Packing: upsert `StockItem` with `$inc { quantity: +N }` and insert a `StockMovement` in the same session
5. Commit atomically — all or nothing

**Stock transfers** follow the same pattern:
1. Read source balance inside session
2. Abort with 400 if `source.quantity < requested` (no-negative guard at the application layer + Mongoose `min: 0` validator as backstop)
3. Decrement source, increment destination, insert movement record in one commit

MongoDB transactions require a replica set. The seed/server logs a clear error if the deployment is a standalone `mongod` — in that case the guard still holds at the application layer, but the atomicity guarantee is advisory. For production: use MongoDB Atlas M10+ or a local `mongod --replSet rs0`.

---

## Offline Sync Design

The floor has unreliable WiFi. The approach:

### How it works
1. On every transition attempt the mobile app checks `NetInfo.isConnected`
2. **Online:** POST to `/api/transitions` directly, show result immediately
3. **Offline:** serialize the payload `{ bundleId, toStage, notes, queuedAt, id }` and append to an AsyncStorage list under the key `offline_transition_queue`
4. A banner shows the operator how many transitions are queued
5. **On reconnect:** `NetInfo.addEventListener` fires `isConnected: true` — the app shows a "tap to sync" prompt; tapping iterates the queue, POSTs each item, removes successes, and reports the result

### Trade-offs acknowledged
- **Conflict risk:** If bundle X was moved to `stitching` by another operator while this device was offline, the queued `cutting → stitching` transition will 409 on sync. The UI reports partial sync failures so the operator can resolve manually. A production system would include the `expectedCurrentStage` in the queue payload and surface a clearer "stale queue" error.
- **Queue is device-local:** Queued items do not roam between devices or users. For a multi-operator floor, this means two operators could queue conflicting transitions. Acceptable for a prototype; a real system might route transitions through a per-bundle lock server or use CRDTs.
- **No background sync:** The sync is operator-triggered (tap the banner) or happens when the app is foregrounded and connectivity returns. A service worker / background fetch could automate this in a web context; React Native would need Expo Task Manager — left out of scope for this build.

---

## RBAC

JWT payload: `{ userId, role }`. Two middleware layers:
- `authenticate` — verifies signature, extracts payload into `req.user`
- `requireRole(...roles)` — checks `req.user.role` against the allowed set

Role matrix:

| Action | Manager | Operator |
|--------|---------|---------|
| POST /auth/login | ✓ | ✓ |
| GET /auth/profile | ✓ | ✓ |
| GET /styles, /bundles, /stock | ✓ | ✓ |
| POST /styles, /bundles | ✓ | — |
| POST /stock/transfer | ✓ | — |
| POST /transitions | ✓ | ✓ |
| GET /dashboard | ✓ | — |

---

## What I Deliberately Left Out

1. **Refresh tokens** — single 7-day JWT is fine for a demo; a real system needs refresh + revocation
2. **Pagination** — all list endpoints return everything; at scale add `?page=&limit=` with MongoDB cursors
3. **Input sanitization beyond Mongoose** — express-validator is installed but not wired up; Mongoose schema types provide basic type coercion
4. **Email verification / password reset** — out of scope
5. **Push notifications** — could use Expo Notifications to alert managers when a bundle is packed
6. **Tests** — no unit or integration tests in this build; the seed script acts as a smoke test
7. **Rate limiting** — no `express-rate-limit` on login endpoint; easy to add

---

## AI Workflow

Used Claude Code (claude-sonnet-4-6) for the entire build. I directed the architecture — data model design, atomicity strategy, offline sync approach, RBAC structure — and had Claude generate the implementation. I reviewed every controller for correctness (especially the transaction logic and route ordering), verified the seed ran cleanly, and wrote this DECISIONS.md myself to crystallize the reasoning. Claude saved roughly 70% of the keystrokes; the architectural judgment and cross-layer consistency checks were mine.
