# BookNest

Online Bookstore Ordering and Inventory Management System.

**Team 6** · UE24CS341A Software Engineering · Section G · Semester V · PES University

| Member | SRN | Owns |
|---|---|---|
| Dhanush Gowda A S | PES1UG24CS812 | Registration, login, profile · API review |
| Sahajpreet Singh | PES1UG24CS397 | Catalog, search, filtering · UI/UX |
| Rishi Jain | PES1UG24CS375 | Cart, checkout, order/payment · MongoDB schema |
| S R Lokesh Adithya | PES1UG24CS392 | Admin inventory, sales reporting · Testing / CI-CD |

## Stack

React (Vite) · Node.js + Express · MongoDB (Mongoose) · Jest + Supertest · Vitest · Docker · GitHub Actions

## Setup

```bash
# server
cd server && npm install && cp .env.example .env && npm run dev

# client (separate terminal)
cd client && npm install && npm run dev
```

Or with Docker:

```bash
docker compose up --build
```

## Test

```bash
cd server && npm test            # Jest + Supertest, line and branch coverage
cd client && npm test            # Vitest
```

Coverage reports are written to `coverage/` in each workspace and published as CI artifacts.

## Branch strategy

```
main                      protected, always deployable
  dev                     integration branch
    feat/US-03-catalog-search
    fix/BUG-02-admin-access
    chore/E-03-ci-pipeline
```

- Commit messages start with the story ID: `US-03: add text index to book search`
- Every PR body contains `Closes #<issue>` so the project board updates itself
- The story owner raises the PR; one approving review from a non-author is required before merge
- `main` requires a pull request, a passing CI check and one approval

## Sprints

| Sprint | Dates | Goal |
|---|---|---|
| Sprint 1 | 19–23 Oct 2026 | Register, log in, search the catalog, build a cart; admin stocks the catalog; RBAC enforced |
| Sprint 2 | 26–30 Oct 2026 | Checkout and payment, order tracking and history, admin reports, security hardening, deployment |

## Traceability

Every backlog issue names the SRS requirement it implements (`FR-xxx`, `NFR-xxx`, `SEC-xxx`)
and is closed by the pull request that implements it. The Requirement Traceability Matrix in
SRS Appendix C is completed from the merged PR history.

## Note on CI tooling

The course guidelines name **Jenkins** as the CI tool. The Deliverables Part-2 brief instructs
teams to "Enable Github Actions to automate the PRs, Commits etc", so this project uses
**GitHub Actions**. The pipeline satisfies the same requirement — build and automated tests on
every push and pull request, with published coverage — and this substitution is recorded here
and in the final report.

## Repository layout

```
01_SYNOPSIS/                 Deliverable 1
02_REQUIREMENTS/             SRS, Validation Spec v1, Project Plan
03_DESIGN/                   Architecture, SW Design, Validation Spec v2
04_IMPLEMENTATION_TESTING/   source, test cases, coverage, CI-CD evidence, Validation Spec v3
05_FINAL_REPORT/             Final report, Validation report, Maintenance plan, screenshots
06_PRESENTATION/             Final presentation
client/  server/             Source code
```
