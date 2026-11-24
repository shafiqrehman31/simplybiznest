# Security Specification & Invariants — simplybiznest.com

## 1. Data Invariants
1. **PII Isolation (`orders` vs `orderStatus`)**: Client PII (`fullName`, `whatsapp`, `email`, `countryCode`) exists ONLY in `orders/{trackingCode}`, readable and listable strictly by verified admins. Public tracking reads ONLY `orderStatus/{trackingCode}` via exact document `get` (never `list`), containing zero PII.
2. **Atomic Lead Submission**: Creating a lead/order in `orders/{trackingCode}` MUST atomically create the corresponding projection in `orderStatus/{trackingCode}` within the same Firestore batch (`existsAfter`).
3. **Admin Privilege Verification**: `isAdmin()` requires `request.auth != null`, `request.auth.token.email_verified == true`, and either the bootstrapped verified admin email or an existing document in `/admins/{request.auth.uid}`.
4. **Immutable Audit & Creation Fields**: `createdAt` and `trackingCode` cannot be mutated after creation; `reportExports` is append-only (no update/delete).
5. **Strict Key & Size Enforcement**: Every collection validates `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, string `.size()` bounds on every string, and `isValidId()` on every document ID path parameter.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read/list on `orders`**: `getDocs(collection(db, 'orders'))` as anon or non-admin -> DENIED.
2. **Shadow field on `orders` create**: Adding `{ isAdmin: true }` or `{ paid: true }` to `orders/SBN-ABC123` -> DENIED.
3. **Orphan `orders` write without `orderStatus`**: Writing `orders/SBN-ABC123` outside a batch with `orderStatus/SBN-ABC123` -> DENIED by `existsAfter`.
4. **Orphan `orderStatus` write without `orders`**: Writing `orderStatus/SBN-ABC123` alone -> DENIED by `existsAfter`.
5. **Public `list` scraping on `orderStatus`**: `getDocs(collection(db, 'orderStatus'))` as public visitor -> DENIED.
6. **Spoofed Admin Email (unverified)**: User with `email == 'shafiq.rehman31@gmail.com'` and `email_verified == false` -> DENIED.
7. **Self-assigned Admin Privilege**: Non-admin user creating `/admins/{uid}` -> DENIED.
8. **ID Poisoning**: Document ID exceeding 128 chars or containing invalid symbols (`../../bad`) -> DENIED.
9. **Client Timestamp Forgery**: Creating `orders/SBN-ABC123` with backdated `createdAt` != `request.time` -> DENIED.
10. **Status Shortcutting on Public Create**: Public create setting `status: "Active Company"` instead of `"Quote Locked"` -> DENIED.
11. **Public Write to CMS (`siteConfig`, `navMenuItems`, `blogPosts`)**: Non-admin attempting `setDoc` on `siteConfig/main` -> DENIED.
12. **Audit Log Tampering**: Even an admin attempting `deleteDoc` or `updateDoc` on `reportExports/{id}` -> DENIED.
