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
