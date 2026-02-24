'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Purchases, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { toast } from 'react-hot-toast';

interface PaywallProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onSuccess }) => {
    const [offering, setOffering] = useState<PurchasesOffering | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadOfferings = async () => {
            setLoading(true);
            try {
                // Initialize if not already done (safe to call multiple times)
                const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_KEY;
                if (!apiKey) {
                    throw new Error("RevenueCat API Key is missing");
                }

                // If on web (testing), this will throw a platform not supported error, so we catch it
                try {
                    await Purchases.configure({ apiKey });
                    const offerings = await Purchases.getOfferings();
                    if (offerings.current !== null) {
                        setOffering(offerings.current);
                    }
                } catch (e: any) {
                    console.warn("Purchases initialization/fetch failed:", e);
                    // Mock data for web testing if needed, or just let it be empty
                }

            } catch (err: any) {
                console.error("Failed to load offerings", err);
                toast.error("無法載入方案，請稍後再試。");
            } finally {
                setLoading(false);
            }
        };

        loadOfferings();
    }, [isOpen]);

    const handlePurchase = async (pkg: PurchasesPackage) => {
        setPurchasing(true);
        const toastId = toast.loading('處理付款中...');
        try {
            const result = await Purchases.purchasePackage({ aPackage: pkg });

            // Check if user got the 'pro' entitlement
            if (typeof result.customerInfo.entitlements.active['pro'] !== "undefined") {
                toast.success('付款成功！您已升級為 PRO', { id: toastId });
                // Save to local storage
                localStorage.setItem('is_pro', 'true');
                onSuccess();
            } else {
                toast.error('付款完成，但未能解鎖權限。', { id: toastId });
            }
        } catch (e: any) {
            console.error("Purchase error", e);
            if (!e.userCancelled) {
                toast.error(e.message || '付款失敗，請重試', { id: toastId });
            } else {
                toast.dismiss(toastId);
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        const toastId = toast.loading('恢復購買中...');
        try {
            const { customerInfo } = await Purchases.restorePurchases();
            if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
                toast.success('恢復購買成功！', { id: toastId });
                localStorage.setItem('is_pro', 'true');
                onSuccess();
            } else {
                toast.error('找不到您的購買紀錄。', { id: toastId });
            }
        } catch (e: any) {
            toast.error(e.message || '恢復購買失敗', { id: toastId });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-stone-900/40"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Image Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 rounded-b-[3rem] -z-10"></div>

                        <div className="pt-8 pb-6 px-6 relative z-10 text-center">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                            >
                                <i className="ph ph-x"></i>
                            </button>

                            <div className="w-20 h-20 bg-white rounded-full shadow-lg mx-auto flex items-center justify-center mb-4 mt-2 border-4 border-white/50">
                                <i className="ph-fill ph-crown text-4xl text-orange-500"></i>
                            </div>

                            <h2 className="text-2xl font-bold text-stone-900 mb-2">升級買斷版</h2>
                            <p className="text-stone-600 text-sm px-2">
                                自備 API Key 每日無限次翻譯、解除所有限制，永久更新支援！
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="px-8 pb-6 space-y-3">
                            {[
                                '去除每日 2 次限制，無限翻譯',
                                '解鎖獨立菜單庫收藏與分類',
                                '解鎖所有歷史點餐紀錄',
                                '一次付費，終身不限設備使用'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                        <i className="ph-bold ph-check text-orange-600 text-xs"></i>
                                    </div>
                                    <span className="text-stone-700 text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Pricing Plans */}
                        <div className="px-6 pb-6 space-y-3 max-h-[40vh] overflow-y-auto">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                                </div>
                            ) : offering?.availablePackages.map((pkg) => (
                                <button
                                    key={pkg.identifier}
                                    disabled={purchasing}
                                    onClick={() => handlePurchase(pkg)}
                                    className="w-full relative overflow-hidden group bg-stone-50 border-2 border-stone-100 p-4 rounded-2xl text-left transition-all hover:border-orange-500 active:scale-[0.98]"
                                >
                                    {pkg.identifier === '$rc_lifetime' && (
                                        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                            超值買斷
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-stone-800 text-lg">
                                                {pkg.identifier === '$rc_lifetime' ? '永久買斷' :
                                                    pkg.identifier === '$rc_annual' ? '年訂閱' :
                                                        pkg.identifier === '$rc_monthly' ? '月訂閱' : '方案升級'}
                                            </h3>
                                            <p className="text-stone-500 text-xs">
                                                {pkg.identifier === '$rc_annual' || pkg.identifier === '$rc_monthly' ? '自動續訂' : '一次付費，永久使用'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-orange-600">
                                                {pkg.product.priceString}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer / Restore */}
                        <div className="px-6 pb-6 text-center">
                            <button
                                onClick={handleRestore}
                                disabled={purchasing}
                                className="text-xs text-stone-400 font-medium hover:text-stone-600 underline"
                            >
                                恢復購買 (Restore Purchases)
                            </button>
                            <p className="text-[10px] text-stone-400 mt-4 leading-relaxed">
                                費用將透過您的 Google Play 帳號一次性扣款，無任何自動續訂的隱藏費用。
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
