# Top New Games: collect today's data and push it to the portal.
#
# Run by the Windows scheduled task "AppSpy Top New Games" at logon and once a day. It needs no
# other program: it reads Google Play with Node, commits data/top-new and pushes to GitHub, and
# the push makes Vercel rebuild appspy.factorialstudio.com with the new tables.
#
#   Install or reinstall the task:   powershell -ExecutionPolicy Bypass -File scripts\top-new\install-task.ps1
#   Run it by hand:                  powershell -ExecutionPolicy Bypass -File scripts\top-new\daily.ps1
#   Logs:                            logs\top-new-YYYY-MM-DD.log (kept 30 days)
#
# It does its work once per day. A second start on the same day only pushes anything that an
# earlier start collected but could not push (no internet at that moment, for example).

$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repo

$today = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')   # the collector dates its files in UTC
$logDir = Join-Path $repo 'logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir "top-new-$today.log"
Get-ChildItem $logDir -Filter 'top-new-*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force

function Log([string]$message) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $message" | Out-File -FilePath $log -Append -Encoding utf8
}
# Native programs write progress to stderr; cmd keeps that out of PowerShell's error stream.
function Run([string]$command) {
  cmd /c "$command >> `"$log`" 2>&1"
  return $LASTEXITCODE
}

Log "---- start (repo $repo)"

# Right after logon the network is often not up yet. Wait up to 10 minutes for GitHub.
$online = $false
for ($i = 0; $i -lt 40; $i++) {
  try {
    $null = Invoke-WebRequest -Uri 'https://github.com' -Method Head -UseBasicParsing -TimeoutSec 10
    $online = $true
    break
  } catch { Start-Sleep -Seconds 15 }
}
if (-not $online) { Log 'No internet after 10 minutes. Nothing done; the next start will try again.'; exit 1 }

# Take in anything pushed from elsewhere first, so the push at the end is not rejected.
if ((Run 'git pull --rebase --autostash') -ne 0) { Log 'git pull failed; carrying on with the local copy.' }

$snapshot = Join-Path $repo "data\top-new\snapshots\$today.json"
if (Test-Path $snapshot) {
  Log "Today's data is already collected."
} else {
  Log 'Collecting.'
  if ((Run 'node scripts/top-new/collect.mjs') -ne 0) {
    # The collector writes nothing when Google Play refuses too many requests, so the portal
    # keeps yesterday's tables. The next start tries again.
    Log 'Collector failed. Portal keeps the last good data.'
    exit 1
  }
}

$null = Run 'git add data/top-new'
cmd /c 'git diff --cached --quiet'
if ($LASTEXITCODE -ne 0) {
  if ((Run "git commit -m `"Top new games: data for $today`"") -ne 0) { Log 'git commit failed.'; exit 1 }
}

# Push whatever is not on GitHub yet: today's commit, or an earlier one that could not be pushed.
$ahead = (cmd /c 'git rev-list --count @{u}..HEAD 2>nul')
if ([int]$ahead -gt 0) {
  if ((Run 'git push') -ne 0) { Log 'git push failed. The next start will push.'; exit 1 }
  Log "Pushed $ahead commit(s). Vercel rebuilds the portal in about two minutes."
} else {
  Log 'Nothing new to push.'
}
Log '---- done'
