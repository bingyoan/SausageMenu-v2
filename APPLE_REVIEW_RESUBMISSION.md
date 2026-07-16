# Apple 重新送審手冊

適用退件：2026-07-16，Submission ID `8e884840-01d3-4738-8f29-f117c61ae31c`。

## 一、已完成的程式修正

### 1. iPad 拍照閃退

- 最終 iOS `Info.plist` 會包含 `NSCameraUsageDescription`、`NSPhotoLibraryUsageDescription`、`NSLocationWhenInUseUsageDescription`。
- Codemagic 會在編譯前檢查上述三項；缺少任一項就停止打包，避免錯誤 IPA 再次送審。
- 相機入口改為一次拍攝一張，移除 iPad 上較不穩定的「多選＋直接相機」組合。
- 相簿仍可一次選擇多張，總數最多四張。

### 2. 商店與 App 內的第三方平台文字

- iOS 付費牆不再提到 Android 或 Google Play。
- App Store 商品描述必須換成專案根目錄的 `APP_STORE_DESCRIPTION_ZH_TW.txt`。

### 3. 自動續訂資訊

- 付費牆顯示月訂閱／年訂閱名稱、續訂週期及 App Store 回傳的實際價格。
- 付費牆新增可點擊的隱私權政策及 Apple 標準 EULA。
- iOS 付款說明只提 App Store 與 Apple ID 訂閱管理。

## 二、重新打包前的必要測試

請使用最新 TestFlight 版本，在實體 iPad 或至少 iPad 模擬器完成：

1. 全新安裝 App，登入帳號。
2. 點「拍照」，允許相機權限，實際拍下一張菜單。
3. 確認照片預覽出現，點開始生成，確認可進入點餐介面。
4. 點「從相簿上傳」，允許相簿權限，分別測試一張與四張。
5. 開啟付費牆，確認月訂閱與年訂閱的名稱、週期和價格均顯示。
6. 點「Privacy Policy」及「Terms of Use (EULA)」，確認兩個連結都能打開。
7. 測試購買、取消付款與恢復購買，不得閃退。

若拍照仍閃退，請從 App Store Connect 的退件訊息下載 Apple 附上的 `.ips` crash log，交給開發端分析，不要直接再次送審。

## 三、App Store Connect 設定

### A. 修改商品描述

1. 進入 App Store Connect → Apps → SausageMenu。
2. 左側選擇 iOS App 的 `1.0` 版本。
3. 在「描述」貼上 `APP_STORE_DESCRIPTION_ZH_TW.txt` 全文。
4. 確認所有語系的描述都沒有 Android、Google Play 或跨平台字樣。
5. 儲存。

### B. 隱私權政策

1. 左側進入「App 資訊」或「App 隱私權」。
2. Privacy Policy URL 填入：
   `https://sausagemenu-v2.zeabur.app/privacy`
3. 用無痕視窗測試網址可公開開啟，不可要求登入。

### C. 使用條款 EULA

本 App 使用 Apple 標準 EULA，不需另上傳自訂合約。請確認 App 描述最後保留：

`使用條款（EULA）：https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`

### D. 完成兩項訂閱資料

進入「營利」→「訂閱」→ SausageMenu PRO 訂閱群組，月訂閱與年訂閱都要完成：

- 月訂閱顯示名稱：`SausageMenu PRO 月訂閱`
- 月訂閱說明：`每月 60 次菜單翻譯，每日最多 20 次`
- 年訂閱顯示名稱：`SausageMenu PRO 年訂閱`
- 年訂閱說明：`每年自動續訂，享有 PRO 菜單翻譯功能`
- 訂閱期限：月訂閱為 1 個月；年訂閱為 1 年
- 訂閱價格：確認已設定且已選擇供應國家／地區

每一項訂閱的「審核資訊」都要上傳 App Review Screenshot。請使用新版 App 的實際付費牆截圖，畫面需清楚顯示月訂閱、年訂閱、週期與價格。同一張完整付費牆截圖可以分別上傳到兩項訂閱。

完成後，訂閱狀態應至少為「準備提交」或可加入審核，不可仍是「缺少元資料」。

### E. 把訂閱和新版 App 一起送審

1. 重新由 Codemagic 打包並上傳新 build；不可沿用被退件的 build 24。
2. 在 `1.0` 版本頁選擇新的 build。
3. 往下找到「App 內購買項目和訂閱項目」。
4. 點「選取 App 內購買項目或訂閱項目」或「編輯」。
5. 勾選月訂閱 `com.sausagemenu.pro.monthly` 與年訂閱 `com.sausagemenu.pro.yearly`，按完成。
6. 確認草稿提交內容同時包含：新版 App、月訂閱、年訂閱。
7. 加入審核，再按「提交以供審核」。只提交 App binary 而未勾選兩項訂閱，仍會再次被 2.1(b) 退件。

## 四、要錄製的審核影片

建議錄製一段連續影片：

1. 啟動 App 並登入。
2. 點拍照，完成權限授權、拍照、照片預覽及生成點餐介面。
3. 回首頁開啟付費牆，展示月／年方案、週期及價格。
4. 分別點開 Privacy Policy 與 Terms of Use (EULA)。
5. 回到付費牆點恢復購買，顯示功能可以正常操作。

將影片附在 App Review 對話回覆；若介面不接受影片，請上傳到可直接觀看、不需登入的雲端連結，並把連結同時貼在 App Review Information 的 Notes。

## 五、App Review Information 的 Notes

完成實機測試後，貼上以下英文內容；方括號請換成真實資料：

```text
Hello App Review,

This build addresses all issues reported for submission 8e884840-01d3-4738-8f29-f117c61ae31c.

1. Camera crash: The final iOS Info.plist now includes camera and photo-library usage descriptions. The camera flow captures one photo at a time. We tested camera capture, photo-library selection, image preview, and menu generation on [DEVICE AND OS VERSION].
2. Metadata: All Android and Google Play references were removed from the iOS App Store description and the iOS paywall.
3. Auto-renewable subscriptions: The in-app paywall displays the subscription title, monthly or annual duration, localized App Store price, and auto-renewal information. Functional Privacy Policy and Apple Standard EULA links are included in the paywall and metadata.
4. In-App Purchases: The monthly and annual subscription products are included in this submission with their App Review screenshots and metadata.

Privacy Policy: https://sausagemenu-v2.zeabur.app/privacy
Terms of Use (Apple Standard EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

Review steps:
1. Sign in using [REVIEW ACCOUNT OR SIGN IN WITH APPLE].
2. Tap the camera button, allow camera access, and take a menu photo.
3. Confirm the preview and start menu generation.
4. Tap Upgrade PRO to view the monthly and annual subscriptions.

Screen recording: [PUBLIC VIDEO LINK OR "ATTACHED TO THE REVIEW MESSAGE"]
```

## 六、回覆 Apple 的訊息

```text
Hello App Review,

Thank you for the detailed feedback. We have uploaded a new build that fixes the iPad camera crash by adding the required camera and photo-library permission descriptions and using a single-photo camera capture flow.

We also removed Android references from the App Store description, added functional Privacy Policy and Apple Standard EULA links, completed the auto-renewable subscription disclosures, and included both subscription products with App Review screenshots in this submission.

A screen recording showing camera capture, menu generation, the subscription paywall, and both legal links is [attached / available here: VIDEO URL].

Thank you for reviewing the updated submission.
```

## 七、送出前最後確認

- [ ] 新 build，不是 build 24
- [ ] iPad 拍照與相簿實測完成
- [ ] App 描述沒有 Android／Google Play
- [ ] App 描述包含 Apple 標準 EULA 網址
- [ ] Privacy Policy URL 可公開開啟
- [ ] 月、年訂閱都不是「缺少元資料」
- [ ] 月、年訂閱各有 App Review Screenshot
- [ ] 新版 App 與兩項訂閱位於同一個審核提交
- [ ] Notes 已貼上測試步驟與影片連結
