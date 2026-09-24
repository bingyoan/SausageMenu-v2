'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Loader2, QrCode, RefreshCw, Share2, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Cart, ImageOverlayPage, ImageTranslationSelection, MenuData } from '@/types';
import type { CompanionOrderEntry, CompanionShareMode } from '@/lib/companionShare';

const OWNER_SHARE_STORAGE_KEY = 'smp_companion_share_active';

export type CompanionShareSource =
  | { mode: 'menu'; title: string; targetLanguage: string; menuData: MenuData; cart: Cart }
  | { mode: 'instant'; title: string; targetLanguage: string; pages: ImageOverlayPage[]; selections: ImageTranslationSelection[] };

interface OwnerShare {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
  fingerprint: string;
}

interface Props {
  source: CompanionShareSource;
  onClose: () => void;
}

function makeCreatePayload(source: CompanionShareSource) {
  if (source.mode === 'menu') {
    return {
      mode: 'menu' as CompanionShareMode,
      title: source.title,
      payload: {
        restaurantName: source.menuData.restaurantName,
        currency: source.menuData.originalCurrency,
        targetLanguage: source.targetLanguage,
        items: source.menuData.items.flatMap(item => [
          { ...item, currency: source.menuData.originalCurrency },
          ...(item.options || []).map((option, index) => ({
            id: `${item.id}-opt-${index}`,
            originalName: `${item.originalName} (${option.name})`,
            translatedName: `${item.translatedName} - ${option.name}`,
            price: option.price,
            currency: source.menuData.originalCurrency,
          })),
        ]),
      },
      ownerSelections: Object.values(source.cart).map(({ item, quantity }) => ({ key: item.id, quantity })),
    };
  }
  return {
    mode: 'instant' as CompanionShareMode,
    title: source.title,
    payload: {
      targetLanguage: source.targetLanguage,
      pages: source.pages.filter(page => page.status === 'ready').map(page => ({
        id: page.id,
        imageBase64: page.imageBase64,
        imageDataUrl: page.imageDataUrl,
        width: page.width,
        height: page.height,
        regions: page.regions,
      })),
    },
    ownerSelections: source.selections.map(selection => ({ key: `${selection.pageId}:${selection.regionId}`, quantity: selection.quantity })),
  };
}

function fingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function shareErrorStatus(error: unknown) {
  return error instanceof Error && 'status' in error ? Number(error.status) : 0;
}

function isShareExpired(error: unknown) {
  // 404 is also returned when this device is signed into a different owner
  // account. Do not erase the saved link unless the server confirms expiry.
  return shareErrorStatus(error) === 410;
}

export function CompanionShareModal({ source, onClose }: Props) {
  const [activeShare, setActiveShare] = useState<OwnerShare | null>(null);
  const [activeTitle, setActiveTitle] = useState('');
  const [entries, setEntries] = useState<CompanionOrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const sourcePayload = useMemo(() => makeCreatePayload(source), [source]);
  const sourceFingerprint = useMemo(() => fingerprint(JSON.stringify(sourcePayload)), [sourcePayload]);

  const loadOwnerSession = useCallback(async (share: OwnerShare) => {
    const response = await fetch(`/api/companion-share?sessionId=${encodeURIComponent(share.id)}`, {
      cache: 'no-store',
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data?.error || '無法載入分享狀態'), { status: response.status });
    setActiveTitle(data.session?.title || source.title);
    setEntries(Array.isArray(data.entries) ? data.entries : []);
  }, [source.title]);

  const forgetShare = useCallback(() => {
    try { localStorage.removeItem(OWNER_SHARE_STORAGE_KEY); } catch { /* The in-memory state is still cleared. */ }
    setActiveShare(null);
    setEntries([]);
    setActiveTitle('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      let saved: OwnerShare | null = null;
      try {
        const raw = localStorage.getItem(OWNER_SHARE_STORAGE_KEY);
        if (!raw) return;
        saved = JSON.parse(raw) as OwnerShare;
        if (!saved?.id || !saved?.token || Date.parse(saved.expiresAt) <= Date.now()) {
          localStorage.removeItem(OWNER_SHARE_STORAGE_KEY);
          return;
        }
        // Keep the share available while checking the server. A temporary
        // offline/auth/API error must not erase the only link the owner has.
        setActiveShare(saved);
        await loadOwnerSession(saved);
        if (!cancelled) setError('');
      } catch (caught) {
        if (!cancelled && saved && isShareExpired(caught)) {
          forgetShare();
          setError(caught instanceof Error ? caught.message : '分享已到期或關閉');
        } else if (!cancelled && saved) {
          setError(caught instanceof Error ? caught.message : '分享狀態暫時無法載入，正在重試');
        } else if (!saved) {
          try { localStorage.removeItem(OWNER_SHARE_STORAGE_KEY); } catch { /* Ignore invalid storage. */ }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void restore();
    return () => { cancelled = true; };
  }, [forgetShare, loadOwnerSession]);

  useEffect(() => {
    if (!activeShare || loading) return;
    let cancelled = false;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        await loadOwnerSession(activeShare);
        if (!cancelled) setError('');
      }
      catch (caught) {
        if (!cancelled && isShareExpired(caught)) {
          forgetShare();
          setError(caught instanceof Error ? caught.message : '分享已到期或關閉');
        } else if (!cancelled) {
          setError(caught instanceof Error ? caught.message : '分享狀態暫時無法更新');
        }
      } finally {
        polling = false;
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void poll();
    };
    void poll();
    const timer = window.setInterval(refreshWhenVisible, 2000);
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [activeShare, forgetShare, loadOwnerSession, loading, refreshTick]);

  const createShare = async () => {
    if (source.mode === 'instant' && sourcePayload.payload.pages.length === 0) {
      setError('目前沒有完成翻譯的圖片可以分享');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/companion-share', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourcePayload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || '無法建立分享');
      const share: OwnerShare = {
        id: data.id,
        token: data.token,
        url: `${window.location.origin}/share#${data.token}`,
        expiresAt: data.expiresAt,
        fingerprint: sourceFingerprint,
      };
      localStorage.setItem(OWNER_SHARE_STORAGE_KEY, JSON.stringify(share));
      setActiveShare(share);
      setActiveTitle(source.title);
      setEntries([]);
      setRefreshTick(value => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '無法建立分享，請稍後再試');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!activeShare) return;
    try {
      await navigator.clipboard.writeText(activeShare.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('複製失敗，請長按並複製下方連結');
    }
  };

  const shareLink = async () => {
    if (!activeShare) return;
    if (navigator.share) {
      try { await navigator.share({ title: activeTitle || source.title, text: '一起加入旅伴點餐清單', url: activeShare.url }); }
      catch { /* User dismissed the native share sheet. */ }
    } else {
      await copyLink();
    }
  };

  const revokeShare = async () => {
    if (!activeShare) return;
    setRevoking(true);
    setError('');
    try {
      const response = await fetch('/api/companion-share', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeShare.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || '目前無法關閉分享');
      localStorage.removeItem(OWNER_SHARE_STORAGE_KEY);
      setActiveShare(null);
      setEntries([]);
      setActiveTitle('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '目前無法關閉分享');
    } finally {
      setRevoking(false);
    }
  };

  const isSameShare = activeShare?.fingerprint === sourceFingerprint;
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, CompanionOrderEntry[]>();
    entries.forEach(entry => groups.set(entry.guest_name, [...(groups.get(entry.guest_name) || []), entry]));
    return [...groups.entries()];
  }, [entries]);

  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-2 sm:items-center sm:p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="companion-share-title" className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: 'var(--brand-glow)', color: 'var(--brand-primary)' }}><Users size={20}/></span>
          <div><h2 id="companion-share-title" className="font-extrabold">旅伴共用點餐清單</h2><p className="text-xs opacity-60">一起看菜單、一起選餐點</p></div>
        </div>
        <button type="button" onClick={onClose} aria-label="關閉" className="rounded-full p-2 opacity-70 hover:opacity-100"><X size={21}/></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : activeShare ? <div className="space-y-4">
          <div className="rounded-2xl border p-3 text-sm" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>
            <p className="font-bold">目前分享：{activeTitle || source.title}</p>
            {isSameShare ? <p className="mt-1 text-xs opacity-65">此連結 24 小時後失效；你也可以隨時關閉。</p> : <p className="mt-1 text-xs text-amber-600">目前連結分享的是先前建立的內容。若要分享這份菜單，先關閉舊連結再建立新連結。</p>}
          </div>

          {isSameShare && <div className="flex flex-col items-center gap-3 rounded-2xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'white' }}>
            <QRCodeSVG value={activeShare.url} size={188} level="M" includeMargin aria-label="旅伴分享 QR Code" />
            <p className="text-xs text-center text-gray-600">旅伴掃描 QR Code 或開啟分享連結即可加入，無須登入或安裝 App。</p>
          </div>}

          {isSameShare && <div className="space-y-2">
            <div className="flex gap-2">
              <button type="button" onClick={shareLink} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-white" style={{ background: 'var(--brand-gradient)' }}><Share2 size={17}/>分享連結</button>
              <button type="button" onClick={copyLink} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>{copied ? <Check size={17}/> : <Copy size={17}/>}複製</button>
            </div>
            <p className="break-all rounded-lg px-3 py-2 text-[11px] opacity-65" style={{ background: 'var(--bg-secondary)' }}>{activeShare.url}</p>
          </div>}

          <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-bold">共同點餐內容</h3><div className="flex items-center gap-2"><span className="text-xs opacity-60">約每 2 秒自動同步</span><button type="button" onClick={() => { setError(''); setRefreshTick(value => value + 1); }} aria-label="立即同步共同點餐內容" title="立即同步" className="rounded-lg border p-1.5 opacity-75 hover:opacity-100" style={{ borderColor: 'var(--glass-border)' }}><RefreshCw size={15}/></button></div></div>
            {!entries.length ? <p className="py-5 text-center text-sm opacity-55">旅伴加入後，選擇的餐點會顯示在這裡。</p> : <div className="max-h-52 space-y-3 overflow-y-auto">
              {groupedEntries.map(([name, items]) => <div key={name}>
                <p className="mb-1 flex items-center gap-2 text-xs font-bold opacity-60">{name}{items.some(item => item.confirmed_at) && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">已確認</span>}</p>
                {items.map(item => <div key={item.id} className="flex justify-between gap-3 py-1 text-sm"><span>{item.translated_name || item.original_name}<span className="ml-1 text-xs opacity-55">{item.translated_name && item.translated_name !== item.original_name ? `(${item.original_name})` : ''}</span></span><b>× {item.quantity}</b></div>)}
              </div>)}
            </div>}
          </div>

          <button type="button" disabled={revoking} onClick={revokeShare} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-300 px-3 text-sm font-bold text-red-600 disabled:opacity-50"><Trash2 size={17}/>{revoking ? '正在關閉…' : '立即關閉分享連結'}</button>
        </div> : <div className="space-y-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>
            <p className="font-bold">即將分享「{source.title}」</p>
            <p className="mt-2 text-sm opacity-70">任何拿到連結的人都能查看這份菜單並加入自己的餐點。分享會在 24 小時後自動失效，也能隨時手動關閉。</p>
            {source.mode === 'menu' ? <p className="mt-2 text-xs opacity-60">菜單模式 · {source.menuData.items.length} 個品項 · 目前已選 {Object.values(source.cart).reduce((sum, item) => sum + item.quantity, 0)} 份</p> : <p className="mt-2 text-xs opacity-60">一拍即翻 · {source.pages.filter(page => page.status === 'ready').length} 張已翻譯圖片 · 分享照片與辨識文字</p>}
          </div>
          {source.mode === 'instant' && <div className="flex gap-2 overflow-x-auto pb-1">
            {source.pages.filter(page => page.status === 'ready').map(page => <img key={page.id} src={page.imageDataUrl} alt="即將分享的菜單" className="h-24 w-20 shrink-0 rounded-lg border object-cover" style={{ borderColor: 'var(--glass-border)' }} />)}
          </div>}
          <button type="button" disabled={creating} onClick={createShare} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white disabled:opacity-60" style={{ background: 'var(--brand-gradient)' }}>
            {creating ? <><Loader2 size={18} className="animate-spin"/>正在建立安全連結…</> : <><QrCode size={18}/>建立分享連結與 QR Code</>}
          </button>
        </div>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </section>
  </div>;
}
