'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, Search, Eye, ChevronRight, Navigation, Utensils, Globe, RefreshCw, Clock, Trash2 } from 'lucide-react';
import { SausageDogLogo } from './DachshundAssets';
import { TargetLanguage } from '../types';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false
});

interface CachedMenuItem {
  id: string;
  restaurant_name: string;
  restaurant_category?: string;
  address: string;
  lat: number;
  lng: number;
  target_language: string;
  original_currency: string;
  item_count: number;
  view_count: number;
  created_at: string;
  thumbnail?: string;
  distance?: number;
  user_id?: string;
}

interface MapExplorerProps {
  onClose: () => void;
  onSelectMenu: (menuId: string) => void;
  targetLanguage: TargetLanguage;
}

// Translation map for MapExplorer UI
const MAP_TRANSLATIONS: Record<string, Record<string, string>> = {
  '繁體中文': {
    title: '附近菜單地圖',
    subtitle: '探索其他旅人上傳的翻譯菜單',
    searchPlaceholder: '搜尋餐廳名稱...',
    nearby: '附近',
    latest: '最新',
    popular: '熱門',
    noResults: '附近暫無菜單',
    noResultsSub: '成為第一個分享菜單的人吧！',
    dishes: '道菜',
    views: '次查看',
    away: '公尺',
    kmAway: '公里',
    locating: '正在定位...',
    locationError: '無法取得位置',
    useGlobal: '查看全球菜單',
    uploaded: '上傳於',
    daysAgo: '天前',
    hoursAgo: '小時前',
    justNow: '剛剛',
  },
  'English': {
    title: 'Nearby Menus',
    subtitle: 'Explore menus uploaded by other travelers',
    searchPlaceholder: 'Search restaurant...',
    nearby: 'Nearby',
    latest: 'Latest',
    popular: 'Popular',
    noResults: 'No menus nearby',
    noResultsSub: 'Be the first to share a menu here!',
    dishes: 'dishes',
    views: 'views',
    away: 'm away',
    kmAway: 'km',
    locating: 'Locating...',
    locationError: 'Unable to get location',
    useGlobal: 'View global menus',
    uploaded: 'Uploaded',
    daysAgo: 'days ago',
    hoursAgo: 'hours ago',
    justNow: 'just now',
  },
  '日本語': {
    title: '近くのメニュー',
    subtitle: '他の旅行者がアップロードしたメニューを探す',
    searchPlaceholder: 'レストラン検索...',
    nearby: '近く',
    latest: '最新',
    popular: '人気',
    noResults: '近くにメニューがありません',
    noResultsSub: '最初のメニューを共有しましょう！',
    dishes: '品',
    views: '回閲覧',
    away: 'm',
    kmAway: 'km',
    locating: '位置情報取得中...',
    locationError: '位置情報を取得できません',
    useGlobal: '世界のメニューを見る',
    uploaded: 'アップロード',
    daysAgo: '日前',
    hoursAgo: '時間前',
    justNow: 'たった今',
  },
  '한국어': {
    title: '주변 메뉴',
    subtitle: '다른 여행자가 업로드한 메뉴 탐색',
    searchPlaceholder: '식당 검색...',
    nearby: '주변',
    latest: '최신',
    popular: '인기',
    noResults: '주변에 메뉴가 없습니다',
    noResultsSub: '첫 번째로 메뉴를 공유해 보세요!',
    dishes: '개 요리',
    views: '회 조회',
    away: 'm',
    kmAway: 'km',
    locating: '위치 확인 중...',
    locationError: '위치를 확인할 수 없습니다',
    useGlobal: '전 세계 메뉴 보기',
    uploaded: '업로드',
    daysAgo: '일 전',
    hoursAgo: '시간 전',
    justNow: '방금',
  },
};

function getTimeAgo(dateStr: string, t: Record<string, string>): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return t.justNow;
  if (hours < 24) return `${hours} ${t.hoursAgo}`;
  const days = Math.floor(hours / 24);
  return `${days} ${t.daysAgo}`;
}

function formatDistance(meters: number, t: Record<string, string>): string {
  if (meters < 1000) return `${meters}${t.away}`;
  return `${(meters / 1000).toFixed(1)}${t.kmAway}`;
}

export const MapExplorer: React.FC<MapExplorerProps> = ({ onClose, onSelectMenu, targetLanguage }) => {
  const [menus, setMenus] = useState<CachedMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'nearby' | 'latest' | 'popular'>('nearby');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [targetCenter, setTargetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('smp_user_email') : null;

  const langKey = targetLanguage === '繁體中文-HK' ? '繁體中文' : targetLanguage as string;
  const t = MAP_TRANSLATIONS[langKey] || MAP_TRANSLATIONS['English'];

  const fetchMenus = useCallback(async (lat?: number, lng?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lat && lng) {
        params.set('lat', lat.toString());
        params.set('lng', lng.toString());
        params.set('radius', '10');
      }
      const res = await fetch(`/api/menu-cache?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMenus(data.menus || []);
      }
    } catch (err) {
      console.error('Failed to fetch menus:', err);
    }
    setLoading(false);
  }, []);

  const fetchMenusMap = useCallback(async (bounds: {minLat: number, maxLat: number, minLng: number, maxLng: number}) => {
    try {
      const params = new URLSearchParams();
      params.set('minLat', bounds.minLat.toString());
      params.set('maxLat', bounds.maxLat.toString());
      params.set('minLng', bounds.minLng.toString());
      params.set('maxLng', bounds.maxLng.toString());
      
      const res = await fetch(`/api/menu-cache?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMenus(data.menus || []);
      }
    } catch (err) {
      console.error('Failed to fetch menus by bounds:', err);
    }
  }, []);

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchMenus(loc.lat, loc.lng);
        },
        () => {
          setLocationError(true);
          fetchMenus(); // Fetch global
        },
        { timeout: 8000 }
      );
    } else {
      setLocationError(true);
      fetchMenus();
    }
  }, [fetchMenus]);

  // Debounced Address Search for Map Explorer
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?action=autocomplete&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.predictions) {
          const formatted = data.predictions.map((p: any) => ({
            display_name: p.description,
            place_id: p.place_id
          }));
          setAddressSuggestions(formatted);
        } else {
          setAddressSuggestions([]);
        }
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query is latitude, longitude
    const coordMatch = searchQuery.trim().match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
    if (coordMatch) {
      setTargetCenter({ lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) });
      setSearchQuery('');
      return;
    }
    
    setIsSearchingLocation(true);
    try {
      const res = await fetch(`/api/places?action=findPlace&q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        const lat = data.candidates[0].geometry.location.lat;
        const lng = data.candidates[0].geometry.location.lng;
        setTargetCenter({ lat, lng });
        setSearchQuery('');
      } else {
        alert('找不到該地點的座標，請嘗試其他地標名稱或輸入精確經緯度。');
      }
    } catch (err) {
      console.error(err);
      alert('地圖跳轉失敗，請檢查網路狀態。');
    }
    setIsSearchingLocation(false);
  };

  const handleDeleteSelectedMapMenu = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('確定要從探索地圖上永久刪除這份公開菜單嗎？ (Are you sure you want to delete this public menu?)')) return;
    
    try {
      const res = await fetch(`/api/menu-cache?id=${id}&userId=${currentUserId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMenus(prev => prev.filter(m => m.id !== id));
        alert('刪除成功！');
      } else {
        alert(`刪除失敗: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('刪除網路請求失敗。');
    }
  };

  const sortedMenus = [...menus]
    .filter(m => !searchQuery || m.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()) || m.address.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === 'nearby') return (a.distance ?? 99999) - (b.distance ?? 99999);
      if (sortMode === 'popular') return (b.view_count || 0) - (a.view_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm z-10 sticky top-0">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-gray-800">{t.title}</h2>
            <p className="text-xs text-gray-400">{t.subtitle}</p>
          </div>
          <button
            onClick={() => userLocation ? fetchMenus(userLocation.lat, userLocation.lng) : fetchMenus()}
            className="p-2 bg-emerald-50 rounded-full text-emerald-600 hover:bg-emerald-100"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Interactive Map */}
        <div className="mx-4 mb-3 rounded-2xl h-[45vh] relative overflow-hidden shadow-sm border-2 border-emerald-100/50 bg-gray-50">
          <DynamicMap 
            menus={menus}
            userLocation={userLocation}
            onSelectMenu={onSelectMenu}
            onBoundsChange={fetchMenusMap}
            targetCenter={targetCenter}
          />
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearchLocation} className="flex gap-2 relative">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={t.searchPlaceholder + " 或輸入地址按Enter跳轉"}
                className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <AnimatePresence>
                {showSuggestions && addressSuggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto z-50 transform-gpu"
                  >
                    {addressSuggestions.map((sug, i) => (
                      <div 
                        key={i}
                        className="px-3 py-2 text-xs text-gray-700 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0"
                        onClick={async () => {
                          setSearchQuery(sug.display_name);
                          setShowSuggestions(false);
                          setIsSearchingLocation(true);
                          if (sug.place_id) {
                            try {
                              const res = await fetch(`/api/places?action=details&place_id=${sug.place_id}`);
                              const data = await res.json();
                              if (data.result?.geometry?.location) {
                                setTargetCenter({ lat: data.result.geometry.location.lat, lng: data.result.geometry.location.lng });
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }
                          setIsSearchingLocation(false);
                        }}
                      >
                        <MapPin size={10} className="inline-block mr-1 text-emerald-500 shrink-0 align-text-bottom" />
                        <span className="align-middle">{sug.display_name}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              type="submit" 
              disabled={isSearchingLocation}
              className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
            >
              {isSearchingLocation ? '...' : '跳轉地圖'}
            </button>
          </form>
        </div>

        {/* Sort Tabs */}
        <div className="px-4 pb-2 flex gap-2">
          {(['nearby', 'latest', 'popular'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                sortMode === mode
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {mode === 'nearby' && <span>{t.nearby}</span>}
              {mode === 'latest' && <span>{t.latest}</span>}
              {mode === 'popular' && <span>{t.popular}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <RefreshCw size={32} className="text-emerald-500" />
            </motion.div>
            <p className="text-sm text-gray-400 mt-3">{t.locating}</p>
          </div>
        ) : sortedMenus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <SausageDogLogo className="w-32 h-20 opacity-30 mb-4" />
            <h3 className="text-lg font-black text-gray-300 mb-1">{t.noResults}</h3>
            <p className="text-sm text-gray-400">{t.noResultsSub}</p>
          </div>
        ) : (
          sortedMenus.map((menu, i) => (
            <motion.button
              key={menu.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelectMenu(menu.id)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all text-left flex gap-3 items-center"
            >
              {/* Thumbnail / Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-200">
                {menu.thumbnail ? (
                  <img src={menu.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Utensils size={20} className="text-orange-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-gray-800 text-sm truncate">{menu.restaurant_name}</h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">{menu.address}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {menu.restaurant_category || '餐廳'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {menu.item_count} {t.dishes}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Eye size={10} /> {menu.view_count || 0}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Clock size={10} /> {getTimeAgo(menu.created_at, t)}
                  </span>
                </div>
              </div>

              {/* Distance & Arrow & Delete */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {menu.distance !== undefined && (
                  <span className="text-xs font-black text-emerald-600">
                    {formatDistance(menu.distance, t)}
                  </span>
                )}
                {menu.user_id === currentUserId && currentUserId ? (
                  <button
                    onClick={(e) => handleDeleteSelectedMapMenu(e, menu.id)}
                    className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                    title="刪除"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">
                      {menu.original_currency}
                    </span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};
