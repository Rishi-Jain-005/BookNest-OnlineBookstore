<#
  BookNest system tests ST-02, ST-03, ST-04 (API level) for the checkout flow.
  Needs the API running and seeded (customer@booknest.test / customer12345).
  Run:  powershell -ExecutionPolicy Bypass -File .\system-tests.ps1
  Writes a transcript to st-run.txt next to the script. Tokens are never printed.
#>
param([int]$Port = 5000)

$base = "http://localhost:$Port/api/v1"
$script:token = $null
$results = New-Object System.Collections.Generic.List[object]
Start-Transcript -Path (Join-Path $PSScriptRoot 'st-run.txt') -Force | Out-Null

function Call($method, $path, $body = $null, $headers = @{}) {
  $h = @{ Authorization = "Bearer $script:token" } + $headers
  $p = @{ Uri = "$base$path"; Method = $method; Headers = $h; ContentType = 'application/json'; UseBasicParsing = $true }
  if ($body) { $p.Body = ($body | ConvertTo-Json -Depth 5) }
  try {
    $r = Invoke-WebRequest @p
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Body = ($r.Content | ConvertFrom-Json) }
  } catch {
    $msg = $_.ErrorDetails.Message
    $parsed = $null
    if ($msg) { try { $parsed = $msg | ConvertFrom-Json } catch { $parsed = $msg } }
    return [pscustomobject]@{ Status = [int]$_.Exception.Response.StatusCode; Body = $parsed }
  }
}

function Show($title, $res) {
  Write-Host ""
  Write-Host "--- $title -> HTTP $($res.Status)" -ForegroundColor Cyan
  Write-Host ($res.Body | ConvertTo-Json -Depth 5)
}

function Check($id, $name, $ok) {
  $status = if ($ok) { 'PASS' } else { 'FAIL' }
  $color = if ($ok) { 'Green' } else { 'Red' }
  Write-Host "[$status] $id  $name" -ForegroundColor $color
  $results.Add([pscustomobject]@{ Test = $id; Check = $name; Result = $status })
}

function StockOf($book) {
  $r = Call GET "/books?q=$([uri]::EscapeDataString($book.title))&limit=50"
  return ($r.Body.data | Where-Object { $_._id -eq $book._id } | Select-Object -First 1).stock_qty
}

function OrderCount { return (Call GET "/orders?limit=1").Body.total }

function ClearCart {
  $c = Call GET "/cart"
  foreach ($i in $c.Body.data.items) { Call DELETE "/cart/items/$($i.itemId)" | Out-Null }
}

# ---------- login (once; the login route is rate limited) ----------
$login = Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' `
  -Body '{"email":"customer@booknest.test","password":"customer12345"}'
$script:token = $login.token
Write-Host "Logged in as $($login.user.email) (role $($login.user.role))"

$books = (Call GET "/books?limit=50").Body.data | Where-Object { $_.stock_qty -ge 5 } | Select-Object -First 3
$bookA = $books[0]; $bookB = $books[1]; $bookC = $books[2]
Write-Host "Books used: A='$($bookA.title)'  B='$($bookB.title)'  C='$($bookC.title)'"
ClearCart

# ---------- ST-02: complete purchase and tracking ----------
Write-Host "`n===== ST-02  Complete purchase and tracking =====" -ForegroundColor Yellow
$stockA0 = StockOf $bookA
$add = Call POST "/cart/items" @{ bookId = $bookA._id; quantity = 2 }
Show "Add 2 x A to cart" $add
Check 'ST-02' 'add to cart returns 201' ($add.Status -eq 201)

$key02 = "st02-" + [guid]::NewGuid().ToString('N')
$co = Call POST "/orders" @{ paymentToken = 'tok_ok' } @{ 'Idempotency-Key' = $key02 }
Show "Checkout with tok_ok" $co
Check 'ST-02' 'checkout returns 201' ($co.Status -eq 201)
Check 'ST-02' 'order status is RECEIVED' ($co.Body.data.status -eq 'RECEIVED')
Check 'ST-02' 'order number format BN-YYYYMMDD-XXXXXXXX' ($co.Body.data.order_number -match '^BN-\d{8}-[0-9A-F]{8}$')
Check 'ST-02' 'total equals 2 x unit price' ($co.Body.data.total -eq (2 * $bookA.price))
Check 'ST-02' 'payment status is SUCCESS' ($co.Body.data.payment_status -eq 'SUCCESS')
Check 'ST-02' 'stock reduced by 2' ((StockOf $bookA) -eq ($stockA0 - 2))
Check 'ST-02' 'cart is empty after checkout' ((Call GET "/cart").Body.data.items.Count -eq 0)

$order02 = Call GET "/orders/$($co.Body.data._id)"
Show "Track order" $order02
Check 'ST-02' 'order page shows RECEIVED' ($order02.Status -eq 200 -and $order02.Body.data.status -eq 'RECEIVED')

# ---------- ST-03: payment failure then retry ----------
Write-Host "`n===== ST-03  Payment failure then retry =====" -ForegroundColor Yellow
$stockB0 = StockOf $bookB
$orders0 = OrderCount
Call POST "/cart/items" @{ bookId = $bookB._id; quantity = 1 } | Out-Null

$fail = Call POST "/orders" @{ paymentToken = 'tok_fail' } @{ 'Idempotency-Key' = ("st03a-" + [guid]::NewGuid().ToString('N')) }
Show "Checkout with tok_fail" $fail
Check 'ST-03' 'declined payment returns 402' ($fail.Status -eq 402)
Check 'ST-03' 'stock unchanged after decline' ((StockOf $bookB) -eq $stockB0)
Check 'ST-03' 'cart kept after decline' ((Call GET "/cart").Body.data.items.Count -eq 1)
Check 'ST-03' 'no order created by the decline' ((OrderCount) -eq $orders0)

$retry = Call POST "/orders" @{ paymentToken = 'tok_ok' } @{ 'Idempotency-Key' = ("st03b-" + [guid]::NewGuid().ToString('N')) }
Show "Retry with tok_ok" $retry
Check 'ST-03' 'retry returns 201' ($retry.Status -eq 201)
Check 'ST-03' 'exactly one order after retry' ((OrderCount) -eq ($orders0 + 1))
Check 'ST-03' 'stock reduced by 1 after retry' ((StockOf $bookB) -eq ($stockB0 - 1))

# ---------- ST-04: gateway outage, retry, replay ----------
Write-Host "`n===== ST-04  Gateway outage, retry and replay with one key =====" -ForegroundColor Yellow
$stockC0 = StockOf $bookC
$orders1 = OrderCount
Call POST "/cart/items" @{ bookId = $bookC._id; quantity = 1 } | Out-Null
$key04 = "st04-" + [guid]::NewGuid().ToString('N')

$err = Call POST "/orders" @{ paymentToken = 'tok_error' } @{ 'Idempotency-Key' = $key04 }
Show "Checkout during gateway outage (tok_error)" $err
Check 'ST-04' 'outage returns 502' ($err.Status -eq 502)
Check 'ST-04' 'stock restored after outage' ((StockOf $bookC) -eq $stockC0)

$ok = Call POST "/orders" @{ paymentToken = 'tok_ok' } @{ 'Idempotency-Key' = $key04 }
Show "Retry with the same key (tok_ok)" $ok
Check 'ST-04' 'retry returns 201' ($ok.Status -eq 201)

$replay = Call POST "/orders" @{ paymentToken = 'tok_ok' } @{ 'Idempotency-Key' = $key04 }
Show "Repeat the same request again (replay)" $replay
Check 'ST-04' 'replay returns 200 with replayed=true' ($replay.Status -eq 200 -and $replay.Body.replayed -eq $true)
Check 'ST-04' 'replay returns the same order' ($replay.Body.data._id -eq $ok.Body.data._id)
Check 'ST-04' 'exactly one new order in total' ((OrderCount) -eq ($orders1 + 1))
Check 'ST-04' 'stock reduced by exactly 1' ((StockOf $bookC) -eq ($stockC0 - 1))

# ---------- summary ----------
Write-Host "`n===== SUMMARY =====" -ForegroundColor Yellow
$results | Format-Table -AutoSize
$failed = ($results | Where-Object { $_.Result -eq 'FAIL' }).Count
Write-Host "Passed: $(($results | Where-Object { $_.Result -eq 'PASS' }).Count)   Failed: $failed"
Stop-Transcript | Out-Null
