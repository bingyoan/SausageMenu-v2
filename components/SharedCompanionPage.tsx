'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, Loader2, Minus, Plus, Utensils, Users } from 'lucide-react';
import { ImageCompareTranslation } from '@/components/ImageCompareTranslation';
import type { CompanionOrderEntry, CompanionSharePayload, SharedInstantPage } from '@/lib/companionShare';
import { TargetLanguage, type ImageOverlayPage, type ImageTranslationRegion, type ImageTranslationSelection } from '@/types';

interface SharedSession {
  id: string;
  mode: 'menu' | 'instant';
  title: string;
  expiresAt: string;
  payload: CompanionSharePayload;
}

interface ShareResponse {
  success: boolean;
  error?: string;
  session?: SharedSession;
  entries?: CompanionOrderEntry[];
}

interface DisplayItem {
  key: string;
  original: string;
  translated: string;
  group?: string;
  price?: number;
}

function SharedInstantExperience({
  session,
  pages,
  selectedItems,
  displayItems,
  entries,
  guestId,
  guestName,
  saving,
  confirming,
  canConfirm,
  confirmedAt,
  showDownloadPrompt,
  error,
  onNameChange,
  onChangeQuantity,
  onUpdateItem,
  onConfirmOrder,
  onCloseDownloadPrompt,
}: {
  session: SharedSession;
  pages: ImageOverlayPage[];
  selectedItems: ImageTranslationSelection[];
  displayItems: DisplayItem[];
  entries: CompanionOrderEntry[];
  guestId: string;
  guestName: string;
  saving: boolean;
  confirming: boolean;
  canConfirm: boolean;
  confirmedAt: string;
  showDownloadPrompt: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onChangeQuantity: (pageId: string, region: ImageTranslationRegion, delta: number) => void;
  onUpdateItem: (item: DisplayItem, delta: number) => void;
  onConfirmOrder: () => void;
  onCloseDownloadPrompt: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showOrderList, setShowOrderList] = useState(false);
  const imageItems = useMemo(() => new Map(displayItems.map(item => [item.key, item])), [displayItems]);
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, CompanionOrderEntry[]>();
    entries.forEach(entry => groups.set(entry.guest_name, [...(groups.get(entry.guest_name) || []), entry]));
    return [...groups.entries()];
  }, [entries]);
  const totalQuantity = entries.reduce((total, entry) => total + entry.quantity, 0);
  const targetLanguage = Object.values(TargetLanguage).includes(session.payload.targetLanguage as TargetLanguage)
    ? session.payload.targetLanguage as TargetLanguage
    : TargetLanguage.ChineseTW;

  return <main className="relative h-[100dvh] w-full overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
    <ImageCompareTranslation
      pages={pages}
      activeIndex={Math.min(activeIndex, Math.max(0, pages.length - 1))}
      onSelectPage={setActiveIndex}
      onRetry={() => {}}
      onBack={() => { if (window.history.length > 1) window.history.back(); else window.location.assign('/'); }}
      showBackButton={false}
      uiLanguage={targetLanguage}
      selectedItems={selectedItems}
      onChangeQuantity={onChangeQuantity}
      onAdjustSelection={(selectionId, delta) => {
        const item = imageItems.get(selectionId);
        if (item) onUpdateItem(item, delta);
      }}
      onRemoveSelection={selectionId => {
        const item = imageItems.get(selectionId);
        const quantity = selectedItems.find(selection => selection.id === selectionId)?.quantity || 0;
        if (item && quantity > 0) onUpdateItem(item, -quantity);
      }}
      showShareButton={false}
      onOpenOrderList={() => setShowOrderList(true)}
      orderListLabel={totalQuantity ? `共用點餐清單 · ${totalQuantity}` : '共用點餐清單'}
      footerAccessory={<div>
        <button type="button" disabled={!canConfirm || confirming} onClick={onConfirmOrder}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--brand-gradient)' }}>
          {confirming ? <><Loader2 size={17} className="animate-spin"/>正在確認…</> : <><Check size={17}/>{confirmedAt ? '更新完成餐點' : '完成點餐'}</>}
        </button>
    {saving && <p className="mt-1 text-center text-[11px] opacity-55">正在同步到共用清單…</p>}
    {confirmedAt && <p className="mt-1 text-center text-[11px] opacity-55">已完成點餐；仍可繼續修改</p>}
      </div>}
      headerAccessory={<label className="block w-28 sm:w-36">
        <span className="sr-only">你的名字 / Your name</span>
        <input value={guestName} onChange={event => onNameChange(event.target.value)} maxLength={48} placeholder="你的名字 / Name"
          className="min-h-9 w-full rounded-lg border px-2 text-xs outline-none"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} />
      </label>}
    />

    {error && <div role="alert" className="absolute left-3 right-3 top-[calc(env(safe-area-inset-top)+4.5rem)] z-30 mx-auto max-w-lg rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 shadow-lg">{error}</div>}
    {!guestName.trim() && !error && <div className="pointer-events-none absolute left-1/2 top-[calc(env(safe-area-inset-top)+4.5rem)] z-20 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-center text-[11px] text-white">輸入名字後即可點選菜色</div>}

    {showOrderList && <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4">
      <section role="dialog" aria-modal="true" aria-label="旅伴共用點餐清單" className="flex max-h-[92%] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <header className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
          <div><h2 className="text-lg font-extrabold">旅伴共用點餐清單</h2><p className="text-xs opacity-60">{entries.length} 項 · 共 {totalQuantity} 份</p></div>
          <button type="button" onClick={() => setShowOrderList(false)} aria-label="關閉點餐清單" className="rounded-full px-3 py-2 text-sm">返回菜單</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {!groupedEntries.length ? <p className="py-10 text-center text-sm opacity-60">還沒有人加入餐點，點選菜單上的菜色開始點餐。</p> : <div className="space-y-5">
            {groupedEntries.map(([name, items]) => <section key={name}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold opacity-65">{name}{items.some(item => item.guest_id === guestId) ? '（你）' : ''}{items.some(item => item.confirmed_at) && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">已確認</span>}</h3>
              <div className="space-y-2">{items.map(entry => {
                const ownItem = entry.guest_id === guestId ? imageItems.get(entry.item_key) : undefined;
                return <article key={entry.id} className="flex items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>
                  <div className="min-w-0 flex-1"><p className="text-sm font-bold">{entry.translated_name || entry.original_name}</p>{entry.translated_name && entry.original_name !== entry.translated_name && <p className="mt-0.5 text-xs opacity-55">{entry.original_name}</p>}</div>
                  {ownItem ? <div className="flex shrink-0 items-center gap-2">
                    <button type="button" disabled={confirming || !guestName.trim()} onClick={() => onUpdateItem(ownItem, -1)} aria-label={`減少 ${entry.translated_name || entry.original_name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--glass-border)' }}><Minus size={14}/></button>
                    <span className="min-w-5 text-center text-sm font-bold">{entry.quantity}</span>
                    <button type="button" disabled={confirming || !guestName.trim()} onClick={() => onUpdateItem(ownItem, 1)} aria-label={`增加 ${entry.translated_name || entry.original_name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--brand-gradient)' }}><Plus size={14}/></button>
                  </div> : <b className="shrink-0 text-sm">× {entry.quantity}</b>}
                </article>;
              })}</div>
            </section>)}
          </div>}
        </div>
        <footer className="space-y-2 border-t px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
          <button type="button" disabled={!canConfirm || confirming} onClick={onConfirmOrder} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50" style={{ background: 'var(--brand-gradient)' }}>
            {confirming ? <><Loader2 size={16} className="animate-spin"/>正在確認…</> : <><Check size={16}/>{confirmedAt ? '更新完成餐點' : '完成點餐'}</>}
          </button>
          <button type="button" onClick={() => setShowOrderList(false)} className="w-full rounded-xl border px-4 py-2.5 text-sm font-bold" style={{ borderColor: 'var(--glass-border)' }}>返回菜單繼續選餐</button>
        </footer>
      </section>
    </div>}
    {showDownloadPrompt && <DownloadAppPrompt onClose={onCloseDownloadPrompt}/>}
  </main>;
}

function DownloadAppPrompt({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="companion-download-title" className="w-full max-w-sm rounded-3xl p-5 shadow-2xl" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Check size={25}/></div>
      <h2 id="companion-download-title" className="text-lg font-extrabold">餐點已確認</h2>
      <p className="mt-2 text-sm opacity-70">你仍可回到菜單修改餐點。想隨時翻譯菜單、保存紀錄，也可以下載 Sausage Menu Pal。</p>
      <div className="mt-5 grid grid-cols-1 gap-2">
        <a href="https://apps.apple.com/app/id6760179953" target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-white" style={{ background: 'var(--brand-gradient)' }}>下載 iOS 版</a>
        <a href="https://play.google.com/store/apps/details?id=com.sausagemenu.app" target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold" style={{ borderColor: 'var(--glass-border)' }}>下載 Android 版</a>
      </div>
      <button type="button" onClick={onClose} className="mt-3 min-h-10 w-full rounded-xl px-4 text-sm opacity-70">繼續使用網頁</button>
    </section>
  </div>;
}

function getTokenFromLocation() {
  const fromHash = window.location.hash.replace(/^#(?:token=)?/, '').trim();
  if (fromHash) {
    try { sessionStorage.setItem('smp_companion_share_token', fromHash); } catch { /* Continue with the in-memory token. */ }
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    return fromHash;
  }
  try { return sessionStorage.getItem('smp_companion_share_token') || ''; } catch { return ''; }
}

function localGuestId(sessionId: string) {
  const key = `smp_companion_guest:${sessionId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const generated = crypto.randomUUID();
    localStorage.setItem(key, generated);
    return generated;
  } catch { return crypto.randomUUID(); }
}

export function SharedCompanionPage() {
  const [token, setToken] = useState('');
  const [session, setSession] = useState<SharedSession | null>(null);
  const [entries, setEntries] = useState<CompanionOrderEntry[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guestId, setGuestId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState('');
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSaves = useRef(0);
  const quantitiesRef = useRef<Record<string, number>>({});
  const lastSavedQuantities = useRef<Record<string, number>>({});
  const itemRevisions = useRef(new Map<string, number>());
  const quantitiesHydrated = useRef(false);
  const saveFailure = useRef('');
  const confirmingRef = useRef(false);

  const load = useCallback(async (shareToken: string) => {
    const response = await fetch('/api/companion-share/access', {
      headers: { Authorization: `Bearer ${shareToken}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({})) as ShareResponse;
    if (response.status === 410) {
      setExpired(true);
      setSession(null);
      return;
    }
    if (!response.ok || !data.session) throw new Error(data.error || '無法開啟共用清單');
    setSession(current => current?.id === data.session?.id
      ? { ...current, expiresAt: data.session.expiresAt }
      : data.session || null);
    const freshEntries = data.entries || [];
    setEntries(freshEntries);
    const ownRows = guestId ? freshEntries.filter(entry => entry.guest_id === guestId) : [];
    const serverConfirmation = ownRows.find(entry => entry.confirmed_at)?.confirmed_at;
    if (serverConfirmation) setConfirmedAt(serverConfirmation);
    if (guestId && !quantitiesHydrated.current) {
      const initial = Object.fromEntries(ownRows.map(entry => [entry.item_key, entry.quantity]));
      quantitiesRef.current = initial;
      lastSavedQuantities.current = initial;
      setQuantities(initial);
      quantitiesHydrated.current = true;
    }
  }, [guestId]);

  useEffect(() => {
    const found = getTokenFromLocation();
    setToken(found);
    if (!found) {
      setError('連結缺少分享代碼。請向建立者重新索取連結或 QR Code。');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let polling = false;
    const refresh = async () => {
      if (polling) return;
      polling = true;
      try {
        await load(token);
        if (!cancelled) setError('');
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : '目前無法載入清單');
      } finally {
        if (!cancelled) setLoading(false);
        polling = false;
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [token, load]);

  useEffect(() => {
    if (!session?.id) return;
    quantitiesHydrated.current = false;
    quantitiesRef.current = {};
    lastSavedQuantities.current = {};
    itemRevisions.current.clear();
    setQuantities({});
    setConfirmedAt('');
    setShowDownloadPrompt(false);
    const id = localGuestId(session.id);
    setGuestId(id);
    try { setGuestName(localStorage.getItem(`smp_companion_name:${session.id}`) || ''); } catch { /* Name can be re-entered. */ }
  }, [session?.id]);

  useEffect(() => {
    const pages = session?.payload.mode === 'instant' ? session.payload.pages || [] : [];
    if (!token || !session || !pages.length) return;
    let cancelled = false;
    const objectUrls: string[] = [];
    const download = async () => {
      const pairs = await Promise.all(pages.map(async (page: SharedInstantPage) => {
        if (!page.imageUrl) return [page.id, ''] as const;
        try {
          const response = await fetch(page.imageUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
          if (!response.ok) return [page.id, ''] as const;
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          return [page.id, url] as const;
        } catch { return [page.id, ''] as const; }
      }));
      if (!cancelled) setImages(Object.fromEntries(pairs));
    };
    void download();
    return () => {
      cancelled = true;
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [token, session?.id, session?.payload]);

  const displayItems = useMemo<DisplayItem[]>(() => {
    if (!session) return [];
    if (session.payload.mode === 'menu') {
      return (session.payload.items || []).map(item => ({
        key: item.id,
        original: item.originalName,
        translated: item.translatedName,
        group: item.currency,
        price: item.price,
      }));
    }
    return (session.payload.pages || []).flatMap(page => page.regions.map(region => ({
      key: `${page.id}:${region.id}`,
      original: region.originalText,
      translated: region.translatedText,
      group: page.id,
    })).filter(item => item.original || item.translated));
  }, [session]);

  const pageImages = session?.payload.mode === 'instant' ? session.payload.pages || [] : [];
  const comparePages = useMemo<ImageOverlayPage[]>(() => pageImages.map(page => ({
    id: page.id,
    imageDataUrl: images[page.id] || '',
    imageBase64: '',
    width: page.width,
    height: page.height,
    status: images[page.id] ? 'ready' : page.imageUrl ? 'processing' : 'error',
    error: page.imageUrl ? undefined : '無法載入菜單照片，請重新開啟分享連結。',
    regions: page.regions.filter(region => Array.isArray(region.polygon) && region.polygon.length >= 3).map(region => ({
      id: region.id,
      originalText: region.originalText,
      translatedText: region.translatedText,
      polygon: region.polygon as unknown as ImageTranslationRegion['polygon'],
      orientation: region.orientation || 'horizontal',
      rotation: region.rotation || 0,
      confidence: region.confidence ?? 0.5,
      kind: region.kind || 'other',
    })),
  })), [pageImages, images]);
  const displayItemsByKey = useMemo(() => new Map(displayItems.map(item => [item.key, item])), [displayItems]);
  const visibleEntries = useMemo<CompanionOrderEntry[]>(() => {
    if (!guestId) return entries;
    const remoteEntries = entries.filter(entry => entry.guest_id !== guestId);
    const ownEntries = displayItems.flatMap(item => {
      const quantity = quantities[item.key] || 0;
      if (quantity <= 0) return [];
      const saved = entries.find(entry => entry.guest_id === guestId && entry.item_key === item.key);
      return [{
        id: saved?.id || `local-${guestId}-${item.key}`,
        guest_id: guestId,
        guest_name: guestName.trim() || saved?.guest_name || '',
        item_key: item.key,
        original_name: item.original,
        translated_name: item.translated,
        quantity,
        confirmed_at: confirmedAt || saved?.confirmed_at || null,
        updated_at: saved?.updated_at || new Date(0).toISOString(),
      }];
    });
    return [...remoteEntries, ...ownEntries];
  }, [entries, guestId, displayItems, quantities, guestName, confirmedAt]);
  const compareSelectedItems = useMemo<ImageTranslationSelection[]>(() => visibleEntries
    .filter(entry => entry.guest_id === guestId && entry.quantity > 0)
    .map(entry => {
      const separator = entry.item_key.indexOf(':');
      return {
        id: entry.item_key,
        pageId: entry.item_key.slice(0, separator),
        regionId: entry.item_key.slice(separator + 1),
        originalText: entry.original_name,
        translatedText: entry.translated_name,
        quantity: entry.quantity,
      };
    }), [visibleEntries, guestId]);
  const groupEntries = useMemo(() => {
    const groups = new Map<string, CompanionOrderEntry[]>();
    visibleEntries.forEach(entry => groups.set(entry.guest_name, [...(groups.get(entry.guest_name) || []), entry]));
    return [...groups.entries()];
  }, [visibleEntries]);

  const updateQuantity = (item: DisplayItem, delta: number) => {
    if (confirmingRef.current) return;
    if (!guestName.trim() || !guestId || !token) {
      setError('請先輸入你的名字，再加入餐點。');
      return;
    }
    const currentQuantity = quantitiesRef.current[item.key] || 0;
    const next = Math.max(0, Math.min(99, currentQuantity + delta));
    if (next === currentQuantity) return;
    const nextQuantities = { ...quantitiesRef.current, [item.key]: next };
    quantitiesRef.current = nextQuantities;
    setQuantities(nextQuantities);
    setError('');
    saveFailure.current = '';
    const revision = (itemRevisions.current.get(item.key) || 0) + 1;
    itemRevisions.current.set(item.key, revision);
    setSaving(true);
    pendingSaves.current += 1;
    saveQueue.current = saveQueue.current.then(async () => {
      const response = await fetch('/api/companion-share/access', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, guestName: guestName.trim(), itemKey: item.key, quantity: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '餐點更新失敗');
      lastSavedQuantities.current = { ...lastSavedQuantities.current, [item.key]: next };
      saveFailure.current = '';
    }).catch(caught => {
      const message = caught instanceof Error ? caught.message : '餐點更新失敗，請再試一次';
      saveFailure.current = message;
      setError(message);
      if (itemRevisions.current.get(item.key) === revision) {
        const rolledBack = { ...quantitiesRef.current, [item.key]: lastSavedQuantities.current[item.key] || 0 };
        quantitiesRef.current = rolledBack;
        setQuantities(rolledBack);
      }
    }).finally(() => {
      pendingSaves.current = Math.max(0, pendingSaves.current - 1);
      setSaving(pendingSaves.current > 0);
    });
  };

  const updateName = (value: string) => {
    setGuestName(value);
    setError('');
    if (session?.id) {
      try { localStorage.setItem(`smp_companion_name:${session.id}`, value); } catch { /* The name is still kept in this page's state. */ }
    }
  };

  const changeCompareQuantity = (pageId: string, region: ImageTranslationRegion, delta: number) => {
    const item = displayItemsByKey.get(`${pageId}:${region.id}`);
    if (item) updateQuantity(item, delta);
  };

  const ownTotalQuantity = Object.values(quantities).reduce((total, quantity) => total + quantity, 0);
  const confirmOrder = async () => {
    if (!token || !guestId || !guestName.trim() || ownTotalQuantity <= 0 || confirmingRef.current) return;
    confirmingRef.current = true;
    setConfirming(true);
    setError('');
    try {
      await saveQueue.current;
      if (saveFailure.current) throw new Error(saveFailure.current);
      const response = await fetch('/api/companion-share/access', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', guestId, guestName: guestName.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '確認餐點失敗，請稍後再試');
      const timestamp = typeof data.confirmedAt === 'string' ? data.confirmedAt : new Date().toISOString();
      setConfirmedAt(timestamp);
      setEntries(current => current.map(entry => entry.guest_id === guestId ? { ...entry, guest_name: guestName.trim(), confirmed_at: timestamp, updated_at: timestamp } : entry));
      setShowDownloadPrompt(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '確認餐點失敗，請稍後再試');
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  };

  if (session?.payload.mode === 'instant') {
    return <SharedInstantExperience
      session={session}
      pages={comparePages}
      selectedItems={compareSelectedItems}
      displayItems={displayItems}
      entries={visibleEntries}
      guestId={guestId}
      guestName={guestName}
      saving={saving}
      confirming={confirming}
      canConfirm={ownTotalQuantity > 0 && !!guestName.trim()}
      confirmedAt={confirmedAt}
      showDownloadPrompt={showDownloadPrompt}
      error={error}
      onNameChange={updateName}
      onChangeQuantity={changeCompareQuantity}
      onUpdateItem={updateQuantity}
      onConfirmOrder={confirmOrder}
      onCloseDownloadPrompt={() => setShowDownloadPrompt(false)}
    />;
  }

  return <>
  <main className="min-h-dvh px-3 pb-28 pt-5 sm:px-5" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="rounded-3xl border p-5 shadow-sm" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
        <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--brand-primary)' }}><Utensils size={17}/> Sausage Menu Pal · 旅伴共點</div>
        <h1 className="text-2xl font-extrabold">{session?.title || '旅伴共用點餐清單'}</h1>
        {session && <p className="mt-2 flex items-center gap-1.5 text-xs opacity-60"><Clock3 size={14}/>連結將於 {new Date(session.expiresAt).toLocaleString()} 失效</p>}
      </header>

      {loading ? <section className="flex items-center justify-center gap-2 rounded-3xl border p-10" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}><Loader2 className="animate-spin"/>正在載入清單…</section> : expired ? <section className="rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}><h2 className="text-lg font-bold">分享已關閉</h2><p className="mt-2 text-sm opacity-65">這個連結已過期或由建立者關閉，請向旅伴索取新的連結。</p></section> : session ? <>
        <section className="rounded-3xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
          <label className="mb-2 block text-sm font-bold" htmlFor="companion-name">你的名字 / Your name</label>
          <input id="companion-name" value={guestName} onChange={event => updateName(event.target.value)} maxLength={48} placeholder="例如：Amy" className="min-h-11 w-full rounded-xl border px-3 text-sm outline-none" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}/>
          <p className="mt-2 text-xs opacity-55">不必登入，也不必安裝 App；選取餐點後，大家會看到更新。</p>
        </section>

        {pageImages.length > 0 && <section className="space-y-3 rounded-3xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
          <h2 className="font-bold">原始菜單照片與辨識結果</h2>
          {pageImages.map((page, index) => {
            const aspect = Math.max(.1, page.width / Math.max(1, page.height));
            return <div key={page.id} className="grid grid-cols-1 gap-3 rounded-2xl border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>
            {images[page.id] ? <div className="relative mx-auto max-h-64 max-w-full overflow-hidden rounded-xl" style={{ width: `min(100%, ${Math.min(640, 256 * aspect)}px)`, aspectRatio: `${page.width} / ${page.height}` }}>
              <img src={images[page.id]} alt={`原始菜單 ${index + 1}`} className="absolute inset-0 h-full w-full object-fill"/>
              {page.regions.map(region => {
                const item = displayItemsByKey.get(`${page.id}:${region.id}`);
                if (!item || !region.polygon?.length) return null;
                const xs = region.polygon.map(point => point.x);
                const ys = region.polygon.map(point => point.y);
                const left = Math.min(...xs), top = Math.min(...ys);
                const width = Math.max(.035, Math.max(...xs) - left);
                const height = Math.max(.025, Math.max(...ys) - top);
                const quantity = quantities[item.key] || 0;
                return <button key={region.id} type="button" onClick={() => updateQuantity(item, 1)} disabled={!guestName.trim() || confirming}
                  aria-label={`加入 ${item.translated || item.original}`} title="點擊加入清單"
                  className="absolute overflow-hidden rounded-sm px-0.5 text-left leading-tight text-white shadow disabled:cursor-not-allowed"
                  style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${Math.min(100, width * 100)}%`, height: `${Math.min(100, height * 100)}%`, background: quantity ? 'rgba(234,88,12,.92)' : 'rgba(20,25,30,.76)', fontSize: 'clamp(6px, 1.7vw, 12px)' }}>
                  <span className="line-clamp-2">{item.translated || item.original}{quantity ? ` ×${quantity}` : ''}</span>
                </button>;
              })}
            </div> : <div className="flex min-h-32 items-center justify-center text-xs opacity-50">圖片載入中…</div>}
            <div className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {page.regions.map(region => <div key={region.id} className="rounded-lg border p-2" style={{ borderColor: 'var(--glass-border)' }}><p className="font-bold">{region.translatedText || region.originalText}</p>{region.translatedText && region.originalText && region.translatedText !== region.originalText && <p className="mt-1 text-xs opacity-60">{region.originalText}</p>}</div>)}
            </div>
          </div>})}
        </section>}

        <section className="rounded-3xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">選擇你想點的餐點</h2><span className="text-xs opacity-55">{displayItems.length} 項</span></div>
          <div className="max-h-[48dvh] space-y-2 overflow-y-auto pr-1">
            {displayItems.map(item => <article key={item.key} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>
              <div className="min-w-0 flex-1"><p className="font-bold leading-snug">{item.translated || item.original}</p>{item.translated && item.original && item.translated !== item.original && <p className="mt-1 text-xs opacity-60">{item.original}</p>}{item.price !== undefined && <p className="mt-1 text-xs opacity-55">{item.price} {session.payload.currency || item.group}</p>}</div>
              <div className="flex shrink-0 items-center gap-2"><button type="button" disabled={!guestName.trim() || confirming} onClick={() => updateQuantity(item, -1)} aria-label="減少" className="flex h-9 w-9 items-center justify-center rounded-xl border disabled:opacity-40" style={{ borderColor: 'var(--glass-border)' }}><Minus size={16}/></button><span className="min-w-5 text-center text-sm font-bold">{quantities[item.key] || 0}</span><button type="button" disabled={!guestName.trim() || confirming} onClick={() => updateQuantity(item, 1)} aria-label="增加" className="flex h-9 w-9 items-center justify-center rounded-xl text-white disabled:opacity-40" style={{ background: 'var(--brand-gradient)' }}><Plus size={16}/></button></div>
            </article>)}
            {!displayItems.length && <p className="py-10 text-center text-sm opacity-60">這份分享沒有可選的菜單品項。</p>}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs opacity-55">{saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}選取後會自動更新共用清單</p>
        </section>

        <section className="rounded-3xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
          <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Users size={18}/>大家的點餐清單</h2><span className="text-xs opacity-55">約每 2 秒同步</span></div>
          {!groupEntries.length ? <p className="py-6 text-center text-sm opacity-55">還沒有人加入餐點，先選幾道喜歡的吧。</p> : <div className="space-y-4">{groupEntries.map(([name, items]) => <div key={name}><p className="mb-1 flex items-center gap-2 text-xs font-bold opacity-60">{name}{items.some(entry => entry.confirmed_at) && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">已確認</span>}</p>{items.map(entry => <div key={entry.id} className="flex justify-between gap-3 py-1 text-sm"><span>{entry.translated_name || entry.original_name}<span className="ml-1 text-xs opacity-55">{entry.translated_name && entry.translated_name !== entry.original_name ? `(${entry.original_name})` : ''}</span></span><b>× {entry.quantity}</b></div>)}</div>)}</div>}
        </section>
      </> : null}

      {error && !expired && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <p className="pb-4 text-center text-[11px] opacity-45">餐點選擇只供同行旅伴查看；連結建立者可隨時關閉。</p>
    </div>
  </main>
  {session && !expired && <div className="fixed inset-x-0 bottom-0 z-30 border-t px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3" style={{ background: 'var(--bg-primary)', borderColor: 'var(--glass-border)' }}>
    <button type="button" disabled={ownTotalQuantity <= 0 || !guestName.trim() || confirming} onClick={confirmOrder} className="mx-auto flex min-h-12 w-full max-w-2xl items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: 'var(--brand-gradient)' }}>
      {confirming ? <><Loader2 size={17} className="animate-spin"/>正在確認…</> : <><Check size={17}/>{confirmedAt ? '更新完成餐點' : ownTotalQuantity ? `完成點餐 · ${ownTotalQuantity} 份` : '先選擇餐點'}</>}
        </button>
        {saving && <p className="mt-1 text-center text-[11px] opacity-55">正在同步到共用清單…</p>}
        {confirmedAt && <p className="mt-1 text-center text-[11px] opacity-55">已確認；仍可繼續修改</p>}
  </div>}
  {showDownloadPrompt && <DownloadAppPrompt onClose={() => setShowDownloadPrompt(false)}/>}
  </>;
}
