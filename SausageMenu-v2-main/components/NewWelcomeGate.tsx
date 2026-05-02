'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { TargetLanguage } from '../types';

// =========================================================
// 🔐 新版登入閘門 - 支援 Google 登入 + 免費試用額度
// =========================================================

interface NewWelcomeGateProps {
    onLoginSuccess: (userData: UserData) => void;
    selectedLanguage: TargetLanguage;
}

export interface UserData {
    email: string;
    displayName?: string;
    photoUrl?: string;
    isPro: boolean;
    subscriptionStatus: 'free' | 'active' | 'expired';
    dailyUsageCount: number;
    remainingUses: number;
}

// 多語言翻譯
const TRANSLATIONS: Record<string, {
    title: string;
    subtitle: string;
    freeTrialTitle: string;
    freeTrialDesc: string;
    freeTrialNote: string;
    googleBtn: string;
    emailBtn: string;
    emailPlaceholder: string;
    codePlaceholder: string;
    verifyBtn: string;
    orDivider: string;
    privacyNote: string;
    alreadyPro: string;
    errorInvalidEmail: string;
    errorNetwork: string;
    successLogin: string;
}> = {
    'Traditional Chinese (Taiwan)': {
        title: '歡迎使用 SausageMenu',
        subtitle: '出國點餐不再困難',
        freeTrialTitle: '🎁 免費試用',
        freeTrialDesc: '每天免費翻譯 2 次菜單',
        freeTrialNote: '無需信用卡，立即開始使用',
        googleBtn: '使用 Google 帳號登入',
        emailBtn: '使用 Email 登入',
        emailPlaceholder: '請輸入您的 Email',
        codePlaceholder: '輸入序號 (選填)',
        verifyBtn: '驗證並登入',
        orDivider: '或',
        privacyNote: '登入即表示您同意我們的隱私權政策',
        alreadyPro: '已是 PRO 用戶？直接登入即可',
        errorInvalidEmail: '請輸入有效的 Email 地址',
        errorNetwork: '網路錯誤，請稍後再試',
        successLogin: '登入成功！',
    },
    'English': {
        title: 'Welcome to SausageMenu',
        subtitle: 'Order food anywhere with ease',
        freeTrialTitle: '🎁 Free Trial',
        freeTrialDesc: '2 free menu translations per day',
        freeTrialNote: 'No credit card required',
        googleBtn: 'Continue with Google',
        emailBtn: 'Continue with Email',
        emailPlaceholder: 'Enter your email',
        codePlaceholder: 'Enter code (optional)',
        verifyBtn: 'Verify & Login',
        orDivider: 'or',
        privacyNote: 'By logging in, you agree to our Privacy Policy',
        alreadyPro: 'Already PRO? Just login to continue',
        errorInvalidEmail: 'Please enter a valid email',
        errorNetwork: 'Network error, please try again',
        successLogin: 'Login successful!',
    },
    'Japanese': {
        title: 'SausageMenuへようこそ',
        subtitle: '海外での注文をもっと簡単に',
        freeTrialTitle: '🎁 無料お試し',
        freeTrialDesc: '毎日2回まで無料でメニュー翻訳',
        freeTrialNote: 'クレジットカード不要',
        googleBtn: 'Googleアカウントでログイン',
        emailBtn: 'メールでログイン',
        emailPlaceholder: 'メールアドレスを入力',
        codePlaceholder: 'コードを入力（任意）',
        verifyBtn: '確認してログイン',
        orDivider: 'または',
        privacyNote: 'ログインすると、プライバシーポリシーに同意したことになります',
        alreadyPro: 'PROユーザーですか？ログインするだけです',
        errorInvalidEmail: '有効なメールアドレスを入力してください',
        errorNetwork: 'ネットワークエラー、後でもう一度お試しください',
        successLogin: 'ログイン成功！',
    },
    'Korean': {
        title: 'SausageMenu에 오신 것을 환영합니다',
        subtitle: '어디서나 쉽게 주문하세요',
        freeTrialTitle: '🎁 무료 체험',
        freeTrialDesc: '매일 2회 무료 메뉴 번역',
        freeTrialNote: '신용카드 필요 없음',
        googleBtn: 'Google 계정으로 로그인',
        emailBtn: '이메일로 로그인',
        emailPlaceholder: '이메일을 입력하세요',
        codePlaceholder: '코드 입력 (선택사항)',
        verifyBtn: '확인 및 로그인',
        orDivider: '또는',
        privacyNote: '로그인하면 개인정보 보호정책에 동의하는 것입니다',
        alreadyPro: 'PRO 사용자이신가요? 로그인만 하시면 됩니다',
        errorInvalidEmail: '유효한 이메일을 입력해주세요',
        errorNetwork: '네트워크 오류, 나중에 다시 시도해주세요',
        successLogin: '로그인 성공!',
    },
};

export const NewWelcomeGate: React.FC<NewWelcomeGateProps> = ({
    onLoginSuccess,
    selectedLanguage
}) => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);

    // 取得翻譯文字
    const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS['English'];

    // Email 驗證
    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Google 登入處理
    const handleGoogleLogin = async () => {
        setIsLoading(true);

        // TODO: 實際的 Google 登入流程需要設定 OAuth
        // 目前暫時使用模擬登入
        // 在 Capacitor 中，我們會使用 @codetrix-studio/capacitor-google-auth

        toast.error('Google 登入功能正在開發中，請先使用 Email 登入');
        setIsLoading(false);
        setShowEmailForm(true);
    };

    // Email 登入處理
    const handleEmailLogin = async () => {
        if (!email) {
            toast.error(t.errorInvalidEmail);
            return;
        }

        if (!isValidEmail(email)) {
            toast.error(t.errorInvalidEmail);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: code || undefined }),
            });

            const data = await response.json();

            if (data.verified) {
                // 登入成功，獲取用戶資料
                const userResponse = await fetch('/api/google-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const userData = await userResponse.json();

                if (userData.success) {
                    toast.success(t.successLogin);
                    onLoginSuccess(userData.user);
                } else {
                    // 即使沒有完整用戶資料，也讓用戶進入 (免費模式)
                    onLoginSuccess({
                        email,
                        isPro: true,
                        subscriptionStatus: 'active',
                        dailyUsageCount: 0,
                        remainingUses: Infinity,
                    });
                }
            } else {
                // 驗證失敗，但如果沒有輸入序號，視為免費用戶登入
                if (!code) {
                    const userResponse = await fetch('/api/google-auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                    });

                    const userData = await userResponse.json();

                    toast.success(t.successLogin);
                    onLoginSuccess(userData.user || {
                        email,
                        isPro: false,
                        subscriptionStatus: 'free',
                        dailyUsageCount: 0,
                        remainingUses: 2,
                    });
                } else {
                    toast.error(data.message || '序號驗證失敗');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error(t.errorNetwork);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center p-6 safe-area-all">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-200">
                        <i className="ph-bold ph-fork-knife text-4xl text-white"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">{t.title}</h1>
                    <p className="text-stone-500">{t.subtitle}</p>
                </div>

                {/* 免費試用提示 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🎁</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-green-800">{t.freeTrialTitle}</h3>
                            <p className="text-sm text-green-600">{t.freeTrialDesc}</p>
                            <p className="text-xs text-green-500 mt-1">{t.freeTrialNote}</p>
                        </div>
                    </div>
                </div>

                {/* 登入卡片 */}
                <div className="bg-white rounded-3xl shadow-xl p-6 border border-stone-100">
                    {/* Google 登入按鈕 */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full py-4 bg-white border-2 border-stone-200 rounded-xl font-semibold text-stone-700 flex items-center justify-center gap-3 hover:border-stone-300 hover:bg-stone-50 transition-all disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{t.googleBtn}</span>
                    </button>

                    {/* 分隔線 */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-stone-200"></div>
                        <span className="text-stone-400 text-sm">{t.orDivider}</span>
                        <div className="flex-1 h-px bg-stone-200"></div>
                    </div>

                    {/* Email 登入表單 */}
                    <AnimatePresence mode="wait">
                        {!showEmailForm ? (
                            <motion.button
                                key="email-btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowEmailForm(true)}
                                className="w-full py-4 bg-stone-100 rounded-xl font-semibold text-stone-600 flex items-center justify-center gap-2 hover:bg-stone-200 transition-all"
                            >
                                <i className="ph-bold ph-envelope text-xl"></i>
                                <span>{t.emailBtn}</span>
                            </motion.button>
                        ) : (
                            <motion.div
                                key="email-form"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.emailPlaceholder}
                                    className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                />
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder={t.codePlaceholder}
                                    className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                />
                                <button
                                    onClick={handleEmailLogin}
                                    disabled={isLoading || !email}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <i className="ph-bold ph-sign-in text-xl"></i>
                                            <span>{t.verifyBtn}</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 提示已是 PRO */}
                    <p className="text-center text-stone-400 text-sm mt-6">
                        {t.alreadyPro}
                    </p>
                </div>

                {/* 隱私權政策連結 */}
                <p className="text-center text-stone-400 text-sm mt-6">
                    {t.privacyNote}
                    <a href="/privacy" className="text-orange-500 hover:text-orange-600 underline ml-1">
                        Privacy Policy
                    </a>
                </p>
            </motion.div>
        </div>
    );
};

export default NewWelcomeGate;
