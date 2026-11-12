# Branch Coverage Report

**Project:** BookNest Online Bookstore  
**Branch / commit:** `main` @ `7fe5afa`  
**Run date:** 12 November 2026 (CI run 43221279462 and a local full run, 128 of 128 tests passed)  
**Tool:** Jest (`--runInBand --coverage`), MongoDB in Docker for integration tests

## 1. Overall

| Metric | Covered / Total | Coverage | Target (STP) | Result |
|---|---|---|---|---|
| Branches | 196/219 | **89.49%** | 70% | **MET** |

## 2. Per-file branch coverage (files that contain branches)

| File | Branches covered / total | Coverage | vs 70% |
|---|---|---|---|
| `src/middleware/errorHandler.js` | 6/12 | 50.00% | **Below** |
| `src/services/orderService.js` | 14/19 | 73.68% | Met |
| `src/routes/cart.js` | 27/32 | 84.37% | Met |
| `src/routes/admin.js` | 21/24 | 87.50% | Met |
| `src/routes/auth.js` | 21/24 | 87.50% | Met |
| `src/routes/orders.js` | 26/27 | 96.29% | Met |
| `src/config/db.js` | 2/2 | 100.00% | Met |
| `src/middleware/auth.js` | 12/12 | 100.00% | Met |
| `src/middleware/validate.js` | 24/24 | 100.00% | Met |
| `src/routes/books.js` | 26/26 | 100.00% | Met |
| `src/services/cartService.js` | 7/7 | 100.00% | Met |
| `src/services/paymentGateway.js` | 6/6 | 100.00% | Met |
| `src/services/securityLog.js` | 3/3 | 100.00% | Met |
| `src/services/tokens.js` | 1/1 | 100.00% | Met |

Files with no branches (models, `app.js`, `notFound.js`, `health.js`) are omitted: they show 100% only because there is nothing to cover.

## 3. Files below the 70% target

| File | Coverage | Uncovered branches (from the run) |
|---|---|---|
| `src/middleware/errorHandler.js` | 50.00% (6/12) | several fallback and conditional branches (lines 7-11) were never taken; the error paths exercised so far all go through the same route |

This one file holds 6 of the 23 uncovered branches in the project. In the 7 Nov run, `config/db.js` (0/2) and `securityLog.js` (1/3) were also below target; both are now at 100% after the unit tests added on 12 Nov. `src/services/orderService.js` is the lowest of the business-logic files at 73.68% (14/19), but is above target.

## 4. Observations
- The project-wide branch coverage is 89.49%, up from 86.30% on 7 Nov and above the 70% STP target. The only file below target is the error handler, which is infrastructure code, not the cart, catalog, checkout or auth logic.
- Business-logic branches are well covered: `validate.js` 100%, `books.js` 100%, `cartService.js` 100%, `paymentGateway.js` 100%, `orders.js` 96.29%.
- Recommended follow-up (if time allows): add tests for `errorHandler.js` that trigger non-500 statuses and the production-mode response.
