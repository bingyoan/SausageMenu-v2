# 🍎 SausageMenu v2.0 - iOS App 打包與上架指南

## 🎯 概述

本指南將帶你完成以下步驟：
1. 安裝 Capacitor iOS 依賴
2. 初始化 iOS 專案
3. 設定 Xcode 簽名與權限
4. 打包 IPA 並上傳到 App Store Connect

---

## 📋 前置需求

### 必要軟體
- [Node.js](https://nodejs.org/) (v18+)
- [Xcode](https://developer.apple.com/xcode/) (最新版, 需要 15.0+)
- [CocoaPods](https://cocoapods.org/) (`sudo gem install cocoapods`)
- **macOS** (iOS 開發只能在 macOS 上進行)

### Apple Developer 帳號
- [Apple Developer Program](https://developer.apple.com/programs/) ($99/年)
- 已建立 App ID: `com.sausagemenu.app`

---

## 🚀 第一階段：安裝與初始化

### 1️⃣ 安裝依賴

```bash
# 進入專案目錄
cd SausageMenu-v2-main

# 安裝所有依賴 (包括 Capacitor iOS)
npm install
```

### 2️⃣ 添加 iOS 平台

```bash
# 添加 iOS 專案
npx cap add ios
```

### 3️⃣ 同步設定

```bash
npx cap sync ios
```

---

## 🔧 第二階段：Xcode 設定

### 1️⃣ 打開 iOS 專案

```bash
npx cap open ios
```

這會自動打開 Xcode。

### 2️⃣ 設定簽名 (Signing)

1. 在 Xcode 左側點擊 `App` 專案
2. 選擇 `Signing & Capabilities` 標籤
3. 勾選 `Automatically manage signing`
4. 選擇你的 `Team` (Apple Developer Account)
5. 確認 `Bundle Identifier` 為 `com.sausagemenu.app`

### 3️⃣ 添加必要的 Capabilities

1. 點擊 `+ Capability` 按鈕
2. 添加以下能力：
   - `Sign in with Apple` (如果使用 Apple 登入)
   - `In-App Purchase` (RevenueCat 付費功能)
   - `Push Notifications` (如果需要推播通知)

### 4️⃣ 修改 App 圖示

1. 在 Xcode 中，打開 `Assets.xcassets`
2. 選擇 `AppIcon`
3. 拖入你的 1024x1024 App Icon
4. Xcode 會自動生成所有尺寸

### 5️⃣ 設定 Launch Screen

1. 打開 `LaunchScreen.storyboard`
2. 你可以設定啟動畫面的背景色為 `#ea580c`
3. 添加 App Logo 到啟動畫面中央

### 6️⃣ iOS 特定設定 (Info.plist)

確認以下權限描述已添加到 `Info.plist`：

```xml
<!-- 相機權限 (拍攝菜單) -->
<key>NSCameraUsageDescription</key>
<string>SausageMenu 需要使用相機拍攝菜單照片進行翻譯</string>

<!-- 相簿權限 (選擇菜單照片) -->
<key>NSPhotoLibraryUsageDescription</key>
<string>SausageMenu 需要存取您的相簿以選擇菜單照片</string>

<!-- 位置權限 (記錄餐廳位置) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>SausageMenu 使用您的位置來記錄餐廳位置，方便日後導航</string>
```

---

## 🔐 第三階段：Google 登入設定 (iOS)

### 1️⃣ 建立 iOS OAuth Client ID

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 前往 `APIs & Services > Credentials`
4. 點擊 `Create Credentials > OAuth 2.0 Client ID`
5. 選擇 `iOS` 應用程式類型
6. 填寫 Bundle ID: `com.sausagemenu.app`
7. 記下生成的 `Client ID`

### 2️⃣ 更新 Capacitor Config

將 iOS Client ID 填入 `capacitor.config.ts`：

```typescript
GoogleAuth: {
  iosClientId: '你的iOS-OAuth-Client-ID.apps.googleusercontent.com'
}
```

### 3️⃣ URL Scheme 設定

1. 在 Xcode 中，選擇 `Info` 標籤
2. 展開 `URL Types`
3. 添加一個新的 URL Scheme：
   - Identifier: `com.sausagemenu.app`
   - URL Schemes: 你的 iOS Client ID 的反轉域名
     (例如: `com.googleusercontent.apps.xxxxx-xxxxx`)

---

## 💰 第四階段：RevenueCat 設定

### 1️⃣ 在 RevenueCat 新增 Apple 平台

1. 登入 [RevenueCat Dashboard](https://app.revenuecat.com/)
2. 選擇你的 App
3. 前往 `Apps > Add New` 添加 Apple App Store 平台
4. 填入 App Bundle ID: `com.sausagemenu.app`
5. 上傳 Apple 的 Shared Secret (在 App Store Connect 取得)

### 2️⃣ 設定環境變數

在 `.env` 中添加：

```
NEXT_PUBLIC_REVENUECAT_APPLE_KEY=appl_你的RevenueCat_Apple_Key
```

### 3️⃣ 建立 In-App Purchase 項目

1. 前往 [App Store Connect](https://appstoreconnect.apple.com/)
2. 選擇你的 App
3. 前往 `Monetization > In-App Purchases`
4. 建立一個 Non-Consumable 項目 (終身會員)
5. 在 RevenueCat 中對應此產品 ID

---

## 📦 第五階段：打包與送審

### 1️⃣ 選擇目標裝置

1. 在 Xcode 頂部，選擇 `Any iOS Device (arm64)` 作為目標
2. 確定 Build Configuration 為 `Release`

### 2️⃣ Archive 打包

1. 點擊 `Product > Archive`
2. 等待打包完成 (可能需要 3-5 分鐘)
3. Archive 完成後會自動打開 Organizer

### 3️⃣ 上傳到 App Store Connect

1. 在 Organizer 中選擇剛建立的 Archive
2. 點擊 `Distribute App`
3. 選擇 `App Store Connect`
4. 選擇 `Upload` (或 `Export` 導出 IPA)
5. 等待上傳完成

### 4️⃣ 在 App Store Connect 中填寫資訊

#### 📝 應用程式詳情
| 欄位 | 內容 |
|------|------|
| 應用程式名稱 | SausageMenu - AI Menu Translator |
| 副標題 | Travel Dining Companion |
| 類別 | Travel / Food & Drink |
| 隱私權政策網址 | https://sausagemenu-v2.zeabur.app/privacy |

#### 🖼️ 圖片資源
| 資源 | 規格 |
|------|------|
| App 圖示 | 1024 x 1024 PNG (無圓角) |
| iPhone 螢幕截圖 | 至少 3 張 (6.7" 和 6.1") |
| iPad 螢幕截圖 | 可選 |

### 5️⃣ 內容分級

填寫問卷 (App 不包含暴力、賭博等內容)，應會獲得 4+ 評級。

### 6️⃣ 送審

點擊「提交審核」，等待審核（通常 1-3 個工作天）。

---

## ⚠️ 常見審核問題與解決

### 問題 1: 缺少隱私權政策
✅ 已解決：我們已建立 `/privacy` 頁面

### 問題 2: In-App Purchase 未正確設定
✅ 解決方式：確認 RevenueCat 的 Apple Key 正確，且產品已在 App Store Connect 建立

### 問題 3: 登入流程不完整
✅ 解決方式：確認 Google Sign-In 的 iOS Client ID 已正確設定

### 問題 4: Guideline 4.2 (Minimum Functionality)
✅ 已解決：App 使用 WebView 但有完整的原生功能 (相機、GPS、IAP)

### 問題 5: 位置權限
✅ 已解決：Info.plist 中有清楚的使用說明

---

## 🔄 後續更新流程

### 更新網頁內容 (不需重新上傳 IPA)
由於使用線上伺服器模式，修改 `sausagemenu-v2.zeabur.app` 的內容會自動反映在 App 中。

### 更新 App 版本 (需重新上傳)
1. 在 Xcode 中更新版本號 (General > Version & Build)
2. 重新 Archive
3. 上傳到 App Store Connect
4. 提交審核

---

## 📁 專案檔案結構 (iOS 相關)

```
SausageMenu-v2-main/
├── ios/                        # iOS 原生專案 (Capacitor 生成)
│   ├── App/
│   │   ├── App/
│   │   │   ├── Info.plist      # iOS 設定檔
│   │   │   ├── Assets.xcassets # 圖片資源
│   │   │   └── LaunchScreen.storyboard
│   │   ├── Podfile             # CocoaPods 依賴
│   │   └── App.xcworkspace     # Xcode 工作區 (用這個開啟)
│   └── ...
├── capacitor.config.ts         # Capacitor 設定 (含 iOS 配置)
├── setup-ios.ps1               # iOS 設定腳本
└── IOS_DEPLOYMENT.md           # 本文件
```

---

## 📞 需要幫助？

如果遇到任何問題，請檢查：
1. macOS 和 Xcode 是否為最新版
2. CocoaPods 是否已安裝 (`pod --version`)
3. Apple Developer 帳號是否已啟用
4. 簽名憑證是否有效

---

**祝你上架順利！🎉🍎**
