# 🌭 SausageMenu v2 — 專案交接文件 (Project Handoff)

> **用途**：本文件供 AI Agent (Codex, Claude Code, Cursor, etc.) 快速理解本專案架構，避免重複探索浪費 Token。
> **最後更新**：2026-07-13
> **當前穩定版本 commit**：`baf01b3` (2026-05-04)

---

## 一、專案概述

**SausageMenu** 是一款面向出國旅遊者的 **AI 菜單翻譯 App**。使用者拍攝餐廳菜單照片，AI (Google Gemini) 即時翻譯並顯示匯率換算價格，支援點餐、結帳、歷史紀錄等功能。

### 產品形態
- **Web App**：部署在 Zeabur (`https://sausagemenu-v2.zeabur.app`)
- **Android App**：透過 Capacitor 包裝 WebView，指向 Zeabur 線上版（已上架 Google Play）
- **iOS App**：透過 Capacitor + Codemagic CI/CD 建構（已上架 App Store）

### 商業模式
- 免費用戶：每日 2 次翻譯
- PRO 用戶：透過 **RevenueCat** 管理的 In-App Purchase（目前全部為終身買斷制 TWD 299）
- 使用者需自備 **Gemini API Key**（BYOK 模式）

---

## 二、技術架構

### 技術棧
| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + React 18 |
| 樣式 | TailwindCSS 3 |
| 動畫 | Framer Motion |
| 行動裝置封裝 | Capacitor 6 |
| AI 引擎 | Google Gemini (`@google/genai`) |
| 資料庫 | Supabase (PostgreSQL) |
| 付費系統 | RevenueCat (`@revenuecat/purchases-capacitor ~8.0.0`) |
| 認證 | Google OAuth (`@codetrix-studio/capacitor-google-auth`) |
| 地圖 | Leaflet + React-Leaflet |
| 部署 | Zeabur (自動從 GitHub main 分支部署) |
| iOS CI/CD | Codemagic (見 `codemagic.yaml`) |

### 語言支援
App UI 支援 15+ 語言：繁體中文(TW/HK)、English、日本語、한국어、ไทย、Tiếng Việt、Bahasa Indonesia、Français、Español、Tagalog、Deutsch、Русский、Polski、Bahasa Melayu、Italiano、Português

---

## 三、目錄結構

```
SausageMenu-v2-ios用/               ← Git 根目錄 (bingyoan/SausageMenu-v2)
├── .git/
├── README.md
├── codemagic.yaml                  ← iOS CI/CD 設定 (Codemagic)
├── SubscriptionKey_*.p8            ← Apple 訂閱金鑰
│
├── SausageMenu-v2-main/            ← ⭐ 主要應用程式 (Next.js 專案)
│   ├── package.json                ← 版本 2.0.1, dev port 8080
│   ├── next.config.js              ← ESLint/TypeScript 錯誤忽略
│   ├── capacitor.config.ts         ← WebView 指向 Zeabur 線上版
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   │
│   ├── App.tsx                     ← ⭐ 主入口元件 (所有頁面路由 + 閘門邏輯)
│   ├── types.ts                    ← TypeScript 型別定義
│   ├── constants.ts                ← 常數 (國家統計預設值等)
│   │
│   ├── app/                        ← Next.js App Router
│   │   ├── page.tsx                ← 首頁 (載入 App.tsx)
│   │   ├── layout.tsx              ← 全域 layout
│   │   ├── globals.css             ← 全域樣式 + CSS 變數 (深/淺色主題)
│   │   ├── privacy/page.tsx        ← 隱私權政策頁面
│   │   └── api/                    ← API Routes (見下方)
│   │
│   ├── components/                 ← ⭐ UI 元件 (30 個)
│   │   ├── Paywall.tsx             ← 付費牆 (RevenueCat 整合)
│   │   ├── WelcomeScreen.tsx       ← 主畫面 (拍照入口 + 功能選單)
│   │   ├── OrderingPage.tsx        ← 點餐頁面 (菜單瀏覽 + 加入購物車)
│   │   ├── OrderSummary.tsx        ← 結帳摘要 (含分帳功能)
│   │   ├── WelcomeGate.tsx         ← 認證閘門 (Google 登入 + Email)
│   │   ├── ApiKeyGate.tsx          ← API Key 輸入閘門 (BYOK)
│   │   ├── LanguageGate.tsx        ← 語言選擇閘門
│   │   ├── GoogleAuthGate.tsx      ← Google OAuth 處理
│   │   ├── CapacitorProvider.tsx   ← Capacitor 原生功能封裝
│   │   ├── MapExplorer.tsx         ← 地圖探索菜單
│   │   ├── MenuLibraryPage.tsx     ← 菜單庫 (本地收藏)
│   │   ├── RestaurantPhrases.tsx   ← 餐廳常用語
│   │   ├── HistoryPage.tsx         ← 歷史紀錄
│   │   ├── Onboarding.tsx          ← 新手導覽
│   │   ├── SaveMenuModal.tsx       ← 儲存菜單對話框
│   │   ├── ShareToMapModal.tsx     ← 分享菜單到地圖
│   │   ├── ShareLinkModal.tsx      ← 分享連結
│   │   ├── SettingsModal.tsx       ← 設定 (API Key / 稅率 / 服務費)
│   │   ├── MenuProcessing.tsx      ← AI 處理中動畫
│   │   ├── UsageLimitBanner.tsx    ← 使用次數限制提示
│   │   ├── LicenseGate.tsx         ← 授權碼閘門
│   │   ├── PaymentGate.tsx         ← 付款閘門
│   │   ├── NewWelcomeGate.tsx      ← 新版登入閘門 (備用)
│   │   ├── AdPopup.tsx             ← 廣告彈窗
│   │   ├── TouristSharePopup.tsx   ← 觀光客分享提示
│   │   ├── CrispChat.tsx           ← 客服聊天
│   │   ├── DachshundAssets.tsx     ← 臘腸犬圖案素材
│   │   ├── MapComponent.tsx        ← 地圖基礎元件
│   │   ├── LicenseModal.tsx        ← 授權碼輸入框
│   │   └── welcomeTranslations.ts  ← 歡迎畫面翻譯文字
│   │
│   ├── services/
│   │   └── geminiService.ts        ← ⭐ Gemini AI 呼叫邏輯 (OCR + 翻譯)
│   │
│   ├── hooks/
│   │   ├── useMenuLibrary.ts       ← 菜單庫 Hook (localStorage)
│   │   ├── useUsageLimit.ts        ← 使用次數限制 Hook
│   │   ├── useTTS.ts               ← 文字轉語音 Hook
│   │   └── useIsAndroid.ts         ← 平台偵測 Hook
│   │
│   ├── lib/
│   │   └── supabase.ts             ← Supabase 客戶端 (懶載入，避免 build 時 crash)
│   │
│   ├── public/                     ← 靜態資源 (Logo, 圖片, manifest.json)
│   ├── IOS_DEPLOYMENT.md           ← iOS 上架指南
│   └── ANDROID_DEPLOYMENT.md       ← Android 上架指南
│
│── (根目錄也有一套舊版檔案的副本，Zeabur 會讀取根目錄的檔案來編譯)
│   ├── App.tsx                     ← ⚠️ 根目錄副本 (Zeabur 實際使用這個)
│   ├── components/Paywall.tsx      ← ⚠️ 根目錄副本
│   ├── app/api/...                 ← ⚠️ 根目錄副本
│   └── ...                         ← 其餘檔案也有根目錄副本
```

---

## 四、核心應用程式流程

### App.tsx 閘門流程 (Gate System)
```
使用者開啟 App
    │
    ├─ [1] LanguageGate: 選擇介面語言 (首次使用)
    │
    ├─ [2] WelcomeGate: Google 登入 / Email 驗證
    │
    ├─ [3] ApiKeyGate: 輸入 Gemini API Key (BYOK)
    │
    └─ [4] 主畫面 (WelcomeScreen)
            ├── 拍照翻譯 → MenuProcessing → OrderingPage → OrderSummary
            ├── 歷史紀錄 → HistoryPage
            ├── 菜單庫 → MenuLibraryPage
            ├── 地圖探索 → MapExplorer
            ├── 常用語 → RestaurantPhrases
            └── 設定 → SettingsModal
```

### DEV_BYPASS 開關
在 `App.tsx` 第 474 行有一個 `DEV_BYPASS` 常數：
- `false`（預設 / 生產環境）：強制經過所有閘門
- `true`：跳過所有閘門，直接進入主畫面（僅開發測試用）

---

## 五、API Routes

| 路徑 | 功能 |
|------|------|
| `/api/generate` | Gemini AI 菜單翻譯 |
| `/api/google-auth` | Google OAuth 驗證 |
| `/api/verify-email` | Email 驗證 |
| `/api/check-usage` | 使用次數檢查 |
| `/api/user-stats` | 全域用戶統計 |
| `/api/init-stats` | 初始化統計 |
| `/api/rates` | 匯率查詢 |
| `/api/tts` | 文字轉語音 |
| `/api/menu-cache` | 地圖菜單快取 (CRUD) |
| `/api/menu-cache/[id]` | 單一菜單快取 |
| `/api/places` | Google Places API 代理 |
| `/api/create-checkout` | Stripe 結帳 |
| `/api/stripe-webhook` | Stripe Webhook |
| `/api/restore-purchase` | 恢復購買紀錄 |
| `/api/become-affiliate` | 聯盟行銷申請 |
| `/api/share-order` | 分享訂單 |
| `/api/share-session` | 分享會話 |

---

## 六、環境變數

以下是需要在 Zeabur / `.env.local` 中設定的環境變數：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...

# RevenueCat
NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_xxx
NEXT_PUBLIC_REVENUECAT_APPLE_KEY=appl_xxx

# Google OAuth
GOOGLE_CLIENT_ID=708202943885-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Stripe (選用)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Google Places API (地圖搜尋)
GOOGLE_PLACES_API_KEY=xxx

# Gemini API (伺服器端備用)
GEMINI_API_KEY=xxx
```

---

## 七、部署架構

### Zeabur (Web + Android/iOS 共用後端)
- **GitHub Repo**: `bingyoan/SausageMenu-v2` → `main` 分支
- **⚠️ 重要**：Zeabur 編譯的是 **Git 根目錄** 的檔案，不是 `SausageMenu-v2-main/` 子目錄
- 推送到 `main` 後 Zeabur 自動觸發重新部署
- 部署完成後 Android/iOS App 會自動載入最新版（因為 WebView 指向 Zeabur URL）

### Capacitor (行動裝置封裝)
- `capacitor.config.ts` 中 `server.url` 設為 `https://sausagemenu-v2.zeabur.app`
- App 本身不包含前端代碼，僅做 WebView 殼 + 原生功能橋接
- 原生功能：相機、GPS、In-App Purchase、Google Sign-In

### Codemagic (iOS CI/CD)
- 設定檔：`codemagic.yaml`
- 自動建構 IPA 並上傳 TestFlight
- 使用 Xcode latest + Node 18.20.4
- 包含 Podfile patch 解決 Xcode 16 + RevenueCat 相容性問題

---

## 八、付費牆 (Paywall) 系統

### 架構
- **RevenueCat** 管理所有平台的訂閱/購買
- 前端元件：`components/Paywall.tsx`
- Entitlement 名稱：`pro`
- 購買成功後 → `localStorage.setItem('is_pro', 'true')`

### 目前方案 (截至 baf01b3)
所有方案均為**終身買斷制**，價格 TWD 299.00，由 RevenueCat 從 Google Play / App Store 取得實際價格。

### ⚠️ 待完成任務：付費牆文字修改
用戶希望將付費牆改為以下三個選項：

| 方案 | 標題 | 說明 | 價格 |
|------|------|------|------|
| 月訂閱制 | 月訂閱制 | 使用期限 30天, 結束不自動續訂 | NT$550 |
| 周訂閱制 | 周訂閱制 | 使用期限 7+1天, 結束不自動續訂 | NT$190 |
| 終身使用會員 | 終身使用會員 | 購買一次享永久使用權利,免費內容更新 ! | NT$2,500 |

**注意事項**：
1. 需要同時修改 **根目錄** 和 `SausageMenu-v2-main/` 中的 `Paywall.tsx`（因為 Zeabur 讀取根目錄的檔案）
2. RevenueCat 的 package identifier 為 `$rc_monthly`、`$rc_weekly`、`$rc_lifetime`
3. 價格必須在 Google Play Console / App Store Connect 中設定，前端只是顯示文字
4. 需確認 RevenueCat Dashboard 中已建立對應的 Offerings

---

## 九、Supabase 資料表

| 資料表 | 用途 |
|--------|------|
| `total_users` | 全域用戶總數 |
| `user_stats` | 各國用戶統計 (country_code, user_count) |
| `menu_cache` | 地圖共享菜單快取 |

---

## 十、已知問題與陷阱

### 🚨 根目錄 vs SausageMenu-v2-main 雙重檔案問題
**這是最大的坑！** Git 根目錄和 `SausageMenu-v2-main/` 子目錄都有一套完整的程式碼。
- **Zeabur 讀取的是根目錄的檔案**
- **開發者通常在 `SausageMenu-v2-main/` 中編輯**
- 修改後必須**同時更新兩處**，否則部署後不會生效
- 建議未來重構：將根目錄的重複檔案移除，並在 Zeabur 設定 Root Directory 為 `SausageMenu-v2-main`

### 🚨 Supabase 懶載入
`lib/supabase.ts` 使用 placeholder URL 避免 build 時 crash。如果環境變數未設定，Supabase 功能會靜默失敗。

### 🚨 Capacitor WebView 快取
Android/iOS App 的 WebView 可能快取舊版網頁。解決方式：
- 使用者需到手機設定 → 應用程式 → SausageMenuPal → 清除快取
- 或在 App 內 force reload

### 🚨 RevenueCat 版本鎖定
`@revenuecat/purchases-capacitor` 鎖定在 `~8.0.0`，因為更高版本與 Xcode 16 + Capacitor 6 有相容性問題。

---

## 十一、常用開發指令

```bash
# 進入主專案目錄
cd SausageMenu-v2-main

# 安裝依賴
npm install

# 本地開發 (port 8080)
npm run dev

# 建構生產版本
npm run build

# Capacitor 同步
npx cap sync

# 開啟 Android Studio
npx cap open android

# 開啟 Xcode
npx cap open ios
```

---

## 十二、Git 歷史重要里程碑

| Commit | 日期 | 說明 |
|--------|------|------|
| `baf01b3` | 2026-05-04 | ✅ **當前穩定版** — Android 1.1.3, Supabase 修復 |
| `d8a2538` | 2026-05-03 | 測試分享按鈕（移除 PRO 檢查） |
| `a51857f` | 2026-05-03 | v201 功能完整移植到 Zeabur |
| `7a0b862` | 2026-04-18 | 支援新版 AQ 前綴 API Key |
| `719aeec` | 2026-03-28 | RevenueCat 8.0.0 + Xcode 16 相容性修復 |
| `39ba7d4` | 2026-03-28 | Supabase 懶載入重構（防 build crash） |
| `62d46fb` | 2026-03-27 | Codemagic iOS CI/CD 設定 |
| `ad77878` | 2026-03-27 | Sign in with Apple + iPad Google 登入修復 |

---

## 十三、給下一位 Agent 的建議

1. **修改任何檔案前**，先確認 Zeabur 讀取的是根目錄還是子目錄的版本
2. **付費牆修改**是用戶最急迫的需求，但需要注意雙重檔案同步問題
3. **不要刪除根目錄的檔案**，否則 Zeabur 會 build 失敗
4. **推送前**建議先在本地 `npm run build` 確認無編譯錯誤
5. **測試付費牆**時，可以將 `DEV_BYPASS` 設為 `true` 跳過登入閘門
6. 所有中文註解是刻意保留的，用戶母語為繁體中文
