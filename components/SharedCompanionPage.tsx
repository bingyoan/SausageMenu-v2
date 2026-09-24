'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, Loader2, Minus, Plus, Utensils, Users } from 'lucide-react';
import type { CompanionOrderEntry, CompanionSharePayload, SharedInstantPage } from '@/lib/companionShare';

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
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSaves = useRef(0);

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
    if (!pendingSaves.current && guestId) {
      const mine = freshEntries.filter(entry => entry.guest_id === guestId);
      setQuantities(Object.fromEntries(mine.map(entry => [entry.item_key, entry.quantity])));
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
    const refresh = async () => {
      try {
        await load(token);
        if (!cancelled) setError('');
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : '目前無法載入清單');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [token, load]);

  useEffect(() => {
    if (!session?.id) return;
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
  const displayItemsByKey = useMemo(() => new Map(displayItems.map(item => [item.key, item])), [displayItems]);
  const groupEntries = useMemo(() => {
    const groups = new Map<string, CompanionOrderEntry[]>();
    entries.forEach(entry => groups.set(entry.guest_name, [...(groups.get(entry.guest_name) || []), entry]));
    return [...groups.entries()];
  }, [entries]);

  const updateQuantity = (item: DisplayItem, delta: number) => {
    if (!guestName.trim() || !guestId || !token) {
      setError('請先輸入你的名字，再加入餐點。');
      return;
    }
    const next = Math.max(0, Math.min(99, (quantities[item.key] || 0) + delta));
    setQuantities(current => ({ ...current, [item.key]: next }));
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
    }).catch(caught => {
      setError(caught instanceof Error ? caught.message : '餐點更新失敗，請再試一次');
    }).finally(() => {
      pendingSaves.current = Math.max(0, pendingSaves.current - 1);
      setSaving(pendingSaves.current > 0);
    });
  };

  const updateName = (value: string) => {
    setGuestName(value);
    if (session?.id) {
      try { localStorage.setItem(`smp_companion_name:${session.id}`, value); } catch { /* The name is still kept in this page's state. */ }
    }
  };

  return <main className="min-h-dvh px-3 py-5 sm:px-5" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
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
                return <button key={region.id} type="button" onClick={() => updateQuantity(item, 1)} disabled={!guestName.trim() || saving}
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
              <div className="flex shrink-0 items-center gap-2"><button type="button" disabled={!guestName.trim() || saving} onClick={() => updateQuantity(item, -1)} aria-label="減少" className="flex h-9 w-9 items-center justify-center rounded-xl border disabled:opacity-40" style={{ borderColor: 'var(--glass-border)' }}><Minus size={16}/></button><span className="min-w-5 text-center text-sm font-bold">{quantities[item.key] || 0}</span><button type="button" disabled={!guestName.trim() || saving} onClick={() => updateQuantity(item, 1)} aria-label="增加" className="flex h-9 w-9 items-center justify-center rounded-xl text-white disabled:opacity-40" style={{ background: 'var(--brand-gradient)' }}><Plus size={16}/></button></div>
            </article>)}
            {!displayItems.length && <p className="py-10 text-center text-sm opacity-60">這份分享沒有可選的菜單品項。</p>}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs opacity-55">{saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}選取後會自動更新共用清單</p>
        </section>

        <section className="rounded-3xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
          <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><Users size={18}/>大家的點餐清單</h2><span className="text-xs opacity-55">每 3 秒同步</span></div>
          {!groupEntries.length ? <p className="py-6 text-center text-sm opacity-55">還沒有人加入餐點，先選幾道喜歡的吧。</p> : <div className="space-y-4">{groupEntries.map(([name, items]) => <div key={name}><p className="mb-1 text-xs font-bold opacity-60">{name}</p>{items.map(entry => <div key={entry.id} className="flex justify-between gap-3 py-1 text-sm"><span>{entry.translated_name || entry.original_name}<span className="ml-1 text-xs opacity-55">{entry.translated_name && entry.translated_name !== entry.original_name ? `(${entry.original_name})` : ''}</span></span><b>× {entry.quantity}</b></div>)}</div>)}</div>}
        </section>
      </> : null}

      {error && !expired && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <p className="pb-4 text-center text-[11px] opacity-45">餐點選擇只供同行旅伴查看；連結建立者可隨時關閉。</p>
    </div>
  </main>;
}
