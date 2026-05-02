'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Send, Clock, AlertTriangle, UserCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface MenuItem {
  id: string;
  originalName: string;
  translatedName: string;
  price: number;
  category?: string;
  shortDescription?: string;
  allergy_warning?: boolean;
  dietary_tags?: string[];
  options?: { name: string; price: number }[];
}

interface MenuData {
  items: MenuItem[];
  originalCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  restaurantName?: string;
}

interface SessionData {
  id: string;
  hostName: string;
  menuData: MenuData;
  targetLanguage: string;
  originalCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  expiresAt: string;
}

type PageState = 'loading' | 'name_input' | 'ordering' | 'submitted' | 'expired' | 'error';

export default function SharedMenuPage() {
  const params = useParams();
  const sessionId = params?.id as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [session, setSession] = useState<SessionData | null>(null);
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState('');
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // 載入場次資料
  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/share-session?id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.session) {
          setSession(data.session);
          setPageState('name_input');
          // 預設展開所有分類
          const cats: Record<string, boolean> = {};
          (data.session.menuData?.items || []).forEach((item: MenuItem) => {
            const cat = item.category || 'Others';
            cats[cat] = true;
          });
          setExpandedCategories(cats);
        } else if (data.expired) {
          setPageState('expired');
        } else {
          setErrorMsg(data.error || 'Session not found');
          setPageState('error');
        }
      })
      .catch(err => {
        setErrorMsg(err.message);
        setPageState('error');
      });
  }, [sessionId]);

  // 倒數計時器
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(session.expiresAt).getTime();
      const diff = expires - now;
      if (diff <= 0) {
        setTimeLeft('已過期');
        setPageState('expired');
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  // 分類菜單
  const groupedItems = useMemo(() => {
    if (!session) return {};
    const groups: Record<string, MenuItem[]> = {};
    session.menuData.items.forEach(item => {
      const cat = item.category || 'Others';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [session]);

  const handleNameSubmit = () => {
    const trimmed = guestName.trim();
    if (!trimmed) {
      setNameError('請輸入您的名稱 / Please enter your name');
      return;
    }
    setNameError('');
    setPageState('ordering');
  };

  const updateCart = (item: MenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev[item.id];
      if (delta > 0) {
        return { ...prev, [item.id]: { item, quantity: (existing?.quantity || 0) + delta } };
      } else {
        if (!existing) return prev;
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          const next = { ...prev };
          delete next[item.id];
          return next;
        }
        return { ...prev, [item.id]: { ...existing, quantity: newQty } };
      }
    });
  };

  const cartEntries = Object.values(cart) as { item: MenuItem; quantity: number }[];
  const totalItems = cartEntries.reduce((sum: number, c) => sum + c.quantity, 0);
  const totalPrice = cartEntries.reduce((sum: number, c) => sum + c.item.price * c.quantity, 0);

  const handleSubmitOrder = async () => {
    if (totalItems === 0) return;
    setIsSubmitting(true);

    const items = cartEntries.map(c => ({
      itemId: c.item.id,
      itemTranslated: c.item.translatedName,
      itemOriginal: c.item.originalName,
      price: c.item.price,
      quantity: c.quantity,
    }));

    try {
      const res = await fetch('/api/share-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          guestName: guestName.trim(),
          items,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPageState('submitted');
      } else {
        setErrorMsg(data.error || 'Failed to submit');
        if (data.error?.includes('expired')) {
          setPageState('expired');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
    setIsSubmitting(false);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // ======= RENDER =======

  // Loading
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading shared menu...</p>
      </div>
    );
  }

  // Expired
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <Clock size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-800">連結已過期</h1>
        <p className="text-gray-500">This shared menu link has expired.<br />Please ask the host to generate a new one.</p>
      </div>
    );
  }

  // Error
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-800">Oops!</h1>
        <p className="text-gray-500">{errorMsg || 'Something went wrong'}</p>
      </div>
    );
  }

  // Name Input
  if (pageState === 'name_input') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-orange-100"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle size={36} className="text-orange-500" />
            </div>
            <h1 className="text-xl font-black text-gray-800 mb-1">Welcome!</h1>
            {session?.menuData?.restaurantName && (
              <p className="text-sm text-gray-400 mb-1">📍 {session.menuData.restaurantName}</p>
            )}
            <p className="text-sm text-gray-500">
              <span className="font-bold text-orange-600">{session?.hostName}</span> shared a menu with you
            </p>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
              <Clock size={12} /> <span>⏳ {timeLeft} remaining</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Enter your name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => { setGuestName(e.target.value); setNameError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Your name / 你的名字"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center font-bold text-lg focus:border-orange-400 focus:outline-none transition-colors"
                autoFocus
              />
              {nameError && (
                <p className="text-red-500 text-xs font-bold mt-2 text-center">{nameError}</p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNameSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all"
            >
              Start Ordering 🍽️
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Submitted Success
  if (pageState === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center gap-6 p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check size={48} className="text-green-500" />
          </div>
        </motion.div>
        <h1 className="text-2xl font-black text-gray-800">Order Sent! 🎉</h1>
        <p className="text-gray-500 max-w-xs">
          <span className="font-bold text-green-600">{guestName}</span>, your order has been sent to <span className="font-bold">{session?.hostName}</span>.
        </p>

        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 w-full max-w-xs">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Your Order</h3>
          <div className="space-y-2">
            {cartEntries.map(c => (
              <div key={c.item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{c.quantity}x {c.item.translatedName}</span>
                <span className="font-bold text-gray-800">{(c.item.price * c.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-200 mt-3 pt-3 flex justify-between">
            <span className="font-bold text-gray-600">Total</span>
            <span className="font-black text-lg text-gray-800">{totalPrice.toFixed(0)} {session?.originalCurrency}</span>
          </div>
        </div>

        <button
          onClick={() => { setCart({}); setPageState('ordering'); }}
          className="text-orange-500 font-bold text-sm underline underline-offset-4"
        >
          ← Modify & Re-submit
        </button>
      </div>
    );
  }

  // ======= ORDERING PAGE =======
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3 p-3 border-b border-gray-100">
          <div className="flex-1">
            <h2 className="font-bold text-gray-800 leading-tight flex items-center gap-2">
              <span className="text-orange-500">🍽️</span>
              {session?.menuData?.restaurantName || 'Shared Menu'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>👤 {guestName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={10} /> {timeLeft}
              </span>
              <span>•</span>
              <span className="text-xs text-gray-400">{(session?.menuData?.items || []).length} dishes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-36">
        {Object.entries(groupedItems).map(([category, items]: [string, MenuItem[]]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
                {category}
                <span className="text-xs font-normal text-gray-400">({items.length})</span>
              </h3>
              {expandedCategories[category] ?
                <ChevronUp size={18} className="text-gray-400" /> :
                <ChevronDown size={18} className="text-gray-400" />
              }
            </button>

            <AnimatePresence>
              {expandedCategories[category] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {items.map(item => {
                    const qty: number = cart[item.id]?.quantity || 0;
                    const converted = (item.price * (session?.exchangeRate || 1)).toFixed(0);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${qty > 0 ? 'border-orange-300 ring-1 ring-orange-100' : 'border-gray-100'}`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-base leading-tight">{item.translatedName}</h4>
                            <p className="text-sm text-gray-400 mt-0.5">{item.originalName}</p>
                            {item.shortDescription && (
                              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-2 border border-amber-100">{item.shortDescription}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-lg text-gray-800">{String(converted)}</span>
                            <span className="text-xs font-bold text-gray-400 ml-0.5">{session?.targetCurrency}</span>
                            <p className="text-[10px] text-gray-300 font-mono">{item.price} {session?.originalCurrency}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-3">
                          <div className="flex items-center bg-gray-100 rounded-full p-1">
                            <button
                              onClick={() => updateCart(item, -1)}
                              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${qty > 0 ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-300'}`}
                              disabled={qty === 0}
                            >
                              <Minus size={16} />
                            </button>
                            <span className={`w-8 text-center font-bold text-sm ${qty > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                              {qty}
                            </span>
                            <button
                              onClick={() => updateCart(item, 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-md active:scale-90 transition-transform"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Floating Submit Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] p-4 z-40 pb-6"
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase">Total</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-800">
                    {(totalPrice * (session?.exchangeRate || 1)).toFixed(0)}
                  </span>
                  <span className="text-sm font-bold text-gray-500">{session?.targetCurrency}</span>
                </div>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3.5 px-6 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Submit
                    <span className="bg-orange-600 px-2 py-0.5 rounded text-sm">{totalItems}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
