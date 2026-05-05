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
        title: '升級 PRO 方案',
        subtitle: '解鎖每日無限次翻譯、菜單庫、歷史紀錄與地圖分享！',
        features: ['去除每日限制，無限翻譯', '解鎖菜單庫收藏與分類', '解鎖所有歷史點餐紀錄', '全功能解鎖，不限設備使用'],
        bestValue: '最划算',
        lifetime: '終身會員',
        weekly: '週訂閱',
        monthly: '月訂閱',
        yearly: '年訂閱',
        oneTimePay: '一次付費，永久使用',
        recurringPay: '自動續訂，隨時可取消',
        restore: '恢復購買 (Restore Purchases)',
        footerDisclaimer: '訂閱將透過您的商店帳號扣款。除非在週期結束前 24 小時取消，否則將自動續約。'
    },
    '繁體中文-HK': {
        title: '升級 PRO 方案',
        subtitle: '解鎖每日無限次翻譯、菜單庫、歷史紀錄與地圖分享！',
        features: ['去除每日限制，無限翻譯', '解鎖菜單庫收藏與分類', '解鎖所有歷史點餐紀錄', '全功能解鎖，不限設備使用'],
        bestValue: '最划算',
        lifetime: '終身會員',
        weekly: '週訂閱',
        monthly: '月訂閱',
        yearly: '年訂閱',
        oneTimePay: '一次付費，永久使用',
        recurringPay: '自動續訂，隨時可取消',
        restore: '恢復購買 (Restore Purchases)',
        footerDisclaimer: '訂閱將透過您的商店帳號扣款。除非在週期結束前 24 小時取消，否則將自動續約。'
    },
    'English': {
        title: 'Upgrade to PRO',
        subtitle: 'Unlock unlimited translations, menu library, history, and map sharing!',
        features: ['Unlimited translations, no daily limits', 'Unlock Menu Library & categories', 'Full access to order history', 'Pay once or subscribe, use on any device'],
        bestValue: 'Best Value',
        lifetime: 'Lifetime',
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly',
        oneTimePay: 'One-time payment, use forever',
        recurringPay: 'Auto-renews, cancel anytime',
        restore: 'Restore Purchases',
        footerDisclaimer: 'Subscription will be charged to your store account. Auto-renews unless canceled 24h before.'
    },
    '日本語': {
        title: 'PROにアップグレード',
        subtitle: '無制限の翻譯、メニューライブラリ、履歴、地図共有を解放！',
        features: ['日次制限なし、無制限翻譯', 'メニューライブラリとカテゴリの解放', '注文履歴へのフルアクセス', '一度の購入またはサブスクで永久利用'],
        bestValue: 'お得',
        lifetime: '買い切り',
        weekly: '週次',
        monthly: '月次',
        yearly: '年次',
        oneTimePay: '一度の支払いで永久利用',
        recurringPay: '自動更新、いつでもキャンセル可',
        restore: '購入の復元',
        footerDisclaimer: 'ストアアカウントに請求されます。終了の24時間前までに解約しない限り自動更新されます。'
    },
    '한국어': {
        title: 'PRO로 업그레이드',
        subtitle: '무제한 번역, 메뉴 라이브러리, 기록 및 지도 공유 해제!',
        features: ['일일 제한 없는 무제한 번역', '메뉴 라이브러리 및 카테고리 해제', '전체 주문 내역 접근', '한 번 결제 또는 구독으로 평생 사용'],
        bestValue: '최고의 가치',
        lifetime: '평생 이용',
        weekly: '주간 구독',
        monthly: '월간 구독',
        yearly: '연간 구독',
        oneTimePay: '한 번 결제, 평생 사용',
        recurringPay: '자동 갱신, 언제든 취소 가능',
        restore: '구매 복원',
        footerDisclaimer: '스토어 계정으로 청구됩니다. 기간 종료 24시간 전에 취소하지 않으면 자동 갱신됩니다.'
    },
    'ไทย': {
        title: 'อัปเกรดเป็น PRO',
        subtitle: 'ปลดล็อกการแปลไม่จำกัด, คลังเมนู, ประวัติ และการแชร์แผนที่!',
        features: ['แปลได้ไม่จำกัด ไม่มีลิมิตต่อวัน', 'ปลดล็อกคลังเมนูและหมวดหมู่', 'เข้าถึงประวัติการสั่งอาหารทั้งหมด', 'จ่ายครั้งเดียวหรือสมัครสมาชิก ใช้ได้ทุกเครื่อง'],
        bestValue: 'คุ้มที่สุด',
        lifetime: 'ตลอดชีพ',
        weekly: 'รายสัปดาห์',
        monthly: 'รายเดือน',
        yearly: 'รายปี',
        oneTimePay: 'จ่ายครั้งเดียว ใช้ตลอดไป',
        recurringPay: 'ต่ออายุอัตโนมัติ ยกเลิกได้ทุกเมื่อ',
        restore: 'กู้คืนการซื้อ',
        footerDisclaimer: 'การสมัครสมาชิกจะเรียกเก็บเงินผ่านบัญชีร้านค้า ต่ออายุอัตโนมัติเว้นแต่จะยกเลิก 24 ชม. ล่วงหน้า'
    },
    'Tiếng Việt': {
        title: 'Nâng cấp lên PRO',
        subtitle: 'Mở khóa dịch không giới hạn, thư viện menu, lịch sử và chia sẻ bản đồ!',
        features: ['Dịch không giới hạn, không giới hạn ngày', 'Mở khóa Thư viện Menu & danh mục', 'Truy cập đầy đủ lịch sử đặt món', 'Thanh toán 1 lần hoặc đăng ký, dùng mọi thiết bị'],
        bestValue: 'Hời nhất',
        lifetime: 'Trọn đời',
        weekly: 'Hàng tuần',
        monthly: 'Hàng tháng',
        yearly: 'Hàng năm',
        oneTimePay: 'Thanh toán 1 lần, dùng mãi mãi',
        recurringPay: 'Tự động gia hạn, hủy bất cứ lúc nào',
        restore: 'Khôi phục mua hàng',
        footerDisclaimer: 'Gói đăng ký sẽ được tính phí vào tài khoản cửa hàng. Tự động gia hạn trừ khi hủy trước 24 giờ.'
    },
    'Bahasa Indonesia': {
        title: 'Upgrade ke PRO',
        subtitle: 'Buka terjemahan tak terbatas, perpustakaan menu, riwayat, dan berbagi peta!',
        features: ['Terjemahan tak terbatas, tanpa batas harian', 'Buka Perpustakaan Menu & kategori', 'Akses penuh riwayat pesanan', 'Bayar sekali atau berlangganan, pakai selamanya'],
        bestValue: 'Terbaik',
        lifetime: 'Seumur Hidup',
        weekly: 'Mingguan',
        monthly: 'Bulanan',
        yearly: 'Tahunan',
        oneTimePay: 'Bayar sekali, pakai selamanya',
        recurringPay: 'Perpanjangan otomatis, batal kapan saja',
        restore: 'Pulihkan Pembelian',
        footerDisclaimer: 'Langganan akan ditagihkan ke akun toko Anda. Perpanjang otomatis kecuali dibatalkan 24 jam sebelumnya.'
    },
    'Français': {
        title: 'Passer à PRO',
        subtitle: 'Traductions illimitées, bibliothèque, historique et partage de carte !',
        features: ['Traductions illimitées, sans limite quotidienne', 'Bibliothèque de menus et catégories', 'Historique complet des commandes', 'Paiement unique ou abonnement'],
        bestValue: 'Meilleur',
        lifetime: 'À vie',
        weekly: 'Hebdomadaire',
        monthly: 'Mensuel',
        yearly: 'Annuel',
        oneTimePay: 'Paiement unique, à vie',
        recurringPay: 'Renouvellement auto, annulez quand vous voulez',
        restore: 'Restaurer les achats',
        footerDisclaimer: 'L\'abonnement sera débité sur votre compte store. Renouvellement auto sauf annulation 24h avant.'
    },
    'Español': {
        title: 'Subir a PRO',
        subtitle: '¡Traducciones ilimitadas, biblioteca, historial y mapas compartidos!',
        features: ['Traducciones ilimitadas, sin límites diarios', 'Biblioteca de menús y categorías', 'Acceso completo al historial', 'Pago único o suscripción'],
        bestValue: 'Mejor valor',
        lifetime: 'De por vida',
        weekly: 'Semanal',
        monthly: 'Mensual',
        yearly: 'Anual',
        oneTimePay: 'Pago único, para siempre',
        recurringPay: 'Renovación auto, cancela cuando quieras',
        restore: 'Restaurar compras',
        footerDisclaimer: 'La suscripción se cargará a tu cuenta de la tienda. Renovación auto a menos que se cancele 24h antes.'
    },
    'Tagalog': {
        title: 'Mag-upgrade sa PRO',
        subtitle: 'Unlimited translations, menu library, history, at map sharing!',
        features: ['Unlimited translations, walang daily limits', 'I-unlock ang Menu Library at categories', 'Full access sa order history', 'Isang bayad o subscription'],
        bestValue: 'Pinakasulit',
        lifetime: 'Habambuhay',
        weekly: 'Lingguhan',
        monthly: 'Buwanan',
        yearly: 'Taunan',
        oneTimePay: 'Isang bayad, habambuhay',
        recurringPay: 'Auto-renews, cancel kahit kailan',
        restore: 'I-restore ang Purchases',
        footerDisclaimer: 'Ang subscription ay sisingilin sa iyong store account. Auto-renews maliban kung i-cancel 24h bago matapos.'
    },
    'Deutsch': {
        title: 'Auf PRO upgraden',
        subtitle: 'Unbegrenzte Übersetzungen, Menübibliothek, Verlauf und Karten-Sharing!',
        features: ['Unbegrenzte Übersetzungen, kein Tageslimit', 'Menübibliothek & Kategorien freischalten', 'Vollständiger Bestellverlauf', 'Einmalzahlung oder Abo'],
        bestValue: 'Bester Wert',
        lifetime: 'Lebenslang',
        weekly: 'Wöchentlich',
        monthly: 'Monatlich',
        yearly: 'Jährlich',
        oneTimePay: 'Einmal zahlen, ewig nutzen',
        recurringPay: 'Autom. Verlängerung, jederzeit kündbar',
        restore: 'Käufe wiederherstellen',
        footerDisclaimer: 'Das Abo wird über Ihr Store-Konto abgerechnet. Autom. Verlängerung, sofern nicht 24h vorher gekündigt.'
    },
    'Русский': {
        title: 'Перейти на PRO',
        subtitle: 'Безлимитные переводы, библиотека меню, история и карты!',
        features: ['Безлимитные переводы без лимитов', 'Библиотека меню и категории', 'Полная история заказов', 'Разовый платеж или подписка'],
        bestValue: 'Лучший выбор',
        lifetime: 'Навсегда',
        weekly: 'Еженедельно',
        monthly: 'Ежемесячно',
        yearly: 'Ежегодно',
        oneTimePay: 'Один платеж, навсегда',
        recurringPay: 'Автопродление, отмена в любое время',
        restore: 'Восстановить покупки',
        footerDisclaimer: 'Оплата будет списана с вашего счета в магазине. Автопродление, если не отменить за 24 часа.'
    },
    'Polski': {
        title: 'Przejdź na PRO',
        subtitle: 'Nielimitowane tłumaczenia, biblioteka menu, historia i mapy!',
        features: ['Nielimitowane tłumaczenia bez limitów', 'Biblioteka Menu i kategorie', 'Pełna historia zamówień', 'Płatność jednorazowa lub subskrypcja'],
        bestValue: 'Najlepsza oferta',
        lifetime: 'Dożywotnio',
        weekly: 'Tygodniowo',
        monthly: 'Miesięcznie',
        yearly: 'Rocznie',
        oneTimePay: 'Zapłać raz, używaj na zawsze',
        recurringPay: 'Automatyczne odnowienie, anuluj w dowolnym momencie',
        restore: 'Przywróć zakupy',
        footerDisclaimer: 'Subskrypcja zostanie naliczona na Twoje konto w sklepie. Odnawia się automatycznie, chyba że anulujesz 24h przed.'
    },
    'Italiano': {
        title: 'Passa a PRO',
        subtitle: 'Traduzioni illimitate, libreria menu, cronologia e mappe!',
        features: ['Traduzioni illimitées senza limiti giornalieri', 'Libreria Menu e categorie sbloccate', 'Cronologia ordini completa', 'Pagamento unico o abbonamento'],
        bestValue: 'Miglior scelta',
        lifetime: 'A vita',
        weekly: 'Settimanale',
        monthly: 'Mensile',
        yearly: 'Annuale',
        oneTimePay: 'Paga una volta, aggiornamenti a vita',
        recurringPay: 'Rinnovo automatico, annulla quando vuoi',
        restore: 'Ripristina Acquisti',
        footerDisclaimer: 'L\'abbonamento sarà addebitato sul tuo account dello store. Rinnovo automatico salvo annullamento 24h prima.'
    },
    'Português': {
        title: 'Upgrade para PRO',
        subtitle: 'Traduções ilimitadas, biblioteca de menus, histórico e mapas!',
        features: ['Traduções ilimitadas sem limites diários', 'Biblioteca de Menus e categorias', 'Histórico de pedidos completo', 'Pagamento único ou subscrição'],
        bestValue: 'Melhor escolha',
        lifetime: 'Vitalício',
        weekly: 'Semanal',
        monthly: 'Mensal',
        yearly: 'Anual',
        oneTimePay: 'Pagamento único, para sempre',
        recurringPay: 'Renovação automática, cancele quando quiser',
        restore: 'Restaurar Compras',
        footerDisclaimer: 'A subscrição será cobrada na sua conta da loja. Renovação automática, a menos que seja cancelada 24h antes.'
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
                        <div className="px-6 pb-6 space-y-3 max-h-[45vh] overflow-y-auto">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                                </div>
                            ) : offering?.availablePackages.map((pkg) => {
                                const id = pkg.identifier;
                                let packageTitle = 'Upgrade';
                                let packageSubtitle = t.recurringPay;
                                let isBestValue = false;

                                if (id === '$rc_lifetime') {
                                    packageTitle = t.lifetime;
                                    packageSubtitle = t.oneTimePay;
                                    isBestValue = true;
                                } else if (id === '$rc_weekly') {
                                    packageTitle = t.weekly;
                                } else if (id === '$rc_monthly') {
                                    packageTitle = t.monthly;
                                } else if (id === '$rc_annual' || id === '$rc_yearly') {
                                    packageTitle = t.yearly;
                                }

                                return (
                                    <button
                                        key={pkg.identifier}
                                        disabled={purchasing}
                                        onClick={() => handlePurchase(pkg)}
                                        className={`w-full relative overflow-hidden group bg-stone-50 border-2 p-4 rounded-2xl text-left transition-all hover:border-orange-500 active:scale-[0.98] ${isBestValue ? 'border-orange-200' : 'border-stone-100'}`}
                                    >
                                        {isBestValue && (
                                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                                {t.bestValue}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-stone-800 text-lg">
                                                    {packageTitle}
                                                </h3>
                                                <p className="text-stone-500 text-xs">
                                                    {packageSubtitle}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-orange-600">
                                                    {pkg.product.priceString}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
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
