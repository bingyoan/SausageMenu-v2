import { useState, useEffect, useCallback } from 'react';
import { SavedMenu, MenuData, GeoLocation, TargetLanguage } from '../types';

const STORAGE_KEY_PREFIX = 'menu_library_';
const MAX_MENUS = 100; // 最多儲存 100 筆

/**
 * 取得當前用戶的菜單庫 storage key
 * 以 email 區分不同帳號的菜單庫
 */
const getStorageKey = (userEmail?: string): string => {
    if (userEmail) return `${STORAGE_KEY_PREFIX}${userEmail}`;
    // 嘗試從 localStorage 取得當前用戶 email
    try {
        const savedUser = localStorage.getItem('google_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.email) return `${STORAGE_KEY_PREFIX}${user.email}`;
        }
    } catch (e) { /* ignore */ }
    // fallback: 使用通用 key（未登入時）
    return `${STORAGE_KEY_PREFIX}guest`;
};

export const useMenuLibrary = (userEmail?: string) => {
    const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [storageKey, setStorageKey] = useState(() => getStorageKey(userEmail));

    // 當 userEmail 變化時更新 storageKey
    useEffect(() => {
        const newKey = getStorageKey(userEmail);
        setStorageKey(newKey);
    }, [userEmail]);

    // 載入菜單庫（跟隨 storageKey 變化）
    useEffect(() => {
        setIsLoading(true);
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as SavedMenu[];
                setSavedMenus(parsed);
            } else {
                setSavedMenus([]);
            }
        } catch (e) {
            console.error('Failed to load menu library:', e);
            setSavedMenus([]);
        } finally {
            setIsLoading(false);
        }
    }, [storageKey]);

    // 一次性遷移：如果舊的 menu_library 有資料，遷移到當前帳號
    useEffect(() => {
        try {
            const oldData = localStorage.getItem('menu_library');
            if (oldData && storageKey !== 'menu_library_guest') {
                const oldMenus = JSON.parse(oldData) as SavedMenu[];
                if (oldMenus.length > 0) {
                    // 合併到當前帳號（避免重複）
                    const currentData = localStorage.getItem(storageKey);
                    const currentMenus = currentData ? JSON.parse(currentData) as SavedMenu[] : [];
                    const existingIds = new Set(currentMenus.map(m => m.id));
                    const newMenus = oldMenus.filter(m => !existingIds.has(m.id));
                    const merged = [...currentMenus, ...newMenus].slice(0, MAX_MENUS);
                    localStorage.setItem(storageKey, JSON.stringify(merged));
                    setSavedMenus(merged);
                    // 刪除舊的通用 key
                    localStorage.removeItem('menu_library');
                }
            }
        } catch (e) {
            console.error('Failed to migrate menu library:', e);
        }
    }, [storageKey]);

    // 儲存到 localStorage
    const persistMenus = useCallback((menus: SavedMenu[]) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(menus));
        } catch (e) {
            console.error('Failed to persist menu library:', e);
            // 如果超出容量，嘗試刪除最舊的
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                const trimmed = menus.slice(0, Math.floor(menus.length * 0.8));
                localStorage.setItem(storageKey, JSON.stringify(trimmed));
            }
        }
    }, [storageKey]);

    // 新增菜單
    const saveMenu = useCallback((
        customName: string,
        menuData: MenuData,
        thumbnailBase64: string,
        targetLanguage: TargetLanguage,
        location?: GeoLocation
    ): SavedMenu => {
        const newMenu: SavedMenu = {
            id: `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            customName: customName.trim() || menuData.restaurantName || '未命名菜單',
            restaurantName: menuData.restaurantName,
            thumbnailBase64,
            menuData,
            location,
            targetLanguage,
            itemCount: menuData.items.length
        };

        setSavedMenus(prev => {
            // 限制最大數量，刪除最舊的
            const updated = [newMenu, ...prev].slice(0, MAX_MENUS);
            persistMenus(updated);
            return updated;
        });

        return newMenu;
    }, [persistMenus]);

    // 刪除菜單
    const deleteMenu = useCallback((id: string) => {
        setSavedMenus(prev => {
            const updated = prev.filter(m => m.id !== id);
            persistMenus(updated);
            return updated;
        });
    }, [persistMenus]);

    // 更新菜單名稱
    const updateMenuName = useCallback((id: string, newName: string) => {
        setSavedMenus(prev => {
            const updated = prev.map(m =>
                m.id === id ? { ...m, customName: newName.trim() || m.customName } : m
            );
            persistMenus(updated);
            return updated;
        });
    }, [persistMenus]);

    // 根據名稱搜尋
    const searchMenus = useCallback((query: string): SavedMenu[] => {
        if (!query.trim()) return savedMenus;
        const lowerQuery = query.toLowerCase();
        return savedMenus.filter(m =>
            m.customName.toLowerCase().includes(lowerQuery) ||
            (m.restaurantName?.toLowerCase().includes(lowerQuery))
        );
    }, [savedMenus]);

    // 取得菜單
    const getMenu = useCallback((id: string): SavedMenu | undefined => {
        return savedMenus.find(m => m.id === id);
    }, [savedMenus]);

    // 計算總儲存大小 (估算)
    const getStorageSize = useCallback((): string => {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return '0 KB';
        const bytes = new Blob([stored]).size;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }, [storageKey]);

    return {
        savedMenus,
        isLoading,
        saveMenu,
        deleteMenu,
        updateMenuName,
        searchMenus,
        getMenu,
        getStorageSize,
        menuCount: savedMenus.length
    };
};
