'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import { WelcomeScreen } from './components/WelcomeScreen';
import { OrderingPage } from './components/OrderingPage';
import { OrderSummary } from './components/OrderSummary';
import { HistoryPage } from './components/HistoryPage';
import { SettingsModal } from './components/SettingsModal';
import { MenuProcessing } from './components/MenuProcessing';
import { ApiKeyGate } from './components/ApiKeyGate';
import { WelcomeGate } from './components/WelcomeGate';
import { LanguageGate } from './components/LanguageGate';
import { MenuLibraryPage } from './components/MenuLibraryPage';
import { SaveMenuModal } from './components/SaveMenuModal';
import { useMenuLibrary } from './hooks/useMenuLibrary';
import { RestaurantPhrases } from './components/RestaurantPhrases';
import { Onboarding } from './components/Onboarding';
import { MapExplorer } from './components/MapExplorer';
import { Paywall } from './components/Paywall';

// Types & Constants
import { MenuData, Cart, AppState, HistoryRecord, TargetLanguage, CartItem, MenuItem, GeoLocation, UserCountryStat, SavedMenu } from './types';
import { parseMenuImage, parseMenuPageByPage } from './services/geminiService';
import { USER_COUNTRY_STATS } from './constants';

const App: React.FC = () => {
  // --- Simplified Auth State ---
  const [isPro, setIsPro] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Settings
  const [apiKey, setApiKey] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [serviceRate, setServiceRate] = useState(0);
  const [hidePrice, setHidePrice] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // App Logic
  const [currentView, setCurrentView] = useState<AppState>('welcome');
  const [sourceView, setSourceView] = useState<AppState>('welcome');
  const [cart, setCart] = useState<Cart>({});
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [uiLang, setUiLang] = useState<TargetLanguage>(TargetLanguage.ChineseTW);
  const [scanLocation, setScanLocation] = useState<GeoLocation | undefined>(undefined);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(17);
  const [countryStats, setCountryStats] = useState<UserCountryStat[]>(USER_COUNTRY_STATS);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);

  // ⭐ 菜單庫功能
  const [showSaveMenuModal, setShowSaveMenuModal] = useState(false);
  const [pendingMenuThumbnail, setPendingMenuThumbnail] = useState<string>('');
  const [showPhrases, setShowPhrases] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // 🌓 深色/淺色主題 (預設淺色)
  const [isDarkMode, setIsDarkMode] = useState(false);
  // ⭐ 逐頁處理進度
  const [processingPage, setProcessingPage] = useState(0);
  const [processingTotal, setProcessingTotal] = useState(0);
  const [processingItemsFound, setProcessingItemsFound] = useState(0);
  const [isProcessingPages, setIsProcessingPages] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const {
    savedMenus,
    saveMenu,
    deleteMenu,
    updateMenuName,
    getStorageSize,
    menuCount
  } = useMenuLibrary(userEmail);

  // --- Init (Load from LocalStorage) ---
  useEffect(() => {
    // 1. Auth Persistence
    const savedIsPro = localStorage.getItem('is_pro') === 'true';
    if (savedIsPro) setIsPro(true);

    // Load user email for menu library
    const savedEmail = localStorage.getItem('smp_user_email') || '';
    setUserEmail(savedEmail);

    // 2. Settings Persistence
    setApiKey(localStorage.getItem('gemini_api_key') || '');
    setTaxRate(Number(localStorage.getItem('tax_rate')) || 0);
    setServiceRate(Number(localStorage.getItem('service_rate')) || 0);
    setHidePrice(localStorage.getItem('hide_price') === 'true');

    // 載入介面語言
    const savedUiLang = localStorage.getItem('ui_language');
    if (savedUiLang && Object.values(TargetLanguage).includes(savedUiLang as TargetLanguage)) {
      setUiLang(savedUiLang as TargetLanguage);
    } else {
      const landingLang = localStorage.getItem('smp_language');
      const langMapping: Record<string, TargetLanguage> = {
        'zh-TW': TargetLanguage.ChineseTW,
        'en': TargetLanguage.English,
        'ja': TargetLanguage.Japanese,
        'ko': TargetLanguage.Korean,
      };
      if (landingLang && langMapping[landingLang]) {
        setUiLang(langMapping[landingLang]);
        localStorage.setItem('ui_language', langMapping[landingLang]);
      }
    }

    // 3. History Persistence
    const savedHistory = localStorage.getItem('order_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // 檢查是否已經選擇過語言
    const hasSelectedLang = localStorage.getItem('has_selected_language') === 'true';
    setHasSelectedLanguage(hasSelectedLang);

    // 載入主題
    const savedTheme = localStorage.getItem('theme_mode');
    if (savedTheme === 'dark') setIsDarkMode(true);

    setLoadingAuth(false);

    // Fetch Global Stats
    fetch('/api/user-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.totalUsers && data.totalUsers >= 17) {
            setTotalUsers(data.totalUsers);
          }
          if (data.countryStats && data.countryStats.length > 0) {
            const hasActualData = data.countryStats.some((s: UserCountryStat) => s.userCount > 0);
            if (hasActualData) {
              setCountryStats(data.countryStats);
            }
          }
        }
      })
      .catch(err => console.error("Failed to fetch global stats:", err));
  }, []);

  // 套用主題到 <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');

    // 🛡️ 核心防線：`only light` 告訴瀏覽器「此頁面絕對禁止自動反轉」
    // `only` 關鍵字放在 light 前面，是 CSS Color Scheme 規範的正確語法
    root.style.colorScheme = 'only light';

    // 同步更新 meta tag
    let metaCS = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement;
    if (!metaCS) {
      metaCS = document.createElement('meta');
      metaCS.name = 'color-scheme';
      document.head.appendChild(metaCS);
    }
    metaCS.content = 'only light';

    // 強制更新 body 顏色，避免 Tailwind / Next.js 權重覆蓋
    document.body.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#fafaf9';
    document.body.style.color = isDarkMode ? '#fafaf9' : '#1c1917';
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // --- Handlers ---
  const handleVerifySuccess = (verified: boolean) => {
    setIsPro(verified);
    if (verified) {
      localStorage.setItem('is_pro', 'true');
    }
  };

  const handleLogout = async () => {
    // 清除所有的本地緩存
    localStorage.removeItem('is_pro');
    localStorage.removeItem('google_user');
    localStorage.removeItem('smp_user_email');
    localStorage.removeItem('gemini_api_key');

    // 重置應用狀態
    setIsPro(false);
    setUserEmail('');
    setApiKey('');

    toast.success('已登出 / Logged out');

    // 強制重整以確保所有閘門 (Gate) 重新驗證，徹底清除殘留的記憶狀態
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // --- Helper Functions ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
          } else {
            if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.65).split(',')[1]);
          } else reject(new Error("Canvas failed"));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const getCurrentLocation = (): Promise<GeoLocation | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn("GPS Error", err);
          resolve(undefined);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  // --- Core Processing Logic ---
  const handleImagesSelected = async (files: File[]) => {
    if (!navigator.onLine) {
      toast.error("Network Error: Please connect to the internet.");
      return;
    }
    if (!apiKey) {
      toast.error("Critical: API Key missing.");
      return;
    }

    const filesToProcess = files.slice(0, 4);

    const toastId = toast.loading("Acquiring GPS Location...");
    const location = await getCurrentLocation();
    setScanLocation(location);
    toast.dismiss(toastId);

    setCurrentView('processing');
    setProcessingPage(0);
    setProcessingTotal(filesToProcess.length);
    setProcessingItemsFound(0);

    try {
      const base64Images = await Promise.all(filesToProcess.map(compressImage));

      if (base64Images.length > 1) {
        setIsProcessingPages(true);
        const finalData = await parseMenuPageByPage(
          apiKey, base64Images, uiLang, false, '',
          (currentData, pageIndex) => {
            setMenuData(currentData);
            setProcessingItemsFound(currentData.items.length);
            if (pageIndex === 0) { setCart({}); setSourceView('welcome'); setCurrentView('ordering'); }
          },
          (pageIndex, totalPages) => {
            setProcessingPage(pageIndex);
            setProcessingTotal(totalPages);
          }
        );
        setMenuData(finalData);
        setIsProcessingPages(false);
      } else {
        const data = await parseMenuImage(apiKey, base64Images, uiLang, false, '');
        setMenuData(data);
        setCart({});
        setSourceView('welcome');
        setCurrentView('ordering');
      }

      // ⭐ 儲存縮略圖並顯示儲存對話框
      if (base64Images.length > 0) {
        setPendingMenuThumbnail(base64Images[0]);
        setTimeout(() => setShowSaveMenuModal(true), 500);
      }

    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(errMsg);
      setCurrentView('welcome');
    }
  };

  const handleUpdateCart = (item: MenuItem, delta: number) => {
    setCart(prevCart => {
      const existingItem = prevCart[item.id];
      if (delta > 0) {
        return { ...prevCart, [item.id]: { item: item, quantity: (existingItem ? existingItem.quantity : 0) + delta } };
      } else {
        if (!existingItem) return prevCart;
        const newQty = existingItem.quantity + delta;
        if (newQty <= 0) {
          const newCart = { ...prevCart };
          delete newCart[item.id];
          return newCart;
        } else {
          return { ...prevCart, [item.id]: { ...existingItem, quantity: newQty } };
        }
      }
    });
  };

  const handleSelectMapMenu = async (id: string) => {
    try {
      toast.loading('Loading menu...', { id: 'load-map-menu' });
      const res = await fetch(`/api/menu-cache/${id}`);
      const data = await res.json();
      if (data.success && data.menu) {
        setMenuData({
          items: data.menu.menu_data.items || [],
          originalCurrency: data.menu.original_currency,
          targetCurrency: data.menu.target_currency,
          exchangeRate: data.menu.exchange_rate,
          detectedLanguage: data.menu.detected_language,
          restaurantName: data.menu.restaurant_name,
        });
        setSourceView('map');
        setCurrentView('ordering');
        toast.dismiss('load-map-menu');
      } else {
        toast.error('Failed to load menu');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const handleFinishOrder = (paidBy: string = '') => {
    if (!menuData) return;
    const cartItems = Object.values(cart) as CartItem[];
    const totalOriginal = cartItems.reduce((sum, item) => sum + item.item.price * item.quantity, 0);

    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      items: cartItems,
      totalOriginalPrice: totalOriginal,
      currency: menuData.originalCurrency || 'JPY',
      restaurantName: menuData.restaurantName,
      paidBy: paidBy,
      location: scanLocation,
      taxRate: taxRate,
      serviceRate: serviceRate
    };

    const newHistory = [newRecord, ...history];
    setHistory(newHistory);
    localStorage.setItem('order_history', JSON.stringify(newHistory));

    localStorage.removeItem('current_menu_session');
    setCart({});
    setCurrentView('welcome');
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('order_history', JSON.stringify(newHistory));
  };

  // ⭐ 儲存菜單到菜單庫
  const handleSaveToLibrary = async (customName: string, shareToMap: boolean, address?: string, lat?: number, lng?: number) => {
    if (!menuData) return;
    saveMenu(
      customName,
      menuData,
      pendingMenuThumbnail,
      uiLang,
      scanLocation
    );
    toast.success('✅ 已儲存至菜單庫');

    if (shareToMap && address && lat && lng) {
      try {
        const res = await fetch('/api/menu-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantName: menuData.restaurantName || customName,
            restaurantCategory: menuData.restaurantCategory || '餐廳',
            address: address,
            lat,
            lng,
            menuData: {
              items: menuData.items,
              restaurantName: menuData.restaurantName || customName,
              detectedLanguage: menuData.detectedLanguage,
            },
            thumbnail: pendingMenuThumbnail || null,
            targetLanguage: uiLang,
            originalCurrency: menuData.originalCurrency,
            targetCurrency: menuData.targetCurrency,
            exchangeRate: menuData.exchangeRate,
            detectedLanguage: menuData.detectedLanguage,
            uploaderName: '菜單庫同步分享', // Default generic uploader name
            userId: userEmail,
            itemCount: menuData.items.length,
          }),
        });
        if (res.ok) {
          toast.success("也成功同步分享至地圖囉！");
        } else {
          toast.error("地圖分享發生錯誤。");
        }
      } catch (err) {
        console.error("Map cache error:", err);
      }
    }

    setShowSaveMenuModal(false);
    setPendingMenuThumbnail('');
  };

  // ⭐ 從菜單庫載入菜單
  const handleLoadFromLibrary = (savedMenu: SavedMenu) => {
    setMenuData(savedMenu.menuData);
    setCart({});
    setScanLocation(savedMenu.location);
    setSourceView('library');
    setCurrentView('ordering');
    toast.success(`📚 已載入: ${savedMenu.customName}`);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  // --- RENDER GATES ---

  // 0. Loading State
  if (loadingAuth) {
    return <div className="h-screen bg-sausage-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sausage-600"></div></div>;
  }

  const DEV_BYPASS = false;

  // 1. Mandatory Language Selection Gate
  if (!DEV_BYPASS && !hasSelectedLanguage) {
    return (
      <div className="h-screen w-full bg-sausage-50 font-sans text-gray-900 overflow-hidden">
        <Toaster position="top-center" />
        <LanguageGate
          onSelectLanguage={(lang) => {
            setUiLang(lang);
            setHasSelectedLanguage(true);
          }}
        />
      </div>
    );
  }

  // 2. Mandatory Auth Gate (WelcomeGate)
  if (!DEV_BYPASS && !isPro) {
    return (
      <div className="h-screen w-full bg-sausage-50 font-sans text-gray-900 overflow-hidden">
        <Toaster position="top-center" />
        <WelcomeGate
          onVerify={handleVerifySuccess}
          totalUsers={totalUsers}
          countryStats={countryStats}
          selectedLanguage={uiLang}
          onOpenPaywall={() => setShowPaywall(true)}
        />
      </div>
    );
  }

  // 3. BYOK Gate (ApiKeyGate)
  if (!DEV_BYPASS && !apiKey) {
    return (
      <div className="h-screen w-full bg-sausage-50 font-sans text-gray-900 overflow-hidden">
        <Toaster position="top-center" />
        <ApiKeyGate
          selectedLanguage={uiLang}
          onSave={(key) => {
            setApiKey(key);
            localStorage.setItem('gemini_api_key', key);
          }}
        />
      </div>
    );
  }

  // 4. Main App
  return (
    <div className="h-screen w-full font-sans overflow-hidden" style={{ background: isDarkMode ? '#1a1a1a' : '#fafaf9', color: isDarkMode ? '#fafaf9' : '#1c1917', transition: 'background 0.3s, color 0.3s' }}>
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />

      <AnimatePresence mode="wait">
        {currentView === 'welcome' && (
          <motion.div key="welcome" {...pageVariants} className="h-full">
            <WelcomeScreen
              onLanguageChange={setUiLang}
              selectedLanguage={uiLang}
              onImagesSelected={handleImagesSelected}
              onViewHistory={() => setCurrentView('history')}
              onViewLibrary={() => setCurrentView('library')}
              menuCount={menuCount}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isVerified={isPro}
              hidePrice={hidePrice}
              onHidePriceChange={(hide) => {
                setHidePrice(hide);
                localStorage.setItem('hide_price', hide.toString());
              }}
              uiLanguage={uiLang}
              onUILanguageChange={(lang) => {
                setUiLang(lang);
                localStorage.setItem('ui_language', lang);
              }}
              onLogout={handleLogout}
              onOpenPhrases={() => setShowPhrases(true)}
              onOpenOnboarding={() => setShowOnboarding(true)}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              onOpenMap={() => setCurrentView('map')}
            />
          </motion.div>
        )}

        {currentView === 'processing' && (
          <motion.div key="processing" {...pageVariants} className="h-full">
            <MenuProcessing
              scanLocation={scanLocation}
              targetLang={uiLang}
              currentPage={processingPage}
              totalPages={processingTotal}
              itemsFound={processingItemsFound}
            />
          </motion.div>
        )}

        {currentView === 'ordering' && menuData && (
          <motion.div key="ordering" {...pageVariants} className="h-full">
            <OrderingPage
              apiKey={apiKey}
              menuData={menuData}
              cart={cart}
              onUpdateCart={handleUpdateCart}
              onViewSummary={() => setCurrentView('summary')}
              onBack={() => setCurrentView(sourceView)}
              targetLang={uiLang}
              taxRate={taxRate}
              serviceRate={serviceRate}
              hidePrice={hidePrice}
              isLoadingMore={isProcessingPages}
              isPro={isPro}
            />
          </motion.div>
        )}

        {currentView === 'summary' && menuData && (
          <motion.div key="summary" initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} className="h-full absolute inset-0 z-50">
            <OrderSummary
              cart={cart}
              menuData={menuData}
              onClose={() => setCurrentView('ordering')}
              onFinish={handleFinishOrder}
              taxRate={taxRate}
              serviceRate={serviceRate}
              hidePrice={hidePrice}
              targetLanguage={uiLang}
            />
          </motion.div>
        )}

        {currentView === 'history' && (
          <motion.div key="history" {...pageVariants} className="h-full">
            <HistoryPage
              history={history}
              onBack={() => setCurrentView('welcome')}
              onDelete={handleDeleteHistory}
            />
          </motion.div>
        )}

        {/* ⭐ 菜單庫頁面 */}
        {currentView === 'library' && (
          <motion.div key="library" {...pageVariants} className="h-full">
            <MenuLibraryPage
              savedMenus={savedMenus}
              onBack={() => setCurrentView('welcome')}
              onSelectMenu={handleLoadFromLibrary}
              onDeleteMenu={deleteMenu}
              onUpdateName={updateMenuName}
              storageSize={getStorageSize()}
              targetLanguage={uiLang}
            />
          </motion.div>
        )}

        {currentView === 'map' && (
          <motion.div key="map" {...pageVariants} className="h-full">
            <MapExplorer
              onClose={() => setCurrentView('welcome')}
              onSelectMenu={handleSelectMapMenu}
              targetLanguage={uiLang}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isSettingsOpen && (
        <SettingsModal
          currentKey={apiKey}
          currentTax={taxRate}
          currentService={serviceRate}
          targetLanguage={uiLang}
          onSave={(key, tax, service) => {
            setApiKey(key);
            setTaxRate(tax);
            setServiceRate(service);
            localStorage.setItem('gemini_api_key', key);
            localStorage.setItem('tax_rate', tax.toString());
            localStorage.setItem('service_rate', service.toString());
            setIsSettingsOpen(false);
          }}
          onLogout={() => {
            handleLogout();
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
          isOpen={isSettingsOpen}
        />
      )}

      {/* ⭐ 儲存菜單對話框 */}
      <SaveMenuModal
        isOpen={showSaveMenuModal}
        onClose={() => {
          setShowSaveMenuModal(false);
          setPendingMenuThumbnail('');
        }}
        onSave={handleSaveToLibrary}
        suggestedName={menuData?.restaurantName || ''}
        thumbnailPreview={pendingMenuThumbnail}
        itemCount={menuData?.items.length || 0}
        targetLanguage={uiLang}
      />

      {/* 餐廳常用語面板 */}
      <RestaurantPhrases
        isOpen={showPhrases}
        onClose={() => setShowPhrases(false)}
        detectedLanguage={menuData?.detectedLanguage}
        userLanguage={uiLang}
      />

      {/* 使用引導教學 */}
      <Onboarding
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        language={uiLang}
      />

      {/* 💳 付費牆 (RevenueCat) */}
      <Paywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          setIsPro(true);
          setShowPaywall(false);
        }}
        targetLanguage={uiLang}
      />
    </div>
  );
};

export default App;