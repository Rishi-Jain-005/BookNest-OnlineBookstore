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
## Part 3 testing deviations
- Test Plan exit criterion "100% of cases executed" was not met. Not executed: TC-PERF-01 (load test), TC-AVL-01 (availability), TC-USE-01 (usability), TC-SAF-01 (backup/restore), TC-SEC-08 (OWASP ZAP scan).
- System tests ST-02, ST-03 and ST-04 were run at API level (scripts in docs/system-tests). The client has no checkout screens, so the UI steps were not executed.
- The mock gateway uses the token tok_error for an outage. The STP names it tok_timeout.
- The API base path is /api/v1. SAD 4.3 specifies /api.
- Order numbers are BN-YYYYMMDD-XXXXXXXX (8 characters). SRS Appendix B specifies nnnn.
- Automated tests use IT-/UT-/ST-SEC- IDs. The mapping to the STP's TC IDs is in the System Validation Report.
- Deferred to a later release: <list the stories your team agreed not to finish>

## Part 3 testing deviations
- Test Plan exit criterion "100% of cases executed" was not met. Not executed: TC-PERF-01, TC-AVL-01, TC-USE-01, TC-SAF-01, TC-SEC-08 (ZAP scan).
- System tests ST-02, ST-03 and ST-04 were run at API level. The client has no checkout screens, so the UI steps were not executed.
- The mock gateway uses tok_error for an outage. The STP names it tok_timeout.
- The API base path is /api/v1. SAD 4.3 specifies /api.
- Order numbers are BN-YYYYMMDD-XXXXXXXX. SRS Appendix B specifies nnnn.
- Automated tests use IT-/UT-/ST-SEC- IDs. The mapping to the STP's TC IDs is in the System Validation Report.
- Deferred to a later release: sales summary report, low-stock report (only the low_stock_threshold field exists), plus any other stories the team agrees not to finish.
