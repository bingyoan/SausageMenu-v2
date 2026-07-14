'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, Loader2, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { PACKAGE_TYPE, Purchases, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { toast } from 'react-hot-toast';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetLanguage?: string;
  userEmail: string;
  appUserID?: string;
  sessionToken?: string;
}

// RevenueCat public SDK keys are app identifiers and are embedded in store builds.
const REVENUECAT_APPLE_PUBLIC_KEY = 'appl_bSuHlpOQIukAuqdKPlIxBcqqVXC';

const subscriptionPackageTypes = new Set<PACKAGE_TYPE>([
  PACKAGE_TYPE.WEEKLY,
  PACKAGE_TYPE.MONTHLY,
  PACKAGE_TYPE.TWO_MONTH,
  PACKAGE_TYPE.THREE_MONTH,
  PACKAGE_TYPE.SIX_MONTH,
  PACKAGE_TYPE.ANNUAL,
  PACKAGE_TYPE.CUSTOM,
]);

export const Paywall: React.FC<PaywallProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetLanguage = 'English',
  userEmail,
  appUserID,
  sessionToken,
}) => {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const isChinese = targetLanguage === '繁體中文' || targetLanguage === '繁體中文-HK';

  const copy = isChinese ? {
    title: '升級 SausageMenu Pro',
    subtitle: '訂閱已包含 AI 翻譯服務，不需要自行申請 API Key。',
    features: ['大幅提高每日翻譯額度', 'Gemini 菜單理解與翻譯', '解鎖菜單庫與完整點餐紀錄', '可隨時在商店管理或取消訂閱'],
    restore: '恢復訂閱',
    unavailable: '目前沒有可用的訂閱方案，請確認商店與 RevenueCat 設定。',
    processing: '處理付款中...',
    success: '訂閱成功，SausageMenu Pro 已啟用。',
    failed: '付款失敗，請稍後再試。',
    restored: '訂閱已恢復。',
    notFound: '找不到有效訂閱。',
    disclaimer: '訂閱採合理使用額度，並由 App Store 或 Google Play 自動續訂，除非您在目前訂閱期結束前取消。實際價格與週期以商店顯示為準。',
  } : {
    title: 'Upgrade to SausageMenu Pro',
    subtitle: 'AI translation is included. No personal API key is required.',
    features: ['Much higher daily translation allowance', 'Gemini menu understanding and translation', 'Menu Library and full order history', 'Manage or cancel anytime in the store'],
    restore: 'Restore Subscription',
    unavailable: 'No subscription plans are available. Check the store and RevenueCat configuration.',
    processing: 'Processing purchase...',
    success: 'Subscription active. Welcome to SausageMenu Pro.',
    failed: 'Purchase failed. Please try again.',
    restored: 'Subscription restored.',
    notFound: 'No active subscription was found.',
    disclaimer: 'Fair-use limits apply. Subscriptions renew automatically through the App Store or Google Play unless canceled before the current period ends. Store pricing and billing period apply.',
  };

  const packages = useMemo(() => offering?.availablePackages.filter(pkg =>
    subscriptionPackageTypes.has(pkg.packageType) &&
    pkg.packageType !== PACKAGE_TYPE.LIFETIME &&
    pkg.identifier !== '$rc_lifetime' &&
    Boolean(pkg.product.subscriptionPeriod)
  ) || [], [offering]);

  const packageName = (pkg: PurchasesPackage) => {
    const zhNames: Partial<Record<PACKAGE_TYPE, string>> = {
      [PACKAGE_TYPE.WEEKLY]: '每週方案',
      [PACKAGE_TYPE.MONTHLY]: '每月方案',
      [PACKAGE_TYPE.TWO_MONTH]: '雙月方案',
      [PACKAGE_TYPE.THREE_MONTH]: '每季方案',
      [PACKAGE_TYPE.SIX_MONTH]: '半年方案',
      [PACKAGE_TYPE.ANNUAL]: '年度方案',
    };
    const enNames: Partial<Record<PACKAGE_TYPE, string>> = {
      [PACKAGE_TYPE.WEEKLY]: 'Weekly',
      [PACKAGE_TYPE.MONTHLY]: 'Monthly',
      [PACKAGE_TYPE.TWO_MONTH]: 'Every 2 months',
      [PACKAGE_TYPE.THREE_MONTH]: 'Quarterly',
      [PACKAGE_TYPE.SIX_MONTH]: 'Every 6 months',
      [PACKAGE_TYPE.ANNUAL]: 'Annual',
    };
    return (isChinese ? zhNames : enNames)[pkg.packageType] || pkg.product.title || pkg.identifier;
  };

  const syncSubscription = async () => {
    if (!appUserID || !userEmail || !sessionToken) throw new Error('Please sign in again.');
    const response = await fetch('/api/subscription/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-token': sessionToken },
      body: JSON.stringify({ email: userEmail, appUserID }),
    });
    const data = await response.json();
    if (!response.ok || !data.active) throw new Error(data.error || 'Subscription verification failed.');
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadOfferings = async () => {
      setLoading(true);
      try {
        const publicKey = Capacitor.getPlatform() === 'ios'
          ? (process.env.NEXT_PUBLIC_REVENUECAT_APPLE_KEY || process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY || REVENUECAT_APPLE_PUBLIC_KEY)
          : process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY;
        if (!publicKey || !appUserID) throw new Error('Subscription service is not configured.');

        const configured = await Purchases.isConfigured();
        if (!configured.isConfigured) await Purchases.configure({ apiKey: publicKey, appUserID });
        else await Purchases.logIn({ appUserID });

        const result = await Purchases.getOfferings();
        if (!cancelled) setOffering(result.current);
      } catch (error) {
        console.error('[Paywall] Failed to load offerings', error);
        if (!cancelled) setOffering(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOfferings();
    return () => { cancelled = true; };
  }, [isOpen, appUserID]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    const toastId = toast.loading(copy.processing);
    try {
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      if (!result.customerInfo.entitlements.active.pro) throw new Error('The pro entitlement is not active.');
      await syncSubscription();
      localStorage.setItem('is_pro', 'true');
      toast.success(copy.success, { id: toastId });
      onSuccess();
    } catch (error: any) {
      if (error?.userCancelled) toast.dismiss(toastId);
      else toast.error(error?.message || copy.failed, { id: toastId });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    const toastId = toast.loading(copy.processing);
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      if (!customerInfo.entitlements.active.pro) throw new Error(copy.notFound);
      await syncSubscription();
      localStorage.setItem('is_pro', 'true');
      toast.success(copy.restored, { id: toastId });
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || copy.notFound, { id: toastId });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.section
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            className="relative w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-neutral-950 text-white shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <button type="button" onClick={onClose} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-white/10" aria-label="Close">
              <X size={18} />
            </button>

            <header className="border-b border-white/10 px-6 pb-5 pt-7 text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-orange-500/15 text-orange-400">
                <Crown size={28} />
              </div>
              <h2 className="text-xl font-bold">{copy.title}</h2>
              <p className="mt-2 text-sm leading-5 text-neutral-400">{copy.subtitle}</p>
            </header>

            <div className="max-h-[62vh] overflow-y-auto px-6 py-5">
              <div className="mb-5 space-y-2.5">
                {copy.features.map(feature => (
                  <div key={feature} className="flex items-start gap-2.5 text-sm text-neutral-200">
                    <Check size={17} className="mt-0.5 shrink-0 text-orange-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-orange-400" /></div>
                ) : packages.length === 0 ? (
                  <p className="py-6 text-center text-sm text-neutral-400">{copy.unavailable}</p>
                ) : packages.map(pkg => (
                  <button
                    type="button"
                    key={pkg.identifier}
                    disabled={purchasing}
                    onClick={() => handlePurchase(pkg)}
                    className="flex min-h-16 w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-orange-500/60 disabled:opacity-50"
                  >
                    <span>
                      <strong className="block text-sm">{packageName(pkg)}</strong>
                      <span className="text-xs text-neutral-500">{pkg.product.subscriptionPeriod || ''}</span>
                    </span>
                    <strong className="text-base text-orange-400">{pkg.product.priceString}</strong>
                  </button>
                ))}
              </div>

              <button type="button" onClick={handleRestore} disabled={purchasing} className="mt-5 w-full py-2 text-xs font-semibold text-neutral-400 underline">
                {copy.restore}
              </button>
              <p className="mt-3 text-center text-[10px] leading-4 text-neutral-500">{copy.disclaimer}</p>
              <div className="mt-3 flex justify-center gap-4 text-[10px] text-neutral-400 underline">
                <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>
                <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noreferrer">Terms of Use</a>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Paywall;
