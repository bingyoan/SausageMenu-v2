'use client';

import { useEffect, useRef, useState } from 'react';
import { COMPANION_OWNER_SHARE_STORAGE_KEY, CompanionOrderEntry } from '@/lib/companionShare';

interface StoredSharePointer {
  id: string;
  mode?: 'menu' | 'instant';
  pageIds?: string[];
}

interface OwnerShareResponse {
  success?: boolean;
  error?: string;
  session?: { mode?: string; pageIds?: string[] };
  entries?: CompanionOrderEntry[];
}

export interface OwnerShareOrdersSnapshot {
  shareSessionId: string;
  confirmedEntries: CompanionOrderEntry[];
  pendingGuestNames: string[];
}

/** Poll confirmed guest orders while the owner is viewing the same instant-translation menu. */
export function useCompanionShareOrders(enabled: boolean, currentPageIds: string[]) {
  const [entries, setEntries] = useState<CompanionOrderEntry[]>([]);
  const [pendingGuestNames, setPendingGuestNames] = useState<string[]>([]);
  const [hasActiveShare, setHasActiveShare] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refreshRef = useRef<(() => Promise<OwnerShareOrdersSnapshot | null>) | null>(null);
  const pageIdsKey = currentPageIds.join('\u001f');

  useEffect(() => {
    const requestGeneration = ++generation.current;
    const expectedPageIds = pageIdsKey ? pageIdsKey.split('\u001f') : [];
    let inFlightRequest: Promise<OwnerShareOrdersSnapshot | null> | null = null;

    const clearOrders = () => {
      if (generation.current !== requestGeneration) return;
      setEntries([]);
      setPendingGuestNames([]);
      setHasActiveShare(false);
      setError('');
    };

    if (!enabled || !expectedPageIds.length) {
      clearOrders();
      refreshRef.current = null;
      return () => { generation.current += 1; };
    }

    const refresh = () => {
      if (inFlightRequest) return inFlightRequest;
      if (generation.current !== requestGeneration) return Promise.resolve(null);
      inFlightRequest = (async (): Promise<OwnerShareOrdersSnapshot | null> => {
        try {
        let pointer: StoredSharePointer | null = null;
        try {
          const raw = localStorage.getItem(COMPANION_OWNER_SHARE_STORAGE_KEY);
          pointer = raw ? JSON.parse(raw) as StoredSharePointer : null;
        } catch {
          setError('無法讀取旅伴分享狀態');
          return null;
        }

        if (!pointer?.id) {
          clearOrders();
          return { shareSessionId: '', confirmedEntries: [], pendingGuestNames: [] };
        }

        const storedPageIds = Array.isArray(pointer.pageIds) ? pointer.pageIds : null;
        if (pointer.mode === 'menu' || (storedPageIds && !sameIds(storedPageIds, expectedPageIds))) {
          clearOrders();
          return { shareSessionId: '', confirmedEntries: [], pendingGuestNames: [] };
        }

        const response = await fetch(`/api/companion-share?sessionId=${encodeURIComponent(pointer.id)}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await response.json().catch(() => ({})) as OwnerShareResponse;
        if (!response.ok) throw new Error(data.error || '旅伴餐點暫時無法同步');

        const serverPageIds = Array.isArray(data.session?.pageIds) ? data.session.pageIds : [];
        if (data.session?.mode !== 'instant' || !sameIds(serverPageIds, expectedPageIds)) {
          clearOrders();
          return { shareSessionId: '', confirmedEntries: [], pendingGuestNames: [] };
        }

        if (generation.current !== requestGeneration) return null;
        const guestEntries = (data.entries || []).filter(entry => entry.guest_id !== 'host');
        const confirmedEntries = guestEntries.filter(entry => !!entry.confirmed_at);
        const pendingByGuest = new Map<string, string>();
        guestEntries.filter(entry => !entry.confirmed_at).forEach(entry => {
          pendingByGuest.set(entry.guest_id, entry.guest_name?.trim() || '旅伴');
        });
        const nextPendingGuestNames = [...pendingByGuest.values()];
        setHasActiveShare(true);
        setEntries(confirmedEntries);
        setPendingGuestNames(nextPendingGuestNames);
        setError('');
        return { shareSessionId: pointer.id, confirmedEntries, pendingGuestNames: nextPendingGuestNames };
        } catch (caught) {
          if (generation.current === requestGeneration) {
            setError(caught instanceof Error ? caught.message : '旅伴餐點暫時無法同步');
          }
          return null;
        }
      })().finally(() => { inFlightRequest = null; });
      return inFlightRequest;
    };

    refreshRef.current = refresh;
    void refresh();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = window.setInterval(refreshWhenVisible, 2000);
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      generation.current += 1;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      if (refreshRef.current === refresh) refreshRef.current = null;
    };
  }, [enabled, pageIdsKey]);

  return {
    entries,
    pendingGuestNames,
    hasActiveShare,
    error,
    refresh: async () => refreshRef.current ? refreshRef.current() : null,
  };
}

function sameIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left);
  return right.every(id => leftSet.has(id));
}
