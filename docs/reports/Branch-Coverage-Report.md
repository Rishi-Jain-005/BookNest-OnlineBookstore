# Branch Coverage Report

**Project:** BookNest Online Bookstore  
**Branch / commit:** `main` @ `d420f77`  
**Run date:** 7 November 2026  
**Tool:** Jest (`--runInBand --coverage`), MongoDB in Docker for integration tests

## 1. Overall

| Metric | Covered / Total | Coverage | Target (STP) | Result |
|---|---|---|---|---|
| Branches | 176/203 | **86.69%** | 70% | **MET** |

## 2. Per-file branch coverage (files that contain branches)

| File | Branches covered / total | Coverage | vs 70% |
|---|---|---|---|
| `src/config/db.js` | 0/2 | 0.00% | **Below** |
| `src/services/securityLog.js` | 1/3 | 33.33% | **Below** |
| `src/middleware/errorHandler.js` | 6/12 | 50.00% | **Below** |
| `src/services/orderService.js` | 14/19 | 73.68% | Met |
| `src/middleware/auth.js` | 10/12 | 83.33% | Met |
| `src/routes/cart.js` | 27/32 | 84.37% | Met |
| `src/routes/admin.js` | 21/24 | 87.50% | Met |
| `src/routes/auth.js` | 7/8 | 87.50% | Met |
| `src/routes/orders.js` | 26/27 | 96.29% | Met |
| `src/middleware/validate.js` | 24/24 | 100.00% | Met |
| `src/routes/books.js` | 26/26 | 100.00% | Met |
| `src/services/cartService.js` | 7/7 | 100.00% | Met |
| `src/services/paymentGateway.js` | 6/6 | 100.00% | Met |
| `src/services/tokens.js` | 1/1 | 100.00% | Met |

Files with no branches (models, `app.js`, `notFound.js`, `health.js`) are omitted: they show 100% only because there is nothing to cover.

## 3. Files below the 70% target

| File | Coverage | Uncovered branches (from the run) |
|---|---|---|
| `src/config/db.js` | 0.00% (0/2) | `connectDb` is never called during the test run |
| `src/services/securityLog.js` | 33.33% (1/3) | the default-argument branch and the `if` at line 6 were never taken |
| `src/middleware/errorHandler.js` | 50.00% (6/12) | several fallback and conditional branches (lines 7-11) were never taken; the error paths exercised so far all go through the same route |

These three files hold 10 of the 27 uncovered branches in the project. `src/services/orderService.js` is also the lowest of the business-logic files at 73.68% (14/19), but is above target.

## 4. Observations
- The project-wide branch coverage is 86.69%, which is above the 70% STP target. The per-file figures show that the shortfall is confined to infrastructure code (error handler, security log, database connector), not to the cart, catalog, checkout or auth logic.
- Business-logic branches are well covered: `validate.js` 100%, `books.js` 100%, `cartService.js` 100%, `paymentGateway.js` 100%, `orders.js` 96.29%.
- Recommended follow-up (if time allows): add tests for `errorHandler.js` that trigger non-500 statuses and the production-mode response, and a test for `securityLog` when a write fails.
