$exePath = Join-Path $PSScriptRoot "..\apps\desktop\release\win-unpacked\心御AI小说辅助器.exe" | Resolve-Path
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "心御AI小说辅助器.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $exePath
$Shortcut.WorkingDirectory = Split-Path $exePath -Parent
$Shortcut.Save()

Write-Host "桌面快捷方式已创建: $shortcutPath"
