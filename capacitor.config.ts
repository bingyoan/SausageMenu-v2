import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App 基本資訊
  appId: 'com.sausagemenu.app',
  appName: 'SausageMenu',

  // 使用線上伺服器模式 (所有 API 功能正常運作)
  webDir: 'out', // 用於生產版本的靜態檔案

  server: {
    // 開發時使用線上網址，發布時改為 undefined
    url: 'https://sausagemenu-v2.zeabur.app',
    cleartext: true,
    // 允許所有 SSL 憑證 (開發用)
    androidScheme: 'https'
  },

  // Android 特定設定
  android: {
    // 允許混合內容 (HTTP 和 HTTPS)
    allowMixedContent: true,
    // WebView 背景色 (與 App 主題一致)
    backgroundColor: '#FDFBF7',
    // 啟用硬體加速
    webContentsDebuggingEnabled: false, // 發布時設為 false
  },

  // 插件設定
  plugins: {
    // 狀態列設定
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ea580c'
    },
    // 啟動畫面設定
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ea580c',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    // 鍵盤設定
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
