'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Purchases, PurchasesOffering, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { toast } from 'react-hot-toast';

interface PaywallProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetLanguage?: string;
}

const TRANSLATIONS: Record<string, any> = {
    '繁體中文': {
        title: '升級買斷版',
        subtitle: '自備 API Key 每日無限次翻譯、解除所有限制，永久更新支援！',
        features: ['去除每日限制，無限翻譯', '解鎖獨立菜單庫收藏與分類', '解鎖所有歷史點餐紀錄', '一次付費，終身不限設備使用'],
        bestValue: '超值買斷',
        lifetime: '永久買斷',
        oneTimePay: '一次付費，永久使用',
        restore: '恢復購買 (Restore Purchases)',
        footerDisclaimer: '費用將透過您的 Google Play 帳號一次性扣款，無任何自動續訂的隱藏費用。'
    },
    '繁體中文-HK': {
        title: '升級買斷版',
        subtitle: '自備 API Key 每日無限次翻譯、解除所有限制，永久更新支援！',
        features: ['去除每日限制，無限翻譯', '解鎖獨立菜單庫收藏與分類', '解鎖所有歷史點餐紀錄', '一次付費，終身不限設備使用'],
        bestValue: '超值買斷',
        lifetime: '永久買斷',
        oneTimePay: '一次付費，永久使用',
        restore: '恢復購買 (Restore Purchases)',
        footerDisclaimer: '費用將透過您的 Google Play 帳號一次性扣款，無任何自動續訂的隱藏費用。'
    },
    'English': {
        title: 'Lifetime Upgrade',
        subtitle: 'Bring your own API Key for unlimited daily translations. Unlock all features forever!',
        features: ['Remove daily limits, unlimited translations', 'Unlock Menu Library & Categories', 'Unlock complete order history', 'Pay once, use forever on any device'],
        bestValue: 'Best Value',
        lifetime: 'Lifetime',
        oneTimePay: 'Pay once, use forever',
        restore: 'Restore Purchases',
        footerDisclaimer: 'A one-time charge will be applied to your Google Play account. No hidden fees or subscriptions.'
    },
    '日本語': {
        title: '買い切り版にアップグレード',
        subtitle: '自分のAPIキーを使って無制限の翻訳！すべての制限を解除し、永久サポート！',
        features: ['1日の制限を解除、無制限の翻訳', 'メニューのライブラリ保存と分類を解放', 'すべての注文履歴を解放', '一度のお支払いで、どのデバイスでも永久に使用可能'],
        bestValue: 'お得な買い切り',
        lifetime: '永久買い切り',
        oneTimePay: '一度のお支払いで、永久に使用',
        restore: '購入の復元 (Restore Purchases)',
        footerDisclaimer: 'Google Play アカウントへの1回限りの請求となります。自動更新などの隠れた費用はありません。'
    },
    '한국어': {
        title: '평생 라이센스 업그레이드',
        subtitle: '자신의 API 키를 사용하여 매일 무제한 번역. 모든 제한 해제 및 영구 지원!',
        features: ['일일 제한 없음, 무제한 번역', '메뉴 라이브러리 저장 및 분류 해제', '모든 주문 내역 해제', '한 번 결제로 모든 기기에서 평생 사용'],
        bestValue: '최고 가치',
        lifetime: '평생 라이센스',
        oneTimePay: '한 번 결제로 평생 사용',
        restore: '구매 복원 (Restore Purchases)',
        footerDisclaimer: 'Google Play 계정을 통해 일회성으로 결제됩니다. 숨겨진 자동 갱신 비용은 없습니다.'
    },
    'Français': {
        title: 'Mise à niveau à vie',
        subtitle: 'Utilisez votre propre clé API pour des traductions illimitées. Débloquez tout à vie !',
        features: ['Traductions illimitées sans limite quotidienne', 'Débloquer la bibliothèque de menus', 'Débloquer l\'historique complet', 'Payez une fois, utilisez pour toujours'],
        bestValue: 'Meilleur Valeur',
        lifetime: 'À vie',
        oneTimePay: 'Payez une fois, utilisez pour toujours',
        restore: 'Restaurer les achats (Restore)',
        footerDisclaimer: 'Un prélèvement unique sera effectué sur votre compte Google Play. Pas d\'abonnement.'
    },
    'Español': {
        title: 'Actualización de por vida',
        subtitle: 'Usa tu propia API Key para traducciones ilimitadas. ¡Desbloquea todo para siempre!',
        features: ['Traducciones ilimitadas sin límite diario', 'Desbloquear biblioteca de menús', 'Historial completo de pedidos', 'Paga una vez, úsalo para siempre'],
        bestValue: 'Mejor Opción',
        lifetime: 'De por vida',
        oneTimePay: 'Paga una vez, úsalo para siempre',
        restore: 'Restaurar compras (Restore)',
        footerDisclaimer: 'Se aplicará un cargo único a su cuenta de Google Play. Sin suscripciones ocultas.'
    }
};

export const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onSuccess, targetLanguage = 'English' }) => {
    const [offering, setOffering] = useState<PurchasesOffering | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);

    const t = TRANSLATIONS[targetLanguage] || TRANSLATIONS['English'];

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

                            <h2 className="text-2xl font-bold text-stone-900 mb-2">{t.title}</h2>
                            <p className="text-stone-600 text-sm px-2">
                                {t.subtitle}
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="px-8 pb-6 space-y-3">
                            {t.features.map((feature: string, i: number) => (
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
                                            {t.bestValue}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-stone-800 text-lg">
                                                {pkg.identifier === '$rc_lifetime' ? t.lifetime : 'Upgrade'}
                                            </h3>
                                            <p className="text-stone-500 text-xs">
                                                {t.oneTimePay}
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
                                {t.restore}
                            </button>
                            <p className="text-[10px] text-stone-400 mt-4 leading-relaxed">
                                {t.footerDisclaimer}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
