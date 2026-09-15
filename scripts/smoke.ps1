# Smoke test: the API answers and returns certifications, and the frontend serves a page.
#
#   .\scripts\smoke.ps1                                              # local stack
#   .\scripts\smoke.ps1 -Api https://sean-keane.com -Web https://sean-keane.com   # production
#
# Exit code is non-zero on the first failure.
param(
    [string]$Api = "https://localhost:5001",
    [string]$Web = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$fail = $false

function Check([string]$Label, [bool]$Ok, [string]$Detail) {
    if ($Ok) { Write-Host "ok    $Label ($Detail)" -ForegroundColor Green }
    else     { Write-Host "FAIL  $Label ($Detail)" -ForegroundColor Red; $script:fail = $true }
}

# The local backend uses the self-signed development certificate.
$skip = @{}
if ($PSVersionTable.PSVersion.Major -ge 6) { $skip = @{ SkipCertificateCheck = $true } }
else {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
}

try {
    $r = Invoke-WebRequest -Uri "$Api/api/Certifications" -UseBasicParsing -TimeoutSec 15 @skip
    Check "API status is 200" ($r.StatusCode -eq 200) "$Api/api/Certifications -> $($r.StatusCode)"
    $certs = $r.Content | ConvertFrom-Json
    $count = @($certs).Count
    Check "API returns certifications" ($count -gt 0) "count=$count"
} catch {
    Check "API reachable" $false $_.Exception.Message
}

try {
    $w = Invoke-WebRequest -Uri "$Web/" -UseBasicParsing -TimeoutSec 15 @skip
    Check "Frontend status is 200" ($w.StatusCode -eq 200) "$Web/ -> $($w.StatusCode)"
    Check "Frontend serves the app shell" ($w.Content -match '<div id="root"') 'looks for <div id="root">'
} catch {
    Check "Frontend reachable" $false $_.Exception.Message
}

if ($fail) { exit 1 } else { exit 0 }
