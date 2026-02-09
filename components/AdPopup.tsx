'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Users } from 'lucide-react';

interface AdPopupProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl?: string;
    linkUrl?: string;
}

export const AdPopup: React.FC<AdPopupProps> = ({
    isOpen,
    onClose,
    imageUrl = '/promo-banner.png',
    linkUrl = 'https://bingyoan.gumroad.com/affiliates'
}) => {
    // 預設 17 位用戶（當前最新數據）
    const [userCount, setUserCount] = useState<number>(17);
    const targetCount = 500;

    // 獲獲即時用戶數
    useEffect(() => {
        if (isOpen) {
            fetch('/api/user-stats')
                .then(res => res.json())
                .then(data => {
                    // 只有當資料庫中的人數「大於等於 17」時才更新，避免抓到 0 蓋過基礎值
                    if (data.success && data.totalUsers >= 17) {
                        setUserCount(data.totalUsers);
                    }
                })
                .catch(err => console.error('Failed to fetch user stats:', err));
        }
    }, [isOpen]);

    const handleAdClick = () => {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
    };

    // 計算進度百分比
    const progressPercent = Math.min((userCount / targetCount) * 100, 100);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Ad Content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>

                        {/* Ad Image - Clickable */}
                        <div
                            onClick={handleAdClick}
                            className="cursor-pointer group"
                        >
                            <img
                                src={imageUrl}
                                alt="Special Offer"
                                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                                <span className="text-white font-bold flex items-center gap-2">
                                    <ExternalLink size={18} />
                                    點擊查看優惠
                                </span>
                            </div>
                        </div>

                        {/* User Counter Progress */}
                        <div className="px-4 pt-4 pb-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <Users size={16} className="text-blue-500" />
                                    <span>抽獎名額</span>
                                </div>
                                <span className="text-lg font-black text-blue-600">
                                    {userCount} / {targetCount}
                                </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 text-center mt-1">
                                前 500 位用戶享抽獎資格
                            </p>
                        </div>

                        {/* CTA Button */}
                        <div className="p-4 pt-2 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <button
                                onClick={handleAdClick}
                                className="w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <ExternalLink size={18} />
                                點我加入獲得推薦連結!
                            </button>
                            <p className="text-center text-white/80 text-xs mt-2">
                                推薦朋友享 40% 分潤 + 抽 iPhone 17！
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
