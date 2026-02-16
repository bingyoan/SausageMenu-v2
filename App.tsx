'use client';
import React, { useState, useEffect } from 'react';
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
import { LanguageGate } from './components/LanguageGate';
import { GoogleAuthGate, GoogleUser } from './components/GoogleAuthGate';
import { UsageExhaustedModal } from './components/UsageLimitBanner';
import { useUsageLimit } from './hooks/useUsageLimit';
import { MenuLibraryPage } from './components/MenuLibraryPage';
import { SaveMenuModal } from './components/SaveMenuModal';
import { useMenuLibrary } from './hooks/useMenuLibrary';
import { RestaurantPhrases } from './components/RestaurantPhrases';

// Types & Constants
import { MenuData, Cart, AppState, HistoryRecord, TargetLanguage, CartItem, MenuItem, GeoLocation, UserCountryStat, SavedMenu } from './types';
import { parseMenuImage } from './services/geminiService';
import { USER_COUNTRY_STATS } from './constants';

const App: React.FC = () => {
  // --- Auth State ---
  const [isPro, setIsPro] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Settings
  const [apiKey, setApiKey] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [serviceRate, setServiceRate] = useState(0);
  const [hidePrice, setHidePrice] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // App Logic
  const [currentView, setCurrentView] = useState<AppState>('welcome');
  const [cart, setCart] = useState<Cart>({});
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [uiLang, setUiLang] = useState<TargetLanguage>(TargetLanguage.ChineseTW);
  const [scanLocation, setScanLocation] = useState<GeoLocation | undefined>(undefined);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(17);
  const [countryStats, setCountryStats] = useState<UserCountryStat[]>(USER_COUNTRY_STATS);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);

  // 使用次數
  const [showExhaustedModal, setShowExhaustedModal] = useState(false);

  // ⭐ 菜單庫功能
  const [showSaveMenuModal, setShowSaveMenuModal] = useState(false);
  const [pendingMenuThumbnail, setPendingMenuThumbnail] = useState<string>('');
  const [showPhrases, setShowPhrases] = useState(false);
  const {
    savedMenus,
    saveMenu,
    deleteMenu,
    updateMenuName,
    getStorageSize,
    menuCount
  } = useMenuLibrary();

  // ⭐ 使用次數限制 Hook
  const { usageCount, remainingUses, canUse, isUnlimited, incrementUsage, dailyLimit } = useUsageLimit(isPro);

  // --- Init (Load from LocalStorage) ---
  useEffect(() => {
    // 1. 檢查登入狀態
    const savedUser = localStorage.getItem('google_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as GoogleUser;
        setIsLoggedIn(true);
        setUserEmail(user.email);
        setIsPro(user.isPro || false);
      } catch (e) {
        localStorage.removeItem('google_user');
      }
    }

    // 2. 檢查是否為 PRO
    const savedIsPro = localStorage.getItem('is_pro') === 'true';
    if (savedIsPro) setIsPro(true);

    // 3. Settings Persistence
    setApiKey(localStorage.getItem('gemini_api_key') || '');
    setTaxRate(Number(localStorage.getItem('tax_rate')) || 0);
    setServiceRate(Number(localStorage.getItem('service_rate')) || 0);
    setHidePrice(localStorage.getItem('hide_price') === 'true');

    // 載入介面語言
    const savedUiLang = localStorage.getItem('ui_language');
    if (savedUiLang && Object.values(TargetLanguage).includes(savedUiLang as TargetLanguage)) {
      setUiLang(savedUiLang as TargetLanguage);
      setHasSelectedLanguage(true);
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
        setHasSelectedLanguage(true);
        localStorage.setItem('ui_language', langMapping[landingLang]);
      }
    }

    // 4. 檢查是否已選擇過語言
    const hasSelectedLang = localStorage.getItem('has_selected_language') === 'true';
    if (hasSelectedLang) {
      setHasSelectedLanguage(true);
    }

    // 5. History Persistence
    const savedHistory = localStorage.getItem('order_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

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

  // --- Handlers ---
  const handleGoogleAuthSuccess = (user: GoogleUser) => {
    setIsLoggedIn(true);
    setUserEmail(user.email);
    setIsPro(user.isPro);

    if (user.isPro) {
      localStorage.setItem('is_pro', 'true');
    }
  };

  const handleLogout = () => {
    setIsPro(false);
    setIsLoggedIn(false);
    setUserEmail('');
    setApiKey('');
    localStorage.removeItem('is_pro');
    localStorage.removeItem('google_user');
    localStorage.removeItem('smp_user_email');
    localStorage.removeItem('gemini_api_key');
    toast.success('已登出 / Logged out');
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

    // ⭐ 檢查使用次數限制
    if (!canUse && !isPro) {
      setShowExhaustedModal(true);
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

    try {
      const base64Images = await Promise.all(filesToProcess.map(compressImage));

      const data = await parseMenuImage(
        apiKey,
        base64Images,
        uiLang,
        false,
        ''
      );

      // ⭐ 成功後增加使用次數
      incrementUsage();

      // ⭐ 同步到伺服器 (如果有 email)
      if (userEmail) {
        fetch('/api/check-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, action: 'increment' })
        }).catch(err => console.warn('Failed to sync usage:', err));
      }

      setMenuData(data);
      setCart({});
      setCurrentView('ordering');

      // ⭐ 儲存縮略圖並顯示儲存對話框
      if (base64Images.length > 0) {
        setPendingMenuThumbnail(base64Images[0]);
        // 延遲顯示，讓用戶先看到菜單
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
  const handleSaveToLibrary = (customName: string) => {
    if (!menuData) return;

    saveMenu(
      customName,
      menuData,
      pendingMenuThumbnail,
      uiLang,
      scanLocation
    );

    toast.success('✅ 已儲存至菜單庫');
    setShowSaveMenuModal(false);
    setPendingMenuThumbnail('');
  };

  // ⭐ 從菜單庫載入菜單
  const handleLoadFromLibrary = (savedMenu: SavedMenu) => {
    setMenuData(savedMenu.menuData);
    setCart({});
    setScanLocation(savedMenu.location);
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
    return (
      <div className="h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // 1. 語言選擇閘門
  if (!hasSelectedLanguage) {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-amber-50 to-orange-50 font-sans text-gray-900 overflow-hidden">
        <Toaster position="top-center" />
        <LanguageGate
          onSelectLanguage={(lang) => {
            setUiLang(lang);
            setHasSelectedLanguage(true);
            localStorage.setItem('has_selected_language', 'true');
            localStorage.setItem('ui_language', lang);
          }}
        />
      </div>
    );
  }

  // 2. Google 登入閘門
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full font-sans text-gray-900 overflow-hidden">
        <Toaster position="top-center" />
        <GoogleAuthGate
          selectedLanguage={uiLang}
          onAuthSuccess={handleGoogleAuthSuccess}
        />
      </div>
    );
  }

  // 3. API Key 閘門
  if (!apiKey) {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-amber-50 to-orange-50 font-sans text-gray-900 overflow-hidden">
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

  // 4. 主 App
  return (
    <div className="h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
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
              hasApiKey={!!apiKey}
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
              totalUsers={totalUsers}
              countryStats={countryStats}
              onOpenPhrases={() => setShowPhrases(true)}
            />
          </motion.div>
        )}

        {currentView === 'processing' && (
          <motion.div key="processing" {...pageVariants} className="h-full">
            <MenuProcessing scanLocation={scanLocation} targetLang={uiLang} />
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
              onBack={() => setCurrentView('welcome')}
              targetLang={uiLang}
              taxRate={taxRate}
              serviceRate={serviceRate}
              hidePrice={hidePrice}
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
      </AnimatePresence>

      {isSettingsOpen && (
        <SettingsModal
          currentKey={apiKey}
          currentTax={taxRate}
          currentService={serviceRate}
          onSave={(key, tax, service) => {
            setApiKey(key);
            setTaxRate(tax);
            setServiceRate(service);
            localStorage.setItem('gemini_api_key', key);
            localStorage.setItem('tax_rate', tax.toString());
            localStorage.setItem('service_rate', service.toString());
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
          isOpen={isSettingsOpen}
        />
      )}

      {/* 使用次數用盡彈窗 */}
      <UsageExhaustedModal
        isOpen={showExhaustedModal}
        onClose={() => setShowExhaustedModal(false)}
        onUpgrade={() => {
          toast('訂閱功能即將推出！', { icon: '🚀' });
          setShowExhaustedModal(false);
        }}
      />

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
    </div>
  );
};

export default App;