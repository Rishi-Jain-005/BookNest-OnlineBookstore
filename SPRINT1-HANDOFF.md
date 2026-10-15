# Sprint 1 — handoff

All eight Sprint 1 stories are implemented. **Do not merge this as one commit from one
person.** The guidelines state that every member must contribute to the implementation and
that commits will be checked; "one student has most commits" is a named anti-pattern.

Each owner takes their own files, on their own branch, as their own pull request.

## Who commits what

### Dhanush — US-01, US-02 (branch `feat/US-01-02-auth`)
```
server/src/models/User.js
server/src/middleware/auth.js
server/src/services/tokens.js
server/src/services/securityLog.js
server/src/routes/auth.js
server/tests/integration/auth.test.js
client/src/pages/Login.jsx
client/src/pages/Register.jsx
```

### Sahaj — US-03, US-04, E-05 (branch `feat/US-03-04-catalogue`)
```
server/src/models/Book.js
server/src/routes/books.js
server/src/seed/seed.js
server/src/seed/books.json
server/tests/integration/books.test.js
client/src/pages/Catalog.jsx
```

### Rishi — US-05, US-06, E-02 (branch `feat/US-05-06-cart`)
```
server/src/models/Cart.js
server/src/models/Order.js
server/src/models/Payment.js
server/src/services/cartService.js
server/src/routes/cart.js
server/tests/unit/cartService.test.js
server/tests/integration/cart.test.js
client/src/pages/Cart.jsx
```

### Lokesh — US-07, US-08, E-01, E-03, E-04 (branch `feat/US-07-08-admin`)
```
server/src/routes/admin.js
server/src/middleware/validate.js
server/tests/integration/admin.test.js
client/src/pages/Admin.jsx
plus the scaffolding, CI pipeline and test harness already merged in E-01
```

### Shared plumbing — merge first, under E-01
```
server/src/app.js            route wiring
server/tests/setup.js        test database
server/tests/helpers.js      test helpers
client/src/App.jsx           routing and nav
client/src/api.js            fetch wrapper
client/src/styles.css
```

## Order of merging

1. Shared plumbing (E-01) — everything else depends on it
2. Dhanush's auth — cart and admin tests need a token
3. Sahaj's catalogue, Rishi's cart, Lokesh's admin — these three are independent

Each PR: author is the owner, one approving review from someone else, `Closes #<issue>`
in the body.

## Running it

```bash
docker compose up -d mongo
cd server && npm install && cp .env.example .env && npm run seed && npm run dev
cd client && npm install && npm run dev        # http://localhost:5173
```

Seeded accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@booknest.test | admin12345 |
| Customer | customer@booknest.test | customer12345 |

51 books across 8 genres; 4 are deliberately out of stock so the availability filter and
the out-of-stock path can both be demonstrated.

## Tests

```bash
cd server
npm run test:unit           # no database needed
npm test                    # everything; needs MongoDB running
cd ../client && npm test
```

CI runs both on every push and pull request and publishes line and branch coverage.

## Test case IDs

The suites are tagged with the IDs your Test Plan and Validation Spec v3 need:
`UT-AUTH-01..07`, `UT-CART-01..10`, `IT-CAT-01..10`, `IT-CART-01..03`, `IT-ADM-01..06`,
`ST-SEC-01..08`. Fill the Actual Result and Pass/Fail columns from a real run — the
exemplar calls out a plan with only Expected columns as a weak submission.

## Demo video — 1 minute

| Time | Show | Stories |
|---|---|---|
| 0:00–0:10 | Register, then log in | US-01, US-02 |
| 0:10–0:30 | Search by author, filter by price, tick in-stock only | US-03, US-04 |
| 0:30–0:45 | Add two books, change a quantity, total updates; then exceed stock and get refused | US-05, US-06 |
| 0:45–0:55 | Sign in as admin, add a book with stock, show it in customer search | US-07 |
| 0:55–1:00 | Customer token on an admin endpoint → 403 | US-08 |

Commit it to `04_IMPLEMENTATION_TESTING/CI-CD-evidence/sprint1-demo.mp4`.
