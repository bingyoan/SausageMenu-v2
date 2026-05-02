# SausageMenu iOS 快速設定腳本
# 請在 macOS 的 Terminal 或 PowerShell 中執行此腳本
# ⚠️ 前置需求: macOS + Xcode 15+ + CocoaPods

Write-Host "🍽️ SausageMenu iOS 設定程序" -ForegroundColor Cyan
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

# 添加 iOS 平台
Write-Host ""
Write-Host "📱 添加 iOS 平台..." -ForegroundColor Yellow
npx cap add ios 2>$null

if (Test-Path "ios") {
    Write-Host "✅ iOS 專案已建立" -ForegroundColor Green
} else {
    Write-Host "⚠️ iOS 專案可能已存在或建立失敗" -ForegroundColor Yellow
}

# 同步 Capacitor
Write-Host ""
Write-Host "🔄 同步 Capacitor 設定..." -ForegroundColor Yellow
npx cap sync ios

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 設定完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "1. 執行 'npx cap open ios' 打開 Xcode" -ForegroundColor White
Write-Host "2. 在 Xcode 中設定 Signing & Capabilities (選擇你的 Apple Developer Team)" -ForegroundColor White
Write-Host "3. 添加 'Sign in with Apple' Capability" -ForegroundColor White
Write-Host "4. 設定 App Icons 和 LaunchScreen" -ForegroundColor White
Write-Host "5. 選擇 Product > Archive 打包" -ForegroundColor White
Write-Host ""
Write-Host "詳細說明請參考: IOS_DEPLOYMENT.md" -ForegroundColor Cyan
