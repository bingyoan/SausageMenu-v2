import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Camera, Upload, Globe, History, Settings, CheckCircle, Lock, PenTool, ChevronDown, X, Plus, LogOut, BookOpen, MessageCircle, HelpCircle, Users } from 'lucide-react';
import { TargetLanguage } from '../types';
import { LANGUAGE_OPTIONS } from '../constants';
import { UI_LANGUAGE_OPTIONS, getUIText, getTranslatedLanguageName } from '../i18n';
import { SausageDogLogo, PawPrint } from './DachshundAssets';

interface WelcomeScreenProps {
    onLanguageChange: (lang: TargetLanguage) => void;
    selectedLanguage: TargetLanguage;
    onImagesSelected: (files: File[], isHandwritingMode: boolean) => void;
    onViewHistory: () => void;
    onOpenSettings: () => void;
    isVerified: boolean;
    onUpgradeClick: () => void;
    hidePrice: boolean;
    onHidePriceChange: (hide: boolean) => void;
    // 新增：介面語言
    uiLanguage: TargetLanguage;
    onUILanguageChange: (lang: TargetLanguage) => void;
    // 新增：登出
    onLogout: () => void;
    // 新增：菜單庫
    onViewLibrary: () => void;
    menuCount: number;
    onOpenPhrases: () => void;
    onOpenOnboarding: () => void;
    // 新增：使用次數
    remainingUses: number;
    dailyLimit: number;
    isPro: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    onLanguageChange,
    selectedLanguage,
    onImagesSelected,
    onViewHistory,
    onOpenSettings,
    isVerified,
    onUpgradeClick,
    hidePrice,
    onHidePriceChange,
    uiLanguage,
    onUILanguageChange,
    onLogout,
    onViewLibrary,
    menuCount,
    onOpenPhrases,
    onOpenOnboarding,
    remainingUses,
    dailyLimit,
    isPro
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [isHandwritingMode, setIsHandwritingMode] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [showPlanTooltip, setShowPlanTooltip] = useState(false);

    // Preview Selection State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [appBuyers, setAppBuyers] = useState<number>(0);
    const [showContactPopup, setShowContactPopup] = useState(false);

    // 取得當前語言的翻譯
    const t = getUIText(uiLanguage);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/user-stats');
                const data = await res.json();
                if (data.success && data.totalUsers) {
                    setAppBuyers(data.totalUsers);
                }
            } catch (e) {
                console.error("Failed to fetch user stats", e);
            }
        };
        fetchStats();
    }, []);

    // 鎖定直式畫面
    useEffect(() => {
        try {
            // @ts-ignore
            screen.orientation?.lock?.('portrait').catch(() => { });
        } catch (e) { }
    }, []);

    // 購買推薦碼
    const handlePurchaseReferralCode = async () => {
        const email = prompt('請輸入你的 Email，付款完成後推薦碼將發送到此信箱：');

        if (!email || !email.includes('@')) {
            if (email !== null) {
                alert('請輸入有效的 Email 地址');
            }
            return;
        }

        setPurchaseLoading(true);

        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (data.success && data.url) {
                // 跳轉到 Stripe Checkout 頁面
                window.location.href = data.url;
            } else {
                alert('❌ ' + (data.message || '發生錯誤，請稍後再試'));
            }
        } catch (error) {
            console.error('Purchase request failed:', error);
            alert('❌ 網路連線失敗，請稍後再試');
        } finally {
            setPurchaseLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            console.log("Files selected:", e.target.files.length);
            const newFiles = Array.from(e.target.files);
            // Combine with existing text but max 4
            const combined = [...selectedFiles, ...newFiles].slice(0, 4);
            setSelectedFiles(combined);
            setShowPreview(true);
            e.target.value = ''; // Reset input
        }
    };

    // Update preview URLs when files change
    useEffect(() => {
        const urls = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
        return () => {
            urls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [selectedFiles]);

    const handleRemoveImage = (index: number) => {
        const newFiles = [...selectedFiles];
        newFiles.splice(index, 1);
        setSelectedFiles(newFiles);
        if (newFiles.length === 0) setShowPreview(false);
    };

    const handleStartScanning = () => {
        if (selectedFiles.length > 0) {
            onImagesSelected(selectedFiles, isHandwritingMode);
            setShowPreview(false);
            setSelectedFiles([]); // Clear after sending
        }
    };

    // 取得當前語言的 flag
    const currentFlag = UI_LANGUAGE_OPTIONS.find(opt => opt.value === uiLanguage)?.flag || '🌐';

    return (
        <div className="flex flex-col h-full bg-sausage-50 relative overflow-hidden">
            {/* Image Preview Overlay - Changed to Absolute to avoid Framer Motion transform issues */}
            {showPreview && (
                <div className="absolute inset-0 z-[100] bg-sausage-900/95 backdrop-blur-sm flex items-center justify-center p-6 h-full w-full">
                    <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90%] overflow-y-auto">
                        <button
                            onClick={() => { setShowPreview(false); setSelectedFiles([]); }}
                            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-600" />
                        </button>

                        <h2 className="text-2xl font-black text-sausage-900 mb-6 text-center">
                            {t.selectedMenus}
                        </h2>

                        {/* 4 Empty Slots Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {[0, 1, 2, 3].map((index) => (
                                <div key={index} className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 relative overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {previewUrls[index] ? (
                                        <>
                                            <img
                                                src={previewUrls[index]}
                                                alt={`Menu ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={selectedFiles.length >= 4}
                                            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={32} className="mb-2 opacity-50" />
                                            <span className="text-xs font-bold">{t.addPhoto}</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-gray-400 text-sm mb-6">
                            {selectedFiles.length} / 4 {t.maxPhotos}
                        </p>

                        <button
                            onClick={handleStartScanning}
                            className="w-full py-4 bg-sausage-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-sausage-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Camera size={24} />
                            {t.startScanning}
                        </button>
                    </div>
                </div>
            )}

            {/* Fixed Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <PawPrint className="absolute top-10 left-[-20px] w-24 h-24 text-sausage-200 opacity-50 rotate-[-15deg]" />
                <PawPrint className="absolute bottom-10 right-[-20px] w-40 h-40 text-sausage-200 opacity-50 rotate-[15deg]" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center p-4 z-20 sticky top-0 bg-sausage-50/80 backdrop-blur-sm">
                <button
                    onClick={onOpenSettings}
                    className={`p-3 rounded-full transition-colors shadow-sm border border-sausage-100 flex items-center justify-center bg-white text-sausage-700 hover:bg-sausage-50`}
                >
                    <Settings size={20} />
                </button>

                {/* 介面語言選擇器 */}
                <div className="relative">
                    <button
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-sm border border-sausage-100 hover:bg-sausage-50 transition-colors"
                    >
                        <span className="text-lg">{currentFlag}</span>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 語言下拉選單 */}
                    {showLangDropdown && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowLangDropdown(false)} />
                            <div className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 min-w-[180px] max-h-[50vh] overflow-y-auto scroll-smooth">
                                {UI_LANGUAGE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            // 同時更新介面語言和翻譯目標語言
                                            onUILanguageChange(opt.value);
                                            onLanguageChange(opt.value); // 這是關鍵！這行之前缺失了
                                            setShowLangDropdown(false);
                                        }}
                                        className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-sausage-50 transition-colors text-left ${uiLanguage === opt.value ? 'bg-sausage-50 font-bold' : ''}`}
                                    >
                                        <span className="text-lg">{opt.flag}</span>
                                        <span className="text-sm flex-1">{getTranslatedLanguageName(opt.value, uiLanguage)}</span>
                                        {uiLanguage === opt.value && (
                                            <span className="text-sausage-600 text-xs">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* 菜單庫按鈕 */}
                <button
                    onClick={onViewLibrary}
                    className="p-3 bg-white text-amber-600 rounded-full hover:bg-amber-50 transition-colors shadow-sm border border-amber-200 relative"
                >
                    <BookOpen size={20} />
                    {menuCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                            {menuCount > 99 ? '99+' : menuCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={onViewHistory}
                    className="p-3 bg-white text-sausage-700 rounded-full hover:bg-sausage-50 transition-colors shadow-sm border border-sausage-100"
                >
                    <History size={20} />
                </button>

                {/* 新手引導按鈕 */}
                <button
                    onClick={onOpenOnboarding}
                    className="p-3 bg-white text-blue-500 rounded-full hover:bg-blue-50 transition-colors shadow-sm border border-blue-100"
                >
                    <HelpCircle size={20} />
                </button>

                {/* Logout Button (Only if verified) */}
                {isVerified && (
                    <button
                        onClick={() => {
                            if (window.confirm(t.logout + '?')) {
                                onLogout();
                            }
                        }}
                        className="ml-2 p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm border border-red-100"
                    >
                        <LogOut size={20} />
                    </button>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-6 z-10">
                <div className="text-center pt-4">
                    <div className="animate-bounce-slow inline-block">
                        <img src="/dachshund-silhouette.png" alt="Sausage Dog" className="w-80 h-56 mx-auto drop-shadow-lg object-contain" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-sausage-900 mt-4 tracking-tight leading-tight">
                        Sausage Dog <br /><span className="text-sausage-600">Menu Pal</span>
                    </h1>

                    <div>
                        <button
                            onClick={() => {
                                if (!isVerified) {
                                    onUpgradeClick();
                                } else {
                                    setShowPlanTooltip(!showPlanTooltip);
                                }
                            }}
                            className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm border cursor-pointer transition-all hover:scale-105 ${isVerified ? 'bg-white border-green-200 text-green-600' : 'bg-white border-sausage-200 text-amber-600'}`}
                        >
                            {isVerified ? <><CheckCircle size={12} /> {t.proUnlimited}</> : <><Lock size={12} /> 升級 PRO / Upgrade to PRO</>}
                        </button>
                    </div>
                </div>

                {/* 剩餘免費次數顯示 */}
                <div className="mt-3 text-center">
                    {isPro ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 border border-green-200 text-green-600">
                            ✨ {t.unlimitedUses}
                        </span>
                    ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${remainingUses > 0
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-red-50 border-red-200 text-red-500'
                            }`}>
                            📊 {t.remainingUses}: {remainingUses} / {dailyLimit}
                        </span>
                    )}
                </div>

                <div className="w-full max-w-sm mx-auto bg-white p-6 rounded-[2rem] shadow-xl border-4 border-sausage-100 space-y-5">
                    {/* ... existing selectors ... */}
                    <div className="bg-sausage-50 p-1 rounded-xl border border-sausage-200">
                        <div className="flex items-center gap-2 px-3 py-2 text-sausage-800 font-bold text-xs uppercase tracking-wider mb-1">
                            <Globe size={14} /> {t.translateTo}
                        </div>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => onLanguageChange(e.target.value as TargetLanguage)}
                            className="w-full p-3 bg-white rounded-lg shadow-sm text-sausage-900 focus:outline-none font-bold text-lg text-center"
                        >
                            {LANGUAGE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {getTranslatedLanguageName(opt.value, uiLanguage)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Handwriting Mode Toggle */}
                    <div
                        onClick={() => setIsHandwritingMode(!isHandwritingMode)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isHandwritingMode ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isHandwritingMode ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-400'}`}>
                                <PenTool size={20} />
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${isHandwritingMode ? 'text-amber-900' : 'text-gray-500'}`}>{t.handwritingMode}</p>
                                <p className="text-[10px] text-gray-400 leading-tight">{t.handwritingDesc}</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isHandwritingMode ? 'bg-amber-500' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isHandwritingMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Hide Price Feature */}
                    <div
                        onClick={() => onHidePriceChange(!hidePrice)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${hidePrice ? 'bg-sausage-50 border-sausage-400' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${hidePrice ? 'bg-sausage-200 text-sausage-800' : 'bg-gray-100 text-gray-400'}`}>
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${hidePrice ? 'text-sausage-900' : 'text-gray-500'}`}>{t.hidePrice}</p>
                                <p className="text-[10px] text-gray-400 leading-tight">{t.hidePriceDesc}</p>
                            </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${hidePrice ? 'bg-sausage-600' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${hidePrice ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-1">
                        {/* 購買推薦碼按鈕 - 暫時移除，等設定台灣付款方式後再啟用 */}

                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className={`w-full py-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 font-bold transition-all active:scale-95 border-b-4 bg-sausage-600 border-sausage-800 hover:bg-sausage-700 text-white`}
                        >
                            <Camera size={32} />
                            <span className="text-lg">{t.takePhoto}</span>
                        </button>
                        <button
                            onClick={() => setShowPreview(true)}
                            className={`w-full py-4 border-2 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 bg-white border-sausage-300 text-sausage-700 hover:bg-sausage-50`}
                        >
                            <Upload size={20} />
                            {t.uploadGallery}
                        </button>

                        {/* 餐廳常用語按鈕 */}
                        <button
                            onClick={onOpenPhrases}
                            className="w-full py-4 border-2 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100"
                        >
                            <MessageCircle size={20} />
                            {t.phrasesBtn || '餐廳常用語'}
                        </button>
                    </div>
                </div>

                {/* 已 APP 購買人數區塊 - 始終顯示 */}
                {(
                    <div className="w-full max-w-sm mx-auto bg-sausage-50 px-6 py-4 rounded-[2rem] shadow-sm border-2 border-sausage-100">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 text-sausage-800 font-bold text-sm">
                                <Users size={16} /> {t.totalUsers}
                            </div>
                            <div className="text-sausage-600 font-bold text-lg">
                                {appBuyers} / 500
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                            <div
                                className="bg-sausage-600 h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min((appBuyers / 500) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}



            </div>

            <input type="file" accept="image/*" multiple capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
            <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

            {/* 方案提示窗 - 用 createPortal 渲染到 body 避免 transform 影響 */}
            {showPlanTooltip && typeof document !== 'undefined' && ReactDOM.createPortal(
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
                        onClick={() => setShowPlanTooltip(false)}
                    />
                    <div
                        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: '80vw', maxWidth: '300px' }}
                    >
                        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '2px solid #fed7aa', padding: '20px', position: 'relative' }}>
                            <button onClick={() => setShowPlanTooltip(false)} style={{ position: 'absolute', top: '12px', right: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={16} />
                            </button>
                            <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#292524', marginBottom: '16px' }}>{t.planCompare}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ color: '#16a34a', fontSize: '14px' }}>✓</span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#292524', margin: 0 }}>{t.planFreeTitle}</p>
                                        <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0' }}>{t.planFreeDesc}</p>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px dashed #d6d3d1' }} />
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#ffedd5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ color: '#ea580c', fontSize: '14px' }}>⭐</span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#292524', margin: 0 }}>{t.planProTitle}</p>
                                        <p style={{ fontSize: '12px', color: '#78716c', margin: '2px 0 0' }}>{t.planProDesc}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
            {/* 📞 浮動聯絡按鈕 (取代 Crisp) */}
            <button
                onClick={() => setShowContactPopup(true)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9990,
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: '#22c55e', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                {/* 對話泡泡 + 加號圖示 */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 11.5C21 16.75 16.75 21 11.5 21C9.8 21 8.2 20.55 6.8 19.75L3 21L4.25 17.2C3.45 15.8 3 14.2 3 12.5C3 7.25 7.25 3 12.5 3C17.75 3 21 6.25 21 11.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M12 8V15M8.5 11.5H15.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {/* 📞 聯絡彈窗 */}
            {showContactPopup && typeof document !== 'undefined' && ReactDOM.createPortal(
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                        onClick={() => setShowContactPopup(false)}
                    />
                    <div
                        style={{
                            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            zIndex: 99999, width: '90vw', maxWidth: '360px',
                            animation: 'contactPopupBounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        }}
                    >
                        <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                            {/* 頂部裝飾 */}
                            <div style={{
                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                padding: '28px 24px 36px', textAlign: 'center', position: 'relative'
                            }}>
                                <button
                                    onClick={() => setShowContactPopup(false)}
                                    style={{
                                        position: 'absolute', top: '14px', right: '14px',
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)', border: 'none',
                                        color: 'white', fontSize: '16px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >✕</button>
                                <div style={{
                                    width: '56px', height: '56px', background: 'white', borderRadius: '50%',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)', margin: '0 auto 12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
                                }}>💬</div>
                                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>聯絡我們</h2>
                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>有任何問題歡迎聯繫！</p>
                            </div>

                            {/* 內容區 */}
                            <div style={{ padding: '20px 20px 28px' }}>
                                {/* WhatsApp */}
                                <a
                                    href="https://wa.me/qr/KCBQ3XCKEFEWC1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: '#f5f5f4', borderRadius: '16px', padding: '14px 16px',
                                        marginBottom: '10px', textDecoration: 'none', transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', background: '#25D366', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, color: '#292524', fontSize: '15px', margin: 0 }}>WhatsApp</p>
                                        <p style={{ color: '#a8a29e', fontSize: '12px', margin: '2px 0 0' }}>直接傳訊息給我們</p>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                                </a>

                                {/* Line 社群 */}
                                <a
                                    href="https://reurl.cc/7bZXny"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: '#f5f5f4', borderRadius: '16px', padding: '14px 16px',
                                        marginBottom: '10px', textDecoration: 'none', transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '44px', height: '44px', background: '#06C755', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 01-.63-.629V8.108a.63.63 0 01.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 01-.63.629.626.626 0 01-.51-.262l-2.06-2.818v2.451a.63.63 0 01-.63.629.63.63 0 01-.63-.629V8.108a.63.63 0 01.63-.63c.2 0 .381.095.51.264l2.054 2.828V8.108a.63.63 0 011.266 0v4.771zm-5.741 0a.63.63 0 01-1.262 0V8.108a.63.63 0 011.262 0v4.771zm-2.498.629H4.884a.63.63 0 01-.63-.629V8.108a.63.63 0 011.262 0v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, color: '#292524', fontSize: '15px', margin: 0 }}>加入匿名 Line 社群</p>
                                        <p style={{ color: '#a8a29e', fontSize: '12px', margin: '2px 0 0' }}>與其他旅遊愛好者交流</p>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                                </a>

                                {/* Email */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    background: '#f5f5f4', borderRadius: '16px', padding: '14px 16px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', background: '#f97316', borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        fontSize: '20px'
                                    }}>📧</div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, color: '#292524', fontSize: '13px', margin: 0 }}>聯絡信箱</p>
                                        <p style={{ color: '#78716c', fontSize: '14px', margin: '2px 0 0', fontWeight: 600 }}>Bingyoan@gmail.com</p>
                                    </div>
                                </div>

                                {/* 關閉 */}
                                <button
                                    onClick={() => setShowContactPopup(false)}
                                    style={{
                                        display: 'block', width: '100%', textAlign: 'center',
                                        color: '#a8a29e', fontSize: '12px', background: 'none',
                                        border: 'none', cursor: 'pointer', padding: '4px'
                                    }}
                                >關閉</button>
                            </div>
                        </div>
                    </div>
                    <style>{`
                        @keyframes contactPopupBounce {
                            0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0; }
                            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                        }
                    `}</style>
                </>,
                document.body
            )}

        </div>
    );
};