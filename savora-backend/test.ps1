$base = "http://localhost:3000"
$h = @{ "Content-Type" = "application/json" }

Write-Host "=== Health ===" -ForegroundColor Cyan
Invoke-RestMethod "$base/health" | ConvertTo-Json

Write-Host "=== Register ===" -ForegroundColor Cyan
$body = '{"name":"Elcan","email":"elcan.atashoff@gmail.com","password":"Test1234"}'
try {
    $r = Invoke-RestMethod "$base/auth/register" -Method POST -Headers $h -Body $body
    $r | ConvertTo-Json -Depth 5
    $global:TOKEN = $r.data.session.access_token
} catch {
    Write-Host "Register error:" -ForegroundColor Red
    $_.ErrorDetails.Message
}

Write-Host "=== Login ===" -ForegroundColor Cyan
$body2 = '{"email":"elcan.atashoff@gmail.com","password":"Test1234"}'
try {
    $r2 = Invoke-RestMethod "$base/auth/login" -Method POST -Headers $h -Body $body2
    $r2 | ConvertTo-Json -Depth 5
    $global:TOKEN = $r2.data.session.access_token
    Write-Host "Token OK" -ForegroundColor Green
} catch {
    Write-Host "Login error:" -ForegroundColor Red
    $_.ErrorDetails.Message
}

Write-Host "=== Me ===" -ForegroundColor Cyan
if ($global:TOKEN) {
    $h2 = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $global:TOKEN" }
    try {
        Invoke-RestMethod "$base/auth/me" -Headers $h2 | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "Me error:" -ForegroundColor Red
        $_.ErrorDetails.Message
    }
} else {
    Write-Host "No token" -ForegroundColor Yellow
}
