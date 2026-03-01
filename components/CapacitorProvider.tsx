'use client';

import React, { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { toast } from 'react-hot-toast';

// =========================================================
// 📱 Capacitor Context - 管理原生功能狀態
// =========================================================

interface CapacitorContextType {
    isNativeApp: boolean;
    isOnline: boolean;
    platform: 'web' | 'android' | 'ios';
    isAppActive: boolean;
    onAppResume: (callback: () => void) => () => void;
}

const CapacitorContext = createContext<CapacitorContextType>({
    isNativeApp: false,
    isOnline: true,
    platform: 'web',
    isAppActive: true,
    onAppResume: () => () => { },
});

export const useCapacitor = () => useContext(CapacitorContext);

// =========================================================
// 🔄 App 生命週期 Hook — 偵測前/背景切換
// =========================================================
export const useAppLifecycle = (onResume?: () => void) => {
    const { onAppResume } = useCapacitor();
    useEffect(() => {
        if (!onResume) return;
        const unsubscribe = onAppResume(onResume);
        return unsubscribe;
    }, [onResume, onAppResume]);
};

// =========================================================
// 🔙 Android 返回鍵處理 Hook
// =========================================================
const useAndroidBackButton = () => {
    useEffect(() => {
        let lastBackPress = 0;

        const handleBackButton = async () => {
            const currentPath = window.location.pathname;
            const now = Date.now();

            // 如果在首頁
            if (currentPath === '/' || currentPath === '') {
                // 雙擊返回鍵退出 App
                if (now - lastBackPress < 2000) {
                    await CapApp.exitApp();
                } else {
                    lastBackPress = now;
                    toast('再按一次返回鍵退出應用', {
                        icon: '👋',
                        duration: 2000,
                        style: {
                            background: '#333',
                            color: '#fff',
                            borderRadius: '12px',
                        }
                    });
                }
            } else {
                // 不在首頁，執行瀏覽器返回
                window.history.back();
            }
        };

        // 註冊返回鍵監聽
        const listener = CapApp.addListener('backButton', handleBackButton);

        return () => {
            listener.then(l => l.remove());
        };
    }, []);
};

// =========================================================
// 🌐 網路狀態監聽 Hook
// =========================================================
const useNetworkStatus = (setIsOnline: React.Dispatch<React.SetStateAction<boolean>>) => {
    useEffect(() => {
        let isShowingOffline = false;

        const checkNetwork = async () => {
            try {
                const status = await Network.getStatus();
                setIsOnline(status.connected);

                if (!status.connected && !isShowingOffline) {
                    isShowingOffline = true;
                    toast.error('網路連線中斷，請檢查網路設定', {
                        duration: 5000,
                        icon: '📡'
                    });
                } else if (status.connected && isShowingOffline) {
                    isShowingOffline = false;
                    toast.success('網路已恢復連線', {
                        duration: 2000,
                        icon: '✅'
                    });
                }
            } catch (e) {
                // 非原生環境，使用瀏覽器 API
                setIsOnline(navigator.onLine);
            }
        };

        // 初始檢查
        checkNetwork();

        // 監聽網路變化
        const listener = Network.addListener('networkStatusChange', (status) => {
            setIsOnline(status.connected);

            if (!status.connected && !isShowingOffline) {
                isShowingOffline = true;
                toast.error('網路連線中斷，請檢查網路設定', {
                    duration: 5000,
                    icon: '📡'
                });
            } else if (status.connected && isShowingOffline) {
                isShowingOffline = false;
                toast.success('網路已恢復連線', {
                    duration: 2000,
                    icon: '✅'
                });
            }
        });

        // 瀏覽器環境備用監聽
        const handleOnline = () => {
            setIsOnline(true);
            if (isShowingOffline) {
                isShowingOffline = false;
                toast.success('網路已恢復連線', { duration: 2000, icon: '✅' });
            }
        };
        const handleOffline = () => {
            setIsOnline(false);
            if (!isShowingOffline) {
                isShowingOffline = true;
                toast.error('網路連線中斷', { duration: 5000, icon: '📡' });
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            listener.then(l => l.remove());
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [setIsOnline]);
};

// =========================================================
// 🎯 Capacitor Provider Component
// =========================================================
interface CapacitorProviderProps {
    children: React.ReactNode;
}

export const CapacitorProvider: React.FC<CapacitorProviderProps> = ({ children }) => {
    const [isNativeApp, setIsNativeApp] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [platform, setPlatform] = useState<'web' | 'android' | 'ios'>('web');
    const [isAppActive, setIsAppActive] = useState(true);

    // 📌 Resume callback 管理
    const resumeCallbacksRef = useRef<Set<() => void>>(new Set());

    const onAppResume = useCallback((callback: () => void) => {
        resumeCallbacksRef.current.add(callback);
        return () => {
            resumeCallbacksRef.current.delete(callback);
        };
    }, []);

    // 🔄 App 生命週期管理 — 核心修復
    useEffect(() => {
        let wasInBackground = false;

        const handleResume = () => {
            if (wasInBackground) {
                console.log('[Capacitor] App resumed from background, firing callbacks...');
                setIsAppActive(true);
                wasInBackground = false;
                // 觸發所有已註冊的 resume 回調
                resumeCallbacksRef.current.forEach(cb => {
                    try { cb(); } catch (e) { console.error('[Resume callback error]', e); }
                });
            }
        };

        const handlePause = () => {
            console.log('[Capacitor] App went to background');
            wasInBackground = true;
            setIsAppActive(false);
        };

        // 1. Capacitor 原生事件 (最可靠)
        const stateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                handleResume();
            } else {
                handlePause();
            }
        });

        // 2. Web Visibility API (備用，非原生環境或 Capacitor 事件未觸發時)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleResume();
            } else {
                handlePause();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 3. 註冊 Android 原生回調橋接
        (window as any).__onAppResumed = () => {
            console.log('[Capacitor] Native onResume bridge called');
            handleResume();
        };

        return () => {
            stateListener.then(l => l.remove());
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            delete (window as any).__onAppResumed;
        };
    }, []);

    // 檢測是否為原生 App
    useEffect(() => {
        const checkPlatform = async () => {
            try {
                const info = await CapApp.getInfo();
                setIsNativeApp(true);
                // 根據 User Agent 判斷平台
                if (navigator.userAgent.includes('Android')) {
                    setPlatform('android');
                } else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
                    setPlatform('ios');
                }
                console.log('[Capacitor] Running as native app:', info);
            } catch (e) {
                // 非原生環境
                setIsNativeApp(false);
                setPlatform('web');
                console.log('[Capacitor] Running as web app');
            }
        };

        checkPlatform();
    }, []);

    // 啟用原生功能
    useAndroidBackButton();
    useNetworkStatus(setIsOnline);

    const value: CapacitorContextType = {
        isNativeApp,
        isOnline,
        platform,
        isAppActive,
        onAppResume,
    };

    return (
        <CapacitorContext.Provider value={value}>
            {/* 離線狀態橫幅 */}
            {!isOnline && (
                <div className="offline-banner">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                    <span>網路連線中斷 - 請檢查您的網路設定</span>
                </div>
            )}
            {children}
        </CapacitorContext.Provider>
    );
};

export default CapacitorProvider;
