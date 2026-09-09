<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1_J8bWmFAH1b61BTKspO4TFeoo7FSNWzn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 管理員啟用碼

在部署環境（例如 Zeabur 的服務環境變數）設定 `PRO_ACTIVATION_CODE_HASH`，值為啟用碼去除前後空白並轉成大寫後的 SHA-256；也可以暫時直接設定 `PRO_ACTIVATION_CODE`。使用者在設定頁輸入正確啟用碼後，該帳號會取得 10 天 PRO 權限，每個帳號只能兌換一次。啟用碼不分大小寫，請勿把它提交到 Git。

產生雜湊值的指令：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_CODE'.trim().toUpperCase()).digest('hex'))"
```
