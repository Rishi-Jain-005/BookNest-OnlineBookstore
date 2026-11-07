# Code Coverage Report

**Project:** BookNest Online Bookstore  
**Branch / commit:** `main` @ `3174f3e`  
**Run date:** 7 November 2026  
**Tool:** Jest (`--runInBand --coverage`), MongoDB in Docker for integration tests

## 1. Overall coverage

| Metric | Covered / Total | Coverage |
|---|---|---|
| Statements | 417/462 | **90.25%** |
| Lines | 387/419 | **92.36%** |
| Functions | 57/63 | **90.47%** |
| Branches | 189/219 | **86.30%** |

Scope: all files under `server/src`. All 112 tests (unit and integration) contribute to these figures.

## 2. Per-file coverage

| File | Statements | Lines | Functions |
|---|---|---|---|
| `src/app.js` | 27/27 (100.00%) | 27/27 (100.00%) | 1/1 (100.00%) |
| `src/config/db.js` | 0/8 (0.00%) | 0/7 (0.00%) | 0/1 (0.00%) |
| `src/middleware/auth.js` | 24/26 (92.30%) | 23/23 (100.00%) | 3/3 (100.00%) |
| `src/middleware/errorHandler.js` | 6/7 (85.71%) | 6/6 (100.00%) | 1/1 (100.00%) |
| `src/middleware/notFound.js` | 2/2 (100.00%) | 2/2 (100.00%) | 1/1 (100.00%) |
| `src/middleware/validate.js` | 31/31 (100.00%) | 25/25 (100.00%) | 11/11 (100.00%) |
| `src/models/Book.js` | 4/4 (100.00%) | 4/4 (100.00%) | 0/0 (100.00%) |
| `src/models/Cart.js` | 4/4 (100.00%) | 4/4 (100.00%) | 0/0 (100.00%) |
| `src/models/Order.js` | 7/7 (100.00%) | 7/7 (100.00%) | 1/1 (100.00%) |
| `src/models/Payment.js` | 3/3 (100.00%) | 3/3 (100.00%) | 0/0 (100.00%) |
| `src/models/User.js` | 11/11 (100.00%) | 11/11 (100.00%) | 3/3 (100.00%) |
| `src/routes/admin.js` | 37/45 (82.22%) | 34/39 (87.17%) | 4/6 (66.66%) |
| `src/routes/auth.js` | 28/30 (93.33%) | 27/29 (93.10%) | 3/3 (100.00%) |
| `src/routes/books.js` | 38/42 (90.47%) | 32/36 (88.88%) | 3/4 (75.00%) |
| `src/routes/cart.js` | 62/71 (87.32%) | 56/61 (91.80%) | 8/9 (88.88%) |
| `src/routes/health.js` | 5/5 (100.00%) | 5/5 (100.00%) | 1/1 (100.00%) |
| `src/routes/orders.js` | 36/38 (94.73%) | 35/37 (94.59%) | 3/3 (100.00%) |
| `src/services/cartService.js` | 8/8 (100.00%) | 8/8 (100.00%) | 3/3 (100.00%) |
| `src/services/orderService.js` | 47/52 (90.38%) | 43/47 (91.48%) | 5/5 (100.00%) |
| `src/services/paymentGateway.js` | 10/11 (90.90%) | 8/9 (88.88%) | 2/3 (66.66%) |
| `src/services/securityLog.js` | 4/5 (80.00%) | 4/4 (100.00%) | 1/1 (100.00%) |
| `src/services/tokens.js` | 3/3 (100.00%) | 3/3 (100.00%) | 1/1 (100.00%) |

## 3. Files below 90% on lines or functions

| File | Lines | Functions | Note |
|---|---|---|---|
| `src/config/db.js` | 0.00% | 0.00% | `connectDb` is never called during the test run (0% of lines) |
| `src/routes/admin.js` | 87.17% | 66.66% | Error-handling `catch` paths and two helper callbacks not triggered |
| `src/routes/books.js` | 88.88% | 75.00% | Error `catch` path and one route callback not triggered |
| `src/routes/cart.js` | 91.80% | 88.88% | Error-handling paths not triggered |
| `src/services/paymentGateway.js` | 88.88% | 66.66% | `catch`/timeout path of the mock gateway not triggered |

## 4. Observations
- Line coverage of 92.36% is above the 70% target in the Test Plan.
- `config/db.js` is the only file at 0%: `connectDb` is not called during the test run.
- The remaining gaps are mostly `catch` blocks and a few callbacks that the tests never trigger (for example in `admin.js`, `books.js` and `paymentGateway.js`).
- The HTML report from the same run is in `server/coverage/index.html`.
