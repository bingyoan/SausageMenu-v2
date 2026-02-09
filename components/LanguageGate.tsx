'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { TargetLanguage } from '../types';
import { UI_LANGUAGE_OPTIONS } from '../i18n';

interface LanguageGateProps {
    onSelectLanguage: (lang: TargetLanguage) => void;
}

/**
 * 強制首次語言選擇畫面
 * 用戶必須選擇語言才能繼續使用 App
 */
export const LanguageGate: React.FC<LanguageGateProps> = ({ onSelectLanguage }) => {
    const handleSelect = (lang: TargetLanguage) => {
        // 儲存語言選擇
        localStorage.setItem('ui_language', lang);
        localStorage.setItem('has_selected_language', 'true');
        onSelectLanguage(lang);
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen p-6 pb-12 bg-gradient-to-b from-sausage-50 to-orange-50 overflow-y-auto">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg p-6 sm:p-8 bg-white rounded-3xl shadow-xl space-y-4 sm:space-y-6 text-center my-4"
            >
                {/* Logo */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-20 h-20 bg-gradient-to-br from-sausage-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                    <span className="text-4xl">🌭</span>
                </motion.div>

                <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        SausageMenuPal
                    </h1>
                    <p className="text-gray-500 text-lg">
                        Please select your language
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        請選擇您的語言
                    </p>
                </motion.div>

                {/* 語言選項網格 */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6"
                >
                    {UI_LANGUAGE_OPTIONS.map((option, index) => (
                        <motion.button
                            key={option.value}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.03 }}
                            onClick={() => handleSelect(option.value)}
                            className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-sausage-50 border-2 border-transparent hover:border-sausage-400 rounded-xl transition-all duration-200 group"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">
                                {option.flag}
                            </span>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-sausage-700">
                                {option.label}
                            </span>
                        </motion.button>
                    ))}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-xs text-gray-400 mt-6"
                >
                    You can change the language anytime in the app.
                </motion.p>
            </motion.div>
        </div>
    );
};
