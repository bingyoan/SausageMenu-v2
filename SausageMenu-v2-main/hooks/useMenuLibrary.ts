import { useState, useEffect, useCallback } from 'react';
import { SavedMenu, MenuData, GeoLocation, TargetLanguage } from '../types';

const STORAGE_KEY_PREFIX = 'menu_library_';
const MAX_MENUS = 100;

const getStorageKey = (userEmail?: string): string => {
    if (userEmail) return `${STORAGE_KEY_PREFIX}${userEmail}`;
    try {
        const savedEmail = localStorage.getItem('smp_user_email');
        if (savedEmail) return `${STORAGE_KEY_PREFIX}${savedEmail}`;
    } catch (e) { /* ignore */ }
    return `${STORAGE_KEY_PREFIX}guest`;
};

export const useMenuLibrary = (userEmail?: string) => {
    const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [storageKey, setStorageKey] = useState(() => getStorageKey(userEmail));

    useEffect(() => {
        const newKey = getStorageKey(userEmail);
        setStorageKey(newKey);
    }, [userEmail]);

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

    const persistMenus = useCallback((menus: SavedMenu[]) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(menus));
        } catch (e) {
            console.error('Failed to persist menu library:', e);
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                const trimmed = menus.slice(0, Math.floor(menus.length * 0.8));
                localStorage.setItem(storageKey, JSON.stringify(trimmed));
            }
        }
    }, [storageKey]);

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
            const updated = [newMenu, ...prev].slice(0, MAX_MENUS);
            persistMenus(updated);
            return updated;
        });

        return newMenu;
    }, [persistMenus]);

    const deleteMenu = useCallback((id: string) => {
        setSavedMenus(prev => {
            const updated = prev.filter(m => m.id !== id);
            persistMenus(updated);
            return updated;
        });
    }, [persistMenus]);

    const updateMenuName = useCallback((id: string, newName: string) => {
        setSavedMenus(prev => {
            const updated = prev.map(m =>
                m.id === id ? { ...m, customName: newName.trim() || m.customName } : m
            );
            persistMenus(updated);
            return updated;
        });
    }, [persistMenus]);

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
        getStorageSize,
        menuCount: savedMenus.length
    };
};
