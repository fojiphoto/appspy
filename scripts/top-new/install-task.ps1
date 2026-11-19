# Registers the Windows scheduled task that keeps the Top New Games tables up to date.
#
#   powershell -ExecutionPolicy Bypass -File scripts\top-new\install-task.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\top-new\install-task.ps1 -Remove
#
# The task runs daily.ps1 as the signed-in user (it needs that user's Git sign-in to push):
#   - two minutes after each logon
#   - every day at 10:00, for a PC that is left on
#   - as soon as possible after a missed 10:00 start
# daily.ps1 itself does the work only once per day, so the extra starts cost nothing.

param([switch]$Remove)

$name = 'AppSpy Top New Games'
if ($Remove) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false
  Write-Output "Removed '$name'."
  exit 0
}

$script = Join-Path $PSScriptRoot 'daily.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""

$logon = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$logon.Delay = 'PT2M'
$daily = New-ScheduledTaskTrigger -Daily -At '10:00'

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 3)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $name -Action $action -Trigger @($logon, $daily) -Settings $settings -Principal $principal `
  -Description 'Collects new Android games from Google Play and pushes the tables to appspy.factorialstudio.com. Script: scripts\top-new\daily.ps1' -Force | Out-Null
Write-Output "Installed '$name'. It runs $script"
