import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, BookmarkPlus, Sparkles, MapPin, Loader2, Globe } from 'lucide-react';
import { TargetLanguage } from '../types';

interface SaveMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customName: string, shareToMap: boolean, address?: string, lat?: number, lng?: number) => void;
    suggestedName: string;
    thumbnailPreview?: string;
    itemCount: number;
    targetLanguage: TargetLanguage;
}

const TEXTS: Record<string, { title: string; placeholder: string; hint: string; save: string; skip: string; shareMap?: string; addressHint?: string; }> = {
    '繁體中文': { title: '儲存至菜單庫', placeholder: '輸入菜單名稱...', hint: 'AI 建議名稱', save: '儲存', skip: '跳過', shareMap: '同步分享至探索地圖', addressHint: '輸入餐廳地址...' },
    '繁體中文-HK': { title: '儲存至菜單庫', placeholder: '輸入菜單名稱...', hint: 'AI 建議名稱', save: '儲存', skip: '跳過', shareMap: '同步分享至探索地圖', addressHint: '輸入餐廳地址...' },
    'English': { title: 'Save to Menu Library', placeholder: 'Enter menu name...', hint: 'AI suggested', save: 'Save', skip: 'Skip', shareMap: 'Share to Map Explorer', addressHint: 'Enter address...' },
    '한국어': { title: '메뉴 라이브러리에 저장', placeholder: '메뉴 이름 입력...', hint: 'AI 추천', save: '저장', skip: '건너뛰기', shareMap: '탐색 지도에 공유', addressHint: '주소 입력...' },
    '日本語': { title: 'メニューライブラリに保存', placeholder: 'メニュー名を入力...', hint: 'AI推奨', save: '保存', skip: 'スキップ', shareMap: '探索マップに共有', addressHint: '住所を入力...' },
    'Français': { title: 'Enregistrer dans la bibliothèque', placeholder: 'Entrez le nom du menu...', hint: 'Suggestion IA', save: 'Enregistrer', skip: 'Passer' },
    'Español': { title: 'Guardar en biblioteca', placeholder: 'Ingrese nombre del menú...', hint: 'Sugerencia IA', save: 'Guardar', skip: 'Omitir' },
    'ไทย': { title: 'บันทึกไปยังคลังเมนู', placeholder: 'ใส่ชื่อเมนู...', hint: 'AI แนะนำ', save: 'บันทึก', skip: 'ข้าม' },
    'Tiếng Việt': { title: 'Lưu vào thư viện', placeholder: 'Nhập tên menu...', hint: 'AI gợi ý', save: 'Lưu', skip: 'Bỏ qua' },
    'Deutsch': { title: 'In Bibliothek speichern', placeholder: 'Menüname eingeben...', hint: 'AI-Vorschlag', save: 'Speichern', skip: 'Überspringen' },
    'Русский': { title: 'Сохранить в библиотеку', placeholder: 'Введите название меню...', hint: 'Предложение ИИ', save: 'Сохранить', skip: 'Пропустить' },
    'Tagalog': { title: 'I-save sa Library', placeholder: 'Ilagay ang pangalan ng menu...', hint: 'AI mungkahi', save: 'I-save', skip: 'Laktawan' },
    'Bahasa Indonesia': { title: 'Simpan ke Perpustakaan', placeholder: 'Masukkan nama menu...', hint: 'Saran AI', save: 'Simpan', skip: 'Lewati' },
};

export const SaveMenuModal: React.FC<SaveMenuModalProps> = ({ isOpen, onClose, onSave, suggestedName, thumbnailPreview, itemCount, targetLanguage }) => {
    const [customName, setCustomName] = useState('');
    const [shareToMap, setShareToMap] = useState(false);
    const [address, setAddress] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const t = TEXTS[targetLanguage] || TEXTS['English'];

    useEffect(() => { 
        if (isOpen) {
            setCustomName(suggestedName || '');
            setShareToMap(false);
            setAddress('');
            setAddressSuggestions([]);
            setSelectedLocation(null);
            setIsProcessing(false);
        }
    }, [isOpen, suggestedName]);

    // Debounced Address Search
    useEffect(() => {
        if (!address.trim() || address.length < 2) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (selectedLocation) return; // Prevent searching if they just selected from dropdown

        // Try to parse direct coordinates (e.g. "33.5855, 130.3927" or from Google Maps)
        const coordMatch = address.trim().match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            setAddressSuggestions([{ 
                display_name: `📍 座標定位: ${lat}, ${lng} (您可以直接點擊使用此座標)`, 
                lat: lat, 
                lon: lng 
            }]);
            setShowSuggestions(true);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingAddress(true);
            try {
                const res = await fetch(`/api/places?action=autocomplete&q=${encodeURIComponent(address)}`);
                const data = await res.json();
                if (data.predictions) {
                    const formatted = data.predictions.map((p: any) => ({
                        display_name: p.description,
                        place_id: p.place_id
                    }));
                    setAddressSuggestions(formatted);
                } else {
                    setAddressSuggestions([]);
                }
                setShowSuggestions(true);
            } catch (err) {
                console.error(err);
            }
            setIsSearchingAddress(false);
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [address, selectedLocation]);

    const handleSave = async () => {
        if (shareToMap && !address.trim()) {
            alert('請輸入地址以便分享至地圖');
            return;
        }

        let lat = selectedLocation?.lat;
        let lng = selectedLocation?.lng;

        if (shareToMap && (!lat || !lng)) {
            // Check if address is directly a coordinate just in case they didn't click the dropdown
            const coordMatch = address.trim().match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
            if (coordMatch) {
                lat = parseFloat(coordMatch[1]);
                lng = parseFloat(coordMatch[2]);
            } else {
                setIsProcessing(true);
                try {
                    const geoRes = await fetch(`/api/places?action=findPlace&q=${encodeURIComponent(address.trim())}`);
                    const geoData = await geoRes.json();
                    if (geoData.candidates && geoData.candidates.length > 0) {
                        lat = parseFloat(geoData.candidates[0].geometry.location.lat);
                        lng = parseFloat(geoData.candidates[0].geometry.location.lng);
                    } else {
                        alert('無法精準定位此地址。請嘗試從下拉選單選擇，或直接輸入「緯度, 經度」。');
                        setIsProcessing(false);
                        return;
                    }
                } catch (err) {
                    console.error(err);
                    alert('解析座標失敗，請檢查網路。');
                    setIsProcessing(false);
                    return;
                }
            }
        }

        onSave(customName.trim() || suggestedName || '未命名菜單', shareToMap, address.trim(), lat, lng);
    };

    const handleUseSuggested = () => setCustomName(suggestedName);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2"><BookmarkPlus className="text-white" size={22} /><h2 className="text-white font-bold text-lg">{t.title}</h2></div>
                            <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {thumbnailPreview && (
                                <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden">
                                    <img src={`data:image/jpeg;base64,${thumbnailPreview}`} alt="Menu preview" className="w-full h-full object-cover" />
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">{itemCount} items</div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={t.placeholder} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:border-amber-500 focus:outline-none transition-colors" autoFocus maxLength={50} />
                                {suggestedName && suggestedName !== customName && (
                                    <button onClick={handleUseSuggested} className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 transition-colors">
                                        <Sparkles size={14} /><span className="font-medium">{t.hint}: </span><span className="text-gray-600 truncate max-w-[180px]">{suggestedName}</span>
                                    </button>
                                )}
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-amber-50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={shareToMap} 
                                        onChange={(e) => setShareToMap(e.target.checked)} 
                                        className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500" 
                                    />
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                        <Globe size={16} className="text-emerald-500" />
                                        {t.shareMap || '同步分享至探索地圖幫助他人'}
                                    </div>
                                </label>
                                
                                <AnimatePresence>
                                    {shareToMap && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: 'auto', opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }} 
                                            className="overflow-visible pt-2 px-2"
                                        >
                                            <div className="relative z-40">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={address}
                                                        onChange={(e) => {
                                                            setAddress(e.target.value);
                                                            setSelectedLocation(null);
                                                            setShowSuggestions(true);
                                                        }}
                                                        onFocus={() => {
                                                            if (addressSuggestions.length > 0) setShowSuggestions(true);
                                                        }}
                                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                        placeholder={t.addressHint || '輸入餐廳地址...'}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 pl-8 py-2.5 text-sm focus:outline-none focus:border-emerald-500 pr-10 shadow-inner"
                                                    />
                                                    <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                                                    {isSearchingAddress && (
                                                        <Loader2 size={14} className="animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                                    )}
                                                </div>

                                                <AnimatePresence>
                                                    {showSuggestions && addressSuggestions.length > 0 && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -5 }}
                                                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto z-50 origin-top"
                                                        >
                                                            {addressSuggestions.map((sug, i) => (
                                                                <div 
                                                                    key={i}
                                                                    className="px-3 py-2 text-[11px] md:text-xs text-gray-700 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                                    onClick={async () => {
                                                                        setAddress(sug.display_name);
                                                                        setShowSuggestions(false);
                                                                        if (sug.place_id) {
                                                                            try {
                                                                                const res = await fetch(`/api/places?action=details&place_id=${sug.place_id}`);
                                                                                const data = await res.json();
                                                                                if (data.result?.geometry?.location) {
                                                                                    setSelectedLocation({ lat: data.result.geometry.location.lat, lng: data.result.geometry.location.lng });
                                                                                }
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                            }
                                                                        } else if (sug.lat !== undefined && sug.lon !== undefined) {
                                                                            setSelectedLocation({ lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) });
                                                                        }
                                                                    }}
                                                                >
                                                                    <MapPin size={10} className="inline-block mr-1 text-emerald-500 shrink-0 align-text-bottom" />
                                                                    <span className="align-middle leading-tight">{sug.display_name}</span>
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <p className="text-[10px] text-emerald-600 mt-1">
                                                    系統將根據輸入的地址進行定位
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={onClose} disabled={isProcessing} className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">{t.skip}</button>
                                <button onClick={handleSave} disabled={isProcessing} className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 transition-colors shadow-lg shadow-amber-500/30 disabled:opacity-50">
                                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    {t.save}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
