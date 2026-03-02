import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, AlertTriangle, Info, Filter, X, Check, Zap, Volume2, MessageCircle, LayoutGrid, List } from 'lucide-react';
import { MenuItem, MenuData, Cart, TargetLanguage, CartItem, MenuOption } from '../types';
import { explainDish } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { ALLERGENS_LIST, ALLERGENS_MAP } from '../constants';
import { SausageDogLogo } from './DachshundAssets';
import { useTTS } from '../hooks/useTTS';
import { RestaurantPhrases } from './RestaurantPhrases';

const FILTER_TRANSLATIONS: Record<string, { title: string; desc: string; apply: string }> = {
    '繁體中文': { title: '飲食禁忌', desc: '選擇您不吃的食材，包含這些成分的選項將被隱藏。', apply: '套用篩選' },
    '繁體中文-HK': { title: '飲食禁忌', desc: '選擇您不吃的食材，包含這些成分的選項將被隱藏。', apply: '套用篩選' },
    'English': { title: 'Dietary Exclusions', desc: 'Select ingredients you want to avoid. Items containing these will be hidden.', apply: 'Apply Filters' },
    '日本語': { title: '食事の制限', desc: '避けるべき食材を選択してください。これらを含むメニューは非表示になります。', apply: '適用' },
    '한국어': { title: '식단 제한', desc: '피해야 할 식재료를 선택하세요. 해당 성분이 포함된 메뉴는 숨겨집니다.', apply: '필터 적용' },
    'Français': { title: 'Exclusions Diététiques', desc: 'Sélectionnez les ingrédients à éviter. Les plats qui les contiennent seront masqués.', apply: 'Appliquer' },
    'Español': { title: 'Exclusiones Dietéticas', desc: 'Seleccione los ingredientes que desea evitar. Los platos que los contengan se ocultarán.', apply: 'Aplicar' },
    'ไทย': { title: 'ข้อจำกัดด้านอาหาร', desc: 'เลือกส่วนผสมที่ต้องการหลีกเลี่ยง เมนูที่มีส่วนผสมเหล่านี้จะถูกซ่อน', apply: 'นำไปใช้' },
    'Tiếng Việt': { title: 'Hạn chế Ăn uống', desc: 'Chọn những nguyên liệu bạn muốn tránh. Các món chứa chúng sẽ bị ẩn.', apply: 'Áp dụng' },
    'Deutsch': { title: 'Ernährungseinschränkungen', desc: 'Wählen Sie Zutaten zur Vermeidung. Gerichte damit werden ausgeblendet.', apply: 'Anwenden' },
    'Русский': { title: 'Диетические Ограничения', desc: 'Выберите ингредиенты, которых хотите избежать. Блюда с ними будут скрыты.', apply: 'Применить' },
    'Tagalog': { title: 'Mga Bawal sa Pagkain', desc: 'Piliin ang mga sangkap na nais iwasan. Itatago ang mga pagkaing mayroon nito.', apply: 'Ilapat' },
    'Bahasa Indonesia': { title: 'Pengecualian Diet', desc: 'Pilih bahan yang ingin dihindari. Menu yang mengandung bahan ini akan disembunyikan.', apply: 'Terapkan' },
    'Polski': { title: 'Wykluczenia Dietetyczne', desc: 'Wybierz składniki do uniknięcia. Dania je zawierające zostaną ukryte.', apply: 'Zastosuj' },
    'Bahasa Melayu': { title: '飲食禁忌', desc: '選擇您不吃的食材，包含這些成分的選項將被隱藏。', apply: '套用篩選' },
    'Italiano': { title: 'Restrizioni Alimentari', desc: 'Seleziona gli ingredienti da evitare. I piatti che li contengono verranno nascosti.', apply: 'Applica' },
    'Português': { title: 'Restrições Alimentares', desc: 'Selecione os ingredientes que você não come. Os pratos que os contêm serão ocultados.', apply: 'Aplicar' },
};

interface OrderingPageProps {
    menuData: MenuData;
    cart: Cart;
    targetLang: TargetLanguage;
    onUpdateCart: (item: MenuItem, delta: number) => void;
    onViewSummary: () => void;
    onBack: () => void;
    taxRate: number;
    serviceRate: number;
    hidePrice?: boolean;
    isLoadingMore?: boolean;  // ⭐ 逐頁處理時，後續頁面仍在載入中
}

export const OrderingPage: React.FC<OrderingPageProps> = ({
    menuData,
    cart,
    targetLang,
    onUpdateCart,
    onViewSummary,
    onBack,
    taxRate,
    serviceRate,
    hidePrice = false,
    isLoadingMore = false
}) => {
    const [activeCategory, setActiveCategory] = useState<string>(menuData.items[0]?.category || 'General');
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

    // Feature 1: Allergen Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);

    // 🔊 TTS 語音功能
    const { speakWithId, speakingId, isSupported: ttsSupported } = useTTS();
    const [showPhrases, setShowPhrases] = useState(false);

    // 📐 List / Grid view mode
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('menuViewMode') as 'list' | 'grid') || 'list';
        }
        return 'list';
    });
    const toggleViewMode = () => {
        const next = viewMode === 'list' ? 'grid' : 'list';
        setViewMode(next);
        localStorage.setItem('menuViewMode', next);
    };

    // Calculate totals
    const cartValues = Object.values(cart) as CartItem[];
    const baseTotal = cartValues.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
    const multiplier = 1 + (taxRate + serviceRate) / 100;
    const finalTotalOriginal = baseTotal * multiplier;
    const finalTotalConverted = finalTotalOriginal * menuData.exchangeRate;
    const totalItems = cartValues.reduce((sum, item) => sum + item.quantity, 0);


    const toggleAllergen = (allergen: string) => {
        setExcludedAllergens(prev =>
            prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
        );
    };

    // Check if item should be dimmed based on allergens
    const isRisky = (item: MenuItem) => {
        if (!item.allergens || !Array.isArray(item.allergens)) return false;

        // 將英文變數名稱對應到已翻譯的使用者介面語言
        const activeTranslatedAllergens = excludedAllergens.map(
            key => (ALLERGENS_MAP[targetLang]?.[key] || key).toLowerCase()
        );

        return item.allergens.some(a => {
            if (typeof a !== 'string') return false;
            const lowerA = a.toLowerCase();
            // 由於 AI 可能吐回原始英文或翻譯後的字眼，兩者皆檢查
            return activeTranslatedAllergens.includes(lowerA) ||
                excludedAllergens.some(ex => ex.toLowerCase() === lowerA);
        });
    };

    const groupedItems = useMemo<Record<string, MenuItem[]>>(() => {
        const groups: Record<string, MenuItem[]> = {};
        menuData.items.forEach(item => {
            const cat = item.category || 'Others';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    }, [menuData.items]);

    const filteredGroups = useMemo(() => {
        const filtered: Record<string, MenuItem[]> = {};
        for (const [cat, items] of Object.entries(groupedItems)) {
            const validItems = items.filter(item => !isRisky(item));
            if (validItems.length > 0) {
                filtered[cat] = validItems;
            }
        }
        return filtered;
    }, [groupedItems, excludedAllergens]);

    const categories = Object.keys(filteredGroups);

    const t = FILTER_TRANSLATIONS[targetLang] || FILTER_TRANSLATIONS['English'];

    const handleExplain = async (item: MenuItem) => {
        if (explanations[item.id]) return;
        setLoadingExplanation(item.id);
        const text = await explainDish(item.originalName, menuData.detectedLanguage, targetLang);
        setExplanations(prev => ({ ...prev, [item.id]: text }));
        setLoadingExplanation(null);
    };

    const scrollToCategory = (cat: string) => {
        setActiveCategory(cat);
        const element = document.getElementById(`cat-${cat}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const createVariantItem = (baseItem: MenuItem, option: MenuOption, index: number): MenuItem => {
        return {
            ...baseItem,
            id: `${baseItem.id}-opt-${index}`,
            translatedName: `${baseItem.translatedName} - ${option.name}`,
            originalName: `${baseItem.originalName} (${option.name})`,
            price: option.price,
            options: []
        };
    };

    return (
        <div className="flex flex-col h-full relative" style={{ background: 'var(--bg-primary)', transition: 'background 0.3s' }}>
            {/* ⭐ 逐頁載入提示條 */}
            {isLoadingMore && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="text-white text-center py-2 px-4 text-sm font-medium z-40"
                    style={{ background: 'var(--brand-gradient)' }}
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        Loading more menu pages...
                    </div>
                </motion.div>
            )}
            {/* Sticky Top Bar */}
            <div className="sticky top-0 z-30" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', transition: 'background 0.3s' }}>
                <div className="flex items-center gap-2 p-3">
                    <button onClick={onBack} className="p-2 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h2 className="font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Menu</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{menuData.items.length} dishes</p>
                            {menuData.usageMetadata && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--glass-bg)', color: 'var(--text-tertiary)' }} title={`Prompt: ${menuData.usageMetadata.promptTokenCount} | Output: ${menuData.usageMetadata.candidatesTokenCount}`}>
                                    <Zap size={10} className="text-yellow-500 fill-yellow-500" />
                                    {menuData.usageMetadata.totalTokenCount}
                                </div>
                            )}
                            {excludedAllergens.length > 0 && (
                                <span className="text-[10px] px-1.5 rounded-full font-bold" style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)' }}>Filter Active</span>
                            )}
                        </div>
                    </div>
                    <button onClick={toggleViewMode}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                        {viewMode === 'list' ? <LayoutGrid size={20} /> : <List size={20} />}
                    </button>
                    <button onClick={() => setIsFilterOpen(true)}
                        className="p-2 rounded-xl transition-colors"
                        style={{ background: excludedAllergens.length > 0 ? 'var(--danger-bg)' : 'var(--glass-bg)', border: `1px solid ${excludedAllergens.length > 0 ? 'rgba(239,68,68,0.2)' : 'var(--glass-border)'}`, color: excludedAllergens.length > 0 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                        <Filter size={20} />
                    </button>
                </div>

                <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 gap-2">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => scrollToCategory(cat)}
                            className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all"
                            style={activeCategory === cat ? { background: 'var(--brand-gradient)', color: 'white', boxShadow: '0 2px 12px var(--brand-glow)' } : { background: 'var(--glass-bg)', color: 'var(--text-secondary)' }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
                {categories.map((category) => (
                    <div key={category} id={`cat-${category}`} className="scroll-mt-36">
                        <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <div className="w-1.5 h-5 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
                            {category}
                        </h3>

                        {/* ===== GRID VIEW ===== */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-3 gap-2">
                                {filteredGroups[category].map((item) => {
                                    const quantity = cart[item.id]?.quantity || 0;
                                    const convertedPrice = (item.price * menuData.exchangeRate).toFixed(0);

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            key={item.id}
                                            className="rounded-xl p-2.5 flex flex-col transition-all duration-200 relative overflow-hidden"
                                            style={{
                                                background: quantity > 0 ? 'var(--brand-bg-light)' : 'var(--glass-bg)',
                                                border: `1px solid ${quantity > 0 ? 'rgba(255,107,43,0.25)' : 'var(--glass-border)'}`,
                                                minHeight: '140px',
                                            }}
                                        >
                                            {/* Quantity badge */}
                                            {quantity > 0 && (
                                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                                    style={{ background: 'var(--brand-primary)' }}>
                                                    {quantity}
                                                </div>
                                            )}
                                            {/* Name + Allergen inline */}
                                            <h4 className="font-bold text-xs leading-tight mb-0.5 line-clamp-2 pr-5" style={{ color: 'var(--text-primary)' }}>
                                                {item.allergy_warning && (
                                                    <AlertTriangle size={11} className="inline-block mr-0.5 -mt-0.5 shrink-0" style={{ color: 'var(--danger-color)' }} />
                                                )}
                                                {item.translatedName}
                                            </h4>
                                            <p className="text-[10px] leading-tight line-clamp-1 mb-auto" style={{ color: 'var(--text-tertiary)' }}>
                                                {item.originalName}
                                            </p>

                                            {/* Price */}
                                            {!hidePrice && (
                                                <div className="mt-1.5 mb-1">
                                                    <span className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>
                                                        {convertedPrice}
                                                    </span>
                                                    <span className="text-[9px] font-bold ml-0.5" style={{ color: 'var(--brand-primary)' }}>
                                                        {menuData.targetCurrency}
                                                    </span>
                                                </div>
                                            )}

                                            {/* +/- buttons */}
                                            <div className="flex items-center justify-between mt-auto pt-1">
                                                <button
                                                    onClick={() => onUpdateCart(item, -1)}
                                                    disabled={quantity === 0}
                                                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                                    style={quantity > 0 ? { background: 'var(--glass-shine)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}>
                                                    <Minus size={13} />
                                                </button>
                                                <span className="text-xs font-bold" style={{ color: quantity > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() => onUpdateCart(item, 1)}
                                                    className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                                                    style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* ===== LIST VIEW (original) ===== */
                            <div className="grid gap-3">
                                {filteredGroups[category].map((item) => {
                                    const quantity = cart[item.id]?.quantity || 0;
                                    const convertedPrice = (item.price * menuData.exchangeRate).toFixed(0);

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            key={item.id}
                                            className="rounded-2xl p-4 relative overflow-hidden transition-all duration-300"
                                            style={{ background: quantity > 0 ? 'var(--brand-bg-light)' : 'var(--glass-bg)', border: `1px solid ${quantity > 0 ? 'rgba(255,107,43,0.2)' : 'var(--glass-border)'}` }}
                                        >
                                            {/* Item Info */}
                                            <div className="mb-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>{item.translatedName}</h4>
                                                    {(item.allergy_warning) && (
                                                        <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)' }}>
                                                            <AlertTriangle size={10} /> Allergen
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-tertiary)' }}>{item.originalName}</p>
                                                    {ttsSupported && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                speakWithId(item.originalName, menuData.detectedLanguage, `item-${item.id}`);
                                                            }}
                                                            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                                            style={speakingId === `item-${item.id}` ? { background: 'var(--info-color)', color: 'white' } : { background: 'var(--info-bg)', color: 'var(--info-color)' }}
                                                            title="Listen to pronunciation">
                                                            <Volume2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Description & Tags */}
                                            <div className="rounded-xl p-3 mb-3 relative" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                                                {item.shortDescription && (
                                                    <p className="text-sm font-medium mb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.shortDescription}</p>
                                                )}
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {item.dietary_tags?.map(tag => (
                                                        <span key={tag} className="text-[10px] bg-white text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">{tag}</span>
                                                    ))}
                                                    {item.allergens?.map(alg => (
                                                        <span key={alg} className={`text-[10px] border px-1.5 py-0.5 rounded ${excludedAllergens.includes(alg) ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-400 border-red-200'}`}>
                                                            {ALLERGENS_MAP[targetLang]?.[alg] || alg}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Variants/Options Display */}
                                                {item.options && item.options.length > 0 && (
                                                    <div className="mt-2 border-t border-amber-200 pt-2">
                                                        <p className="text-[10px] uppercase font-bold text-amber-500 mb-2">Available Options</p>
                                                        <div className="space-y-2">
                                                            {item.options.map((opt, idx) => {
                                                                const variantItem = createVariantItem(item, opt, idx);
                                                                const vQty = cart[variantItem.id]?.quantity || 0;

                                                                return (
                                                                    <div key={idx} className="flex justify-between items-center bg-white/60 rounded-lg p-2 border border-amber-100">
                                                                        <div className="flex-1 mr-2">
                                                                            <div className="text-xs font-bold text-amber-900">{opt.name}</div>
                                                                            <div className="text-[10px] font-mono text-amber-700">{opt.price} {menuData.originalCurrency}</div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-amber-200 p-0.5">
                                                                            <button
                                                                                onClick={() => onUpdateCart(variantItem, -1)}
                                                                                disabled={vQty === 0}
                                                                                className={`w-6 h-6 flex items-center justify-center rounded-md ${vQty > 0 ? 'bg-amber-100 text-amber-800' : 'text-gray-300'}`}
                                                                            >
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <span className={`w-4 text-center text-xs font-bold ${vQty > 0 ? 'text-amber-900' : 'text-gray-300'}`}>{vQty}</span>
                                                                            <button
                                                                                onClick={() => onUpdateCart(variantItem, 1)}
                                                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-500 text-white hover:bg-amber-600"
                                                                            >
                                                                                <Plus size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {explanations[item.id] ? (
                                                    <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                                                        💡 {explanations[item.id]}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleExplain(item)}
                                                        disabled={loadingExplanation === item.id}
                                                        className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 mt-2 transition-colors"
                                                    >
                                                        {loadingExplanation === item.id ? 'Thinking...' : <><Info size={12} /> Explain</>}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Base Item Price & Action */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div>
                                                    {!hidePrice ? (
                                                        <>
                                                            <span className="block font-extrabold text-xl" style={{ color: 'var(--text-primary)' }}>
                                                                {convertedPrice} <span className="text-xs font-bold" style={{ color: 'var(--brand-primary)' }}>{menuData.targetCurrency}</span>
                                                            </span>
                                                            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                                                {item.price} {menuData.originalCurrency}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm font-bold italic" style={{ color: 'var(--text-muted)' }}>Price Hidden</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center rounded-full p-1" style={{ background: 'var(--glass-bg)' }}>
                                                    <button
                                                        onClick={() => onUpdateCart(item, -1)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                                                        style={quantity > 0 ? { background: 'var(--glass-shine)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
                                                        disabled={quantity === 0}>
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="w-7 text-center font-bold text-sm" style={{ color: quantity > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => onUpdateCart(item, 1)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-full active:scale-95 transition-transform"
                                                        style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 🗣️ Floating Phrases Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                onClick={() => setShowPhrases(true)}
                className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-300/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                title="Restaurant Phrases"
            >
                <MessageCircle size={24} />
            </motion.button>

            {/* 🗣️ Restaurant Phrases Panel */}
            <AnimatePresence>
                {showPhrases && (
                    <RestaurantPhrases
                        isOpen={showPhrases}
                        onClose={() => setShowPhrases(false)}
                        detectedLanguage={menuData.detectedLanguage}
                        userLanguage={targetLang}
                    />
                )}
            </AnimatePresence>

            {/* Floating Footer */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 z-40 pb-6 safe-area-bottom"
                        style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--glass-border)' }}
                    >
                        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                {!hidePrice ? (
                                    <>
                                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Est. Final Total</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{finalTotalConverted.toFixed(0)}</span>
                                            <span className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>{menuData.targetCurrency}</span>
                                        </div>
                                        {(taxRate > 0 || serviceRate > 0) && (
                                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Includes {taxRate}% Tax & {serviceRate}% Service</span>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col">
                                        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>Dish List Mode</span>
                                        <span className="text-lg font-bold leading-none" style={{ color: 'var(--text-primary)' }}>Ready to Checkout</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={onViewSummary}
                                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2"
                                style={{ background: 'var(--brand-gradient)', color: 'white', boxShadow: '0 4px 20px var(--brand-glow)' }}>
                                {hidePrice ? "View Summary" : "Checkout"} <span className="px-2 py-0.5 rounded text-sm" style={{ background: 'rgba(255,255,255,0.2)' }}>{totalItems}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feature 1: Allergen Modal */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(12px)' }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-sm rounded-3xl p-6"
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <AlertTriangle className="text-red-400" /> {t.title}
                            </h3>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full" style={{ background: 'var(--glass-bg)' }}><X size={20} style={{ color: 'var(--text-tertiary)' }} /></button>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>{t.desc}</p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {ALLERGENS_LIST.map(alg => (
                                <button key={alg} onClick={() => toggleAllergen(alg)}
                                    className="p-3 rounded-xl font-bold text-sm flex items-center justify-between transition-all"
                                    style={excludedAllergens.includes(alg) ? { background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger-color)' } : { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-tertiary)' }}>
                                    {ALLERGENS_MAP[targetLang]?.[alg] || alg}
                                    {excludedAllergens.includes(alg) && <Check size={16} />}
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setIsFilterOpen(false)}
                            className="w-full py-3 rounded-xl font-bold"
                            style={{ background: 'var(--brand-gradient)', color: 'white' }}>
                            {t.apply}
                        </button>
                    </motion.div>
                </div>
            )}

        </div>
    );
};