# Unit Test Report

**Project:** BookNest Online Bookstore  
**Branch / commit:** `main` @ `7fe5afa`  
**Run date:** 12 November 2026 (CI run 43221279462 and a local full run, 128 of 128 tests passed)  
**Tool:** Jest (`--runInBand --coverage`), MongoDB in Docker for integration tests

## 1. Summary

| Metric | Value |
|---|---|
| Unit test suites | 7 |
| Unit tests | 33 |
| Passed | 33 |
| Failed | 0 |
| Overall result | **PASS** |

Unit tests run without a database. For context, the full run on `main` was 128 tests in 15 suites, 128 passed and 0 failed; the 95 integration tests are in the System Validation Report.

## 2. Suites

| Suite | Tests | Passed | Failed | Time |
|---|---|---|---|---|
| `tests/unit/health.test.js` | 2 | 2 | 0 | 1.5 s |
| `tests/unit/orderService.test.js` | 6 | 6 | 0 | 0.9 s |
| `tests/unit/cartService.test.js` | 9 | 9 | 0 | 0.3 s |
| `tests/unit/rateLimit.test.js` | 2 | 2 | 0 | 0.3 s |
| `tests/unit/securityLog.test.js` | 8 | 8 | 0 | 0.1 s |
| `tests/unit/securityLogService.test.js` | 3 | 3 | 0 | 0.1 s |
| `tests/unit/db.test.js` | 3 | 3 | 0 | 0.1 s |

## 3. Test cases

| File | ID | Test | Duration | Result |
|---|---|---|---|---|
| `health.test.js` | - | health endpoint returns ok | 6 ms | PASS |
| `health.test.js` | - | health endpoint returns a 404 envelope for an unknown route | 5 ms | PASS |
| `orderService.test.js` | UT-PAY-01 | MockGatewayAdapter (US-19) approves a normal token and returns a gateway reference only | 2 ms | PASS |
| `orderService.test.js` | UT-PAY-02 | MockGatewayAdapter (US-19) declines tok_fail | 1 ms | PASS |
| `orderService.test.js` | UT-PAY-03 | MockGatewayAdapter (US-19) declines a zero amount | 1 ms | PASS |
| `orderService.test.js` | UT-PAY-04 | MockGatewayAdapter (US-19) tok_error throws to simulate an outage | 20 ms | PASS |
| `orderService.test.js` | UT-ORD-01 | generateOrderNumber (US-10) matches BN-YYYYMMDD-XXXXXXXX | 1 ms | PASS |
| `orderService.test.js` | UT-ORD-02 | generateOrderNumber (US-10) successive numbers differ | 5 ms | PASS |
| `cartService.test.js` | UT-CART-01..07 | cartService.calculateTotal returns 0 for an empty cart | 1 ms | PASS |
| `cartService.test.js` | UT-CART-01..07 | cartService.calculateTotal handles a missing items argument | 1 ms | PASS |
| `cartService.test.js` | UT-CART-01..07 | cartService.calculateTotal calculates a single line | 1 ms | PASS |
| `cartService.test.js` | UT-CART-01..07 | cartService.calculateTotal sums multiple lines | 1 ms | PASS |
| `cartService.test.js` | UT-CART-01..07 | cartService.calculateTotal rejects a negative quantity | 22 ms | PASS |
| `cartService.test.js` | UT-CART-01..07 | cartService.calculateTotal rejects a negative price | 1 ms | PASS |
| `cartService.test.js` | UT-CART-01..07 | cartService.calculateTotal rejects a non-numeric quantity | 1 ms | PASS |
| `cartService.test.js` | UT-CART-08..09 | cartService.toCurrency rounds to two decimal places | 0 ms | PASS |
| `cartService.test.js` | UT-CART-08..09 | cartService.toCurrency removes floating point drift | 1 ms | PASS |
| `rateLimit.test.js` | AUTH-09 | SEC-007 login rate limit allows 10 attempts, then answers 429 on the 11th | 119 ms | PASS |
| `rateLimit.test.js` | - | SEC-007 login rate limit sends standard rate-limit headers | 32 ms | PASS |
| `securityLog.test.js` | - | requireAdmin (SEC-002, SEC-006) returns 403 and logs UNAUTHORIZED_ACCESS for a customer | 1 ms | PASS |
| `securityLog.test.js` | - | requireAdmin (SEC-002, SEC-006) returns 401 when there is no user | 0 ms | PASS |
| `securityLog.test.js` | - | requireAdmin (SEC-002, SEC-006) lets an admin through without logging | 9 ms | PASS |
| `securityLog.test.js` | - | requireAuth (SEC-004) returns 401 when the header is missing | 0 ms | PASS |
| `securityLog.test.js` | - | requireAuth (SEC-004) returns 401 for a tampered token | 3 ms | PASS |
| `securityLog.test.js` | - | requireAuth (SEC-004) returns 401 for an expired token | 1 ms | PASS |
| `securityLog.test.js` | - | requireAuth (SEC-004) returns 401 when the account no longer exists | 0 ms | PASS |
| `securityLog.test.js` | - | requireAuth (SEC-004) accepts a valid token and attaches the user | 0 ms | PASS |
| `securityLogService.test.js` | - | logSecurityEvent returns a timestamped entry with the event type and details | 6 ms | PASS |
| `securityLogService.test.js` | - | logSecurityEvent writes to the console outside the test environment | 1 ms | PASS |
| `securityLogService.test.js` | - | logSecurityEvent stays silent in the test environment | 0 ms | PASS |
| `db.test.js` | - | connectDb refuses to start without MONGO_URI | 8 ms | PASS |
| `db.test.js` | - | connectDb connects with strictQuery on and returns the connection | 1 ms | PASS |
| `db.test.js` | - | connectDb propagates a connection failure | 1 ms | PASS |

## 4. Notes
- Test IDs are taken from the test titles. Tests without an ID in their title show `-`.
- Cart total and currency logic (UT-CART-01..09) and the mock payment gateway (UT-PAY-01..04) and order number format (UT-ORD-01..02) are covered. UT-AUTH-01..07 and UT-CART-10 are exercised through the API in the integration suites (`auth.test.js`, `cart.test.js`), not as database-free unit tests.
- The 16 tests added on 12 Nov cover the login rate limit (SEC-007, AUTH-09), security event logging and the 401/403 middleware (SEC-006, SEC-004), and `config/db.js`. They use mocks, so they need no database. Their durations were measured on a separate run of the same tests; the 7 Nov rows keep their original timings. All 33 unit tests passed in the 12 Nov CI run (128 of 128 overall).
