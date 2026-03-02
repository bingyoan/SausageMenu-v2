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
        title: '解鎖全功能(終身會員)',
        subtitle: '自備 API Key 每日無限次翻譯(依API每日額度)、享用所有功能、新功能更新不加價！',
        features: ['去除每日限制，無限翻譯', '解鎖菜單庫收藏與分類', '解鎖所有歷史點餐紀錄', '一次付費，終身不限設備使用'],
        bestValue: '超值',
        lifetime: '終身會員',
        oneTimePay: '一次付費，享受永久更新',
        restore: '恢復購買 (Restore Purchases)',
        footerDisclaimer: '費用將透過您的 Google Play 帳號一次性扣款，無任何自動續訂的隱藏費用。'
    },
    '繁體中文-HK': {
        title: '解鎖全功能(終身會員)',
        subtitle: '自備 API Key 每日無限次翻譯(依API每日額度)、享用所有功能、新功能更新不加價！',
        features: ['去除每日限制，無限翻譯', '解鎖菜單庫收藏與分類', '解鎖所有歷史點餐紀錄', '一次付費，終身不限設備使用'],
        bestValue: '超值',
        lifetime: '終身會員',
        oneTimePay: '一次付費，享受永久更新',
        restore: '恢復購買 (Restore Purchases)',
        footerDisclaimer: '費用將透過您的 Google Play 帳號一次性扣款，無任何自動續訂的隱藏費用。'
    },
    'English': {
        title: 'Unlock All (Lifetime)',
        subtitle: 'Use your own API Key for unlimited translations (based on API quota). All features included, free updates!',
        features: ['No daily limits, unlimited translations', 'Unlock Menu Library & categories', 'Full order history access', 'Pay once, use forever on any device'],
        bestValue: 'Best Value',
        lifetime: 'Lifetime',
        oneTimePay: 'Pay once, enjoy lifetime updates',
        restore: 'Restore Purchases',
        footerDisclaimer: 'One-time charge via Google Play. No hidden fees or subscriptions.'
    },
    '日本語': {
        title: '全機能解放（生涯会員）',
        subtitle: '自分のAPI Keyで毎日無制限翻訳（API上限内）。全機能利用可、アプデ追加料金なし！',
        features: ['日次制限なし、無制限翻訳', 'メニューライブラリ解放', '全注文履歴を解放', '一度の支払いで永久利用'],
        bestValue: 'お得',
        lifetime: '生涯会員',
        oneTimePay: '一度の支払いで永久アップデート',
        restore: '購入の復元',
        footerDisclaimer: 'Google Playへの1回限りの請求です。自動更新や隠れた費用はありません。'
    },
    '한국어': {
        title: '전체 기능 해제 (평생)',
        subtitle: '자체 API Key로 무제한 번역(API 일일 한도 내). 모든 기능 이용, 업데이트 추가비용 없음!',
        features: ['일일 제한 없이 무제한 번역', '메뉴 라이브러리 해제', '전체 주문 내역 해제', '한 번 결제, 평생 사용'],
        bestValue: '추천',
        lifetime: '평생 이용',
        oneTimePay: '한 번 결제, 평생 업데이트',
        restore: '구매 복원',
        footerDisclaimer: 'Google Play를 통한 일회성 결제입니다. 자동 갱신이나 숨겨진 비용 없음.'
    },
    'ไทย': {
        title: 'ปลดล็อกทั้งหมด (ตลอดชีพ)',
        subtitle: 'ใช้ API Key ของคุณแปลไม่จำกัด (ตามโควต้า API) ใช้ทุกฟีเจอร์ อัปเดตฟรี!',
        features: ['ไม่จำกัดต่อวัน แปลได้ไม่อั้น', 'ปลดล็อกคลังเมนู', 'ดูประวัติสั่งอาหารทั้งหมด', 'จ่ายครั้งเดียว ใช้ตลอดชีพ'],
        bestValue: 'คุ้มสุด',
        lifetime: 'ตลอดชีพ',
        oneTimePay: 'จ่ายครั้งเดียว รับการอัปเดตตลอดชีพ',
        restore: 'กู้คืนการซื้อ',
        footerDisclaimer: 'เรียกเก็บครั้งเดียวผ่าน Google Play ไม่มีค่าธรรมเนียมแอบแฝง'
    },
    'Tiếng Việt': {
        title: 'Mở khóa tất cả (Trọn đời)',
        subtitle: 'Dùng API Key của bạn để dịch không giới hạn (theo hạn mức API). Mọi tính năng, cập nhật miễn phí!',
        features: ['Không giới hạn lượt dịch hàng ngày', 'Mở khóa Thư viện menu', 'Xem toàn bộ lịch sử đặt món', 'Thanh toán 1 lần, dùng mãi mãi'],
        bestValue: 'Tốt nhất',
        lifetime: 'Trọn đời',
        oneTimePay: 'Thanh toán 1 lần, cập nhật trọn đời',
        restore: 'Khôi phục mua hàng',
        footerDisclaimer: 'Tính phí 1 lần qua Google Play. Không phí ẩn hay tự gia hạn.'
    },
    'Bahasa Indonesia': {
        title: 'Buka Semua (Seumur Hidup)',
        subtitle: 'Gunakan API Key Anda untuk terjemahan tak terbatas (sesuai kuota API). Semua fitur, update gratis!',
        features: ['Tanpa batas harian, terjemahan tak terbatas', 'Buka Perpustakaan Menu', 'Akses riwayat pesanan lengkap', 'Bayar sekali, pakai selamanya'],
        bestValue: 'Terbaik',
        lifetime: 'Seumur Hidup',
        oneTimePay: 'Bayar sekali, nikmati pembaruan seumur hidup',
        restore: 'Pulihkan Pembelian',
        footerDisclaimer: 'Pembayaran satu kali melalui Google Play. Tanpa biaya tersembunyi.'
    },
    'Français': {
        title: 'Tout débloquer (À vie)',
        subtitle: 'Utilisez votre API Key pour traduire sans limite (selon quota API). Toutes fonctions, mises à jour gratuites !',
        features: ['Traductions illimitées, sans limite', 'Bibliothèque de menus débloquée', 'Historique complet des commandes', 'Payez une fois, utilisez à vie'],
        bestValue: 'Meilleur',
        lifetime: 'À vie',
        oneTimePay: 'Payez une fois, profitez des mises à jour à vie',
        restore: 'Restaurer les achats',
        footerDisclaimer: 'Paiement unique via Google Play. Aucun frais caché ni abonnement.'
    },
    'Español': {
        title: 'Desbloquear todo (De por vida)',
        subtitle: 'Usa tu API Key para traducciones ilimitadas (según cuota API). Todas las funciones, actualizaciones gratis!',
        features: ['Sin límites diarios, traducciones ilimitadas', 'Desbloquear biblioteca de menús', 'Historial completo de pedidos', 'Paga una vez, úsalo para siempre'],
        bestValue: 'Mejor',
        lifetime: 'De por vida',
        oneTimePay: 'Paga una vez, disfruta de actualizaciones de por vida',
        restore: 'Restaurar compras',
        footerDisclaimer: 'Cargo único vía Google Play. Sin tarifas ocultas ni suscripciones.'
    },
    'Tagalog': {
        title: 'I-unlock Lahat (Panghabambuhay)',
        subtitle: 'Gamitin ang iyong API Key para sa walang limitasyong pagsasalin. Lahat ng feature, libreng updates!',
        features: ['Walang daily limit, walang limitasyong pagsasalin', 'I-unlock ang Menu Library', 'Buong order history', 'Bayad isang beses, gamitin habambuhay'],
        bestValue: 'Sulit',
        lifetime: 'Habambuhay',
        oneTimePay: 'Isang bayad, habambuhay na updates',
        restore: 'I-restore ang Purchases',
        footerDisclaimer: 'Isang beses na singil sa Google Play. Walang nakatagong bayad.'
    },
    'Deutsch': {
        title: 'Alles freischalten (Lebenslang)',
        subtitle: 'Eigener API Key für unbegrenzte Übersetzungen (nach API-Kontingent). Alle Funktionen, kostenlose Updates!',
        features: ['Kein Tageslimit, unbegrenzt übersetzen', 'Menübibliothek freischalten', 'Gesamte Bestellhistorie', 'Einmal zahlen, ewig nutzen'],
        bestValue: 'Top-Wert',
        lifetime: 'Lebenslang',
        oneTimePay: 'Einmal zahlen, lebenslange Updates genießen',
        restore: 'Käufe wiederherstellen',
        footerDisclaimer: 'Einmalige Belastung über Google Play. Keine versteckten Gebühren.'
    },
    'Русский': {
        title: 'Разблокировать всё (Навсегда)',
        subtitle: 'Используйте свой API Key для безлимитных переводов (в рамках квоты API). Все функции, бесплатные обновления!',
        features: ['Без дневных лимитов, безлимитно', 'Библиотека меню', 'Полная история заказов', 'Один платёж — навсегда'],
        bestValue: 'Лучшее',
        lifetime: 'Навсегда',
        oneTimePay: 'Один платёж, пожизненные обновления',
        restore: 'Восстановить покупки',
        footerDisclaimer: 'Разовый платёж через Google Play. Без скрытых платежей и подписок.'
    },
    'Polski': {
        title: 'Odblokuj wszystko (Dożywotnio)',
        subtitle: 'Używaj swojego API Key bez limitu (wg kwoty API). Wszystkie funkcje, darmowe aktualizacje!',
        features: ['Bez dziennych limitów', 'Biblioteka Menu odblokowana', 'Pełna historia zamówień', 'Zapłać raz, używaj na zawsze'],
        bestValue: 'Najlepsza',
        lifetime: 'Dożywotnio',
        oneTimePay: 'Zapłać raz, ciesz się dożywotnimi aktualizacjami',
        restore: 'Przywróć zakupy',
        footerDisclaimer: 'Jednorazowa opłata przez Google Play. Bez ukrytych opłat.'
    },
    'Bahasa Melayu': {
        title: 'Buka Semua (Sepanjang Hayat)',
        subtitle: 'Gunakan API Key anda untuk terjemahan tanpa had (mengikut kuota API). Semua ciri, kemas kini percuma!',
        features: ['Tanpa had harian, terjemahan tanpa had', 'Buka Pustaka Menu', 'Akses penuh sejarah pesanan', 'Bayar sekali, guna selamanya'],
        bestValue: 'Terbaik',
        lifetime: 'Sepanjang Hayat',
        oneTimePay: 'Bayar sekali, nikmati kemas kini seumur hidup',
        restore: 'Pulihkan Pembelian',
        footerDisclaimer: 'Caj sekali melalui Google Play. Tiada yuran tersembunyi.'
    },
    'Italiano': {
        title: 'Sblocca Tutto (A vita)',
        subtitle: 'Usa la tua API Key per traduzioni illimitate. Tutte le funzioni, aggiornamenti gratuiti!',
        features: ['Nessun limite giornaliero', 'Libreria Menu sbloccata', 'Cronologia ordini completa', 'Paga una volta, aggiornamenti a vita'],
        bestValue: 'Miglior Scelta',
        lifetime: 'A vita',
        oneTimePay: 'Pagamento unico',
        restore: 'Ripristina Acquisti',
        footerDisclaimer: 'Addebito una tantum tramite Google Play. Nessun costo nascosto.'
    },
    'Português': {
        title: 'Desbloquear Tudo (Vitalício)',
        subtitle: 'Use a sua API Key para traduções ilimitadas. Todas as funcionalidades, atualizações gratuitas!',
        features: ['Sem limite diário', 'Biblioteca de Menus', 'Histórico de pedidos completo', 'Pague uma vez, atualizações vitalícias'],
        bestValue: 'Melhor Escolha',
        lifetime: 'Vitalício',
        oneTimePay: 'Pagamento único',
        restore: 'Restaurar Compras',
        footerDisclaimer: 'Cobrado uma única vez pelo Google Play. Sem custos ocultos.'
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
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(12px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="rounded-[2rem] w-full max-w-sm relative overflow-hidden" style={{ background: 'var(--bg-tertiary)', boxShadow: 'var(--card-shadow)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Image Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-40 rounded-b-[3rem] -z-10" style={{ background: 'var(--brand-gradient)' }}></div>

                        <div className="pt-8 pb-6 px-6 relative z-10 text-center">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
                            >
                                <i className="ph ph-x"></i>
                            </button>

                            <div className="w-20 h-20 rounded-full shadow-lg mx-auto flex items-center justify-center mb-4 mt-2" style={{ background: 'var(--bg-tertiary)', border: '3px solid var(--glass-border)' }}>
                                <i className="ph-fill ph-crown text-4xl" style={{ color: 'var(--brand-primary)' }}></i>
                            </div>

                            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t.title}</h2>
                            <p className="text-sm px-2" style={{ color: 'var(--text-secondary)' }}>
                                {t.subtitle}
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="px-8 pb-6 space-y-3">
                            {t.features.map((feature: string, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--brand-bg)' }}>
                                        <i className="ph-bold ph-check text-xs" style={{ color: 'var(--brand-primary)' }}></i>
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
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
                                    className="w-full relative overflow-hidden group p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                                    style={{ background: 'var(--glass-bg)', border: '2px solid var(--glass-border)' }}
                                >
                                    {pkg.identifier === '$rc_lifetime' && (
                                        <div className="absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg" style={{ background: 'var(--brand-primary)' }}>
                                            {t.bestValue}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                                {pkg.identifier === '$rc_lifetime' ? t.lifetime : 'Upgrade'}
                                            </h3>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                {t.oneTimePay}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                                                TWD 299.00
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
                                className="text-xs font-medium underline" style={{ color: 'var(--text-tertiary)' }}
                            >
                                {t.restore}
                            </button>
                            <p className="text-[10px] mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                {t.footerDisclaimer}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
