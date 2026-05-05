# 📱 SausageMenu v2.0 - Android App 打包與上架指南

## 🎯 概述

本指南將帶你完成以下步驟：
1. 安裝 Capacitor 依賴
2. 初始化 Android 專案
3. 打包 APK/AAB
4. 上傳到 Google Play Store

---

## 📋 前置需求

### 必要軟體
- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) (最新版)
- [JDK 17](https://adoptium.net/) (Java Development Kit)

### Google Play 帳號
- [Google Play Console 開發者帳號](https://play.google.com/console) ($25 一次性費用)

---

## 🚀 第一階段：安裝與初始化

### 1️⃣ 安裝依賴

```bash
# 進入專案目錄
cd SausageMenu-main

# 安裝所有依賴 (包括 Capacitor)
npm install
```

### 2️⃣ 添加 Android 平台

```bash
# 添加 Android 專案
npx cap add android
```

### 3️⃣ 同步網頁資源

由於我們使用線上伺服器模式，不需要 build 靜態檔案。
但仍需要同步 Capacitor 設定：

```bash
npx cap sync android
```

---

## 🔧 第二階段：Android Studio 設定

### 1️⃣ 打開 Android 專案

```bash
npx cap open android
```

這會自動打開 Android Studio。

### 2️⃣ 等待 Gradle 同步

首次打開會自動下載依賴，可能需要 5-10 分鐘。

### 3️⃣ 修改 App 圖示

1. 在 Android Studio 中，右鍵點擊 `app/src/main/res`
2. 選擇 `New > Image Asset`
3. 上傳你的 1024x1024 App Icon
4. 生成所有尺寸的圖示

### 4️⃣ 修改 App 名稱 (如需要)

編輯 `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">SausageMenu</string>
    <string name="title_activity_main">SausageMenu</string>
    <string name="package_name">com.sausagemenu.app</string>
    <string name="custom_url_scheme">com.sausagemenu.app</string>
</resources>
```

---

## 📦 第三階段：打包 AAB (Android App Bundle)

### 1️⃣ 生成簽名金鑰 (首次)

在終端機執行：

```bash
keytool -genkey -v -keystore sausagemenu-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sausagemenu
```

**重要**：請記住密碼，並將 `sausagemenu-release-key.jks` 保存在安全地方！

### 2️⃣ 在 Android Studio 中打包

1. 點擊 `Build > Generate Signed Bundle / APK`
2. 選擇 `Android App Bundle`
3. 點擊 `Next`
4. 選擇你的 keystore 檔案
5. 輸入密碼和別名
6. 點擊 `Next`
7. 選擇 `release`
8. 點擊 `Create`

AAB 檔案會生成在：
`android/app/release/app-release.aab`

---

## 🚀 第四階段：上傳到 Google Play Store

### 1️⃣ 登入 [Google Play Console](https://play.google.com/console)

### 2️⃣ 創建新應用程式

1. 點擊「建立應用程式」
2. 填寫基本資訊：
   - **應用程式名稱**: SausageMenu - AI Menu Translator
   - **預設語言**: 繁體中文 或 English
   - **應用程式類型**: 應用程式
   - **免費或付費**: 免費

### 3️⃣ 填寫商店資訊

#### 📝 應用程式詳情
| 欄位 | 內容 |
|------|------|
| 應用程式名稱 | SausageMenu - AI Menu Translator |
| 簡短說明 (80字) | AI-powered menu translator for travelers. Snap, translate, and order food anywhere! |
| 完整說明 | (見下方) |

**完整說明範例**:
```
🍽️ SausageMenu - Your Ultimate Travel Dining Companion

Traveling abroad and can't read the menu? SausageMenu uses advanced AI (Google Gemini) to instantly translate menus and help you order confidently.

✨ KEY FEATURES:
• 📷 Snap & Translate: Take a photo of any menu and get instant translations
• 💱 Smart Currency Conversion: See prices in your home currency
• ⚠️ Allergen Alerts: Set your allergies and get automatic warnings
• 🧾 Easy Ordering: Generate a clear order summary to show the waiter
• 📍 Restaurant History: Save and navigate back to your favorite spots

🆓 FREE FEATURES:
• 2 free menu translations per day
• Full access to all translation languages
• Currency conversion

👑 PRO SUBSCRIPTION:
• Unlimited menu translations
• Priority AI processing
• All future updates included

Perfect for travelers visiting Japan, Korea, Thailand, Vietnam, France, Spain, and more!

Download now and never struggle with foreign menus again!
```

#### 🖼️ 圖片資源
| 資源 | 規格 |
|------|------|
| App 圖示 | 512 x 512 PNG |
| 功能圖片 | 1024 x 500 PNG |
| 手機螢幕截圖 | 至少 2 張, 16:9 或 9:16 |
| 平板螢幕截圖 | 可選 |

### 4️⃣ 內容分級

1. 前往「內容分級」
2. 填寫問卷 (你的 App 不包含暴力、賭博等內容)
3. 你應該會獲得 「PEGI 3」 或 「Everyone」 評級

### 5️⃣ 隱私權政策

**非常重要！** 填寫你的隱私權政策網址：
```
https://sausagemenu.zeabur.app/privacy
```

### 6️⃣ 上傳 AAB

1. 前往「發布 > 正式版」
2. 點擊「建立新版本」
3. 上傳你的 `app-release.aab`
4. 填寫版本說明
5. 點擊「儲存」
6. 點擊「審核版本」

### 7️⃣ 送審

點擊「開始正式版發布」，等待審核（通常 1-3 個工作天）。

---

## ⚠️ 常見審核問題與解決

### 問題 1: 缺少隱私權政策
✅ 已解決：我們已建立 `/privacy` 頁面

### 問題 2: 外部付款
✅ 已解決：App 內只有登入功能，購買透過網站

### 問題 3: WebView 最低功能
✅ 已解決：我們添加了原生返回鍵、離線處理等功能

### 問題 4: 位置權限
✅ 已解決：我們只在必要時請求位置權限，且有說明用途

---

## 🔄 後續更新流程

### 更新網頁內容 (不需重新上傳 APK)
由於使用線上伺服器模式，修改 `sausagemenu.zeabur.app` 的內容會自動反映在 App 中。

### 更新 App 版本 (需重新上傳 AAB)
1. 修改 `android/app/build.gradle` 中的版本號
2. 重新打包 AAB
3. 上傳到 Play Console

---

## 📞 需要幫助？

如果遇到任何問題，請檢查：
1. Android Studio 是否為最新版
2. Gradle 是否同步成功
3. 簽名金鑰是否正確

---

## 📁 專案檔案結構

```
SausageMenu-main/
├── android/                    # Android 原生專案 (Capacitor 生成)
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── check-usage/        # 使用次數檢查
│   │   ├── google-auth/        # Google 登入
│   │   └── ...
│   ├── privacy/                # 隱私權政策頁面
│   └── ...
├── components/
│   ├── CapacitorProvider.tsx   # Capacitor 功能封裝
│   ├── NewWelcomeGate.tsx      # 新版登入閘門
│   ├── UsageLimitBanner.tsx    # 使用次數顯示
│   └── ...
├── hooks/
│   └── useUsageLimit.ts        # 使用次數 Hook
├── capacitor.config.ts         # Capacitor 設定
├── supabase_migration.sql      # 資料庫遷移腳本
└── ANDROID_DEPLOYMENT.md       # 本文件
```

---

**祝你上架順利！🎉**
