'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, DollarSign, Loader2, CheckCircle, Gift } from 'lucide-react';

interface TouristSharePopupProps {
    /** 延遲顯示時間（毫秒），預設 15 秒 */
    delayMs?: number;
    /** 分享的連結 URL */
    shareUrl?: string;
    /** 分享訊息標題 */
    shareTitle?: string;
    /** 分享訊息內容 */
    shareText?: string;
}

export const TouristSharePopup: React.FC<TouristSharePopupProps> = ({
    delayMs = 0,
    shareUrl = 'https://bingyoan.gumroad.com/l/ihrnvp',
    shareTitle = 'Sausage Dog Menu Pal 🌭',
    shareText = '旅行必備神器！拍下菜單就能自動翻譯 + 算匯率，出國吃飯再也不怕看不懂菜單！'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [affiliateLoading, setAffiliateLoading] = useState(false);
    const [affiliateSuccess, setAffiliateSuccess] = useState(false);
    const [affiliateLink, setAffiliateLink] = useState<string | null>(null);

    // 延遲顯示彈窗
    useEffect(() => {
        // 檢查是否已經顯示過（避免重複打擾）
        const hasShown = sessionStorage.getItem('tourist_popup_shown');
        if (hasShown) return;

        const timer = setTimeout(() => {
            setIsVisible(true);
            sessionStorage.setItem('tourist_popup_shown', 'true');
        }, delayMs);

        return () => clearTimeout(timer);
    }, [delayMs]);

    // 處理原生分享
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: affiliateLink || shareUrl,
                });
            } catch (err) {
                // 用戶取消分享，不需要處理
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            // Fallback: 複製連結到剪貼簿
            try {
                await navigator.clipboard.writeText(affiliateLink || shareUrl);
                alert('連結已複製到剪貼簿！');
            } catch {
                alert('請手動複製此連結：\n' + (affiliateLink || shareUrl));
            }
        }
    };

    // 處理加入聯盟行銷
    const handleBecomeAffiliate = async () => {
        const email = prompt('輸入你的 Email，我們會引導你申請成為推廣夥伴：\n\n每有人透過你的連結購買，你可以獲得 30% 現金回饋！');

        if (!email || !email.includes('@')) {
            if (email !== null) {
                alert('請輸入有效的 Email 地址');
            }
            return;
        }

        setAffiliateLoading(true);

        try {
            const response = await fetch('/api/become-affiliate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (data.success) {
                setAffiliateSuccess(true);

                // 開啟 Gumroad Affiliate 註冊頁面
                if (data.affiliateSignupUrl) {
                    window.open(data.affiliateSignupUrl, '_blank', 'noopener,noreferrer');
                }

                alert('✅ 已開啟 Gumroad 推廣夥伴申請頁面！\n\n請使用 ' + email + ' 註冊或登入 Gumroad 帳號，即可開始賺取 30% 現金回饋！');
            } else {
                alert('❌ ' + (data.message || '發生錯誤，請稍後再試'));
            }
        } catch (error) {
            console.error('Affiliate request failed:', error);
            alert('❌ 網路連線失敗，請稍後再試');
        } finally {
            setAffiliateLoading(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Popup Content */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-8 text-white text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <Gift size={32} />
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-2">覺得好用嗎？</h2>
                            <p className="text-white/90 text-sm">
                                分享給朋友，讓他們也能享受無障礙點餐的樂趣！
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="p-6 space-y-3">
                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                            >
                                <Share2 size={22} />
                                <span>分享給朋友</span>
                            </button>

                            {/* Affiliate Button */}
                            <button
                                onClick={handleBecomeAffiliate}
                                disabled={affiliateLoading || affiliateSuccess}
                                className={`w-full py-4 px-6 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${affiliateSuccess
                                    ? 'bg-green-100 text-green-700 border-2 border-green-200'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl'
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {affiliateLoading ? (
                                    <>
                                        <Loader2 size={22} className="animate-spin" />
                                        <span>處理中...</span>
                                    </>
                                ) : affiliateSuccess ? (
                                    <>
                                        <CheckCircle size={22} />
                                        <span>已成為推廣夥伴！</span>
                                    </>
                                ) : (
                                    <>
                                        <DollarSign size={22} />
                                        <span>我要賺現金回饋</span>
                                    </>
                                )}
                            </button>

                            {/* Info Text */}
                            <p className="text-center text-xs text-gray-400 pt-2">
                                成為推廣夥伴後，每有人透過你的連結購買，<br />
                                你可以獲得 <span className="font-bold text-emerald-600">30% 現金回饋</span>！
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
