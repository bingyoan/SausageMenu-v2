# SausageMenu v2 完整專案交接

> 更新時間：2026-07-14（Asia/Taipei）
> GitHub：`https://github.com/bingyoan/SausageMenu-v2.git`
> 分支：`main`
> 本次功能基準提交：`94ec51c`（`fix: improve offline menu recognition recovery`）
> 上一個穩定化提交：`abc687e`（登入、GPS 阻塞、Android OfflineMenu 外掛）

## 1. 給下一位執行者的最重要資訊

1. 真正由 Git、Codemagic 與目前建置流程使用的專案根目錄，就是含有 `.git`、`package.json`、`App.tsx`、`ios/`、`android/`、`codemagic.yaml` 的最外層目錄。
2. 根目錄內另有 `SausageMenu-v2-main/` 舊副本。它有約 202 個被 Git 追蹤的舊檔案，但不是目前 Codemagic 執行 `npm install`、`npm run build:mobile` 的主要程式來源。除非先完成差異盤點，請不要只修改內層副本。
3. 使用者目前最在意的是「不需要使用者提供 AI API Key」的手機端菜單翻譯。原生 App 現在走裝置端 OCR + 裝置端翻譯模型；Web 版仍保留雲端路徑。
4. `94ec51c` 已修正一批嚴重 OCR 結構化問題，但尚未在真實 iPhone／TestFlight 上用多張菜單完成驗收。Windows 只能驗證 Web bundle 與 Android，iOS 原生編譯必須交給 Codemagic。
5. 不要提交任何 `.p8`、keystore 密碼、API secret 或本機環境檔。OAuth Client ID 不是 secret，但其他憑證仍不可寫入文件或 commit。

## 2. 產品與使用流程

SausageMenu 是旅行用菜單翻譯與點餐 App。主要流程：

1. 使用 Email 或 Apple／Google 帳號通過登入閘門。
2. 選擇介面／目標語言。
3. 拍攝或上傳 1 至 8 張菜單圖片。
4. App 壓縮圖片，手機原生端執行 OCR、語言辨識及翻譯。
5. JavaScript 端把 OCR 文字框整理成分類、菜名、價格、過敏原與飲食標籤。
6. 顯示點餐介面，使用者可加減品項、查看說明、建立點餐摘要、儲存菜單。

手機端目標是：第一次使用某語言時可能需要網路下載 ML Kit 翻譯語言包；下載後可以離線 OCR／翻譯。這不是單純文字詞庫，而是專用 OCR + 手機端翻譯模型 + 菜名／過敏原知識庫。

## 3. 主要技術架構

| 區域 | 技術 |
|---|---|
| UI | Next.js 14、React 18、TypeScript、TailwindCSS、Framer Motion |
| 手機容器 | Capacitor 6 |
| iOS OCR | Apple Vision `VNRecognizeTextRequest` |
| iOS 翻譯 | Google ML Kit Translate（CocoaPods） |
| Android OCR | Google ML Kit Text Recognition（Latin／中文／日文／韓文／Devanagari） |
| Android 翻譯 | Google ML Kit Language ID + Translate |
| 登入 | Email、Apple Sign In、Google Auth Capacitor plugin |
| 訂閱 | RevenueCat Capacitor 9.2.2 |
| 後端資料 | Supabase |
| Web 雲端 AI | `@google/genai`，只作非原生 Web fallback |
| iOS CI/CD | Codemagic，設定在 `codemagic.yaml` |

Capacitor app id／iOS Bundle ID／Android applicationId 均為：

```text
com.sausagemenu.app
```

App Store Connect App ID：

```text
6760179953
```

## 4. 重要檔案

| 檔案 | 功能 |
|---|---|
| `App.tsx` | App 主狀態、登入後流程、圖片壓縮、OCR 路徑選擇、菜單頁切換 |
| `services/offlineMenuService.ts` | 註冊 `OfflineMenu`、OCR 列結構化、價格／分類配對、幣別與匯率、知識庫整合 |
| `services/menuKnowledgeBase.ts` | 菜名、食材、過敏原與飲食標籤的規則／詞庫 |
| `components/GoogleAuthGate.tsx` | Email、Google、Apple 登入閘門 |
| `components/OrderingPage.tsx` | 菜單點餐 UI |
| `components/AppErrorBoundary.tsx` | 避免 React render error 只留下黑畫面，提供返回首頁復原按鈕 |
| `ios/App/App/OfflineMenuPlugin.swift` | iOS Vision OCR、語言辨識、ML Kit 翻譯、價格保護 |
| `ios/App/App/BridgeViewController.swift` | 註冊 iOS `OfflineMenu` plugin |
| `android/app/src/main/java/com/sausagemenu/app/OfflineMenuPlugin.java` | Android ML Kit OCR／語言辨識／翻譯 |
| `android/app/src/main/java/com/sausagemenu/app/MainActivity.java` | 在 `super.onCreate` 前註冊 Android plugin |
| `capacitor.config.ts` | Capacitor app id、靜態 bundle、Google OAuth 設定 |
| `codemagic.yaml` | iOS build、簽章、TestFlight／App Store 上傳流程 |
| `scripts/build-mobile.mjs` | 產生 App 內使用的 Next.js 靜態 bundle |

## 5. 手機端離線處理流程

`App.tsx -> handleImagesSelected()`：

1. 原生 iOS／Android 由 `isOfflineMenuAvailable()` 判定走裝置端流程。
2. 圖片透過 canvas 壓到最長邊 1800px、JPEG quality 0.65。
3. 每頁呼叫 `parseMenuOffline()`。
4. 原生 `OfflineMenu.processMenu()` 回傳每個文字框：原文、可翻譯文字、保護價格、信心值、標準化座標、頁碼。
5. `structureMenu()` 將文字框轉成 `MenuData.items`。
6. 第一頁完成後即可先顯示點餐介面，多頁繼續累加。

iOS 首次翻譯語言包下載由 ML Kit 處理。Android 亦相同。使用者不需輸入 Gemini 或其他 AI Key。

## 6. 2026-07-14 嚴重問題與本次修正

### 使用者回報

安裝上一版 iOS 後：

- 一張日文多欄菜單被錯誤轉成無關內容。
- iPad／照片 App 狀態列的時間、日期、電量被當成菜品。
- 菜單標題、營業時間被當成菜品。
- 價格大量變成 `0 TWD`。
- 其他多張菜單完成處理後只顯示全黑畫面。

### 根因

舊 JS 結構器只依 y 座標合併 OCR 行。多欄菜單中，同一高度的左欄菜名、右欄菜名及價格會被錯誤拼成同一品項；狀態列和營業資訊也沒有被排除。當結構化結果為空或 React render 發生錯誤時，缺少可靠復原畫面。

### `94ec51c` 已做的修正

- iOS Vision OCR 尊重 `UIImage.imageOrientation`／EXIF 方向。
- 過濾低信心、純符號、頂端時間／日期／電量、營業時間、電話、網址、稅與一般 `MENU` 標題。
- OCR 行必須同時符合垂直接近與水平間距接近才可合併，避免跨欄拼接。
- 獨立價格文字框依頁碼、y 距離及右側位置配到最近菜名。
- 支援 `¥`、`￥`、`円`、`元`、`圓`、`RM`、`Rp` 等更多價格／幣別形式。
- 多欄分類改用「分類錨點」；菜品依欄位位置與上方最近標題分類，不再只有一個全域目前分類。
- 沒有辨識到價格時顯示 `Price not detected`，不再冒充 `0 TWD`。
- 處理失敗時清除半成品狀態並回首頁。
- 新增全 App Error Boundary；render error 時顯示中文錯誤與返回首頁按鈕，不再只剩黑畫面。
- `.gitignore` 排除 Android Studio 自動產生的 `**/.idea/deviceManager.xml`。

### 尚未證明的部分

這些修正已通過 production bundle 與 Android 編譯，但 iOS 真機 OCR 品質仍需用 TestFlight 驗收。若同一張截圖仍有誤，下一步應先把原生 OCR 回傳的 JSON 寫入可匯出的 debug log，再用固定測試圖片建立結構化測試，不要繼續只調畫面。

## 7. 登入與 GPS 修正歷史

提交 `abc687e` 已完成：

- 恢復 iOS Google OAuth Client ID：
  `708202943885-tmfdkjpeencn7nqbgqtmnlc7bjp8vajh.apps.googleusercontent.com`
- iOS URL scheme：
  `com.googleusercontent.apps.708202943885-tmfdkjpeencn7nqbgqtmnlc7bjp8vajh`
- Web／server Client ID：
  `708202943885-rev2dlrdaivfqavra8rc1q2u79o0vaht.apps.googleusercontent.com`
- 產生菜單不再等待 GPS。位置只作地圖／歷史的可選資料，不可阻塞 OCR。
- Android `OfflineMenuPlugin` 改在 `MainActivity.super.onCreate()` 前註冊，修正：
  `"OfflineMenu" plugin is not implemented on android`。

登入閘門目前應保留，不要再次移除。使用者要求正式 App 必須有 Email 登入與 Apple 登入；Google 登入也應維持。

## 8. iOS 與 Codemagic

`codemagic.yaml` workflow：`ios-release`／畫面名稱 `iOS Release Build`。

主要步驟：

1. Node 18.20.4 `npm install`
2. `npm run build:mobile`
3. `npx cap sync ios`
4. patch Podfile 以配合新版 Xcode Swift concurrency
5. `pod install`
6. 建立／取得簽章檔
7. 自動增加 TestFlight build number
8. Build IPA
9. 上傳 App Store Connect，送 TestFlight 與 App Store（手動發佈）

先前已解決：

- CocoaPods `GTMSessionFetcher/Core` 版本衝突。
- Apple agreement 未簽署造成 App Store Connect 403。
- RevenueCat 在 Xcode 26 出現 `SubscriptionPeriod is ambiguous`。
- Swift 的 `TranslateLanguage.fromLanguageTag` API 不存在。
- Codemagic 簽章私鑰取得流程。

曾成功建立並上傳 `App.ipa`。Codemagic 顯示 `finished with post-processing failed` 的一次原因不是 IPA 失敗，而是 TestFlight 外部測試資料未填：

- Beta App Information：Feedback Email
- Beta App Review Information：First Name、Last Name、Phone Number、Email

這些需在 App Store Connect 的 TestFlight Test Information 補齊。

### 下一次 iOS 驗收步驟

1. 確認 GitHub `main` 已含 `94ec51c` 及本交接文件提交。
2. Codemagic 手動 Start new build，選 `main`、`iOS Release Build`。
3. 等狀態完整 finished；確認 IPA 與 App Store Connect upload 成功。
4. 在 TestFlight 安裝最新 build，不可拿舊 build 測。
5. 先測登入，再測至少 6 張菜單：單欄日文、多欄日文、中文、英文、低光、旋轉照片。
6. 每張核對：分類、菜名、價格、幣別、是否誤抓狀態列、失敗時是否可回首頁。

## 9. Android 狀態與上架

- `android/app/build.gradle`：`versionCode 26`、`versionName 1.1.5`。
- Android Debug APK 已在 Windows 成功編譯。
- Debug APK 路徑：`android/app/build/outputs/apk/debug/app-debug.apk`。
- 正式 Play Store 需要 signed `.aab`，Debug APK 不能上架。
- keystore 檔案曾存在本機，但密碼未保存在專案／對話中。不要猜密碼，也不要建立新 key 覆蓋舊 app signing identity。
- 取得正確 signing 設定後，Android Studio 使用 `Build > Generate Signed Bundle / APK > Android App Bundle`。
- 上傳新 AAB 前，`versionCode` 必須高於 Google Play 已存在版本。

建置驗證命令（Windows PowerShell）：

```powershell
npm install
npm run build:mobile
npx cap sync android
$env:ANDROID_HOME='C:\Users\GP\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
.\android\gradlew.bat -p android assembleDebug
```

2026-07-14 驗證結果：`BUILD SUCCESSFUL`。

## 10. Web 版與另一個 GitHub Repo

- 手機 App repo：`https://github.com/bingyoan/SausageMenu-v2.git`
- 菜單翻譯 Web repo：`https://github.com/bingyoan/SausageMenu.git`
- 正式 Web 位址曾使用：`https://sausagemenu-v2.zeabur.app`

目前 Capacitor 正式設定使用 `webDir: 'out'`，App 內載入靜態 bundle，因此可在沒有網路時啟動。只有設定 `CAPACITOR_REMOTE_SERVER=true` 才會直接載入 Zeabur，正式商店版不應開啟此值。

## 11. 建置與檢查結果

本次已執行：

```text
npm run build:mobile                       PASS
npx cap sync ios                           PASS（Windows 無 CocoaPods/Xcode，屬預期警告）
npx cap sync android                       PASS
android gradlew assembleDebug              PASS
git diff --check                           PASS
```

`npx tsc --noEmit` 目前不是乾淨的，既有錯誤位於：

- `components/CrispChat.tsx`
- `SausageMenu-v2-main/components/CrispChat.tsx`

錯誤包含 TS1443、TS1005、TS1109、TS1128。Next.js 設定目前跳過 TypeScript／lint 驗證，所以 production mobile build 仍成功。這是技術債，後續應修，但不要在沒有確認 Crisp 使用方式前直接刪除。

Windows sandbox 執行 `tsc` 時另可能因無法寫入 `tsconfig.tsbuildinfo` 出現 EPERM，這不是產品程式錯誤。

## 12. 下一位執行者的優先順序

### P0：真機驗收 `94ec51c`

- 先 Codemagic 打最新 iOS build。
- 重現使用者提供的日文多欄菜單。
- 確認狀態列、營業時間不再成為菜品。
- 確認右側 `¥1,300` 能配到同列菜名。
- 確認任一錯誤不會再出現純黑畫面。

### P0：若辨識仍錯，先增加可觀測性

- 保存每頁原生 OCR line JSON：`originalText`、`contentText`、`protectedPrice`、`confidence`、`x/y/width/height`。
- 提供使用者可匯出的 debug 檔，不要包含圖片本身或個資，除非明確同意。
- 將使用者的測試菜單匿名化後建立 fixture，為 `buildStructuredRows()`／`structureMenu()` 加自動測試。

### P1：Android 正式 AAB

- 確認 Google Play 目前最高 `versionCode`。
- 取得既有 keystore 的正確 alias 與密碼。
- 產生 signed AAB，在內部測試軌驗證 Google 登入、OfflineMenu、RevenueCat。

### P1：翻譯品質

- 目前 iOS/Android 主翻譯由 ML Kit 完成，不是小 LLM。
- 菜名／過敏原詞庫只能做補強，不可憑空補食材。
- 價格、數字、否定詞必須保持，不允許語言模型改寫。
- 若未來加入小 LLM，僅用於有限後處理與說明，不可取代 OCR 或直接自由生成整張菜單。

### P2：程式庫整理

- 釐清並移除或封存根目錄內的 `SausageMenu-v2-main/` 舊副本，避免雙份程式持續漂移。
- 修復兩份 `CrispChat.tsx` 的語法／編碼問題。
- 補上 OCR 結構化測試與登入 smoke test。
- 升級 Android Gradle Plugin 前先建立可回歸的 release build；目前 compileSdk 35 只有相容性警告，並未阻擋建置。

## 13. Git 操作注意事項

- 工作分支：`main`。
- 推送前必做：`git status --short`、`git diff --check`、`npm run build:mobile`。
- 不要提交 `.env`、`.env.local`、`.p8`、keystore 密碼、Codemagic secret。
- 不要把 Android Studio 的 `deviceManager.xml` 加入 Git；它只是本機 Device Manager 排序／介面狀態，與 App 功能無關，現已由 `.gitignore` 排除。
- 不要重置使用者未提交的變更；先確認來源。

## 14. 完成交接的判定

只有同時符合以下條件，才能稱本次嚴重問題真正完成：

1. 最新 iOS TestFlight build 能正常登入。
2. 使用者原本失敗的多欄菜單能產生合理分類、菜名與價格。
3. 至少五種不同版型不會出現全黑畫面。
4. 辨識失敗會顯示可理解錯誤並能返回首頁。
5. Android 內部測試 build 不再出現 OfflineMenu plugin 未實作。
6. iOS 與 Android 都不要求使用者輸入 AI API Key。

在真機測試完成前，請描述為「已修正並通過建置，等待真機驗收」，不要聲稱 OCR 問題已百分之百解決。
