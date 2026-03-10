'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LANGUAGE_OPTIONS } from '../i18n';
import { TargetLanguage } from '../types';

interface GoogleAuthGateProps {
    onAuthSuccess: (user: GoogleUser) => void;
    selectedLanguage: string;
    onLanguageChange?: (lang: TargetLanguage) => void;
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
        title: 'SausageMenu',
        subtitle: '使用 Google 登入即可開始使用 AI 生成點餐系統',
        googleButton: '用 Google 登入',
        terms: '登入即表示您同意我們的服務條款與隱私政策',
        freeInfo: '免費版：每日2次免費翻譯',
        proInfo: '訂閱版：無限制次數、菜單庫、歷史明細等功能解鎖',
        loading: '登入中...',
    },
    // 繁體中文 (香港)
    '繁體中文-HK': {
        title: 'SausageMenu',
        subtitle: '使用 Google 登入即可開始使用 AI 生成點餐系統',
        googleButton: '用 Google 登入',
        terms: '登入即表示您同意我們的服務條款與隱私政策',
        freeInfo: '免費版：每日2次免費翻譯',
        proInfo: '訂閱版：無限制次數、菜單庫、歷史明細等功能解鎖',
        loading: '登入中...',
    },
    // 英文
    'English': {
        title: 'SausageMenu',
        subtitle: 'Sign in with Google to use AI-powered ordering system',
        googleButton: 'Sign in with Google',
        terms: 'By signing in, you agree to our Terms of Service and Privacy Policy',
        freeInfo: 'Free: 2 translations per day',
        proInfo: 'Pro: Unlimited translations, Menu Library, History & more',
        loading: 'Signing in...',
    },
    // 日文
    '日本語': {
        title: 'SausageMenu',
        subtitle: 'Googleでログインして、AI注文システムを使いましょう',
        googleButton: 'Googleでログイン',
        terms: 'ログインすることで、利用規約とプライバシーポリシーに同意します',
        freeInfo: '無料版：1日2回の翻訳',
        proInfo: '有料版：無制限翻訳、メニューライブラリ、履歴など',
        loading: 'ログイン中...',
    },
    // 韓文
    '한국어': {
        title: 'SausageMenu',
        subtitle: 'Google로 로그인하여 AI 주문 시스템을 사용하세요',
        googleButton: 'Google로 로그인',
        terms: '로그인하면 서비스 약관 및 개인정보 보호정책에 동의하는 것입니다',
        freeInfo: '무료: 하루 2회 번역',
        proInfo: '구독: 무제한 번역, 메뉴 라이브러리, 히스토리 등',
        loading: '로그인 중...',
    },
    // 法文
    'Français': {
        title: 'SausageMenu',
        subtitle: 'Connectez-vous avec Google pour utiliser le système de commande IA',
        googleButton: 'Se connecter avec Google',
        terms: 'En vous connectant, vous acceptez nos Conditions d\'utilisation et notre Politique de confidentialité',
        freeInfo: 'Gratuit : 2 traductions par jour',
        proInfo: 'Pro : Traductions illimitées, Bibliothèque, Historique',
        loading: 'Connexion...',
    },
    // 西班牙文
    'Español': {
        title: 'SausageMenu',
        subtitle: 'Inicia sesión con Google para usar el sistema de pedidos IA',
        googleButton: 'Iniciar sesión con Google',
        terms: 'Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad',
        freeInfo: 'Gratis: 2 traducciones por día',
        proInfo: 'Pro: Traducciones ilimitadas, Biblioteca, Historial',
        loading: 'Iniciando sesión...',
    },
    // 泰文
    'ไทย': {
        title: 'SausageMenu',
        subtitle: 'ลงชื่อเข้าใช้ด้วย Google เพื่อใช้ระบบสั่งอาหาร AI',
        googleButton: 'ลงชื่อเข้าใช้ด้วย Google',
        terms: 'การลงชื่อเข้าใช้หมายความว่าคุณยอมรับข้อกำหนดในการให้บริการและนโยบายความเป็นส่วนตัว',
        freeInfo: 'ฟรี: 2 การแปลต่อวัน',
        proInfo: 'สมาชิก: แปลไม่จำกัด, คลังเมนู, ประวัติ',
        loading: 'กำลังลงชื่อเข้าใช้...',
    },
    // 越南文
    'Tiếng Việt': {
        title: 'SausageMenu',
        subtitle: 'Đăng nhập bằng Google để sử dụng hệ thống đặt món AI',
        googleButton: 'Đăng nhập bằng Google',
        terms: 'Bằng cách đăng nhập, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật',
        freeInfo: 'Miễn phí: 2 bản dịch mỗi ngày',
        proInfo: 'Pro: Dịch không giới hạn, Thư viện, Lịch sử',
        loading: 'Đang đăng nhập...',
    },
    // 德文
    'Deutsch': {
        title: 'SausageMenu',
        subtitle: 'Melden Sie sich mit Google an, um das KI-Bestellsystem zu verwenden',
        googleButton: 'Mit Google anmelden',
        terms: 'Mit der Anmeldung stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu',
        freeInfo: 'Kostenlos: 2 Übersetzungen pro Tag',
        proInfo: 'Pro: Unbegrenzt, Menübibliothek, Verlauf',
        loading: 'Anmeldung...',
    },
    // 俄文
    'Русский': {
        title: 'SausageMenu',
        subtitle: 'Войдите через Google, чтобы использовать ИИ-систему заказов',
        googleButton: 'Войти через Google',
        terms: 'Входя в систему, вы соглашаетесь с Условиями использования и Политикой конфиденциальности',
        freeInfo: 'Бесплатно: 2 перевода в день',
        proInfo: 'Pro: Безлимитные переводы, Библиотека, История',
        loading: 'Вход...',
    },
    // 菲律賓語
    'Tagalog': {
        title: 'SausageMenu',
        subtitle: 'Mag-sign in gamit ang Google upang gamitin ang AI ordering system',
        googleButton: 'Mag-sign in gamit ang Google',
        terms: 'Sa pag-sign in, sumasang-ayon ka sa aming Mga Tuntunin ng Serbisyo at Patakaran sa Privacy',
        freeInfo: 'Libre: 2 pagsasalin bawat araw',
        proInfo: 'Pro: Walang limitasyon, Menu Library, History',
        loading: 'Nagsa-sign in...',
    },
    // Bahasa Indonesia
    'Bahasa Indonesia': {
        title: 'SausageMenu',
        subtitle: 'Masuk dengan Google untuk menggunakan sistem pemesanan AI',
        googleButton: 'Masuk dengan Google',
        terms: 'Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami',
        freeInfo: 'Gratis: 2 terjemahan per hari',
        proInfo: 'Pro: Tak terbatas, Perpustakaan Menu, Riwayat',
        loading: 'Sedang masuk...',
    },
    // Italiano
    'Italiano': {
        title: 'SausageMenu',
        subtitle: 'Accedi con Google per utilizzare il sistema di ordinazione AI',
        googleButton: 'Accedi con Google',
        terms: 'Accedendo, accetti i nostri Termini di Servizio e la Politica sulla Privacy',
        freeInfo: 'Gratuito: 2 traduzioni al giorno',
        proInfo: 'Pro: Traduzioni illimitate, Libreria Menu, Cronologia',
        loading: 'Accesso in corso...',
    },
    // Português
    'Português': {
        title: 'SausageMenu',
        subtitle: 'Faça login com o Google para usar o sistema de pedidos com IA',
        googleButton: 'Entrar com o Google',
        terms: 'Ao entrar, você concorda com nossos Termos de Serviço e Política de Privacidade',
        freeInfo: 'Gratuito: 2 traduções por dia',
        proInfo: 'Pro: Ilimitado, Biblioteca de Menus, Histórico',
        loading: 'Entrando...',
    },
};

// 真正的 Google 登入
export const GoogleAuthGate: React.FC<GoogleAuthGateProps> = ({
    onAuthSuccess,
    selectedLanguage,
    onLanguageChange,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // 取得翻譯
    const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS['en'];

    // Web Client ID（用於 Web 和 Android 的 serverClientId）
    const WEB_CLIENT_ID = '708202943885-rev2dlrdaivfqavra8rc1q2u79o0vaht.apps.googleusercontent.com';

    // 初始化 Google Auth（Web 環境）
    useEffect(() => {
        // @ts-ignore
        const isNative = window.Capacitor?.isNativePlatform?.();
        if (!isNative) {
            // Web 環境：載入 Google Identity Services
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
    }, []);

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

        // --- 與後端驗證並同步用戶狀態的共用函數 ---
        const verifyUserWithBackend = async (email: string, displayName: string, photoUrl?: string, googleId?: string): Promise<GoogleUser> => {
            try {
                const response = await fetch('/api/google-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, displayName, photoUrl, googleId })
                });
                const data = await response.json();

                let isPro = localStorage.getItem('is_pro') === 'true';

                // 如果後端資料庫顯示他是 PRO 用戶 (包含之前的 Gumroad 買家)，就強制更新為 true
                if (data.success && data.user) {
                    if (data.user.isPro || data.user.subscriptionStatus === 'active') {
                        isPro = true;
                    }
                }

                return { email, displayName, photoUrl, isPro };
            } catch (err) {
                console.error("[GoogleAuth] Backend verification failed:", err);
                // 網路失敗時，退回使用本地狀態
                return { email, displayName, photoUrl, isPro: localStorage.getItem('is_pro') === 'true' };
            }
        };

        try {
            // @ts-ignore
            const isNative = window.Capacitor?.isNativePlatform?.();

            if (isNative) {
                // ===== 原生 App：使用 Capacitor Google Auth 插件 =====
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                await GoogleAuth.initialize({
                    clientId: WEB_CLIENT_ID,
                    scopes: ['profile', 'email'],
                    grantOfflineAccess: true,
                });

                const googleUser = await GoogleAuth.signIn();
                console.log('[GoogleAuth] Native sign-in success:', googleUser);

                const user = await verifyUserWithBackend(
                    googleUser.email,
                    googleUser.name || googleUser.email.split('@')[0],
                    googleUser.imageUrl,
                    googleUser.id
                );

                localStorage.setItem('google_user', JSON.stringify(user));
                localStorage.setItem('smp_user_email', user.email);
                setIsLoading(false);
                onAuthSuccess(user);

            } else {
                // ===== Web 環境：使用 Google OAuth2 Token Client（彈出視窗） =====
                // @ts-ignore
                if (!window.google?.accounts?.oauth2) {
                    setError('Google Sign-In SDK 載入中，請稍後再試');
                    setIsLoading(false);
                    return;
                }

                // @ts-ignore
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: WEB_CLIENT_ID,
                    scope: 'email profile',
                    callback: async (tokenResponse: any) => {
                        if (tokenResponse.error) {
                            console.error('[GoogleAuth] Token error:', tokenResponse);
                            setError('登入失敗，請重試');
                            setIsLoading(false);
                            return;
                        }

                        try {
                            // 用 access token 取得用戶資料
                            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                            });
                            const profile = await res.json();
                            console.log('[GoogleAuth] Web sign-in success:', profile);

                            const user = await verifyUserWithBackend(
                                profile.email,
                                profile.name || profile.email.split('@')[0],
                                profile.picture,
                                profile.sub
                            );

                            localStorage.setItem('google_user', JSON.stringify(user));
                            localStorage.setItem('smp_user_email', user.email);
                            setIsLoading(false);
                            onAuthSuccess(user);
                        } catch (err) {
                            console.error('[GoogleAuth] Userinfo fetch error:', err);
                            setError('登入失敗，請重試');
                            setIsLoading(false);
                        }
                    },
                });

                tokenClient.requestAccessToken();
            }
        } catch (err: any) {
            console.error('Google Sign-In Error:', err);
            const errorMsg = err?.message || '登入失敗，請重試';
            setError(errorMsg);
            setIsLoading(false);
        }
    };

    const currentFlag = UI_LANGUAGE_OPTIONS.find(opt => opt.value === selectedLanguage)?.flag || '🌐';

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
            style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #fffbf5 45%, #fff3e0 100%)' }}>

            {/* Soft warm orbs — light mode */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: 400, height: 400, top: '-10%', right: '-15%',
                        background: 'radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 70%)',
                        filter: 'blur(60px)'
                    }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: 300, height: 300, bottom: '5%', left: '-10%',
                        background: 'radial-gradient(circle, rgba(253,186,116,0.18) 0%, transparent 70%)',
                        filter: 'blur(50px)'
                    }}
                    animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
                />
            </div>

            {/* 🌐 Language Picker — top right */}
            {onLanguageChange && (
                <div ref={dropdownRef} className="absolute top-4 right-4 z-50">
                    <button
                        onClick={() => setShowLangDropdown(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-semibold shadow-sm transition-all"
                        style={{
                            background: 'rgba(255,255,255,0.9)',
                            borderColor: 'rgba(234,88,12,0.2)',
                            color: '#1c1917',
                        }}
                    >
                        <span className="text-base">{currentFlag}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    <AnimatePresence>
                        {showLangDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl border overflow-hidden"
                                style={{
                                    background: 'white',
                                    borderColor: 'rgba(0,0,0,0.08)',
                                    maxHeight: '55vh',
                                    overflowY: 'auto',
                                }}
                            >
                                {UI_LANGUAGE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            onLanguageChange(opt.value);
                                            setShowLangDropdown(false);
                                        }}
                                        className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-sm transition-colors hover:bg-orange-50"
                                        style={{
                                            fontWeight: selectedLanguage === opt.value ? 700 : 400,
                                            background: selectedLanguage === opt.value ? '#fff7ed' : undefined,
                                            color: '#1c1917',
                                        }}
                                    >
                                        <span className="text-lg">{opt.flag}</span>
                                        <span className="flex-1">{opt.label}</span>
                                        {selectedLanguage === opt.value && (
                                            <span style={{ color: '#ea580c', fontSize: '12px' }}>✓</span>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            {/* Content */}
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
                    className="mb-6"
                >
                    <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl"
                        style={{ boxShadow: '0 8px 32px rgba(255,107,43,0.3)' }}>
                        <img
                            src="/images/logo.png"
                            alt="Sausage Menu Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<span style="font-size:56px">🌭</span>';
                            }}
                        />
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="text-4xl font-extrabold text-center mb-2 tracking-tight"
                    style={{ color: '#1c1917' }}
                >
                    {t.title}
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="text-center mb-8 max-w-xs leading-relaxed"
                    style={{ color: 'var(--text-secondary)', fontSize: '15px' }}
                >
                    {t.subtitle}
                </motion.p>

                {/* Feature Cards */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="w-full mb-8 space-y-3"
                >
                    {/* Free Tier */}
                    <div className="p-4 flex items-center gap-4 rounded-2xl border"
                        style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(22,163,74,0.12)' }}>
                            <span style={{ color: '#16a34a', fontSize: '18px' }}>✓</span>
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>{t.freeInfo}</p>
                        </div>
                    </div>

                    {/* Pro Tier */}
                    <div className="p-4 flex items-center gap-4 rounded-2xl border"
                        style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(234,88,12,0.15)', boxShadow: '0 2px 8px rgba(234,88,12,0.06)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(234,88,12,0.1)' }}>
                            <span style={{ fontSize: '18px' }}>⭐</span>
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>{t.proInfo}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Google Sign In Button — Premium Style */}
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        background: 'white',
                        color: '#1c1917',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                        border: '1.5px solid rgba(0,0,0,0.08)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                            <span>{t.loading}</span>
                        </div>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>{t.googleButton}</span>
                        </>
                    )}
                </motion.button>

                {/* Google fallback */}
                <div id="google-signin-btn" className="mt-4 w-full flex justify-center" />

                {/* Error */}
                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm mt-4 text-center"
                    >
                        {error}
                    </motion.p>
                )}

                {/* Terms */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-8 max-w-xs"
                    style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6' }}
                >
                    {t.terms}
                </motion.p>
            </div>
        </div>
    );
};

export default GoogleAuthGate;
