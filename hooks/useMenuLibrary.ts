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

const menuVersion = (menu: SavedMenu): number => menu.updatedAt || menu.createdAt || 0;

const mergeMenus = (...sources: SavedMenu[][]): SavedMenu[] => {
    const merged = new Map<string, SavedMenu>();
    sources.flat().forEach(menu => {
        if (!menu?.id) return;
        const current = merged.get(menu.id);
        if (!current || menuVersion(menu) >= menuVersion(current)) merged.set(menu.id, menu);
    });
    return Array.from(merged.values())
        .sort((a, b) => menuVersion(b) - menuVersion(a))
        .slice(0, MAX_MENUS);
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

const writeMenuLibraryBackup = async (email: string, menus: SavedMenu[]): Promise<boolean> => {
    const db = await openMenuLibraryDb();
    if (!db) return false;
    return new Promise<boolean>(resolve => {
        const transaction = db.transaction(MENU_LIBRARY_STORE, 'readwrite');
        transaction.objectStore(MENU_LIBRARY_STORE).put(menus, email);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => resolve(false);
        transaction.onabort = () => resolve(false);
    });
};

type CloudMenuSnapshot = { menus: SavedMenu[]; deletedMenus: Array<{ id: string; deletedAt: number }> };

const fetchCloudMenus = async (): Promise<CloudMenuSnapshot> => {
    try {
        const response = await fetch('/api/menu-library', { cache: 'no-store', credentials: 'include' });
        if (!response.ok) return { menus: [], deletedMenus: [] };
        const body = await response.json();
        return {
            menus: mergeMenus(
                Array.isArray(body?.menus) ? body.menus : [],
                Array.isArray(body?.recoveredFromMap) ? body.recoveredFromMap : [],
            ),
            deletedMenus: Array.isArray(body?.deletedMenus) ? body.deletedMenus : [],
        };
    } catch (error) {
        console.warn('Menu cloud backup is unavailable:', error);
        return { menus: [], deletedMenus: [] };
    }
};

const syncCloudMenus = async (menus: SavedMenu[]): Promise<void> => {
    try {
        await fetch('/api/menu-library', {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ menus }),
        });
    } catch (error) {
        console.warn('Menu cloud backup could not be synced:', error);
    }
};

const deleteCloudMenu = async (id: string): Promise<void> => {
    try {
        await fetch('/api/menu-library', {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
    } catch (error) {
        console.warn('Menu cloud backup could not be updated:', error);
    }
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

    // 載入菜單庫（跟隨 storageKey 變化）。所有舊 key 都只讀取、複製，
    // 不會在自動遷移時刪除，避免更新中斷造成不可逆資料遺失。
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        const loadMenus = async () => {
          try {
            const normalizedEmail = normalizeEmail(userEmail)
                || (storageKey.startsWith(STORAGE_KEY_PREFIX)
                    ? normalizeEmail(storageKey.slice(STORAGE_KEY_PREFIX.length).replace(/^guest$/, ''))
                    : '');
            const sourceKeys = new Set<string>([storageKey, 'menu_library']);
            if (normalizedEmail) sourceKeys.add('menu_library_guest');

            for (let index = 0; index < localStorage.length; index += 1) {
                const key = localStorage.key(index);
                if (!key || key === storageKey || !key.startsWith(STORAGE_KEY_PREFIX)) continue;
                const keyEmail = normalizeEmail(key.slice(STORAGE_KEY_PREFIX.length));
                if (normalizedEmail && keyEmail === normalizedEmail) sourceKeys.add(key);
            }

            const localMenus = mergeMenus(...Array.from(sourceKeys).map(key => parseMenus(localStorage.getItem(key))));
            const [backupMenus, cloudSnapshot] = await Promise.all([
                normalizedEmail ? readMenuLibraryBackup(normalizedEmail) : Promise.resolve([]),
                normalizedEmail ? fetchCloudMenus() : Promise.resolve({ menus: [], deletedMenus: [] }),
            ]);
            const deletedVersions = new Map(
                cloudSnapshot.deletedMenus
                    .filter(item => item && typeof item.id === 'string' && Number.isFinite(item.deletedAt))
                    .map(item => [item.id, item.deletedAt] as const),
            );
            const recoveredMenus = mergeMenus(localMenus, backupMenus, cloudSnapshot.menus)
                .filter(menu => (deletedVersions.get(menu.id) || 0) < menuVersion(menu));

            if (recoveredMenus.length > 0) {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(recoveredMenus));
                } catch (error) {
                    console.warn('Recovered menus exceeded localStorage capacity:', error);
                }
                if (normalizedEmail) {
                    await writeMenuLibraryBackup(normalizedEmail, recoveredMenus);
                    void syncCloudMenus(recoveredMenus);
                }
            }
            if (!cancelled) setSavedMenus(recoveredMenus);
          } catch (e) {
            console.error('Failed to load menu library:', e);
            // Preserve the current in-memory value on transient storage/network errors.
          } finally {
            if (!cancelled) setIsLoading(false);
          }
        };
        void loadMenus();
        return () => { cancelled = true; };
    }, [storageKey, userEmail]);

    // 儲存到 localStorage
    const persistMenus = useCallback((menus: SavedMenu[]) => {
        const menusToPersist = mergeMenus(menus);
        const normalizedEmail = normalizeEmail(userEmail);

        // Durable stores receive the full set even if localStorage is full.
        if (normalizedEmail) {
            void writeMenuLibraryBackup(normalizedEmail, menusToPersist);
            void syncCloudMenus(menusToPersist);
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(menusToPersist));
        } catch (e) {
            console.error('Failed to persist menu library:', e);
            // 如果超出容量，嘗試刪除最舊的
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                const trimmed = menusToPersist.slice(0, Math.max(1, Math.floor(menusToPersist.length * 0.8)));
                try {
                    localStorage.setItem(storageKey, JSON.stringify(trimmed));
                } catch (retryError) {
                    console.error('Menu library local fallback also exceeded capacity:', retryError);
                }
            }
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
            updatedAt: Date.now(),
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
        // Explicit deletion is applied to every legacy local key so an old copy
        // cannot be re-imported on the next launch.
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (!key || (key !== 'menu_library' && !key.startsWith(STORAGE_KEY_PREFIX))) continue;
            const menus = parseMenus(localStorage.getItem(key));
            if (menus.some(menu => menu.id === id)) {
                localStorage.setItem(key, JSON.stringify(menus.filter(menu => menu.id !== id)));
            }
        }
        setSavedMenus(prev => {
            const updated = prev.filter(m => m.id !== id);
            persistMenus(updated);
            return updated;
        });
        if (normalizeEmail(userEmail)) void deleteCloudMenu(id);
    }, [persistMenus, userEmail]);

    // 更新菜單名稱
    const updateMenuName = useCallback((id: string, newName: string) => {
        setSavedMenus(prev => {
            const updated = prev.map(m =>
                m.id === id ? { ...m, customName: newName.trim() || m.customName, updatedAt: Date.now() } : m
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
