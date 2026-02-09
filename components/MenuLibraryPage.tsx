import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Trash2, Calendar, MapPin, UtensilsCrossed, Edit2, Check, X, BookOpen, Database } from 'lucide-react';
import { SavedMenu, TargetLanguage } from '../types';
import { SausageDogLogo, PawPrint } from './DachshundAssets';

interface MenuLibraryPageProps {
    savedMenus: SavedMenu[];
    onBack: () => void;
    onSelectMenu: (menu: SavedMenu) => void;
    onDeleteMenu: (id: string) => void;
    onUpdateName: (id: string, newName: string) => void;
    storageSize: string;
    targetLanguage: TargetLanguage;
}

// 多語言文字
const TEXTS: Record<string, {
    title: string;
    search: string;
    empty: string;
    emptyHint: string;
    items: string;
    delete: string;
    confirmDelete: string;
    cancel: string;
    storage: string;
}> = {
    '繁體中文': {
        title: '菜單庫',
        search: '搜尋菜單...',
        empty: '還沒有儲存的菜單',
        emptyHint: '上傳菜單後可儲存至這裡，方便下次直接使用！',
        items: '道菜',
        delete: '刪除',
        confirmDelete: '確定要刪除此菜單嗎？',
        cancel: '取消',
        storage: '已使用儲存空間'
    },
    '繁體中文-HK': {
        title: '菜單庫',
        search: '搜尋菜單...',
        empty: '還沒有儲存的菜單',
        emptyHint: '上傳菜單後可儲存至這裡，方便下次直接使用！',
        items: '道菜',
        delete: '刪除',
        confirmDelete: '確定要刪除此菜單嗎？',
        cancel: '取消',
        storage: '已使用儲存空間'
    },
    'English': {
        title: 'Menu Library',
        search: 'Search menus...',
        empty: 'No saved menus yet',
        emptyHint: 'Save menus after scanning to use them instantly next time!',
        items: 'items',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this menu?',
        cancel: 'Cancel',
        storage: 'Storage used'
    },
    '日本語': {
        title: 'メニューライブラリ',
        search: 'メニューを検索...',
        empty: '保存されたメニューはありません',
        emptyHint: 'スキャン後にメニューを保存して、次回すぐに使えます！',
        items: '品',
        delete: '削除',
        confirmDelete: 'このメニューを削除しますか？',
        cancel: 'キャンセル',
        storage: '使用済みストレージ'
    },
    '한국어': {
        title: '메뉴 라이브러리',
        search: '메뉴 검색...',
        empty: '저장된 메뉴가 없습니다',
        emptyHint: '스캔 후 메뉴를 저장하면 다음에 바로 사용할 수 있습니다!',
        items: '개',
        delete: '삭제',
        confirmDelete: '이 메뉴를 삭제하시겠습니까?',
        cancel: '취소',
        storage: '사용된 저장 공간'
    },
    'Français': {
        title: 'Bibliothèque de Menus',
        search: 'Rechercher des menus...',
        empty: 'Aucun menu sauvegardé',
        emptyHint: 'Enregistrez les menus après numérisation pour les utiliser instantanément !',
        items: 'éléments',
        delete: 'Supprimer',
        confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce menu ?',
        cancel: 'Annuler',
        storage: 'Stockage utilisé'
    },
    'Español': {
        title: 'Biblioteca de Menús',
        search: 'Buscar menús...',
        empty: 'No hay menús guardados',
        emptyHint: '¡Guarda los menús después de escanear para usarlos instantáneamente!',
        items: 'elementos',
        delete: 'Eliminar',
        confirmDelete: '¿Estás seguro de que quieres eliminar este menú?',
        cancel: 'Cancelar',
        storage: 'Almacenamiento usado'
    },
    'ไทย': {
        title: 'คลังเมนู',
        search: 'ค้นหาเมนู...',
        empty: 'ยังไม่มีเมนูที่บันทึกไว้',
        emptyHint: 'บันทึกเมนูหลังจากสแกนเพื่อใช้งานได้ทันที!',
        items: 'รายการ',
        delete: 'ลบ',
        confirmDelete: 'คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?',
        cancel: 'ยกเลิก',
        storage: 'พื้นที่จัดเก็บที่ใช้'
    },
    'Tiếng Việt': {
        title: 'Thư Viện Menu',
        search: 'Tìm kiếm menu...',
        empty: 'Chưa có menu nào được lưu',
        emptyHint: 'Lưu menu sau khi quét để sử dụng ngay lần sau!',
        items: 'món',
        delete: 'Xóa',
        confirmDelete: 'Bạn có chắc chắn muốn xóa menu này không?',
        cancel: 'Hủy',
        storage: 'Đã sử dụng'
    },
    'Deutsch': {
        title: 'Menübibliothek',
        search: 'Menüs suchen...',
        empty: 'Keine gespeicherten Menüs',
        emptyHint: 'Speichern Sie Menüs nach dem Scannen, um sie sofort zu verwenden!',
        items: 'Artikel',
        delete: 'Löschen',
        confirmDelete: 'Sind Sie sicher, dass Sie dieses Menü löschen möchten?',
        cancel: 'Abbrechen',
        storage: 'Genutzter Speicher'
    },
    'Русский': {
        title: 'Библиотека Меню',
        search: 'Поиск меню...',
        empty: 'Нет сохраненных меню',
        emptyHint: 'Сохраняйте меню после сканирования для мгновенного использования!',
        items: 'позиций',
        delete: 'Удалить',
        confirmDelete: 'Вы уверены, что хотите удалить это меню?',
        cancel: 'Отмена',
        storage: 'Использовано хранилище'
    },
    'Tagalog': {
        title: 'Menu Library',
        search: 'Maghanap ng menu...',
        empty: 'Walang naka-save na menu',
        emptyHint: 'I-save ang mga menu pagkatapos mag-scan para magamit agad sa susunod!',
        items: 'items',
        delete: 'Burahin',
        confirmDelete: 'Sigurado ka bang gusto mong burahin ang menu na ito?',
        cancel: 'Kanselahin',
        storage: 'Ginamit na storage'
    },
    'Bahasa Indonesia': {
        title: 'Perpustakaan Menu',
        search: 'Cari menu...',
        empty: 'Belum ada menu tersimpan',
        emptyHint: 'Simpan menu setelah memindai untuk langsung digunakan nanti!',
        items: 'item',
        delete: 'Hapus',
        confirmDelete: 'Apakah Anda yakin ingin menghapus menu ini?',
        cancel: 'Batal',
        storage: 'Penyimpanan terpakai'
    }
};

export const MenuLibraryPage: React.FC<MenuLibraryPageProps> = ({
    savedMenus,
    onBack,
    onSelectMenu,
    onDeleteMenu,
    onUpdateName,
    storageSize,
    targetLanguage
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const t = TEXTS[targetLanguage] || TEXTS['English'];

    // 篩選菜單
    const filteredMenus = useMemo(() => {
        if (!searchQuery.trim()) return savedMenus;
        const query = searchQuery.toLowerCase();
        return savedMenus.filter(m =>
            m.customName.toLowerCase().includes(query) ||
            m.restaurantName?.toLowerCase().includes(query)
        );
    }, [savedMenus, searchQuery]);

    const handleStartEdit = (menu: SavedMenu) => {
        setEditingId(menu.id);
        setEditingName(menu.customName);
    };

    const handleSaveEdit = () => {
        if (editingId && editingName.trim()) {
            onUpdateName(editingId, editingName.trim());
        }
        setEditingId(null);
        setEditingName('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleConfirmDelete = (id: string) => {
        onDeleteMenu(id);
        setDeleteConfirmId(null);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-orange-50 relative overflow-hidden">
            {/* Background Decoration */}
            <PawPrint className="absolute top-32 right-[-30px] w-48 h-48 text-amber-200 opacity-30 rotate-12" />
            <PawPrint className="absolute bottom-20 left-[-20px] w-32 h-32 text-amber-200 opacity-20 -rotate-12" />

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm shadow-sm px-4 py-3 flex items-center gap-4 sticky top-0 z-20 border-b border-amber-100">
                <button onClick={onBack} className="p-2 text-amber-800 hover:bg-amber-50 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h2 className="font-black text-amber-900 text-xl flex items-center gap-2">
                        <BookOpen size={22} />
                        {t.title}
                    </h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    <Database size={12} />
                    <span>{savedMenus.length}</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 sticky top-14 z-10 bg-gradient-to-b from-amber-50 to-transparent">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.search}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-gray-800 placeholder-amber-300 focus:border-amber-500 focus:outline-none transition-colors shadow-sm"
                    />
                </div>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                {filteredMenus.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-amber-500 py-20">
                        <SausageDogLogo className="w-32 h-20 mb-4 opacity-40" />
                        <p className="font-bold text-lg">{t.empty}</p>
                        <p className="text-sm text-amber-400 text-center mt-2 max-w-[250px]">{t.emptyHint}</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredMenus.map((menu, idx) => (
                            <motion.div
                                key={menu.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-md border border-amber-100 relative"
                            >
                                {/* Delete Confirmation Overlay */}
                                <AnimatePresence>
                                    {deleteConfirmId === menu.id && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-red-500/95 z-10 flex flex-col items-center justify-center p-4"
                                        >
                                            <p className="text-white font-bold text-center mb-4">{t.confirmDelete}</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                                                >
                                                    {t.cancel}
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmDelete(menu.id)}
                                                    className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors"
                                                >
                                                    {t.delete}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex">
                                    {/* Thumbnail */}
                                    <div
                                        onClick={() => onSelectMenu(menu)}
                                        className="w-24 h-24 flex-shrink-0 bg-amber-100 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        {menu.thumbnailBase64 ? (
                                            <img
                                                src={`data:image/jpeg;base64,${menu.thumbnailBase64}`}
                                                alt={menu.customName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <UtensilsCrossed className="text-amber-300" size={32} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                        {/* Name */}
                                        {editingId === menu.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-amber-300 rounded text-sm focus:outline-none focus:border-amber-500"
                                                    autoFocus
                                                    maxLength={50}
                                                />
                                                <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={handleCancelEdit} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2">
                                                <h3
                                                    onClick={() => onSelectMenu(menu)}
                                                    className="font-bold text-gray-800 truncate flex-1 cursor-pointer hover:text-amber-600 transition-colors"
                                                >
                                                    {menu.customName}
                                                </h3>
                                                <button
                                                    onClick={() => handleStartEdit(menu)}
                                                    className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded flex-shrink-0 transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {formatDate(menu.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <UtensilsCrossed size={12} />
                                                {menu.itemCount} {t.items}
                                            </span>
                                        </div>

                                        {/* Location & Actions */}
                                        <div className="flex items-center justify-between mt-2">
                                            {menu.location ? (
                                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <MapPin size={10} />
                                                    {menu.location.lat.toFixed(2)}, {menu.location.lng.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            <button
                                                onClick={() => setDeleteConfirmId(menu.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Storage Info Footer */}
            {savedMenus.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm border-t border-amber-100 px-4 py-2 text-center">
                    <p className="text-xs text-amber-600">
                        {t.storage}: <span className="font-bold">{storageSize}</span>
                    </p>
                </div>
            )}
        </div>
    );
};
