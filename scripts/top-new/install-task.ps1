# Registers the Windows scheduled task that keeps the Top New Games tables up to date.
#
#   powershell -ExecutionPolicy Bypass -File scripts\top-new\install-task.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\top-new\install-task.ps1 -Remove
#
# The task runs daily.ps1 as the signed-in user (it needs that user's Git sign-in to push):
#   - two minutes after each logon
#   - every hour after that, so a PC that was asleep or off still gets its run the same day
#     (a single daily start at 10:00 was simply missed on 2026-11-20 while the PC slept)
# daily.ps1 itself does the work only once per day; every other start leaves within a second.
# It is started through "conhost --headless" so that no console window flashes up each hour.

param([switch]$Remove)

$name = 'AppSpy Top New Games'
if ($Remove) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false
  Write-Output "Removed '$name'."
  exit 0
}

$script = Join-Path $PSScriptRoot 'daily.ps1'
$action = New-ScheduledTaskAction -Execute 'conhost.exe' `
  -Argument "--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$script`""

$logon = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$logon.Delay = 'PT2M'
$hourly = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(20) -RepetitionInterval (New-TimeSpan -Hours 1)

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 3)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $name -Action $action -Trigger @($logon, $hourly) -Settings $settings -Principal $principal `
  -Description 'Collects new Android games from Google Play and pushes the tables to appspy.factorialstudio.com. Script: scripts\top-new\daily.ps1' -Force | Out-Null
Write-Output "Installed '$name'. It runs $script"
