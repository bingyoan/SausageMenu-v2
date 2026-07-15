'use client';

import { useCallback, useEffect, useState } from 'react';

export function useUsageLimit(isPro: boolean, userEmail: string) {
  const [usageCount, setUsageCount] = useState(0);
  const [remainingUses, setRemainingUses] = useState(isPro ? 20 : 3);
  const [dailyLimit, setDailyLimit] = useState(isPro ? 20 : 3);
  const [monthlyRemaining, setMonthlyRemaining] = useState(isPro ? 60 : 3);
  const [monthlyLimit, setMonthlyLimit] = useState(isPro ? 60 : 3);
  const [canUse, setCanUse] = useState(true);

  const refreshUsage = useCallback(async () => {
    if (!userEmail) return;
    try {
      const response = await fetch('/api/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageCount: 1 }),
      });
      if (!response.ok) return;
      const data = await response.json();
      const limit = data.isPro ? 20 : 3;
      const used = data.isPro ? data.dailyUsed : data.lifetimeUsed;
      const remaining = data.isPro ? data.dailyRemaining : data.lifetimeRemaining;
      setUsageCount(Number(used || 0));
      setRemainingUses(Number(remaining || 0));
      setDailyLimit(limit);
      setMonthlyRemaining(Number(data.isPro ? data.monthlyRemaining || 0 : data.lifetimeRemaining || 0));
      setMonthlyLimit(data.isPro ? 60 : 3);
      setCanUse(data.canUse === true);
    } catch (error) {
      console.warn('[useUsageLimit] Server refresh failed', error);
    }
  }, [userEmail]);

  useEffect(() => {
    void refreshUsage();
  }, [refreshUsage, isPro]);

  return {
    usageCount,
    remainingUses,
    canUse,
    isUnlimited: false,
    refreshUsage,
    dailyLimit,
    monthlyRemaining,
    monthlyLimit,
  };
}

export default useUsageLimit;
