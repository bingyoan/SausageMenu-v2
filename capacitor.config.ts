import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App 基本資訊
  appId: 'com.sausagemenu.app',
  appName: 'SausageMenu',

  // 使用線上伺服器模式 (所有 API 功能正常運作)
  webDir: 'out',

  // 正式 IPA 使用 App 內的靜態畫面，才能在沒有網路時啟動。
  // 開發時如需直接載入 Zeabur，可設定 CAPACITOR_REMOTE_SERVER=true。
  server: process.env.CAPACITOR_REMOTE_SERVER === 'true' ? {
    url: 'https://sausagemenu-v2.zeabur.app',
    cleartext: true,
    androidScheme: 'https'
  } : undefined,

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
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
