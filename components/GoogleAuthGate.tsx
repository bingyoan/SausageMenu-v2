'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GoogleAuthGateProps {
    onAuthSuccess: (user: GoogleUser) => void;
    selectedLanguage: string;
}

export interface GoogleUser {
    email: string;
    displayName: string;
    photoUrl?: string;
    isPro: boolean; // 是否為訂閱用戶
}

// 多語言翻譯 - 支援所有 13 種語言
const TRANSLATIONS: Record<string, {
    title: string;
    subtitle: string;
    googleButton: string;
    terms: string;
    freeInfo: string;
    proInfo: string;
    loading: string;
}> = {
    // 繁體中文 (台灣)
    '繁體中文': {
        title: '香腸熱狗菜單夥伴',
        subtitle: '使用 Google 登入即可開始使用 AI 選單翻譯器',
        googleButton: '用 Google 登入',
        terms: '登入即表示您同意我們的服務條款與隱私政策',
        freeInfo: '免費：每天2次翻譯',
        proInfo: '訂閱：無限翻譯',
        loading: '登入中...',
    },
    // 繁體中文 (香港)
    '繁體中文-HK': {
        title: '香腸熱狗菜單夥伴',
        subtitle: '使用 Google 登入即可開始使用 AI 選單翻譯器',
        googleButton: '用 Google 登入',
        terms: '登入即表示您同意我們的服務條款與隱私政策',
        freeInfo: '免費：每天2次翻譯',
        proInfo: '訂閱：無限翻譯',
        loading: '登入中...',
    },
    // 英文
    'English': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Sign in with Google to start using AI Menu Translator',
        googleButton: 'Sign in with Google',
        terms: 'By signing in, you agree to our Terms of Service and Privacy Policy',
        freeInfo: 'Free: 2 translations per day',
        proInfo: 'Subscribed: Unlimited translations',
        loading: 'Signing in...',
    },
    // 日文
    '日本語': {
        title: 'ソーセージドッグ メニューパル',
        subtitle: 'Googleアカウントでログインして、AIメニュー翻訳を始めましょう',
        googleButton: 'Googleでログイン',
        terms: 'ログインすることで、利用規約とプライバシーポリシーに同意します',
        freeInfo: '無料：1日2回の翻訳',
        proInfo: '購読中：無制限の翻訳',
        loading: 'ログイン中...',
    },
    // 韓文
    '한국어': {
        title: '소시지독 메뉴 팔',
        subtitle: 'Google 계정으로 로그인하여 AI 메뉴 번역을 시작하세요',
        googleButton: 'Google로 로그인',
        terms: '로그인하면 서비스 약관 및 개인정보 보호정책에 동의하는 것입니다',
        freeInfo: '무료: 하루 2회 번역',
        proInfo: '구독 중: 무제한 번역',
        loading: '로그인 중...',
    },
    // 法文
    'Français': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Connectez-vous avec Google pour utiliser le traducteur de menu IA',
        googleButton: 'Se connecter avec Google',
        terms: 'En vous connectant, vous acceptez nos Conditions d\'utilisation et notre Politique de confidentialité',
        freeInfo: 'Gratuit : 2 traductions par jour',
        proInfo: 'Abonné : Traductions illimitées',
        loading: 'Connexion...',
    },
    // 西班牙文
    'Español': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Inicia sesión con Google para usar el traductor de menú IA',
        googleButton: 'Iniciar sesión con Google',
        terms: 'Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad',
        freeInfo: 'Gratis: 2 traducciones por día',
        proInfo: 'Suscrito: Traducciones ilimitadas',
        loading: 'Iniciando sesión...',
    },
    // 泰文
    'ไทย': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'ลงชื่อเข้าใช้ด้วย Google เพื่อใช้ตัวแปลเมนู AI',
        googleButton: 'ลงชื่อเข้าใช้ด้วย Google',
        terms: 'การลงชื่อเข้าใช้หมายความว่าคุณยอมรับข้อกำหนดในการให้บริการและนโยบายความเป็นส่วนตัว',
        freeInfo: 'ฟรี: 2 การแปลต่อวัน',
        proInfo: 'สมาชิก: แปลไม่จำกัด',
        loading: 'กำลังลงชื่อเข้าใช้...',
    },
    // 越南文
    'Tiếng Việt': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Đăng nhập bằng Google để sử dụng trình dịch menu AI',
        googleButton: 'Đăng nhập bằng Google',
        terms: 'Bằng cách đăng nhập, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật',
        freeInfo: 'Miễn phí: 2 bản dịch mỗi ngày',
        proInfo: 'Đã đăng ký: Dịch không giới hạn',
        loading: 'Đang đăng nhập...',
    },
    // 德文
    'Deutsch': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Melden Sie sich mit Google an, um den KI-Menüübersetzer zu verwenden',
        googleButton: 'Mit Google anmelden',
        terms: 'Mit der Anmeldung stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu',
        freeInfo: 'Kostenlos: 2 Übersetzungen pro Tag',
        proInfo: 'Abonniert: Unbegrenzte Übersetzungen',
        loading: 'Anmeldung...',
    },
    // 俄文
    'Русский': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Войдите через Google, чтобы использовать ИИ-переводчик меню',
        googleButton: 'Войти через Google',
        terms: 'Входя в систему, вы соглашаетесь с Условиями использования и Политикой конфиденциальности',
        freeInfo: 'Бесплатно: 2 перевода в день',
        proInfo: 'Подписка: Безлимитные переводы',
        loading: 'Вход...',
    },
    // 菲律賓語
    'Tagalog': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Mag-sign in gamit ang Google upang gamitin ang AI Menu Translator',
        googleButton: 'Mag-sign in gamit ang Google',
        terms: 'Sa pag-sign in, sumasang-ayon ka sa aming Mga Tuntunin ng Serbisyo at Patakaran sa Privacy',
        freeInfo: 'Libre: 2 pagsasalin bawat araw',
        proInfo: 'Naka-subscribe: Walang limitasyong pagsasalin',
        loading: 'Nagsa-sign in...',
    },
    // 印尼語
    'Bahasa Indonesia': {
        title: 'Sausage Dog Menu Pal',
        subtitle: 'Masuk dengan Google untuk menggunakan Penerjemah Menu AI',
        googleButton: 'Masuk dengan Google',
        terms: 'Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami',
        freeInfo: 'Gratis: 2 terjemahan per hari',
        proInfo: 'Berlangganan: Terjemahan tak terbatas',
        loading: 'Sedang masuk...',
    },
};

// 簡單的 Google 登入模擬（之後會用真正的 Capacitor Google Auth）
export const GoogleAuthGate: React.FC<GoogleAuthGateProps> = ({
    onAuthSuccess,
    selectedLanguage,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 取得翻譯
    const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS['en'];

    // 檢查是否已經登入
    useEffect(() => {
        const savedUser = localStorage.getItem('google_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                onAuthSuccess(user);
            } catch (e) {
                localStorage.removeItem('google_user');
            }
        }
    }, [onAuthSuccess]);

    // Google 登入處理
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 檢查是否在 Capacitor 環境
            // @ts-ignore
            const isNative = window.Capacitor?.isNativePlatform?.();

            if (isNative) {
                // 原生 App 使用 Capacitor Google Auth
                // 目前先使用模擬登入，之後整合真正的 Google Auth
                await simulateGoogleAuth();
            } else {
                // Web 環境使用模擬登入或 Firebase Auth
                await simulateGoogleAuth();
            }
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            setError('登入失敗，請重試');
            setIsLoading(false);
        }
    };

    // 模擬 Google 登入（開發用）
    const simulateGoogleAuth = async () => {
        // 顯示簡易登入表單
        const email = prompt('請輸入你的 Email（開發模式）:');

        if (!email) {
            setIsLoading(false);
            return;
        }

        if (!email.includes('@')) {
            setError('請輸入有效的 Email');
            setIsLoading(false);
            return;
        }

        // 模擬 API 呼叫檢查訂閱狀態
        // 之後會改成真正的 Google Play 訂閱查詢
        const user: GoogleUser = {
            email: email,
            displayName: email.split('@')[0],
            isPro: false, // 預設為免費用戶
        };

        // 檢查是否為 PRO 用戶（從伺服器或本地）
        const savedIsPro = localStorage.getItem('is_pro') === 'true';
        user.isPro = savedIsPro;

        // 儲存用戶資料
        localStorage.setItem('google_user', JSON.stringify(user));
        localStorage.setItem('smp_user_email', email);

        setIsLoading(false);
        onAuthSuccess(user);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="w-32 h-32 rounded-3xl flex items-center justify-center overflow-hidden">
                    <img
                        src="/images/logo.png"
                        alt="Sausage Menu Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            // Fallback to emoji if image fails
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<span class="text-6xl">🌭</span>';
                        }}
                    />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-stone-800 text-center mb-2"
            >
                {t.title}
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-stone-500 text-center mb-8 max-w-sm"
            >
                {t.subtitle}
            </motion.p>

            {/* 使用說明 */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-8 w-full max-w-sm"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600">✓</span>
                    </div>
                    <span className="text-stone-600">{t.freeInfo}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600">⭐</span>
                    </div>
                    <span className="text-stone-600">{t.proInfo}</span>
                </div>
            </motion.div>

            {/* Google 登入按鈕 */}
            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full max-w-sm bg-white border-2 border-stone-200 rounded-xl py-4 px-6 flex items-center justify-center gap-3 hover:border-stone-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-stone-300 border-t-orange-500 rounded-full animate-spin" />
                        <span className="text-stone-600 font-medium">{t.loading}</span>
                    </div>
                ) : (
                    <>
                        {/* Google Logo */}
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-stone-700 font-semibold">{t.googleButton}</span>
                    </>
                )}
            </motion.button>

            {/* 錯誤訊息 */}
            {error && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-sm mt-4"
                >
                    {error}
                </motion.p>
            )}

            {/* 條款 */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-stone-400 text-xs text-center mt-6 max-w-xs"
            >
                {t.terms}
            </motion.p>
        </div>
    );
};

export default GoogleAuthGate;
