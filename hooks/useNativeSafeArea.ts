import { useEffect } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';

/** Older Android WebViews can report a zero CSS inset while the status bar
 * overlays the page. Read the installed native plugin's actual height (dp).
 * CSS takes the larger inset, so newer WebViews never get double padding.
 * This assumes our current overlay layout with native edge-to-edge margins
 * disabled; revisit this fallback if the native WebView gets its own margins. */
export function useNativeSafeArea() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('StatusBar')) return;

    let disposed = false;
    let revision = 0;
    const listeners: PluginListenerHandle[] = [];
    const root = document.documentElement;
    const plugin = import('@capacitor/status-bar');

    const refresh = async () => {
      const request = ++revision;
      try {
        const { StatusBar } = await plugin;
        if (disposed) return;
        const info = await StatusBar.getInfo();
        if (disposed || request !== revision) return;
        const height = info.visible && info.overlays && Number.isFinite(info.height)
          ? Math.max(0, info.height) : 0;
        root.style.setProperty('--native-safe-area-top', `${height}px`);
      } catch {
        // CSS env() remains available if this native build lacks the plugin API.
      }
    };

    const onVisible = () => { if (!document.hidden) void refresh(); };
    void refresh();
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    document.addEventListener('visibilitychange', onVisible);

    void plugin.then(async ({ StatusBar }) => {
      for (const subscribe of [
        () => StatusBar.addListener('statusBarVisibilityChanged', refresh),
        () => StatusBar.addListener('statusBarOverlayChanged', refresh),
      ]) {
        if (disposed) break;
        try {
          const listener = await subscribe();
          if (disposed) await listener.remove();
          else listeners.push(listener);
        } catch { /* Older native versions still refresh on resize/resume. */ }
      }
    }).catch(() => undefined);

    return () => {
      disposed = true;
      window.removeEventListener('resize', refresh);
      window.removeEventListener('orientationchange', refresh);
      document.removeEventListener('visibilitychange', onVisible);
      listeners.forEach(listener => { void listener.remove().catch(() => undefined); });
      root.style.removeProperty('--native-safe-area-top');
    };
  }, []);
}
