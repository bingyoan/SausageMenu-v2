# SausageMenu Android 快速設定腳本
# 請在 PowerShell 中執行此腳本

Write-Host "🍽️ SausageMenu Android 設定程序" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js
Write-Host "📦 檢查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js 已安裝: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ 請先安裝 Node.js: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 安裝依賴
Write-Host ""
Write-Host "📦 安裝 npm 依賴..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 依賴安裝完成" -ForegroundColor Green
} else {
    Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
    exit 1
}

# 添加 Android 平台
Write-Host ""
Write-Host "📱 添加 Android 平台..." -ForegroundColor Yellow
npx cap add android 2>$null

if (Test-Path "android") {
    Write-Host "✅ Android 專案已建立" -ForegroundColor Green
} else {
    Write-Host "⚠️ Android 專案可能已存在或建立失敗" -ForegroundColor Yellow
}

# 同步 Capacitor
Write-Host ""
Write-Host "🔄 同步 Capacitor 設定..." -ForegroundColor Yellow
npx cap sync android

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 設定完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 執行 'npx cap open android' 打開 Android Studio" -ForegroundColor White
Write-Host "2. 等待 Gradle 同步完成" -ForegroundColor White
Write-Host "3. 點擊 Build > Generate Signed Bundle / APK" -ForegroundColor White
Write-Host ""
Write-Host "詳細說明請參考: ANDROID_DEPLOYMENT.md" -ForegroundColor Cyan
