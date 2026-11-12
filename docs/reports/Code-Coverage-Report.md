# Code Coverage Report

**Project:** BookNest Online Bookstore  
**Branch / commit:** `main` @ `7fe5afa`  
**Run date:** 12 November 2026 (CI run 43221279462 and a local full run, 128 of 128 tests passed)  
**Tool:** Jest (`--runInBand --coverage`), MongoDB in Docker for integration tests

## 1. Overall coverage

| Metric | Covered / Total | Coverage |
|---|---|---|
| Statements | 428/462 | **92.64%** |
| Lines | 394/419 | **94.03%** |
| Functions | 58/63 | **92.06%** |
| Branches | 196/219 | **89.49%** |

Scope: all files under `server/src`. All 128 tests (33 unit and 95 integration) contribute to these figures.

## 2. Per-file coverage

| File | Statements | Lines | Functions |
|---|---|---|---|
| `src/app.js` | 27/27 (100.00%) | 27/27 (100.00%) | 1/1 (100.00%) |
| `src/config/db.js` | 8/8 (100.00%) | 7/7 (100.00%) | 1/1 (100.00%) |
| `src/middleware/auth.js` | 26/26 (100.00%) | 23/23 (100.00%) | 3/3 (100.00%) |
| `src/middleware/errorHandler.js` | 6/7 (85.71%) | 6/6 (100.00%) | 1/1 (100.00%) |
| `src/middleware/notFound.js` | 2/2 (100.00%) | 2/2 (100.00%) | 1/1 (100.00%) |
| `src/middleware/validate.js` | 31/31 (100.00%) | 25/25 (100.00%) | 11/11 (100.00%) |
| `src/models/Book.js` | 4/4 (100.00%) | 4/4 (100.00%) | 0/0 (100.00%) |
| `src/models/Cart.js` | 4/4 (100.00%) | 4/4 (100.00%) | 0/0 (100.00%) |
| `src/models/Order.js` | 7/7 (100.00%) | 7/7 (100.00%) | 1/1 (100.00%) |
| `src/models/Payment.js` | 3/3 (100.00%) | 3/3 (100.00%) | 0/0 (100.00%) |
| `src/models/User.js` | 11/11 (100.00%) | 11/11 (100.00%) | 3/3 (100.00%) |
| `src/routes/admin.js` | 37/45 (82.22%) | 34/39 (87.17%) | 4/6 (66.66%) |
| `src/routes/auth.js` | 48/52 (92.30%) | 47/51 (92.15%) | 5/5 (100.00%) |
| `src/routes/books.js` | 38/42 (90.47%) | 32/36 (88.88%) | 3/4 (75.00%) |
| `src/routes/cart.js` | 62/71 (87.32%) | 56/61 (91.80%) | 8/9 (88.88%) |
| `src/routes/health.js` | 5/5 (100.00%) | 5/5 (100.00%) | 1/1 (100.00%) |
| `src/routes/orders.js` | 36/38 (94.73%) | 35/37 (94.59%) | 3/3 (100.00%) |
| `src/services/cartService.js` | 8/8 (100.00%) | 8/8 (100.00%) | 3/3 (100.00%) |
| `src/services/orderService.js` | 47/52 (90.38%) | 43/47 (91.48%) | 5/5 (100.00%) |
| `src/services/paymentGateway.js` | 10/11 (90.90%) | 8/9 (88.88%) | 2/3 (66.66%) |
| `src/services/securityLog.js` | 5/5 (100.00%) | 4/4 (100.00%) | 1/1 (100.00%) |
| `src/services/tokens.js` | 3/3 (100.00%) | 3/3 (100.00%) | 1/1 (100.00%) |

## 3. Files below 90% on lines or functions

| File | Lines | Functions | Note |
|---|---|---|---|
| `src/routes/admin.js` | 87.17% | 66.66% | Uncovered lines 22, 46, 58, 68, 79: error-handling `catch` paths and two helper callbacks |
| `src/routes/books.js` | 88.88% | 75.00% | Uncovered lines 46 and 51-54: error `catch` path and one route callback |
| `src/routes/cart.js` | 91.80% | 88.88% | Uncovered lines 35, 70, 79, 94, 107: error-handling paths |
| `src/services/paymentGateway.js` | 88.88% | 66.66% | Uncovered line 21: the `catch`/timeout path of the mock gateway |

## 4. Observations
- Line coverage of 94.03% is above the 70% target in the Test Plan.
- `config/db.js` was at 0% in the 7 Nov run and is now at 100% (`tests/unit/db.test.js`). `securityLog.js`, `middleware/validate.js` and all models are also at 100%.
- The remaining gaps are mostly `catch` blocks and a few callbacks that the tests never trigger (for example in `admin.js`, `books.js`, `cart.js` and `paymentGateway.js`).
- The HTML report from the same run is in `server/coverage/index.html` and is attached to the CI run as the `server-coverage` artifact.
