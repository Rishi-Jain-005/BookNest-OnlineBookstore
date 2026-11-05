# Unit Test Report

**Project:** BookNest Online Bookstore  
**Branch / commit:** `main` @ `b6086ab`  
**Run date:** 5 November 2026  
**Tool:** Jest (`--runInBand --coverage`), MongoDB in Docker for integration tests

## 1. Summary

| Metric | Value |
|---|---|
| Unit test suites | 3 |
| Unit tests | 17 |
| Passed | 17 |
| Failed | 0 |
| Overall result | **PASS** |

Unit tests run without a database. For context, the full run on `main` was 97 tests in 9 suites, 97 passed and 0 failed; the 80 integration tests are in the System Validation Report.

## 2. Suites

| Suite | Tests | Passed | Failed | Time |
|---|---|---|---|---|
| `tests/unit/health.test.js` | 2 | 2 | 0 | 1.5 s |
| `tests/unit/orderService.test.js` | 6 | 6 | 0 | 0.9 s |
| `tests/unit/cartService.test.js` | 9 | 9 | 0 | 0.3 s |

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

## 4. Notes
- Test IDs are taken from the test titles. Tests without an ID in their title show `-`.
- Cart total and currency logic (UT-CART-01..09) and the mock payment gateway (UT-PAY-01..04) and order number format (UT-ORD-01..02) are covered. UT-AUTH-01..07 and UT-CART-10 are exercised through the API in the integration suites (`auth.test.js`, `cart.test.js`), not as database-free unit tests.
