# Security scan evidence (TC-AUTH-08, supporting evidence for SEC tests)

Run on 12 Nov 2026 against `main` at commit `6feb3ad` (repository root).

## 1. Secret scan: gitleaks 8.18.4 (TC-AUTH-08, SEC-004)

```
gitleaks detect --source . --redact -v
INF 15 commits scanned.
WRN leaks found: 5
```

All five findings are the same rule (`generic-api-key`) in `docs/system-tests/st-run.txt`
(lines 65, 98, 137, 178, 205, commit `aa8f318`). Each is an `"idempotency_key"` value that
`system-tests.ps1` generates at random for the order-retry tests (ST-02 to ST-04). It is test
traffic, not a credential, so the five findings are false positives.

Other checks:

| Check | Command | Result |
|---|---|---|
| No environment file is tracked | `git ls-files \| findstr /i ".env"` | no output |
| JWT secret comes from the environment | `grep JWT_SECRET server/src` | read from `process.env.JWT_SECRET` only |
| CI uses a throwaway value | `.github/workflows/ci.yml` line 57 | `ci-test-secret-not-a-real-key` |

**Result: Pass.** No real secret is in the repository history.

## 2. Dependency audit: npm audit (production dependencies)

| Package | Command | Result |
|---|---|---|
| server | `npm audit --omit=dev` | 0 vulnerabilities |
| client | `npm audit --omit=dev` | 2 moderate: `react-router` and `react-router-dom` (6.0.0 to 7.17.0) |

The two client advisories concern an open redirect via a backslash in `<Link>`/`useNavigate`
and a constructor injection in `deserializeErrors()` during server-side-rendering hydration.
The client is a client-side Vite application with no server-side rendering. The fix is a major
version upgrade (`npm audit fix --force`), which was not applied after the development freeze.
Recorded as a known issue.

## 3. Not run

TLS configuration (TC-SEC-06), the OWASP ZAP scan (TC-SEC-08) and the SonarQube quality gate
need a deployed environment or a server the team did not set up. See DEVIATIONS.md,
section "Deployment". CI runs ESLint on the server and client on every push.
