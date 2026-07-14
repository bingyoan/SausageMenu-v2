# SausageMenu v2 完整專案交接

> 更新時間：2026-07-14（Asia/Taipei）
> GitHub：`https://github.com/bingyoan/SausageMenu-v2.git`
> 分支：`main`
> 本文件描述「後端代管 Gemini + 訂閱制」版本。

## 1. 專案位置與重要原則

1. 正式專案根目錄是含 `.git`、`package.json`、`App.tsx`、`ios/`、`android/` 與 `codemagic.yaml` 的最外層目錄。
2. `SausageMenu-v2-main/` 是舊副本，不是 Codemagic 與目前 Git 根目錄使用的主要程式。不要只修改內層副本。
3. 正式 App 必須保留 Email、Google、Apple 登入閘門。
4. Gemini 金鑰、RevenueCat secret、簽章檔、`.p8`、keystore 密碼均不可進 Git。Gemini 金鑰只能放 Zeabur 的 `GEMINI_API_KEY`。
5. 使用者曾在對話中貼出 Gemini key，必須先在 Google AI Studio 撤銷並重建，再把新 key 放到 Zeabur。舊 key 視為已暴露。

## 2. 產品流程

SausageMenu 是旅行用菜單翻譯與點餐 App：

1. 使用 Email、Google 或 Apple 登入。
2. 選擇目標語言。
3. 拍攝或上傳 1 至 8 張菜單圖片。
4. 有網路時，把所有頁面一次送到後端 Gemini，保留跨頁與多欄上下文。
5. 後端使用固定模型 `gemini-2.5-flash` 辨識、結構化與翻譯，不接受 App 傳入 API key 或模型名稱。
6. 無網路的原生 App 才改走 `OfflineMenu`：Apple Vision／Google ML Kit OCR + ML Kit 翻譯。
7. 顯示分類、菜名、說明、價格、過敏原與點餐介面。

目前產品策略是「Gemini 線上主路徑 + 裝置端離線備援」。離線模式可應急，但菜單語意與結構品質通常不如 Gemini。

## 3. 本次改版目標與結果

使用者要求：恢復最初的 Gemini 品質、使用開發者後端金鑰、終端使用者不輸入 key，並把付費方式改成訂閱制。

已完成的程式改動：

- 恢復 `gemini-2.5-flash` 作為有網路時的預設菜單處理模型。
- 移除 API key 輸入介面、教學連結、`x-custom-api-key` 與舊 `ApiKeyGate`。
- Gemini key 只從伺服器環境變數讀取。
- 多頁菜單合併成一次 Gemini 請求，避免每頁失去上下文，也避免同一份菜單重複計次。
- 無網路時才啟用 iOS／Android `OfflineMenu`。
- 訂閱頁只顯示 RevenueCat 的週期型商品，不再顯示終身買斷或硬編碼 TWD 299。
- iOS 與 Android 使用各自 RevenueCat public SDK key，購買與恢復後由後端再次驗證 `pro` entitlement。
- Google／Apple 登入 token 由後端驗證；後端簽發 30 天 App session，不再相信任意 email。
- RevenueCat app user id 由伺服器 HMAC 產生，不直接使用 email。
- 舊版已登入但沒有 session token 的使用者會被登出一次，重新登入後即可繼續。

## 4. 用量與成本保護

`app/api/generate/route.ts` 是唯一 Gemini 入口：

- 免費帳號：每日 2 份菜單。
- 有效 Pro／舊版有效權益：每日預設 50 份菜單。
- 可用 `GEMINI_PAID_DAILY_LIMIT` 調整付費合理使用上限。
- 單次請求最大 12 MB。
- 同一 IP 每分鐘最多 15 次請求；目前是單一 server instance 的記憶體限制。
- 菜單掃描成功前即會占用一次額度；菜品說明 `dish-explanation` 不占菜單份數。
- 所有菜單掃描由伺服器更新 Supabase usage，前端不能自行宣告免費或付費權限。

注意：後端代管 Gemini 不是免費服務。訂閱收入、每日上限、圖片壓縮與濫用防護必須一起存在。正式流量增加後，應把 IP rate limit 移到 Redis／Upstash 或 API gateway，並增加每月總成本警報。

## 5. 登入與訂閱安全

重要檔案：

| 檔案 | 功能 |
|---|---|
| `lib/authSession.ts` | 驗證 Google／Apple token，簽發與驗證 App session |
| `lib/subscriptionUser.ts` | 以 HMAC 產生穩定且不洩漏 email 的 RevenueCat app user id |
| `lib/revenueCatServer.ts` | 用 RevenueCat secret REST API 驗證 `pro` entitlement |
| `app/api/google-auth/route.ts` | 建立／同步帳號，簽發 session 與 RC app user id |
| `app/api/subscription/sync/route.ts` | 購買／恢復後同步 RevenueCat 訂閱狀態到 Supabase |
| `components/GoogleAuthGate.tsx` | Email、Google、Apple 登入 UI 與 provider proof 傳送 |
| `components/Paywall.tsx` | 載入週期訂閱、購買、恢復與後端驗證 |

訂閱判定以 RevenueCat entitlement `pro` 為準。App Store Connect／Google Play 商品必須在 RevenueCat 掛到同一個 `pro` entitlement。

## 6. Zeabur 必要環境變數

根目錄 `.env.example` 有完整名稱。正式 Zeabur 至少設定：

```text
GEMINI_API_KEY=<新建立的 Gemini key>
GEMINI_PAID_DAILY_LIMIT=50
AUTH_SESSION_SECRET=<至少 32 bytes 的隨機字串>
SUBSCRIPTION_USER_ID_SECRET=<另一組至少 32 bytes 的隨機字串>
REVENUECAT_SECRET_API_KEY=<RevenueCat secret key>
NEXT_PUBLIC_REVENUECAT_APPLE_KEY=<iOS public SDK key>
NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY=<Android public SDK key>
NEXT_PUBLIC_SUPABASE_URL=<既有值>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<既有值>
```

注意：

- `GEMINI_API_KEY` 與 `REVENUECAT_SECRET_API_KEY` 是 secret，不可放 `NEXT_PUBLIC_`。
- 兩個 signing secret 上線後不要隨意更換；更換會讓既有 session 或 RevenueCat app user mapping 失效。
- 公開 SDK key 可內嵌 App，但仍應由 Codemagic／Zeabur環境管理。iOS 程式目前保留既有 public key fallback；Android 必須提供 Google public key。
- 本機沒有 Zeabur CLI，因此這些值尚未代為寫入 Zeabur。

## 7. 商店與 RevenueCat 尚待人工設定

程式已改為訂閱制，但未建立商店商品就不會出現可購買方案。上架前必須完成：

1. App Store Connect 建立 Subscription Group 與自動續訂商品，例如月訂閱、年訂閱，設定價格與審核資訊。
2. Google Play Console 建立相同概念的 Subscription／Base plan。
3. RevenueCat 匯入 iOS／Android 商品。
4. 所有商品連到 entitlement：`pro`。
5. Current Offering 加入月／年 package；移除舊 lifetime package。
6. 把 RevenueCat secret key 放 Zeabur，把兩平台 public SDK key 放建置環境。
7. 補齊 App Store Connect TestFlight 的 Feedback Email 與 Beta App Review 聯絡資料。

定價尚未由產品負責人指定，程式會直接顯示商店回傳的價格與週期，不應在程式內寫死價格。

## 8. 主要技術與檔案

| 區域 | 技術／檔案 |
|---|---|
| UI | Next.js 14、React 18、TypeScript、TailwindCSS、Framer Motion |
| 手機容器 | Capacitor 6 |
| 線上 AI | `@google/genai`、`gemini-2.5-flash`、`services/geminiService.ts` |
| API | `app/api/generate/route.ts` |
| iOS 離線 | Apple Vision + ML Kit Translate，`ios/App/App/OfflineMenuPlugin.swift` |
| Android 離線 | ML Kit OCR／Language ID／Translate，`OfflineMenuPlugin.java` |
| 訂閱 | RevenueCat Capacitor 9.2.2 |
| 後端資料 | Supabase |
| iOS CI/CD | `codemagic.yaml` |
| App 主流程 | `App.tsx` |
| 手機靜態 bundle | `scripts/build-mobile.mjs` |

Bundle ID／Android applicationId：`com.sausagemenu.app`
App Store Connect App ID：`6760179953`

## 9. 已修正的歷史問題

- Google 登入 URL scheme 與 OAuth Client ID 已恢復。
- 產生菜單不再等待 GPS；位置只作選用資訊。
- Android `OfflineMenu` plugin 已在 `MainActivity` 正確註冊。
- iOS OCR 尊重圖片方向，並改善多欄、價格、狀態列與營業時間過濾。
- React render error 由 App Error Boundary 接住，不再只顯示黑畫面。
- Codemagic 已處理 CocoaPods 衝突、Xcode 26 RevenueCat 相容性與簽章流程。
- `.gitignore` 已排除 Android Studio 自動產生的 `deviceManager.xml`；它只是模擬器清單，不需上傳。

## 10. 建置與驗證結果

2026-07-14 已執行：

```text
npm run build                            PASS
npm run build:mobile                     PASS
npx cap sync ios                         PASS（Windows 無 CocoaPods／Xcode，警告屬預期）
npx cap sync android                     PASS
android gradlew assembleDebug            PASS
```

Android Debug APK：`android/app/build/outputs/apk/debug/app-debug.apk`。它不能直接上 Play Store；正式上架仍需既有 keystore 產生 signed AAB，且 `versionCode` 必須高於 Play Console 現有版本。

Next.js 設定目前跳過 TypeScript 與 lint 驗證。既有 `components/CrispChat.tsx` 與舊副本同名檔案有語法技術債；production build 可通過，但後續仍應清理。

## 11. 上線與真機驗收順序

1. 撤銷對話中暴露的 Gemini key，建立新 key。
2. 在 Zeabur 設定第 6 節所有 server secrets，重新部署後端。
3. 完成 App Store Connect、Google Play、RevenueCat 訂閱商品與 `pro` entitlement。
4. Push GitHub `main` 後，用 Codemagic 建立 iOS release。
5. Android Studio 產生 signed AAB，上傳 Google Play 內部測試。
6. 新舊帳號都重新登入一次，確認 email／Google／Apple。
7. 用至少 6 張真實菜單測試：單欄日文、多欄日文、中文、英文、低光、旋轉照片。
8. 核對分類、菜名、價格、幣別、過敏原；確認有網路走 Gemini，斷網才走離線模式。
9. 測免費第 1、2、3 份菜單；第 3 份應出現訂閱頁。
10. 分別測 iOS／Android 月訂閱、年訂閱、恢復購買、取消後到期與跨裝置登入。

## 12. 尚未完成／風險

- Zeabur secrets 尚未由本機設定；沒有 server key 時 `/api/generate` 會回報服務未設定。
- 商店訂閱商品與 RevenueCat offering 尚需人工建立。
- 本次只能在 Windows 驗證 Web bundle 與 Android；iOS 原生 archive 必須由 Codemagic 驗證。
- Email 登入目前是既有流程，若沒有真正 email challenge／密碼驗證，安全性仍弱於 Google／Apple，後續應改為 Supabase Auth magic link 或 OTP。
- 目前 rate limit 是 instance-local；多 instance 部署時不能當完整防濫用方案。
- Supabase 舊 `is_pro`／`pro_expires_at` 權益仍相容，訂閱狀態另由 RevenueCat 同步。遷移策略需在正式轉訂閱前決定。
- 不要再把 Gemini key 放進 App、Git、Codemagic YAML 或前端環境變數。

## 13. 建議下一位執行者的 P0

1. 先完成 key rotation、Zeabur env 與 RevenueCat 商品設定。
2. 以測試帳號走完整購買和後端 entitlement 驗證。
3. 用使用者先前提供的同一張日文菜單比較 Gemini 新版輸出，確認內容真正對得上照片。
4. 若 Gemini 仍有結構錯誤，保存匿名化 OCR／Gemini JSON fixture，為菜單 schema 與價格保護加入自動測試，不要只靠畫面目測調 prompt。
