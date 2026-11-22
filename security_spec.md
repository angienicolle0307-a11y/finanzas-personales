# Security Specification — Mi Presupuesto Mensual

## 1. Data Invariants
1. **Strict Account Isolation**: Every `/users/{userId}` document and every `/users/{userId}/movements/{movementId}` document is owned exclusively by `request.auth.uid == userId`. No user can read, list, create, update, or delete another user's profile or financial movements.
2. **Parent Existence (Master Gate)**: Movements under `/users/{userId}/movements/{movementId}` cannot be read, created, updated, or deleted unless the parent `/users/{userId}` profile document exists (verified via `exists` / `existsAfter`).
3. **Immutable Ownership & Creation Timestamps**: `uid`, `userId`, `id`, and `createdAt` cannot be modified after document creation, and `createdAt`/`updatedAt` must equal `request.time`.
4. **No Shadow Fields**: Strict `keys().hasAll(...)` and `keys().hasOnly(...)` on create, and `affectedKeys().hasOnly(...)` on update, prevent arbitrary extra attributes.
5. **Bounded Types & Sizes**: All strings enforce explicit `.size()` bounds; numeric amounts are bounded and non-negative (`monthlyBudget >= 0`, `movement.amount > 0`); path variables enforce `^[a-zA-Z0-9_\\-]+$`.
6. **Zero-Trust List Queries**: `/users` forbids listing (`allow list: if false`); `/users/{userId}/movements` enforces `isOwner(userId) && resource.data.userId == request.auth.uid` without `get()`/`exists()`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read of `/users/userA`.
2. Authenticated `userB` reading `/users/userA` (cross-account PII/budget leak).
3. Authenticated `userA` listing `/users` collection.
4. Authenticated `userA` creating `/users/userA` with `uid: "userB"` (identity spoofing).
5. Authenticated `userA` creating `/users/userA` with `monthlyBudget: -50000` (negative budget).
6. Authenticated `userA` creating `/users/userA` with ghost field `isAdmin: true` (shadow field injection).
7. Authenticated `userA` creating `/users/userA` with client-forged `createdAt` timestamp instead of `request.time`.
8. Authenticated `userA` updating `/users/userA` to mutate `createdAt` or `uid` (immortal field tampering).
9. Authenticated `userA` creating `/users/userA/movements/mov1` when `/users/userA` parent profile does not exist (orphaned movement).
10. Authenticated `userB` listing `/users/userA/movements` (cross-account movement scraping).
11. Authenticated `userA` creating a movement with `amount: 0` or `type: "HACK"` or 10KB `description` (type/boundary poisoning).
12. Authenticated `userA` creating a movement with a 500-char invalid `movementId` path containing spaces/slashes (ID poisoning).
