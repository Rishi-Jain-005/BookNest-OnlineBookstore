# Deviations from the submitted documents

The Part 2 brief requires deviations from the submitted SRS, SAD and Test Plan to be
documented and explained at the final demo. Add a dated entry here the day a deviation
happens, not afterwards.

---

## 2026-10-15 — Sprint count reduced from six to two

**Submitted:** Synopsis §1.6 plans six sprints (S1 setup/auth → S6 validation and release).

**Actual:** The Deliverables Part-2 brief allocates two sprints: 19–23 Oct and 26–30 Oct.

**Impact:** No scope was dropped. The six planned iterations are compressed into two:

| Actual sprint | Covers synopsis sprints | Content |
|---|---|---|
| Sprint 1 (19–23 Oct) | S1, S2 + admin catalogue from S5 | Auth, catalogue, search, filtering, cart, admin stock management, RBAC |
| Sprint 2 (26–30 Oct) | S3, S4, S5, S6 | Checkout and payment, order tracking and history, admin reporting, security hardening, coverage, deployment |

**Reason:** Course schedule, not a change of plan by the team.

---

## 2026-10-15 — CI tool is GitHub Actions, not Jenkins

**Submitted:** SRS §10 Tool Stack names "GitHub Actions / Jenkins"; the course guidelines
name Jenkins.

**Actual:** GitHub Actions.

**Reason:** The Deliverables Part-2 brief instructs teams to "Enable Github Actions to
automate the PRs, Commits etc". The pipeline meets the same requirement — build and
automated tests on every push and pull request, with published line and branch coverage.

---

## 2026-10-15 — Test suite split into unit and integration projects

**Submitted:** Test Plan §5 lists Unit / Integration / System levels.

**Actual:** Jest is configured with two projects. `unit` runs without a database;
`integration` requires MongoDB (CI service container, or `docker compose up -d mongo`).

**Reason:** Makes NFR-006 real — the suite must be runnable without live external
services. Does not change the test levels described in the Test Plan.



## Sprint 2/3 deviations — checkout and orders (Rishi)

| Area | SAD v1.0 | Implemented | Reason |
|---|---|---|---|
| Checkout endpoint | POST /api/checkout | POST /api/v1/orders | Single orders resource, versioned prefix used across all modules |
| Order number | BN-YYYYMMDD-nnnn from an atomic counter | BN-YYYYMMDD-XXXXXXXX (random hex), unique index, retried on collision | Avoids a counter collection; uniqueness still enforced by the index |
| Payment lifecycle | PENDING payment first, then FAILED / SUCCESS / REFUNDED | Payment record written only on success; a decline creates no record | Simpler; no order or charge is ever created on failure (BR-05) |
| Stock decrement | One MongoDB transaction | Atomic conditional update per book, undone if any line fails | Local test database is not a replica set; the same guarantee that stock never goes negative (SAF-002) |
| Idempotency key | Stored on the Payment | Stored on the Order | Replay returns the original order directly |
| Sprints | Six | Two, plus Sprint 3 for spillover and testing | Per the Part 2 and Part 3 briefs |


## Part 3: features not built (deferred)

| Requirement | Priority | Status | Effect on testing |
|---|---|---|---|
| FR-013 sales summary and low-stock report | Medium | Not built | RPT-01..08 and ST-08 cannot run |
| FR-014 admin order status update | High | Not built (only the status list exists in Order.js) | OPS-01..08, TRK-05 and ST-06 cannot run |
| FR-016 profile update and password change | Low | Only GET /api/v1/auth/me exists | AUTH-10..17 cannot run |

The Test Plan exit criteria "100% of cases executed" and "100% of High-priority cases passed" are therefore not met.

## Part 3: implementation differs from SAD/SRS

| Area | Submitted | Implemented | Reason |
|---|---|---|---|
| Stock vs payment order | Decrement after payment success (BR-06, ADR-08) | Atomic conditional decrement before the gateway call; released on decline (402) or outage (502) | Same guarantee (stock never negative, SAF-002) without a MongoDB transaction on a non-replica-set test database. A failed payment leaves stock unchanged (IT-ORD-03, IT-ORD-10) |
| Refund (SAF-001) | Refund if payment succeeds but the order cannot be created | No refund call. Stock is released and the error returned. The last-copy race is refused with 409 before payment is taken | Mock gateway only. Known gap: if saving the order fails after approval, the charge is not reversed |
| Login rate limit (SEC-007) | 5 failures per account and IP in 15 min | Per IP, [5 or 10] per 15 min | express-rate-limit default key |
| Security logging (SEC-006) | Failed login, 401/403, invalid token logged | Implemented in code; no automated test checks the log entries | Not tested in this release |
| Gateway outage | 504, retry with same key (tok_timeout) | 502 (tok_error); retry verified by ST-04 | Mock gateway design |
| API base path | /api | /api/v1 | Versioned prefix |
| Order number | BN-YYYYMMDD-nnnn | BN-YYYYMMDD-XXXXXXXX (random hex) | No counter collection; unique index retained |
| TC IDs | STP TC-xxx | Jest uses IT-/UT-/ST-SEC- IDs; mapping in the Test Case Document §3 | Naming grew during development |


## Deployment
The server Dockerfile builds locally (docker build succeeds). The application was not deployed to a cloud host or staging, and CI has no Docker build step. TC-PERF-01, TC-AVL-01, TC-SEC-06 (TLS) and TC-SEC-08 (ZAP) need a deployed environment, so they were not run.

