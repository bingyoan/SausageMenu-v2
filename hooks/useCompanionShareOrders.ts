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

/** Poll confirmed guest orders while the owner is viewing the same instant-translation menu. */
export function useCompanionShareOrders(enabled: boolean, currentPageIds: string[]) {
  const [entries, setEntries] = useState<CompanionOrderEntry[]>([]);
  const [hasActiveShare, setHasActiveShare] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const pageIdsKey = currentPageIds.join('\u001f');

  useEffect(() => {
    const requestGeneration = ++generation.current;
    const expectedPageIds = pageIdsKey ? pageIdsKey.split('\u001f') : [];
    let requestInFlight = false;

    const clearOrders = () => {
      if (generation.current !== requestGeneration) return;
      setEntries([]);
      setHasActiveShare(false);
      setError('');
    };

    if (!enabled || !expectedPageIds.length) {
      clearOrders();
      refreshRef.current = null;
      return () => { generation.current += 1; };
    }

    const refresh = async () => {
      if (requestInFlight || generation.current !== requestGeneration) return;
      requestInFlight = true;
      try {
        let pointer: StoredSharePointer | null = null;
        try {
          const raw = localStorage.getItem(COMPANION_OWNER_SHARE_STORAGE_KEY);
          pointer = raw ? JSON.parse(raw) as StoredSharePointer : null;
        } catch {
          setError('無法讀取旅伴分享狀態');
          return;
        }

        if (!pointer?.id) {
          clearOrders();
          return;
        }

        const storedPageIds = Array.isArray(pointer.pageIds) ? pointer.pageIds : null;
        if (pointer.mode === 'menu' || (storedPageIds && !sameIds(storedPageIds, expectedPageIds))) {
          clearOrders();
          return;
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
          return;
        }

        if (generation.current !== requestGeneration) return;
        setHasActiveShare(true);
        setEntries((data.entries || []).filter(entry => entry.guest_id !== 'host' && !!entry.confirmed_at));
        setError('');
      } catch (caught) {
        if (generation.current === requestGeneration) {
          setError(caught instanceof Error ? caught.message : '旅伴餐點暫時無法同步');
        }
      } finally {
        requestInFlight = false;
      }
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
    hasActiveShare,
    error,
    refresh: () => refreshRef.current?.(),
  };
}

function sameIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left);
  return right.every(id => leftSet.has(id));
}
