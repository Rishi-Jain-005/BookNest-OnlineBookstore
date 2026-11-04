#!/usr/bin/env bash
#
# BookNest — Team 6 — UE24CS341A
# Creates the whole Part 2 backlog as GitHub issues: labels, milestones,
# 5 enablers and 22 user stories, each traced to an SRS requirement ID.
#
# Prerequisites
#   1. GitHub CLI installed:  https://cli.github.com
#   2. Authenticated:         gh auth login
#   3. Run from inside the cloned repo, OR set REPO below.
#
# Usage
#   chmod +x create-backlog.sh
#   ./create-backlog.sh            # create everything
#   DRY_RUN=1 ./create-backlog.sh  # print what it would do, change nothing
#
# After it runs, open the Project board and add a number field called
# "Story Points", then copy each issue's points-N label into it. GitHub's
# CLI cannot set Projects v2 custom fields reliably, so that last step is
# manual — it takes about five minutes.

set -euo pipefail

# ---------------------------------------------------------------------------
# CONFIGURE THIS BLOCK FIRST — replace with real GitHub usernames
# ---------------------------------------------------------------------------
REPO="${REPO:-}"                 # e.g. "team6-pes/booknest"; blank = current repo
GH_DHANUSH="dhanush-gh-username"
GH_SAHAJ="sahaj-gh-username"
GH_RISHI="rishi-gh-username"
GH_LOKESH="lokesh-gh-username"
# ---------------------------------------------------------------------------

DRY_RUN="${DRY_RUN:-0}"
REPO_ARG=()
[[ -n "$REPO" ]] && REPO_ARG=(--repo "$REPO")

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !! \033[0m%s\n' "$*"; }

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '   [dry-run] %s\n' "$*"
  else
    "$@" >/dev/null 2>&1 || warn "already exists or failed: $*"
  fi
}

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install it from https://cli.github.com then run 'gh auth login'." >&2
  exit 1
fi

if [[ "$GH_LOKESH" == "lokesh-gh-username" ]]; then
  warn "You have not replaced the GitHub usernames at the top of this script."
  warn "Issues will be created unassigned. Edit the script and re-run, or assign by hand."
fi

# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------
say "Creating labels"
mklabel() { run gh label create "$1" --color "$2" --description "$3" --force "${REPO_ARG[@]}"; }

mklabel "sprint-1"   "0E8A16" "Sprint 1: 19-23 Oct"
mklabel "sprint-2"   "1D76DB" "Sprint 2: 26-30 Oct"
mklabel "enabler"    "5319E7" "Infrastructure, not a user story"
mklabel "story"      "0052CC" "User story from the SRS"
mklabel "security"   "B60205" "Traces to a SEC-xxx requirement"
mklabel "nfr"        "D93F0B" "Traces to an NFR-xxx requirement"
mklabel "points-1"   "EDEDED" "1 story point"
mklabel "points-2"   "E4E4E4" "2 story points"
mklabel "points-3"   "D9D9D9" "3 story points"
mklabel "points-5"   "C9C9C9" "5 story points"
mklabel "points-8"   "B4B4B4" "8 story points"
mklabel "auth"       "FBCA04" "Registration, login, profile"
mklabel "catalog"    "FEF2C0" "Catalog, search, filtering"
mklabel "orders"     "C2E0C6" "Cart, checkout, payment, orders"
mklabel "admin"      "BFD4F2" "Admin inventory and reporting"
mklabel "platform"   "D4C5F9" "CI/CD, deployment, tooling"

# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------
say "Creating milestones"
mkmilestone() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '   [dry-run] milestone: %s (due %s)\n' "$1" "$2"
    return
  fi
  gh api "repos/{owner}/{repo}/milestones" -f title="$1" -f due_on="$2" -f description="$3" \
    >/dev/null 2>&1 || warn "milestone already exists: $1"
}

mkmilestone "Sprint 1" "2026-10-23T18:00:00Z" "Browse and build a cart. Ends with a 1-minute working-product video."
mkmilestone "Sprint 2" "2026-10-30T18:00:00Z" "Pay, track, report, harden. Ends with a 2-minute video and the development freeze."

# ---------------------------------------------------------------------------
# Issues
# ---------------------------------------------------------------------------
# mk <id> <title> <story> <acceptance> <traces> <points> <assignee> <milestone> <labels...>
mk() {
  local id="$1" title="$2" story="$3" ac="$4" traces="$5" pts="$6" who="$7" ms="$8"
  shift 8
  local labels="points-${pts}"
  for l in "$@"; do labels="${labels},${l}"; done

  local body
  body=$(cat <<EOF
### User story

${story}

### Acceptance criteria

${ac}

### Traceability

| Field | Value |
|---|---|
| Traces to | ${traces} |
| Story points | ${pts} |
| Sprint | ${ms} |
| Owner | ${who} |

---
Branch: \`feat/${id}-$(echo "$title" | tr '[:upper:] ' '[:lower:]-' | tr -cd '[:alnum:]-' | cut -c1-40)\`
Close this issue from the PR body with \`Closes #<number>\`.
EOF
)

  local args=(issue create --title "${id}: ${title}" --body "$body" --label "$labels" --milestone "$ms")
  [[ -n "$who" && "$who" != *"-gh-username" ]] && args+=(--assignee "$who")
  args+=("${REPO_ARG[@]}")

  if [[ "$DRY_RUN" == "1" ]]; then
    printf '   [dry-run] %s: %s  [%s pts, %s, %s]\n' "$id" "$title" "$pts" "$who" "$ms"
  else
    gh "${args[@]}" || warn "failed to create ${id}"
  fi
}

say "Creating enablers"

mk "E-01" "Repository scaffolding and README" \
  "As a developer, I want a working repository skeleton so that everyone can run the project on day one." \
  "- \`client/\` and \`server/\` each start with a single documented command
- README covers setup, run, test and the branch strategy" \
  "—" "3" "$GH_LOKESH" "Sprint 1" "enabler" "platform"

mk "E-02" "Mongoose schemas and indexes" \
  "As a developer, I want the data model implemented so that every feature has something to read and write." \
  "- User, Book, Cart, CartItem, Order, OrderItem and Payment match SRS Appendix B field layouts
- A text index exists on book title and author" \
  "SRS Appendix B" "5" "$GH_RISHI" "Sprint 1" "enabler" "platform"

mk "E-03" "GitHub Actions CI pipeline" \
  "As a developer, I want CI on every push and pull request so that breakage is caught before review." \
  "- Build, lint and tests run on push and on PR
- Line and branch coverage published as a downloadable artifact" \
  "NFR-005" "3" "$GH_LOKESH" "Sprint 1" "enabler" "platform"

mk "E-04" "Project board and automation" \
  "As the team, we want the board to update itself so that it reflects real git activity rather than manual tidying." \
  "- Columns: Todo, In Progress, In Review, Done
- Auto-add is enabled; a linked PR moves the card to In Progress; a merge moves it to Done and closes the issue" \
  "—" "2" "$GH_LOKESH" "Sprint 1" "enabler" "platform"

mk "E-05" "Catalog seed data" \
  "As a developer, I want a realistic seeded catalog so that search and filtering can be demonstrated credibly." \
  "- At least 50 books across 6 or more genres with realistic prices and stock
- One script repopulates a clean database from scratch" \
  "—" "2" "$GH_SAHAJ" "Sprint 1" "enabler" "catalog"

say "Creating Sprint 1 stories"

mk "US-01" "Customer registration" \
  "As a customer, I want to register with my email so that I can place orders." \
  "- A valid account is created and a duplicate email is rejected
- The stored password is a bcrypt hash and never plaintext" \
  "FR-001, SEC-001, UC-01" "5" "$GH_DHANUSH" "Sprint 1" "story" "auth" "security"

mk "US-02" "Customer login with JWT" \
  "As a customer, I want to log in so that I get a session I can shop with." \
  "- Correct credentials return a signed JWT
- Wrong credentials, an expired token and a tampered token are each rejected with 401" \
  "FR-002, SEC-004, UC-01" "5" "$GH_DHANUSH" "Sprint 1" "story" "auth" "security"

mk "US-03" "Catalog browse and search" \
  "As a visitor, I want to browse and search the catalog by title, author or genre so that I can find a book." \
  "- A search returns every matching active book and no inactive book
- An empty result set renders an explicit empty state" \
  "FR-003, UC-02" "5" "$GH_SAHAJ" "Sprint 1" "story" "catalog"

mk "US-04" "Filter by price and availability" \
  "As a customer, I want to filter results by price range and availability so that I only see books I can actually buy." \
  "- Filters combine with the active search rather than replacing it
- Out-of-stock books are excluded when the availability filter is on" \
  "FR-004, UC-02" "3" "$GH_SAHAJ" "Sprint 1" "story" "catalog"

mk "US-05" "Add to cart and change quantity" \
  "As a customer, I want to add an available book to my cart and change its quantity so that I can prepare an order." \
  "- Only in-stock books can be added
- Quantity cannot be set to zero or above available stock" \
  "FR-005, UC-03" "5" "$GH_RISHI" "Sprint 1" "story" "orders"

mk "US-06" "Cart total calculation" \
  "As a customer, I want my cart total calculated automatically so that I know what I will pay." \
  "- Total equals the sum of unit price times quantity across all items
- The total updates on every quantity change" \
  "FR-006, UC-03" "3" "$GH_RISHI" "Sprint 1" "story" "orders"

mk "US-07" "Admin catalog and stock management" \
  "As an administrator, I want to add, edit and disable book listings with stock levels so that the catalog reflects real inventory." \
  "- An admin can create, update and disable a listing
- A disabled book disappears from customer search immediately" \
  "FR-011, UC-06" "8" "$GH_LOKESH" "Sprint 1" "story" "admin"

mk "US-08" "Role-based access control on admin endpoints" \
  "As the store owner, I want admin endpoints closed to customers so that only staff can change the catalog." \
  "- A valid customer token calling any admin endpoint is rejected with 403
- The check is enforced server-side, not by hiding UI elements" \
  "SEC-002" "3" "$GH_LOKESH" "Sprint 1" "story" "admin" "security"

say "Creating Sprint 2 stories"

mk "US-09" "Checkout and payment authorization" \
  "As a customer, I want to check out and pay so that my order is confirmed." \
  "- An order is created only after the payment gateway authorizes
- A declined payment creates no order and deducts no stock
- Payment success or failure is recorded against the order" \
  "FR-007, FR-012, UC-04" "8" "$GH_RISHI" "Sprint 2" "story" "orders"

mk "US-10" "Unique order number" \
  "As a customer, I want a unique order number so that I can refer to my order." \
  "- Every successfully created order carries a unique identifier
- Two concurrent checkouts never produce the same number" \
  "FR-008" "2" "$GH_RISHI" "Sprint 2" "story" "orders"

mk "US-11" "Order status tracking" \
  "As a customer, I want to see my order's current status so that I know where it is." \
  "- Status displays one of RECEIVED, PROCESSING, SHIPPED or DELIVERED
- An invalid state transition is refused" \
  "FR-009, UC-05" "5" "$GH_DHANUSH" "Sprint 2" "story" "orders"

mk "US-12" "Order history" \
  "As a customer, I want to view my past orders so that I can check what I bought." \
  "- History shows only the signed-in customer's own orders
- Requesting another customer's order returns 403" \
  "FR-010, SEC-002" "3" "$GH_DHANUSH" "Sprint 2" "story" "orders" "security"

mk "US-13" "Sales summary and low-stock report" \
  "As an administrator, I want a sales summary and a low-stock report so that I can manage the store." \
  "- The sales summary totals confirmed orders over a chosen date range
- Low-stock lists every active book below its threshold" \
  "FR-013, UC-07" "5" "$GH_LOKESH" "Sprint 2" "story" "admin"

mk "US-14" "Input validation and sanitization" \
  "As the store owner, I want every user-supplied field validated so that malformed or hostile input cannot reach the database." \
  "- A request failing schema validation returns 400 with a field-level message
- Mongo operator injection in a query parameter is rejected" \
  "SEC-003" "3" "$GH_SAHAJ" "Sprint 2" "story" "security"

mk "US-15" "No card data stored" \
  "As a customer, I want my card details never stored so that a breach cannot expose them." \
  "- No card number, CVV or expiry appears in any collection, log or API response
- Only the gateway reference or token is persisted" \
  "SEC-005" "2" "$GH_RISHI" "Sprint 2" "story" "orders" "security"

mk "US-16" "Security event logging" \
  "As the store owner, I want failed logins and unauthorized access logged so that misuse is visible." \
  "- Each failed login and each 403 writes a timestamped record identifying the actor
- No password or token value appears in any log line" \
  "SEC-006" "3" "$GH_DHANUSH" "Sprint 2" "story" "auth" "security"

mk "US-17" "Idempotent order creation on payment retry" \
  "As a customer, I want a retried payment not to charge me twice so that a timeout does not cost me money." \
  "- Resubmitting the same checkout after a timeout yields exactly one order
- Stock is deducted exactly once" \
  "NFR-004" "5" "$GH_RISHI" "Sprint 2" "story" "orders" "nfr"

mk "US-18" "Catalog search performance" \
  "As a customer, I want search to be fast so that browsing is not painful." \
  "- 95% of catalog search requests respond within 2 seconds under the defined test load
- The measured run is recorded as evidence" \
  "NFR-001" "3" "$GH_SAHAJ" "Sprint 2" "story" "catalog" "nfr"

mk "US-19" "Mockable payment adapter" \
  "As a developer, I want the payment gateway mockable so that tests run without a live service." \
  "- The payment adapter is injectable
- The full suite passes with the gateway stubbed, including timeout and decline paths" \
  "NFR-006, NFR-005" "3" "$GH_LOKESH" "Sprint 2" "story" "platform" "nfr"

mk "US-20" "Coverage reporting in CI" \
  "As a developer, I want line and branch coverage reported by CI so that test quality is visible." \
  "- Every pull request publishes a coverage report
- The report shows line and branch percentages per module" \
  "NFR-005" "5" "$GH_LOKESH" "Sprint 2" "story" "platform" "nfr"

mk "US-21" "Order in five screens or fewer" \
  "As a new customer, I want to order in a handful of steps so that buying is not a chore." \
  "- A first-time customer goes from registration to order confirmation in no more than 5 primary screens
- The walkthrough is recorded as evidence" \
  "NFR-003" "3" "$GH_SAHAJ" "Sprint 2" "story" "nfr"

mk "US-22" "Containerized build and deployment" \
  "As the store owner, I want BookNest deployed and reachable so that customers can actually use it." \
  "- The application builds and runs from a single Dockerfile
- The deployed instance stays reachable through the defined operating window, with uptime evidence recorded" \
  "NFR-002" "5" "$GH_LOKESH" "Sprint 2" "story" "platform" "nfr"

say "Done."
echo
echo "Next steps:"
echo "  1. Open the Project board and confirm all 27 items were auto-added."
echo "  2. Add a number field called 'Story Points' and fill it from each points-N label."
echo "  3. Turn on branch protection for main: require a PR, a passing CI check, and one approval."
echo "  4. Copy ci.yml to .github/workflows/ci.yml and push it."
