package com.sausagemenu.app;

import android.os.Bundle;
import android.os.PowerManager;
import android.content.Context;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    /**
     * WakeLock: 防止 CPU 在 App 進入背景時休眠，
     * 確保 AI 生成請求能在背景繼續完成。
     */
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(GoogleAuth.class);

        // 初始化 WakeLock (PARTIAL_WAKE_LOCK 只保持 CPU 運行，不亮螢幕)
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "SausageMenu::AIGenerationLock"
        );
    }

    /**
     * App 進入背景時：
     * 1. 先讓 Capacitor 執行正常的 onPause 流程
     * 2. 立即恢復 WebView 的計時器和 JS 執行
     * 3. 取得 WakeLock 防止 CPU 休眠
     *
     * 這樣 fetch 請求和 JS 邏輯在背景仍會持續運行，
     * 用戶回來時 AI 生成已經完成。
     */
    @Override
    public void onPause() {
        super.onPause();

        // 關鍵：super.onPause() 會呼叫 webView.pauseTimers()
        // 我們立即恢復它，讓 JS 在背景繼續執行
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.resumeTimers();
            }
        } catch (Exception e) {
            // ignore
        }

        // 取得 WakeLock，最多保持 5 分鐘（足夠 AI 生成完成）
        try {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(5 * 60 * 1000L); // 5 minutes timeout
            }
        } catch (Exception e) {
            // ignore
        }
    }

    @Override
    public void onResume() {
        super.onResume();

        // 釋放 WakeLock（如果還在持有）
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception e) {
            // ignore
        }
    }

    @Override
    public void onDestroy() {
        // 確保 WakeLock 被釋放，避免電池耗盡
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception e) {
            // ignore
        }
        super.onDestroy();
    }
}
