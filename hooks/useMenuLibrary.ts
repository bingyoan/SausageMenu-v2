import { useState, useEffect, useCallback } from 'react';
import { SavedMenu, MenuData, GeoLocation, TargetLanguage } from '../types';

const STORAGE_KEY_PREFIX = 'menu_library_';
const MAX_MENUS = 100; // 最多儲存 100 筆
const MENU_LIBRARY_DB = 'sausagemenu_local_data';
const MENU_LIBRARY_STORE = 'menu_library';

const normalizeEmail = (email?: string): string => email?.trim().toLowerCase() || '';

const parseMenus = (data: string | null): SavedMenu[] => {
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed as SavedMenu[] : [];
    } catch {
        return [];
    }
};

const openMenuLibraryDb = (): Promise<IDBDatabase | null> => new Promise(resolve => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    const request = indexedDB.open(MENU_LIBRARY_DB, 1);
    request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(MENU_LIBRARY_STORE)) {
            request.result.createObjectStore(MENU_LIBRARY_STORE);
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
});

const readMenuLibraryBackup = async (email: string): Promise<SavedMenu[]> => {
    const db = await openMenuLibraryDb();
    if (!db) return [];
    return new Promise(resolve => {
        const request = db.transaction(MENU_LIBRARY_STORE, 'readonly')
            .objectStore(MENU_LIBRARY_STORE)
            .get(email);
        request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
        request.onerror = () => resolve([]);
    });
};

const writeMenuLibraryBackup = async (email: string, menus: SavedMenu[]): Promise<void> => {
    const db = await openMenuLibraryDb();
    if (!db) return;
    await new Promise<void>(resolve => {
        const request = db.transaction(MENU_LIBRARY_STORE, 'readwrite')
            .objectStore(MENU_LIBRARY_STORE)
            .put(menus, email);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
    });
};

export const deleteMenuLibraryBackup = async (email?: string): Promise<void> => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return;
    const db = await openMenuLibraryDb();
    if (!db) return;
    await new Promise<void>(resolve => {
        const request = db.transaction(MENU_LIBRARY_STORE, 'readwrite')
            .objectStore(MENU_LIBRARY_STORE)
            .delete(normalizedEmail);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
    });
};

/**
 * 取得當前用戶的菜單庫 storage key
 * 以 email 區分不同帳號的菜單庫
 */
const getStorageKey = (userEmail?: string): string => {
    const normalizedEmail = normalizeEmail(userEmail);
    if (normalizedEmail) return `${STORAGE_KEY_PREFIX}${normalizedEmail}`;
    // 嘗試從 localStorage 取得當前用戶 email
    try {
        const savedUser = localStorage.getItem('google_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            const savedEmail = normalizeEmail(user.email);
            if (savedEmail) return `${STORAGE_KEY_PREFIX}${savedEmail}`;
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
        let cancelled = false;
        setIsLoading(true);
        const loadMenus = async () => {
          try {
            const primaryMenus = parseMenus(localStorage.getItem(storageKey));
            const normalizedEmail = normalizeEmail(userEmail);

            if (primaryMenus.length > 0) {
                if (!cancelled) setSavedMenus(primaryMenus);
            } else {
                const backupMenus = normalizedEmail
                    ? await readMenuLibraryBackup(normalizedEmail)
                    : [];
                if (backupMenus.length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(backupMenus));
                    if (!cancelled) setSavedMenus(backupMenus);
                } else if (!cancelled) {
                    setSavedMenus([]);
                }
            }
          } catch (e) {
            console.error('Failed to load menu library:', e);
            if (!cancelled) setSavedMenus([]);
          } finally {
            if (!cancelled) setIsLoading(false);
          }
        };
        void loadMenus();
        return () => { cancelled = true; };
    }, [storageKey, userEmail]);

    // 一次性遷移：如果舊的 menu_library 或 menu_library_guest 有資料，遷移到當前帳號
    useEffect(() => {
        let cancelled = false;
        const migrateMenus = async () => {
          try {
            // Only migrate if we are currently logged in with a real account (not guest)
            if (storageKey !== 'menu_library_guest') {
                const normalizedEmail = normalizeEmail(userEmail);
                const sourceKeys = new Set<string>(['menu_library', 'menu_library_guest']);

                // Earlier builds used the email exactly as returned by the login provider.
                // Recover keys that differ only by casing or surrounding whitespace.
                for (let index = 0; index < localStorage.length; index += 1) {
                    const key = localStorage.key(index);
                    if (!key || key === storageKey) continue;
                    if (key.startsWith(STORAGE_KEY_PREFIX)) {
                        const keyEmail = normalizeEmail(key.slice(STORAGE_KEY_PREFIX.length));
                        if (keyEmail === normalizedEmail) sourceKeys.add(key);
                    }
                }

                const mergedMenus: SavedMenu[] = [];
                const existingIds = new Set<string>();
                const mergeFromKey = (key: string) => {
                    parseMenus(localStorage.getItem(key)).forEach(menu => {
                        if (!menu?.id || existingIds.has(menu.id)) return;
                        existingIds.add(menu.id);
                        mergedMenus.push(menu);
                    });
                };

                mergeFromKey(storageKey);
                sourceKeys.forEach(mergeFromKey);
                (await readMenuLibraryBackup(normalizedEmail)).forEach(menu => {
                    if (!menu?.id || existingIds.has(menu.id)) return;
                    existingIds.add(menu.id);
                    mergedMenus.push(menu);
                });

                if (mergedMenus.length > 0) {
                    const finalMerged = mergedMenus
                        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                        .slice(0, MAX_MENUS);
                    const serialized = JSON.stringify(finalMerged);

                    // Copy first. Old keys are removed only after the durable backup succeeds.
                    localStorage.setItem(storageKey, serialized);
                    await writeMenuLibraryBackup(normalizedEmail, finalMerged);
                    sourceKeys.forEach(key => {
                        if (key !== storageKey) localStorage.removeItem(key);
                    });
                    if (!cancelled) setSavedMenus(finalMerged);
                }
            }
          } catch (e) {
            console.error('Failed to migrate menu library:', e);
          }
        };
        void migrateMenus();
        return () => { cancelled = true; };
    }, [storageKey, userEmail]);

    // 儲存到 localStorage
    const persistMenus = useCallback((menus: SavedMenu[]) => {
        let menusToPersist = menus;
        try {
            localStorage.setItem(storageKey, JSON.stringify(menusToPersist));
        } catch (e) {
            console.error('Failed to persist menu library:', e);
            // 如果超出容量，嘗試刪除最舊的
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                menusToPersist = menus.slice(0, Math.max(1, Math.floor(menus.length * 0.8)));
                localStorage.setItem(storageKey, JSON.stringify(menusToPersist));
            }
        }

        const normalizedEmail = normalizeEmail(userEmail);
        if (normalizedEmail) {
            void writeMenuLibraryBackup(normalizedEmail, menusToPersist);
        }
    }, [storageKey, userEmail]);

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
