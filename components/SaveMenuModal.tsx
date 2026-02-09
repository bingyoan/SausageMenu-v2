import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, BookmarkPlus, Sparkles } from 'lucide-react';
import { TargetLanguage } from '../types';

interface SaveMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customName: string) => void;
    suggestedName: string;
    thumbnailPreview?: string;
    itemCount: number;
    targetLanguage: TargetLanguage;
}

// 多語言文字
const TEXTS: Record<string, { title: string; placeholder: string; hint: string; save: string; skip: string }> = {
    '繁體中文': { title: '儲存至菜單庫', placeholder: '輸入菜單名稱...', hint: 'AI 建議名稱', save: '儲存', skip: '跳過' },
    '繁體中文-HK': { title: '儲存至菜單庫', placeholder: '輸入菜單名稱...', hint: 'AI 建議名稱', save: '儲存', skip: '跳過' },
    'English': { title: 'Save to Menu Library', placeholder: 'Enter menu name...', hint: 'AI suggested', save: 'Save', skip: 'Skip' },
    '한국어': { title: '메뉴 라이브러리에 저장', placeholder: '메뉴 이름 입력...', hint: 'AI 추천', save: '저장', skip: '건너뛰기' },
    '日本語': { title: 'メニューライブラリに保存', placeholder: 'メニュー名を入力...', hint: 'AI推奨', save: '保存', skip: 'スキップ' },
    'Français': { title: 'Enregistrer dans la bibliothèque', placeholder: 'Entrez le nom du menu...', hint: 'Suggestion IA', save: 'Enregistrer', skip: 'Passer' },
    'Español': { title: 'Guardar en biblioteca', placeholder: 'Ingrese nombre del menú...', hint: 'Sugerencia IA', save: 'Guardar', skip: 'Omitir' },
    'ไทย': { title: 'บันทึกไปยังคลังเมนู', placeholder: 'ใส่ชื่อเมนู...', hint: 'AI แนะนำ', save: 'บันทึก', skip: 'ข้าม' },
    'Tiếng Việt': { title: 'Lưu vào thư viện', placeholder: 'Nhập tên menu...', hint: 'AI gợi ý', save: 'Lưu', skip: 'Bỏ qua' },
    'Deutsch': { title: 'In Bibliothek speichern', placeholder: 'Menüname eingeben...', hint: 'AI-Vorschlag', save: 'Speichern', skip: 'Überspringen' },
    'Русский': { title: 'Сохранить в библиотеку', placeholder: 'Введите название меню...', hint: 'Предложение ИИ', save: 'Сохранить', skip: 'Пропустить' },
    'Tagalog': { title: 'I-save sa Library', placeholder: 'Ilagay ang pangalan ng menu...', hint: 'AI mungkahi', save: 'I-save', skip: 'Laktawan' },
    'Bahasa Indonesia': { title: 'Simpan ke Perpustakaan', placeholder: 'Masukkan nama menu...', hint: 'Saran AI', save: 'Simpan', skip: 'Lewati' },
};

export const SaveMenuModal: React.FC<SaveMenuModalProps> = ({
    isOpen,
    onClose,
    onSave,
    suggestedName,
    thumbnailPreview,
    itemCount,
    targetLanguage
}) => {
    const [customName, setCustomName] = useState('');
    const t = TEXTS[targetLanguage] || TEXTS['English'];

    useEffect(() => {
        if (isOpen) {
            setCustomName(suggestedName || '');
        }
    }, [isOpen, suggestedName]);

    const handleSave = () => {
        onSave(customName.trim() || suggestedName || '未命名菜單');
    };

    const handleUseSuggested = () => {
        setCustomName(suggestedName);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookmarkPlus className="text-white" size={22} />
                                <h2 className="text-white font-bold text-lg">{t.title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Thumbnail Preview */}
                            {thumbnailPreview && (
                                <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden">
                                    <img
                                        src={`data:image/jpeg;base64,${thumbnailPreview}`}
                                        alt="Menu preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                        {itemCount} items
                                    </div>
                                </div>
                            )}

                            {/* Name Input */}
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder={t.placeholder}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 font-medium focus:border-amber-500 focus:outline-none transition-colors"
                                    autoFocus
                                    maxLength={50}
                                />

                                {/* AI Suggested Name */}
                                {suggestedName && suggestedName !== customName && (
                                    <button
                                        onClick={handleUseSuggested}
                                        className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 transition-colors"
                                    >
                                        <Sparkles size={14} />
                                        <span className="font-medium">{t.hint}: </span>
                                        <span className="text-gray-600 truncate max-w-[180px]">{suggestedName}</span>
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    {t.skip}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 transition-colors shadow-lg shadow-amber-500/30"
                                >
                                    <Save size={18} />
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
