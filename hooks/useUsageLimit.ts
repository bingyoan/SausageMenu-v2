'use client';

import { useState, useEffect, useCallback } from 'react';

// =========================================================
// 📊 每日使用次數限制 Hook
// =========================================================

const FREE_DAILY_LIMIT = 2; // 免費用戶每日限制次數
const STORAGE_KEY = 'smp_usage_data';

interface UsageData {
    date: string;      // YYYY-MM-DD 格式
    count: number;     // 今日已使用次數
}

interface UseUsageLimitReturn {
    usageCount: number;         // 今日已使用次數
    remainingUses: number;      // 剩餘可用次數
    canUse: boolean;            // 是否還可以使用
    isUnlimited: boolean;       // 是否為無限次數 (PRO 用戶)
    incrementUsage: () => void; // 增加使用次數
    resetUsage: () => void;     // 重置使用次數 (測試用)
    dailyLimit: number;         // 每日限制
}

/**
 * 每日使用次數限制 Hook
 * @param isPro - 是否為 PRO 訂閱用戶
 */
export function useUsageLimit(isPro: boolean): UseUsageLimitReturn {
    const [usageCount, setUsageCount] = useState(0);

    // 取得今天的日期字串 (YYYY-MM-DD)
    const getTodayString = useCallback(() => {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }, []);

    // 從 localStorage 讀取使用數據
    const loadUsageData = useCallback((): UsageData => {
        if (typeof window === 'undefined') {
            return { date: getTodayString(), count: 0 };
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data: UsageData = JSON.parse(stored);
                // 如果是今天的數據，返回；否則重置
                if (data.date === getTodayString()) {
                    return data;
                }
            }
        } catch (e) {
            console.error('[useUsageLimit] Failed to load usage data:', e);
        }

        // 新的一天或沒有數據，返回初始值
        return { date: getTodayString(), count: 0 };
    }, [getTodayString]);

    // 儲存使用數據到 localStorage
    const saveUsageData = useCallback((data: UsageData) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[useUsageLimit] Failed to save usage data:', e);
        }
    }, []);

    // 初始化：讀取使用數據
    useEffect(() => {
        const data = loadUsageData();
        setUsageCount(data.count);
    }, [loadUsageData]);

    // 增加使用次數
    const incrementUsage = useCallback(() => {
        if (isPro) return; // PRO 用戶不計數

        const today = getTodayString();
        const newCount = usageCount + 1;

        setUsageCount(newCount);
        saveUsageData({ date: today, count: newCount });

        console.log(`[useUsageLimit] Usage incremented: ${newCount}/${FREE_DAILY_LIMIT}`);
    }, [isPro, usageCount, getTodayString, saveUsageData]);

    // 重置使用次數 (測試用)
    const resetUsage = useCallback(() => {
        setUsageCount(0);
        saveUsageData({ date: getTodayString(), count: 0 });
        console.log('[useUsageLimit] Usage reset');
    }, [getTodayString, saveUsageData]);

    // 計算剩餘次數
    const remainingUses = isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - usageCount);
    const canUse = isPro || usageCount < FREE_DAILY_LIMIT;

    return {
        usageCount,
        remainingUses,
        canUse,
        isUnlimited: isPro,
        incrementUsage,
        resetUsage,
        dailyLimit: FREE_DAILY_LIMIT
    };
}

export default useUsageLimit;
