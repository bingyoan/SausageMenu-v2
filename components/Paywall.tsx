'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Purchases, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { toast } from 'react-hot-toast';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetLanguage?: string;
  appUserId?: string;
  userEmail?: string;
}

interface PaywallCopy {
  title: string;
  subtitle: string;
  features: string[];
  monthly: string;
  annual: string;
  perMonth: string;
  perYear: string;
  bestValue: string;
  restore: string;
  disclaimer: string;
  loadingError: string;
  retry: string;
}

const COPY: Record<string, PaywallCopy> = {
  '繁體中文': {
    title: '解鎖完整功能',
    subtitle: '訂閱後使用開發者提供的 AI 服務，不需自行申請 API Key。',
    features: ['每月可翻譯 60 頁菜單', '每日最多 20 頁、單次最多 4 頁', '解鎖菜單收藏與完整點餐紀錄', 'iOS 與 Android 共用訂閱權限'],
    monthly: '月訂閱',
    annual: '年訂閱',
    perMonth: '每月自動續訂',
    perYear: '每年自動續訂',
    bestValue: '最划算',
    restore: '恢復購買 (Restore Purchases)',
    disclaimer: '付款將由 App Store 或 Google Play 處理。訂閱會自動續訂，您可隨時在商店帳號中取消。',
    loadingError: '目前無法載入訂閱方案，請稍後再試。',
    retry: '重新載入',
  },
  '繁體中文-HK': {
    title: '解鎖完整功能',
    subtitle: '訂閱後使用開發者提供的 AI 服務，毋須自行申請 API Key。',
    features: ['每月可翻譯 60 頁菜單', '每日最多 20 頁、單次最多 4 頁', '解鎖菜單收藏與完整點餐紀錄', 'iOS 與 Android 共用訂閱權限'],
    monthly: '月訂閱',
    annual: '年訂閱',
    perMonth: '每月自動續訂',
    perYear: '每年自動續訂',
    bestValue: '最划算',
    restore: '恢復購買 (Restore Purchases)',
    disclaimer: '付款將由 App Store 或 Google Play 處理。訂閱會自動續訂，您可隨時在商店帳號中取消。',
    loadingError: '目前無法載入訂閱方案，請稍後再試。',
    retry: '重新載入',
  },
  English: {
    title: 'Unlock Every Feature',
    subtitle: 'Subscribe to use our managed AI service. No personal API key required.',
    features: ['60 menu pages per month', 'Up to 20 pages daily and 4 per upload', 'Menu library and complete order history', 'Subscription access on iOS and Android'],
    monthly: 'Monthly',
    annual: 'Annual',
    perMonth: 'Auto-renews monthly',
    perYear: 'Auto-renews annually',
    bestValue: 'Best Value',
    restore: 'Restore Purchases',
    disclaimer: 'Payment is handled by the App Store or Google Play. Subscriptions renew automatically and can be cancelled in your store account.',
    loadingError: 'Subscription plans are unavailable right now. Please try again.',
    retry: 'Try Again',
  },
};

type PlanKind = 'monthly' | 'annual';
const ENTITLEMENT_ID = process.env.NEXT_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'pro';

function getPlanKind(pkg: PurchasesPackage): PlanKind | null {
  if (pkg.packageType === 'MONTHLY') return 'monthly';
  if (pkg.packageType === 'ANNUAL') return 'annual';

  const searchable = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
  if (/month|monthly|月/.test(searchable)) return 'monthly';
  if (/annual|year|yearly|年/.test(searchable)) return 'annual';
  return null;
}

function formatAnnualOriginalPrice(monthlyPackage: PurchasesPackage | undefined): string | null {
  if (!monthlyPackage) return null;
  const { currencyCode, price } = monthlyPackage.product;
  if (!currencyCode || !Number.isFinite(price)) return null;

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: currencyCode === 'TWD' ? 0 : 2,
    }).format(price * 12);
  } catch {
    return null;
  }
}

async function configureRevenueCat(apiKey: string, appUserId: string, email?: string) {
  try {
    const current = await Purchases.getAppUserID();
    if (current.appUserID !== appUserId) {
      await Purchases.logIn({ appUserID: appUserId });
    }
  } catch {
    await Purchases.configure({ apiKey, appUserID: appUserId });
  }

  if (email) await Purchases.setEmail({ email });
}

export const Paywall: React.FC<PaywallProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetLanguage = 'English',
  appUserId,
  userEmail,
}) => {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const t = COPY[targetLanguage] || COPY.English;

  const loadOfferings = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);
    setLoadError(false);
    setOffering(null);

    try {
      if (!appUserId) throw new Error('Missing RevenueCat App User ID');

      const platform = Capacitor.getPlatform();
      const apiKey = platform === 'ios'
        ? process.env.NEXT_PUBLIC_REVENUECAT_APPLE_KEY
        : platform === 'android'
          ? process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY
          : undefined;

      if (!apiKey) throw new Error(`RevenueCat ${platform} public SDK key is missing`);

      await configureRevenueCat(apiKey, appUserId, userEmail);
      const result = await Purchases.getOfferings();
      if (!result.current || result.current.availablePackages.length === 0) {
        throw new Error('RevenueCat current offering has no packages');
      }
      setOffering(result.current);
    } catch (error) {
      console.error('[Paywall] Failed to load offerings', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [appUserId, isOpen, userEmail]);

  useEffect(() => {
    void loadOfferings();
  }, [loadOfferings]);

  const plans = useMemo(() => {
    if (!offering) return [];
    const byKind = new Map<PlanKind, PurchasesPackage>();
    for (const pkg of offering.availablePackages) {
      const kind = getPlanKind(pkg);
      if (kind && !byKind.has(kind)) byKind.set(kind, pkg);
    }
    return (['monthly', 'annual'] as PlanKind[])
      .map((kind) => ({ kind, pkg: byKind.get(kind) }))
      .filter((plan): plan is { kind: PlanKind; pkg: PurchasesPackage } => Boolean(plan.pkg));
  }, [offering]);

  const monthlyPackage = plans.find((plan) => plan.kind === 'monthly')?.pkg;
  const annualOriginalPrice = formatAnnualOriginalPrice(monthlyPackage);

  const syncServer = async () => {
    if (!appUserId) return false;
    const response = await fetch('/api/revenuecat/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appUserId }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.subscription?.isActive === true;
  };

  const finishPurchase = async (message: string, toastId: string) => {
    const synced = await syncServer().catch(() => false);
    if (!synced) {
      toast.error('Purchase received, but account sync is still pending. Please use Restore Purchases in a moment.', { id: toastId });
      return;
    }
    const savedUser = localStorage.getItem('google_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        user.isPro = true;
        user.subscriptionStatus = 'active';
        localStorage.setItem('google_user', JSON.stringify(user));
      } catch {
        // The server remains the source of truth if the local cache is malformed.
      }
    }
    localStorage.removeItem('is_pro');
    toast.success(message, { id: toastId });
    onSuccess();
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    const toastId = toast.loading('處理付款中...');
    try {
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      if (result.customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        await finishPurchase('付款成功！訂閱權限已啟用。', toastId);
      } else {
        toast.error('付款完成，但商店尚未回傳訂閱權限。請使用恢復購買。', { id: toastId });
      }
    } catch (error: any) {
      if (error?.userCancelled) toast.dismiss(toastId);
      else toast.error(error?.message || '付款失敗，請重試。', { id: toastId });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    const toastId = toast.loading('恢復購買中...');
    try {
      if (!appUserId) throw new Error('請重新登入後再試');
      const { customerInfo } = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        await finishPurchase('恢復購買成功！', toastId);
      } else {
        toast.error('找不到有效的月訂閱或年訂閱。', { id: toastId });
      }
    } catch (error: any) {
      toast.error(error?.message || '恢復購買失敗。', { id: toastId });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl"
            style={{ background: 'var(--bg-tertiary)', boxShadow: 'var(--card-shadow)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative px-6 pb-5 pt-7 text-center">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}
              >
                <i className="ph ph-x" />
              </button>
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'var(--brand-bg)', border: '1px solid var(--glass-border)' }}
              >
                <i className="ph-fill ph-crown text-3xl" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <h2 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.title}</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.subtitle}</p>
            </div>

            <div className="space-y-2 px-7 pb-5">
              {t.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <i className="ph-bold ph-check-circle" style={{ color: 'var(--brand-primary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 px-5 pb-5">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
                </div>
              )}

              {!loading && loadError && (
                <div className="py-4 text-center">
                  <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.loadingError}</p>
                  <button
                    onClick={() => void loadOfferings()}
                    className="rounded-md px-4 py-2 text-sm font-bold text-white"
                    style={{ background: 'var(--brand-primary)' }}
                  >
                    {t.retry}
                  </button>
                </div>
              )}

              {!loading && !loadError && plans.map(({ kind, pkg }) => (
                <button
                  key={pkg.identifier}
                  disabled={purchasing}
                  onClick={() => void handlePurchase(pkg)}
                  className="relative w-full rounded-lg p-4 text-left transition-transform active:scale-[0.98] disabled:opacity-60"
                  style={{ background: 'var(--glass-bg)', border: kind === 'annual' ? '2px solid var(--brand-primary)' : '1px solid var(--glass-border)' }}
                >
                  {kind === 'annual' && (
                    <span
                      className="absolute right-3 top-0 -translate-y-1/2 rounded-full px-2 py-1 text-[10px] font-bold text-white"
                      style={{ background: 'var(--brand-primary)' }}
                    >
                      {t.bestValue}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        {kind === 'monthly' ? t.monthly : t.annual}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {kind === 'monthly' ? t.perMonth : t.perYear}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {kind === 'annual' && annualOriginalPrice && (
                        <div className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                          {annualOriginalPrice}
                        </div>
                      )}
                      <div className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                        {pkg.product.priceString}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 text-center">
              <button
                onClick={() => void handleRestore()}
                disabled={purchasing || loading || loadError}
                className="text-xs font-medium underline disabled:opacity-50"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t.restore}
              </button>
              <p className="mt-3 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t.disclaimer}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
