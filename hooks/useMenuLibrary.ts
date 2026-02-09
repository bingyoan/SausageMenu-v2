import { useState, useEffect, useCallback } from 'react';
import { SavedMenu, MenuData, GeoLocation, TargetLanguage } from '../types';

const STORAGE_KEY = 'menu_library';
const MAX_MENUS = 100; // 最多儲存 100 筆

export const useMenuLibrary = () => {
    const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 載入菜單庫
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as SavedMenu[];
                setSavedMenus(parsed);
            }
        } catch (e) {
            console.error('Failed to load menu library:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 儲存到 localStorage
    const persistMenus = useCallback((menus: SavedMenu[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
        } catch (e) {
            console.error('Failed to persist menu library:', e);
            // 如果超出容量，嘗試刪除最舊的
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                const trimmed = menus.slice(0, Math.floor(menus.length * 0.8));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
            }
        }
    }, []);

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
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return '0 KB';
        const bytes = new Blob([stored]).size;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }, []);

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
