import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { GUMROAD_PRODUCT_PERMALINK, LANGUAGE_TO_COUNTRY } from '../constants';
import { UserCountryStat, TargetLanguage } from '../types';
import { WELCOME_TRANSLATIONS } from './welcomeTranslations';

interface WelcomeGateProps {
  onVerify?: (verified: boolean) => void;
  totalUsers: number;
  countryStats: UserCountryStat[];
  selectedLanguage: TargetLanguage;
  onOpenPaywall?: () => void;
}

export const WelcomeGate: React.FC<WelcomeGateProps> = ({ onVerify, totalUsers, countryStats, selectedLanguage, onOpenPaywall }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  // 控制顯示模式：'email' (初始) 或 'purchase_or_code' (驗證失敗後)
  const [viewState, setViewState] = useState<'email' | 'purchase_or_code'>('email');

  const t = WELCOME_TRANSLATIONS[selectedLanguage] || WELCOME_TRANSLATIONS['default'];

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    // 如果是第一步，提示正在檢查；如果是第二步(有填code)，提示正在啟用
    const loadingMsg = code ? 'Activating Code...' : 'Checking Email...';
    const toastId = toast.loading(loadingMsg);

    try {
      // 使用用戶在 LanguageGate 選擇的語言來判斷國家
      const detectedCountry = LANGUAGE_TO_COUNTRY[selectedLanguage] || 'US';
      console.log(`[WelcomeGate] 使用語言 ${selectedLanguage} 推測國家: ${detectedCountry}`);

      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: code.trim(),
          country: detectedCountry
        })
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        toast.success(data.message || "Welcome back! Pro access verified.", { id: toastId });
        if (onVerify) onVerify(true);
      } else {
        // --- 驗證失敗的處理邏輯 ---

        // 如果原本是在第一步 (只查 Email)
        if (viewState === 'email') {
          toast.dismiss(toastId); // 關掉 loading
          // 不顯示紅字錯誤，而是溫和地切換到第二頁
          setViewState('purchase_or_code');
        } else {
          // 如果是在第二步 (輸入了 Code 還錯)
          toast.error(data.message || "Invalid Code or License.", { id: toastId });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Connection failed. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-sausage-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl space-y-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-sausage-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-4xl">🌭</span>
        </motion.div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SausageMenu</h1>
        <p className="text-sm text-sausage-600 font-medium -mt-2">{t.subtitle}</p>

        {/* 標題文字根據狀態改變 */}
        <p className="text-gray-500">
          {viewState === 'email'
            ? t.emailPrompt
            : t.emailNoLicense}
        </p>

        {/* --- 第一階段：乾淨的 Email 輸入 --- */}
        {viewState === 'email' && (
          <form onSubmit={handleVerify} className="space-y-4 text-left">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sausage-500 focus:border-sausage-500 transition-colors outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-sausage-600 hover:bg-sausage-700 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? t.checking : t.continueBtn}
            </button>
          </form>
        )}

        {/* --- 第二階段：購買 或 輸入序號 --- */}
        {viewState === 'purchase_or_code' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. 購買按鈕 (主要行動) */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">{t.opt1Title}</p>
              <a
                href={`https://gumroad.com/l/${GUMROAD_PRODUCT_PERMALINK}?email=${encodeURIComponent(email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all text-center no-underline"
              >
                {t.buyBtn}
              </a>

              {onOpenPaywall && (
                <button
                  onClick={onOpenPaywall}
                  className="block w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all text-center"
                >
                  {selectedLanguage === TargetLanguage.ChineseTW ? '直接在 App 內訂閱 (iOS/Android)' : 'Subscribe in App (iOS/Android)'}
                </button>
              )}
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">{t.or}</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* 2. 序號輸入 (次要行動 - 夜市用) */}
            <form onSubmit={handleVerify} className="space-y-3 text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">{t.opt2Title}</p>
              <div>
                <input
                  type="text"
                  placeholder={t.codePlaceholder}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono tracking-wider text-center uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code}
                className="w-full py-2 px-4 bg-white border-2 border-sausage-600 text-sausage-600 font-bold rounded-lg hover:bg-sausage-50 transition-all disabled:opacity-50"
              >
                {loading ? t.activating : t.activateBtn}
              </button>
            </form>

            {/* 返回按鈕 */}
            <button
              onClick={() => {
                setViewState('email');
                setCode('');
              }}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              {t.backBtn}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8">
          {t.byokNotice}
        </p>

      </div>
    </div>
  );
};
