# 心御AI小说辅助器 打包脚本
# 绕过 electron-builder 的 winCodeSign 问题
# 用法: powershell -File scripts/pack.ps1

$releaseDir = "apps/desktop/release"
$unpackedDir = "$releaseDir/win-unpacked"

if (-not (Test-Path "$unpackedDir/心御AI小说辅助器.exe")) {
    Write-Host "请先运行: pnpm --filter @mindforge/desktop build"
    Write-Host "然后手动运行一次 electron-builder 生成 win-unpacked"
    exit 1
}

$version = (Get-Content apps/desktop/package.json | ConvertFrom-Json).version
$zipName = "心御AI小说辅助器-v$version-win-x64.zip"
$zipPath = "$releaseDir/$zipName"

Write-Host "打包中..."
Compress-Archive -Path "$unpackedDir/*" -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "完成! 文件位于:"
Write-Host "  .exe:  $unpackedDir/心御AI小说辅助器.exe"
Write-Host "  .zip:  $zipPath"
Write-Host ""
Write-Host "直接双击 .exe 即可运行。或解压 .zip 到任意目录。"
