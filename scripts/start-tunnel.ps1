$cloudflared = Join-Path $PSScriptRoot "..\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    $cloudflared = "cloudflared.exe"
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ACE PROSOFT V2 - STARTING INTERNET TUNNEL...            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Automatically detect what port ACE Prosoft V2 is running on!
$targetPort = 5173
try {
    $procIds = @(Get-Process -Name "*prosoft*","*electron*" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
    if ($procIds.Count -gt 0) {
        $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $procIds -contains $_.OwningProcess }
        if ($conns) {
            $foundPort = ($conns | Select-Object -First 1).LocalPort
            if ($foundPort -gt 0) {
                $targetPort = $foundPort
            }
        }
    }
} catch {
    # fallback to 5173
}

Write-Host ">> Target Prosoft App Port detected: $targetPort" -ForegroundColor Yellow
Write-Host "Connecting to Cloudflare... Generating your public link...`n" -ForegroundColor Gray

$foundUrl = $false

& $cloudflared tunnel --url "http://127.0.0.1:$targetPort" 2>&1 | ForEach-Object {
    $line = $_.ToString()
    
    if ($line -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
        $url = $matches[1]
        if (-not $foundUrl) {
            $foundUrl = $true
            try { Set-Clipboard -Value $url } catch {}
            try { Set-Content -Path (Join-Path $PSScriptRoot "..\active_tunnel_url.txt") -Value $url } catch {}
            
            Write-Host "`n************************************************************************" -ForegroundColor Green
            Write-Host "  SUCCESS! YOUR REMOTE LAB PUBLIC LINK IS:" -ForegroundColor Yellow
            Write-Host "  $url" -ForegroundColor Green
            Write-Host "  (Link has been automatically COPIED to your clipboard!)" -ForegroundColor Cyan
            Write-Host "************************************************************************" -ForegroundColor Green
            Write-Host "  Student Access Passkey: ACE-101" -ForegroundColor White
            Write-Host "  Keep this window open while students are connected.`n" -ForegroundColor Gray
        }
    }

    # Hide noisy diagnostic precheck logs so the screen stays clean
    if ($line -match "precheck component|INF Settings|Initial protocol|ICMP proxy|metrics server|curve preferences|Registered tunnel") {
        # skip
    } else {
        if (-not ($line -match "trycloudflare\.com")) {
            Write-Host $line -ForegroundColor DarkGray
        }
    }
}
