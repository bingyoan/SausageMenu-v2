'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =========================================================
// 📊 使用次數提示元件
// =========================================================

interface UsageLimitBannerProps {
    remainingUses: number;
    dailyLimit: number;
    isUnlimited: boolean;
    onUpgrade?: () => void;
}

export const UsageLimitBanner: React.FC<UsageLimitBannerProps> = ({
    remainingUses,
    dailyLimit,
    isUnlimited,
    onUpgrade
}) => {
    // PRO 用戶顯示無限標誌
    if (isUnlimited) {
        return (
            <div className="usage-badge" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                <i className="ph-bold ph-infinity" style={{ fontSize: '14px' }}></i>
                <span>PRO 無限次數</span>
            </div>
        );
    }

    // 計算進度百分比
    const usedCount = dailyLimit - remainingUses;
    const progressPercent = (usedCount / dailyLimit) * 100;
    const isExhausted = remainingUses <= 0;
    const isLow = remainingUses === 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`usage-badge ${isExhausted ? 'exhausted' : ''}`}
            onClick={isExhausted ? onUpgrade : undefined}
            style={{ cursor: isExhausted ? 'pointer' : 'default' }}
        >
            {isExhausted ? (
                <>
                    <i className="ph-bold ph-lock" style={{ fontSize: '14px' }}></i>
                    <span>今日額度已用完 - 點擊升級</span>
                </>
            ) : (
                <>
                    <i className={`ph-bold ${isLow ? 'ph-warning' : 'ph-lightning'}`} style={{ fontSize: '14px' }}></i>
                    <span>今日剩餘 {remainingUses}/{dailyLimit} 次</span>
                </>
            )}
        </motion.div>
    );
};

// =========================================================
// 🚫 額度用盡彈窗
// =========================================================

interface UsageExhaustedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

export const UsageExhaustedModal: React.FC<UsageExhaustedModalProps> = ({
    isOpen,
    onClose,
    onUpgrade
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="ph-bold ph-hourglass-medium text-4xl text-orange-600"></i>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-center text-stone-800 mb-3">
                            今日免費額度已用完
                        </h2>

                        {/* Description */}
                        <p className="text-stone-500 text-center mb-8 leading-relaxed">
                            您今天的 2 次免費額度已用完。<br />
                            升級 PRO 可享無限次數翻譯菜單！
                        </p>

                        {/* Features */}
                        <div className="bg-stone-50 rounded-2xl p-4 mb-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <i className="ph-bold ph-check text-green-600"></i>
                                </div>
                                <span className="text-stone-700 font-medium">無限次數菜單翻譯</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <i className="ph-bold ph-check text-green-600"></i>
                                </div>
                                <span className="text-stone-700 font-medium">即時匯率轉換</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <i className="ph-bold ph-check text-green-600"></i>
                                </div>
                                <span className="text-stone-700 font-medium">過敏原警示</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={onUpgrade}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="ph-bold ph-crown text-xl"></i>
                                升級 PRO
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-stone-500 font-medium hover:text-stone-700 transition-colors"
                            >
                                明天再試 (免費額度每日重置)
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UsageLimitBanner;
