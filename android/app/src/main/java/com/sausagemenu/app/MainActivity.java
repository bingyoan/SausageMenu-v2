package com.sausagemenu.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(GoogleAuth.class);
    }

    /**
     * 防止 App 進入背景時 WebView 被暫停，
     * 確保 AI 生成請求能在背景繼續完成。
     */
    @Override
    public void onPause() {
        // 不呼叫 super.onPause() 中的 WebView 暫停邏輯
        // 先取得 Bridge 中的 WebView
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // 確保計時器和網路請求在背景繼續運行
                webView.getSettings().setJavaScriptEnabled(true);
            }
        } catch (Exception e) {
            // ignore
        }
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        // 回到前景後，通知 WebView 中的 JS 恢復狀態
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.evaluateJavascript(
                    "if(window.__onAppResumed) window.__onAppResumed();",
                    null
                );
            }
        } catch (Exception e) {
            // ignore
        }
    }
}
