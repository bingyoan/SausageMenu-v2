import { useState, useEffect } from 'react';

/**
 * 通用平台偵測 Hook
 * 支援 Android、iOS 和 Web 平台偵測
 */
export type Platform = 'android' | 'ios' | 'web';

export const usePlatform = (): { platform: Platform; isNative: boolean } => {
    const [platform, setPlatform] = useState<Platform>('web');
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        // 優先使用 Capacitor 原生檢測
        // @ts-ignore
        const isCapacitorNative = window.Capacitor?.isNativePlatform?.();
        if (isCapacitorNative) {
            setIsNative(true);
            if (/android/i.test(userAgent)) {
                setPlatform('android');
            } else if (/iPad|iPhone|iPod/.test(userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
                setPlatform('ios');
            }
        } else {
            // Web 環境的平台偵測
            if (/android/i.test(userAgent)) {
                setPlatform('android');
            } else if (/iPad|iPhone|iPod/.test(userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
                setPlatform('ios');
            }
        }
    }, []);

    return { platform, isNative };
};

/**
 * @deprecated 請使用 usePlatform() 取代
 * 保留向後相容性
 */
export const useIsAndroid = () => {
    const { platform } = usePlatform();
    return platform === 'android';
};
