$base = "http://localhost:3000"
$h    = @{ "Content-Type" = "application/json" }

# ── 1. Login to get token ──────────────────────────────────────
Write-Host "`n=== Login ===" -ForegroundColor Cyan
$loginBody = '{"email":"elcan.atashoff@gmail.com","password":"Test1234"}'
try {
    $r = Invoke-RestMethod "$base/auth/login" -Method POST -Headers $h -Body $loginBody
    $global:TOKEN = $r.data.session.access_token
    Write-Host "Token alindi" -ForegroundColor Green
} catch {
    Write-Host "Login xetasi - serverin ishleyir mi?" -ForegroundColor Red
    $_.ErrorDetails.Message
    exit
}

$auth = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $global:TOKEN" }

# ══════════════════════════════════════════════════════════════
#  SHOPPING LIST
# ══════════════════════════════════════════════════════════════

Write-Host "`n=== Shopping List: Item elave et ===" -ForegroundColor Cyan
$item1 = '{"name":"Toyuq","quantity":"500g","category":"Et"}'
try {
    $r = Invoke-RestMethod "$base/shopping-list/items" -Method POST -Headers $auth -Body $item1
    $r | ConvertTo-Json -Depth 4
    $global:ITEM_ID = $r.data.id
    Write-Host "Item ID: $global:ITEM_ID" -ForegroundColor Green
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Shopping List: 2ci item ===" -ForegroundColor Cyan
$item2 = '{"name":"Zeytun yagi","quantity":"1 shushe","category":"Yag"}'
try {
    Invoke-RestMethod "$base/shopping-list/items" -Method POST -Headers $auth -Body $item2 | ConvertTo-Json -Depth 4
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Shopping List: Bulk elave et ===" -ForegroundColor Cyan
$bulk = '{"items":[{"name":"Sogan","quantity":"2 eded","category":"Terevez"},{"name":"Sarimsaq","quantity":"5 dis","category":"Terevez"},{"name":"Duzu","quantity":"1 qasiq","category":"Ədviyyat"}]}'
try {
    Invoke-RestMethod "$base/shopping-list/items/bulk" -Method POST -Headers $auth -Body $bulk | ConvertTo-Json -Depth 4
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Shopping List: Siyahi goster ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/shopping-list" -Headers $auth | ConvertTo-Json -Depth 5
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Shopping List: Item yenile (is_checked=true) ===" -ForegroundColor Cyan
if ($global:ITEM_ID) {
    $patch = '{"is_checked":true}'
    try {
        Invoke-RestMethod "$base/shopping-list/items/$global:ITEM_ID" -Method PATCH -Headers $auth -Body $patch | ConvertTo-Json -Depth 4
    } catch { $_.ErrorDetails.Message }
} else { Write-Host "Item ID yoxdur" -ForegroundColor Yellow }

Write-Host "`n=== Shopping List: Toggle all checked ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/shopping-list/toggle-all" -Method PATCH -Headers $auth -Body '{"checked":true}' | ConvertTo-Json -Depth 4
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Shopping List: Checked itemleri sil ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/shopping-list/checked" -Method DELETE -Headers $auth | ConvertTo-Json
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Shopping List: Son siyahi ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/shopping-list" -Headers $auth | ConvertTo-Json -Depth 5
} catch { $_.ErrorDetails.Message }

# ══════════════════════════════════════════════════════════════
#  MEAL PLANNER
# ══════════════════════════════════════════════════════════════

$week = "2026-06-22"   # Bu heftanin Bazerti

Write-Host "`n=== Meal Planner: Hefteni goster (bosh) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/meal-plans/week/$week" -Headers $auth | ConvertTo-Json -Depth 6
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Meal Planner: Bazertesi sehe yemediyini elave et ===" -ForegroundColor Cyan
$meal1 = '{"recipe_title":"Yumurtali sendvic","meal_type":"breakfast","day_of_week":0,"calories":350}'
try {
    $r = Invoke-RestMethod "$base/meal-plans/week/$week/items" -Method POST -Headers $auth -Body $meal1
    $r | ConvertTo-Json -Depth 4
    $global:MEAL_ID = $r.data.id
    Write-Host "Meal ID: $global:MEAL_ID" -ForegroundColor Green
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Meal Planner: Bazertesi nahar elave et ===" -ForegroundColor Cyan
$meal2 = '{"recipe_title":"Toyuq salatasi","meal_type":"lunch","day_of_week":0,"calories":520}'
try {
    Invoke-RestMethod "$base/meal-plans/week/$week/items" -Method POST -Headers $auth -Body $meal2 | ConvertTo-Json -Depth 4
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Meal Planner: Seli axsam yemediyini elave et ===" -ForegroundColor Cyan
$meal3 = '{"recipe_title":"Pilav","meal_type":"dinner","day_of_week":1,"calories":680}'
try {
    Invoke-RestMethod "$base/meal-plans/week/$week/items" -Method POST -Headers $auth -Body $meal3 | ConvertTo-Json -Depth 4
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Meal Planner: Hefteyi goster (dolu) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/meal-plans/week/$week" -Headers $auth | ConvertTo-Json -Depth 6
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Meal Planner: 1 meal sil ===" -ForegroundColor Cyan
if ($global:MEAL_ID) {
    try {
        Invoke-RestMethod "$base/meal-plans/items/$global:MEAL_ID" -Method DELETE -Headers $auth | ConvertTo-Json
    } catch { $_.ErrorDetails.Message }
} else { Write-Host "Meal ID yoxdur" -ForegroundColor Yellow }

Write-Host "`n=== Meal Planner: Seli butun gununu temizle (day=1) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/meal-plans/week/$week/day/1" -Method DELETE -Headers $auth | ConvertTo-Json
} catch { $_.ErrorDetails.Message }

Write-Host "`n=== Meal Planner: Son heftelik plan ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod "$base/meal-plans/week/$week" -Headers $auth | ConvertTo-Json -Depth 6
} catch { $_.ErrorDetails.Message }

Write-Host "`nBitti!" -ForegroundColor Green
