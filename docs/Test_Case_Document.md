# BookNest – Test Case Document (updated after Sprints 1–3)

**Team 6 · UE24CS341A · Based on STP v1.0 §13.3 · Execution: Jest run of 7 Nov 2026 (`server/jest-results.json`: 112 tests, 112 passed, 0 failed)**

**Result key:** **Pass** = executed and passed · **Partial** = executed, but some steps/data of the STP case were not exercised · **Not built (deferred)** = feature not implemented (see DEVIATIONS.md) · **Not executed** = no automated or manual evidence yet (not counted as Pass).

## 1. Summary

| Result | Count | % of 99 |
|---|---|---|
| Pass | 46 | 46.5% |
| Partial | 19 | 19.2% |
| Not built (deferred) | 19 | 19.2% |
| Not executed | 15 | 15.2% |
| Failed | 0 | 0% |

99 STP cases plus added cases (TRK-10 and those in section 2), reported separately.

| Module | Cases | Pass | Partial | Not built | Not executed |
|---|---|---|---|---|---|
| Auth (AUTH-01-17) | 17 | 5 | 10 | 0 | 2 |
| Catalog (CAT) | 9 | 7 | 1 | 0 | 1 |
| Cart (CART) | 8 | 6 | 2 | 0 | 0 |
| Order (ORD) | 11 | 10 | 1 | 0 | 0 |
| Tracking (TRK) | 9 | 8 | 0 | 1 | 0 |
| Order processing (OPS) | 8 | 0 | 0 | 8 | 0 |
| Admin catalog (ADM) | 8 | 8 | 0 | 0 | 0 |
| Reports (RPT) | 8 | 0 | 0 | 8 | 0 |
| Security (SEC) | 8 | 2 | 1 | 0 | 5 |
| Non-functional (PERF/AVL/USE/MNT/SAF) | 5 | 0 | 1 | 0 | 4 |
| System (ST-01-08) | 8 | 0 | 3 | 2 | 3 |
| **Total** | **99** | **46** | **19** | **19** | **15** |

Code coverage (server, Jest): lines 92.36% (387/419), statements 90.25%, functions 90.47%, **branches 86.30% (189/219)**. Targets in STP §5: services lines ≥ 80%, branches ≥ 70% – met.

## 2. Changes from STP v1.0 (test cases updated during the sprints)

| # | STP v1.0 | Implemented / tested as | Action |
|---|---|---|---|
| 1 | Decline token `tok_decline`, timeout `tok_timeout` | Mock gateway uses `tok_fail`, `tok_error` (UT-PAY-02/04) | Test data updated |
| 2 | Order number `BN-YYYYMMDD-nnnn` (atomic counter) | `BN-YYYYMMDD-XXXXXXXX` (UT-ORD-01) | TC-ORD-01/06 and SRS B.3 to be updated |
| 3 | Gateway timeout → 504, retry with same key (TC-ORD-05) | Gateway outage → 502, stock restored (IT-ORD-10) | Expected result updated; retry-after-outage still to be tested |
| 4 | Missing-token checkout/cart/history cases | Added IT-ORD-06, IT-ORD-11 (missing paymentToken 400), IT-ORD-12 | New cases added |
| 5 | SEC-005 raw card rejected not specified | Added IT-ORD-09 (raw card number rejected) | New case added |
| 6 | History pagination | Added TC-TRK-10 (invalid page/limit → 400) | New case added |
| 7 | Cart cases | Added: snapshot price at add, refuse disabled book, unit tests UT-CART-10 and total edge cases | New cases added |
| 8 | Catalog | Added: combined search+filter, malformed id 404, regex text literal, `/health`, unknown-route 404 envelope | New cases added |

## 3. Test case results

Evidence = test name in `jest-results.json`. UT = unit, IT = integration.

### Auth (UC-01, UC-09)

| TC | Req | Evidence | Result | Note |
|---|---|---|---|---|
| AUTH-01 | FR-001 | "creates an account and returns a token" | Pass | |
| AUTH-02 | FR-001 | "rejects a duplicate email with 409" | Pass | |
| AUTH-03 | FR-001, SEC-003 | malformed email 400; password < 8 → 400 | Partial | empty name and 1000-char name not tested |
| AUTH-04 | FR-002 | "returns a signed JWT for correct credentials" | Pass | |
| AUTH-05 | FR-002, SEC-006 | wrong password 401; same error for unknown email; LOGIN_FAILED call asserted on a mocked logger (profile.test.js) | Partial | stored log entry not verified; 401/403 and invalid-token events not asserted |
| AUTH-06 | SEC-001 | "SEC-001: stores a bcrypt hash, never the plaintext password" | Pass | |
| AUTH-07 | SEC-004 | no token / tampered / expired tokens rejected | Pass | |
| AUTH-08 | SEC-004 | – | Not executed | secret scan evidence needed |
| AUTH-09 | SEC-007 | – | Not executed | rate limiting not tested |
| AUTH-10 to AUTH-17 | FR-016 | profile.test.js (PR #34, #35): name update; email refused; role refused; empty name refused; auth required 401; password change; wrong current password 400; short password 400 | Partial | STP lists these 8 cases only in the traceability matrix, so they are mapped by requirement (name and password only, per SRS). API level only, no profile screen |

### Catalog (UC-02)

| TC | Req | Evidence | Result | Note |
|---|---|---|---|---|
| CAT-01 | FR-003 | "searches by title" | Pass | |
| CAT-02 | FR-003 | "searches by author, case-insensitively" | Pass | |
| CAT-03 | FR-003 | "filters by genre, case-insensitively" (gaps.test.js) | Pass | |
| CAT-04 | FR-003 | "returns an empty set rather than an error…" | Pass | UI "no results" message not tested |
| CAT-05 | FR-004 | min/max/range price filter tests | Partial | boundary values 199.99/500.01 not confirmed |
| CAT-06 | FR-004 | "excludes out-of-stock books when inStock is on"; disabled hidden | Pass | |
| CAT-07 | FR-015 | "returns one book"; "404s on an unknown id"; "404s on a malformed id…" | Pass | |
| CAT-08 | SEC-003 | "treats regex characters as literal text"; non-numeric price 400; "operator objects in query are not executed and do not leak data" (gaps.test.js) | Pass | |
| CAT-09 | NFR-003 | – | Not executed | React Testing Library tests not run |

### Cart (UC-03)

| TC | Req | Evidence | Result | Note |
|---|---|---|---|---|
| CART-01 | FR-005, BR-01 | "adds an available book [IT-CART-01]"; "snapshots the price…" | Pass | |
| CART-02 | FR-005 | "merges a repeat add into the existing line" | Pass | |
| CART-03 | FR-005, BR-01 | "refuses an out-of-stock book [IT-CART-03]"; "refuses a disabled book" | Pass | |
| CART-04 | FR-005 | "refuses to exceed available stock"; "rejects a quantity of zero [UT-CART-10]"; "refuses an update above available stock" | Partial | negative and 2.5 not shown |
| CART-05 | FR-005 | "removes an item" | Pass | second delete → 404 not shown |
| CART-06 | FR-006 | "sums multiple lines"; "rounds to two decimal places"; "removes floating point drift" | Pass | |
| CART-07 | FR-006 | "returns 0 for an empty cart" | Partial | qty 999 case not shown |
| CART-08 | SEC-002 | "keeps one customer cart separate from another" | Pass | |

### Order (UC-04)

| TC | Req | Evidence | Result | Note |
|---|---|---|---|---|
| ORD-01 | FR-007/008/012, BR-06 | IT-ORD-01 | Pass | |
| ORD-02 | FR-007/012, BR-05 | IT-ORD-03 (402, stock restored, cart kept, no order) | Pass | |
| ORD-03 | BR-04 | IT-ORD-02 | Pass | |
| ORD-04 | NFR-004, SAF-001 | IT-ORD-04 | Pass | |
| ORD-05 | NFR-004, SAF-001 | IT-ORD-10 (outage 502, stock restored); ST-04 (retry with same key 201, replay returns same order) | Pass | verified with tok_error/502, not the STP tok_timeout/504 |
| ORD-06 | FR-008 | IT-ORD-07; UT-ORD-01/02 | Partial | 100-concurrent run not done |
| ORD-07 | BR-06, SAF-002 | IT-ORD-01 and IT-ORD-03 | Pass | |
| ORD-08 | SAF-001/002 | TC-ORD-08 last-copy race | Pass | |
| ORD-09 | FR-006/007 | TC-ORD-09 | Pass | |
| ORD-10 | NFR-006 | UT-PAY-01 to UT-PAY-04 | Pass | |
| ORD-11 | BR-01, BR-04 | TC-ORD-11 | Pass | |

### Tracking (UC-05, UC-08)

| TC | Req | Evidence | Result |
|---|---|---|---|
| TRK-01 to TRK-04 | FR-009, SEC-002/004 | TC-TRK-01 to 04 | Pass (4) |
| TRK-05 | FR-009, FR-014 | - | Not built (deferred) | FR-014 admin status endpoint not implemented |
| TRK-06 to TRK-09 | FR-009, FR-010 | TC-TRK-06 to 09 | Pass (4) |
| TRK-10 (new) | FR-010 | invalid page/limit → 400 | Pass |

### Order processing (UC-10) – OPS-01 to OPS-08: **Not built (deferred)** (FR-014 status endpoint not implemented).
### Reports (UC-07) – RPT-01 to RPT-08: **Not built (deferred)** (FR-013 not implemented).

### Admin catalog (UC-06)

| TC | Req | Evidence | Result | Note |
|---|---|---|---|---|
| ADM-01 | FR-011 | "creates a listing" | Pass | |
| ADM-02 | FR-011, SEC-003 | missing title, negative price, fractional stock → 400 | Pass | |
| ADM-03 | FR-011 | "admin edits a price and customers see the new price" (gaps.test.js) | Pass | |
| ADM-04 | FR-011, BR-03 | "updates stock quantity" | Pass | |
| ADM-05 | SAF-002 | "stock cannot be set below zero" (gaps.test.js) | Pass | stock is set as absolute stock_qty via PATCH, not a delta |
| ADM-06 | FR-011, BR-01 | "disabling removes the book from customer search immediately"; "still shows disabled books to the admin" | Pass | |
| ADM-07 | FR-011 | "a disabled book can be re-enabled" (gaps.test.js) | Pass | re-enable via PATCH is_active=true |
| ADM-08 | BR-03, SEC-002 | customer 403 on create/disable; 401 unauthenticated | Pass | stock endpoint not shown |

### Security

| TC | Evidence | Result | Note |
|---|---|---|---|
| SEC-01 | customer 403 / anonymous 401 on admin book routes | Partial | not a sweep of all admin routes |
| SEC-05 | "SEC-05: operator injection in login is refused" (gaps.test.js) | Pass | |
| SEC-02, 03, 06, 07, 08 | - | Not executed | SEC-02 logging built, no test; SEC-07 rate limit built, no test; XSS, TLS, npm audit/SonarQube, ZAP not run |
| SEC-04 | TC-SEC-04 | Pass | |

### Non-functional and system

| TC | Result | Note |
|---|---|---|
| MNT-01 | Partial | coverage met (lines 92.36%, branches 86.30%); layering review/SonarQube gate not evidenced |
| PERF-01, AVL-01, USE-01, SAF-01 | Not executed | need staging |
| ST-02, ST-03, ST-04 | Partial | API-level run, 23/23 checks (st-run.txt); UI steps not exercised, no checkout screens |
| ST-06, ST-08 | Not built (deferred) | FR-014 and FR-013 not implemented |
| ST-01, ST-05, ST-07 | Not executed | manual/UI runs needed |

## 4. Defects
No failed tests in this run. Defect log: GitHub Issues (none opened from this run).

## 5. Open stories affecting results
- **US-14 (#20) input validation:** implemented; operator-injection acceptance criterion has no test → add one (also closes CAT-08/SEC-05 gaps).
- **US-16 (#22) security event logging:** delivered in PR #34; LOGIN_FAILED and PASSWORD_CHANGE_FAILED calls asserted on a mocked logger; 401/403 and invalid-token events not asserted; affects AUTH-05, SEC-02.
