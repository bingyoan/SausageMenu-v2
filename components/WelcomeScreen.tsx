import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Globe, History, Settings, CheckCircle, Lock, PenTool, ChevronDown, X, Plus, LogOut, BookOpen, MessageCircle, HelpCircle } from 'lucide-react';
import { TargetLanguage } from '../types';
import { LANGUAGE_OPTIONS } from '../constants';
import { UI_LANGUAGE_OPTIONS, getUIText } from '../i18n';
import { SausageDogLogo, PawPrint } from './DachshundAssets';

interface WelcomeScreenProps {
    onLanguageChange: (lang: TargetLanguage) => void;
    selectedLanguage: TargetLanguage;
    onImagesSelected: (files: File[], isHandwritingMode: boolean) => void;
    onViewHistory: () => void;
    onOpenSettings: () => void;
    isVerified: boolean;
    hasApiKey: boolean;
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
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
    onLanguageChange,
    selectedLanguage,
    onImagesSelected,
    onViewHistory,
    onOpenSettings,
    isVerified,
    hasApiKey,
    hidePrice,
    onHidePriceChange,
    uiLanguage,
    onUILanguageChange,
    onLogout,
    onViewLibrary,
    menuCount,
    onOpenPhrases,
    onOpenOnboarding
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [isHandwritingMode, setIsHandwritingMode] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    // Preview Selection State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // 取得當前語言的翻譯
    const t = getUIText(uiLanguage);

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
                    className={`p-3 rounded-full transition-colors shadow-sm border border-sausage-100 flex items-center justify-center ${!hasApiKey ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-sausage-700 hover:bg-sausage-50'}`}
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
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 min-w-[180px] max-h-[60vh] overflow-y-auto scroll-smooth">
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
                                        <span className="text-sm flex-1">{opt.label}</span>
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

                    <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${isVerified ? 'bg-white border-green-200 text-green-600' : 'bg-white border-sausage-200 text-sausage-600'}`}>
                        {isVerified ? <><CheckCircle size={12} /> {t.proUnlimited}</> : <><Lock size={12} /> {t.freeMode}</>}
                    </div>
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
                                    {opt.label}
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
                            disabled={!hasApiKey}
                            className={`w-full py-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 font-bold transition-all active:scale-95 border-b-4 ${hasApiKey ? 'bg-sausage-600 border-sausage-800 hover:bg-sausage-700 text-white' : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Camera size={32} />
                            <span className="text-lg">{t.takePhoto}</span>
                        </button>
                        <button
                            onClick={() => setShowPreview(true)}
                            disabled={!hasApiKey}
                            className={`w-full py-4 border-2 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 ${hasApiKey ? 'bg-white border-sausage-300 text-sausage-700 hover:bg-sausage-50' : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'}`}
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


            </div>

            <input type="file" accept="image/*" multiple capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
            <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        </div>
    );
};