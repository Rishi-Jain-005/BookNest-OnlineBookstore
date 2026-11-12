# BookNest: changes since SRS v1.1, SAD v1.0 and STP v1.0

**Addendum A · Team 6 · UE24CS341A · 12 Nov 2026**

This addendum updates the submitted SRS (v1.1), SAD (v1.0) and Test Plan (v1.0) to match the
frozen implementation (`v1.0-freeze`). It lists only what changed. Everything else in those
documents stands. Deviations and their reasons are in `DEVIATIONS.md`; test results are in
`docs/Test_Case_Document.md`.

## A.1 API base path

Every endpoint in SAD §4 and the STP test cases uses the prefix `/api`. The implementation
mounts all routes under `/api/v1`. Read every `/api/...` path in those documents as
`/api/v1/...`.

## A.2 Endpoint changes (SAD §4.3)

| SAD / STP | Implemented | Note |
|---|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | same, under `/api/v1` | |
| `GET /api/users/me`, `PUT /api/users/me` | `GET /api/v1/auth/me`, `PUT /api/v1/auth/me` | name only; email and role are ignored |
| `PUT /api/users/me/password` | `PUT /api/v1/auth/me/password` | current password required |
| `GET /api/books`, `GET /api/books/:id` | same, under `/api/v1` | added `GET /api/v1/books/genres` for the filter list |
| `GET /api/cart`, `POST /api/cart/items` | same, under `/api/v1` | |
| `PATCH` and `DELETE /api/cart/items/:bookId` | `/api/v1/cart/items/:itemId` | the id is the cart line id |
| `POST /api/checkout` | `POST /api/v1/orders` | body carries `paymentToken`; retries send an `Idempotency-Key` header |
| `GET /api/orders`, `GET /api/orders/:id` | same, under `/api/v1` | |
| `POST /api/admin/books`, `PUT /api/admin/books/:id` | `POST /api/v1/admin/books`, `PATCH /api/v1/admin/books/:id` | partial update |
| `PATCH /api/admin/books/:id/active` and `/stock` | `PATCH /api/v1/admin/books/:id` with `is_active` or absolute `stock_qty`; `DELETE /api/v1/admin/books/:id` disables | simpler admin API |
| `PATCH /api/admin/orders/:id/status` | not implemented | FR-014 deferred |
| `GET /api/admin/reports/sales`, `/low-stock` | not implemented | FR-013 deferred |
| `GET /api/health` | `GET /api/v1/health` | |

## A.3 Requirement traceability matrix: implementation files (SRS Appendix)

The RTM names service files that were not created as listed. The logic exists in these files:

| RTM names | Implemented in |
|---|---|
| `services/authService.js` (FR-001, FR-002, SEC-001) | `routes/auth.js`, `services/tokens.js`, `models/User.js` (bcrypt in `User.hashPassword`) |
| `services/catalogService.js` (FR-003, FR-004, FR-015) | `routes/books.js`, `models/Book.js` |
| `services/cartService.js` | as listed |
| `services/orderService.js` | as listed (also the atomic stock decrement for SAF-002 and BR-06) |
| `services/inventoryService.js` (FR-011) | `routes/admin.js` |
| `services/paymentService.js`, `adapters/paymentGateway` (FR-012, NFR-006) | `services/paymentGateway.js`, `models/Payment.js` |
| `middleware/securityLogger.js` (SEC-006) | `services/securityLog.js` |
| `services/reportService.js` (FR-013) | not implemented |

## A.4 Requirement status

| Requirement | Status |
|---|---|
| FR-013 sales summary and low-stock report | Deferred (issue #19). Blocks test cases RPT-01 to RPT-08 and ST-08 |
| FR-014 admin order-status update | Deferred (issue #32). Blocks OPS-01 to OPS-08, TRK-05 and ST-06 |
| FR-015 book detail view | API implemented (`GET /api/v1/books/:id`); no client screen |
| FR-016 profile update and password change | Implemented at API level (issue #33); no client screen |
| Checkout, order tracking and order history screens | Not built; the flows run through the API (see Sprint 2 video) |
| SEC-006 security event logging | Partly met: `LOGIN_FAILED`, `PASSWORD_CHANGE_FAILED` and `UNAUTHORIZED_ACCESS` (403) are logged; 401 and invalid-token events are not |
| SEC-007 login rate limit | 10 login requests per IP per 15 minutes (SRS: 5 failures per account and IP) |
| NFR-006 payment adapter | Mock gateway only (`tok_fail`, `tok_error`) |
| SAF-001 automatic refund | No refund call; stock is released and the error returned |
| US-18 search performance, US-21 five screens, US-22 containerised deployment | Deferred (#24, #27, #28) |

## A.5 Test Plan changes

1. The test case IDs used by the automated tests (`IT-`, `UT-`) are mapped to STP IDs in
   `docs/Test_Case_Document.md` section 3.
2. Decline and outage tokens changed (`tok_fail`, `tok_error`); a gateway outage returns 502
   rather than 504.
3. Order numbers are `BN-YYYYMMDD-XXXXXXXX`.
4. Added test cases are listed in the Test Case Document, section 2.
5. The STP exit criteria "100% of cases executed" and "100% of High-priority cases passed" are
   not met. The counts are in the Test Case Document, section 1.
6. Evidence for the secret scan and dependency audit is in
   `docs/evidence/security-scan-evidence.md`.
