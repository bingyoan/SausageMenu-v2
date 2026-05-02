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
    // iOS 使用 capacitor:// scheme, Android 使用 https://
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },

  // 保持 WebView 在背景運行（防止 AI 生成在切換 App 時卡住）
  // @ts-ignore - Capacitor internal config
  keepRunning: true,

  // Android 特定設定
  android: {
    // 允許混合內容 (HTTP 和 HTTPS)
    allowMixedContent: true,
    // WebView 背景色 (與 App 主題一致)
    backgroundColor: '#FDFBF7',
    // 啟用硬體加速
    webContentsDebuggingEnabled: false, // 發布時設為 false
  },

  // iOS 特定設定
  ios: {
    // WebView 背景色 (與 App 主題一致)
    backgroundColor: '#FDFBF7',
    // 使用 WKWebView 的內容模式
    contentInset: 'automatic',
    // 允許在 WebView 中顯示鍵盤附件欄
    allowsLinkPreview: false,
    // 使用 Apple 的 status bar 覆蓋模式
    webContentsDebuggingEnabled: false, // 發布時設為 false
    // 捲動行為
    scrollEnabled: true,
    // Apple App Store 相關
    preferredContentMode: 'mobile'
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
    },
    // Google 登入設定
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '708202943885-rev2dlrdaivfqavra8rc1q2u79o0vaht.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
      // iOS 需要額外的 clientId (需在 Google Cloud Console 建立 iOS OAuth Client ID)
      iosClientId: '708202943885-tmfdkjpeencn7nqbgqtmnlc7bjp8vajh.apps.googleusercontent.com'
    }
  }
};

export default config;
