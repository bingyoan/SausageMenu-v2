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
import { LanguageGate } from './components/LanguageGate';
import { GoogleAuthGate, GoogleUser } from './components/GoogleAuthGate';
import { ApiKeyGate } from './components/ApiKeyGate';
import { UsageExhaustedModal } from './components/UsageLimitBanner';
import { Paywall } from './components/Paywall';
import { useUsageLimit } from './hooks/useUsageLimit';
import { MenuLibraryPage } from './components/MenuLibraryPage';
import { SaveMenuModal } from './components/SaveMenuModal';
import { useMenuLibrary } from './hooks/useMenuLibrary';
import { RestaurantPhrases } from './components/RestaurantPhrases';
import { Onboarding } from './components/Onboarding';
import { MapExplorer } from './components/MapExplorer';

// Types & Constants
import { MenuData, Cart, AppState, HistoryRecord, TargetLanguage, CartItem, MenuItem, GeoLocation, SavedMenu } from './types';
import { parseMenuImage, parseMenuPageByPage } from './services/geminiService';

const DEV_BYPASS = false;

const App: React.FC = () => {
  // --- Auth State ---
  const [isPro, setIsPro] = useState(DEV_BYPASS);
  const [isLoggedIn, setIsLoggedIn] = useState(DEV_BYPASS);
  const [userEmail, setUserEmail] = useState<string>(DEV_BYPASS ? 'tester@example.com' : '');
  const [loadingAuth, setLoadingAuth] = useState(!DEV_BYPASS);
  const [apiKey, setApiKey] = useState(DEV_BYPASS ? 'dev-bypass-key' : '');

  // Settings
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
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(DEV_BYPASS);

  // 使用次數
  const [showExhaustedModal, setShowExhaustedModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // 🌓 深色/淺色模式
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ⭐ 菜單庫功能
  const [showSaveMenuModal, setShowSaveMenuModal] = useState(false);
  const [pendingMenuThumbnail, setPendingMenuThumbnail] = useState<string>('');
  const [showPhrases, setShowPhrases] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // 記住從哪裡進入 ordering，返回時回到正確頁面
  const [orderingBackTarget, setOrderingBackTarget] = useState<AppState>('welcome');

  // ⭐ 逐頁處理進度
  const [processingPage, setProcessingPage] = useState(0);
  const [processingTotal, setProcessingTotal] = useState(0);
  const [processingItemsFound, setProcessingItemsFound] = useState(0);
  const [isProcessingPages, setIsProcessingPages] = useState(false);
  const {
    savedMenus,
    saveMenu,
    deleteMenu,
    updateMenuName,
    getStorageSize,
    menuCount
  } = useMenuLibrary(userEmail);

  // ⭐ 使用次數限制 Hook
  const { usageCount, remainingUses, canUse, isUnlimited, incrementUsage, dailyLimit } = useUsageLimit(isPro);

  // --- Init (Load from LocalStorage) ---
  useEffect(() => {
    // 1. 檢查登入狀態
    const savedUser = localStorage.getItem('google_user');
    let initialEmail = '';
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as GoogleUser;
        setIsLoggedIn(true);
        setUserEmail(user.email);
        setIsPro(user.isPro || false);
        initialEmail = user.email;

        // --- 默默與後台同步最新狀態 (解決舊版重疊問題) ---
        fetch('/api/google-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, googleId: '', displayName: user.displayName, photoUrl: user.photoUrl })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) {
              const backendIsPro = data.user.isPro || data.user.subscriptionStatus === 'active';
              // 如果後端說他是 PRO，就強制更新
              if (backendIsPro) {
                setIsPro(true);
                localStorage.setItem('is_pro', 'true');
                user.isPro = true;
                localStorage.setItem('google_user', JSON.stringify(user));
              } else if (localStorage.getItem('is_pro') === 'true' && !data.user.isPro) {
                // 注意：如果本地是 PRO，但後端說不是，有可能是從 Settings 驗證信箱回來的，此時保留本地狀態，除非被登出。
              }
            }
          })
          .catch(err => console.warn('Silent sync failed:', err));

      } catch (e) {
        localStorage.removeItem('google_user');
      }
    }

    // 2. 檢查是否為 PRO
    const savedIsPro = localStorage.getItem('is_pro') === 'true';
    if (savedIsPro) setIsPro(true);

    // 3. Settings Persistence
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

    // 5. 檢查 API Key
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    // 5. 檢查是否需要顯示新手引導
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding') === 'true';
    if (hasSelectedLang && !hasSeenOnboarding) {
      setShowOnboarding(true);
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

    // 6. 載入主題偏好
    const savedTheme = localStorage.getItem('smp_theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    }

    setLoadingAuth(false);
  }, []);

  // --- 主題切換 ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('smp_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // --- 攔截 Android/iOS 原生返回手勢 ---
  // 當進入子頁面時 push 一個 dummy history state；
  // 使用者按返回 (或左滑) 時觸發 popstate，我們攔截並導回上一頁而不是離開 APP。
  useEffect(() => {
    const subViews: AppState[] = ['ordering', 'summary', 'history', 'library', 'map', 'processing'];
    const isSubView = subViews.includes(currentView);

    if (isSubView) {
      // Push a fake state so the browser has a history entry to "go back" to
      window.history.pushState({ view: currentView }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      // If we're in a sub-view, go back to the appropriate previous screen
      if (currentView === 'summary') {
        setCurrentView('ordering');
        window.history.pushState({ view: 'ordering' }, '');
      } else if (currentView === 'ordering') {
        setCurrentView(orderingBackTarget);
      } else if (isSubView) {
        setCurrentView('welcome');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  // --- Handlers ---
  const handleGoogleAuthSuccess = (user: GoogleUser) => {
    setIsLoggedIn(true);
    setUserEmail(user.email);
    setIsPro(user.isPro);
    // Store email so MapExplorer can identify ownership for delete
    localStorage.setItem('smp_user_email', user.email);

    if (user.isPro) {
      localStorage.setItem('is_pro', 'true');
    }
  };

  const handleLogout = async () => {
    try {
      // @ts-ignore
      const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
      if (isNative) {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        await GoogleAuth.initialize({
          clientId: '708202943885-rev2dlrdaivfqavra8rc1q2u79o0vaht.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
        await GoogleAuth.signOut();
      }
    } catch (e) {
      console.log('Google Auth signout error or already signed out', e);
    }

    // 清除所有的本地緩存
    localStorage.removeItem('is_pro');
    localStorage.removeItem('google_user');
    localStorage.removeItem('smp_user_email');
    localStorage.removeItem('gemini_api_key');

    // 重置應用狀態
    setIsPro(false);
    setIsLoggedIn(false);
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

    // ⭐ 檢查使用次數限制
    if (!canUse && !isPro) {
      setShowPaywall(true); // 直上付費牆
      return;
    }

    const filesToProcess = files.slice(0, 8); // 逐頁處理支援更多頁

    const toastId = toast.loading("Acquiring GPS Location...");
    const location = await getCurrentLocation();
    setScanLocation(location);
    toast.dismiss(toastId);

    setOrderingBackTarget('welcome'); // 拍照翻譯 → 返回首頁
    setCurrentView('processing');
    setProcessingPage(0);
    setProcessingTotal(filesToProcess.length);
    setProcessingItemsFound(0);

    try {
      const base64Images = await Promise.all(filesToProcess.map(compressImage));

      // ⭐ 多頁用逐頁處理，單頁用原方法
      if (base64Images.length > 1) {
        setIsProcessingPages(true);
        const finalData = await parseMenuPageByPage(
          base64Images,
          uiLang,
          false,
          // onPageComplete: 每頁完成後更新 UI
          (currentData, pageIndex, totalPages) => {
            setMenuData(currentData);
            setProcessingItemsFound(currentData.items.length);
            // 第一頁完成就跳到 ordering 頁面，讓用戶先瀏覽
            if (pageIndex === 0) {
              setCart({});
              setCurrentView('ordering');
            }
          },
          // onPageStart: 更新進度
          (pageIndex, totalPages) => {
            setProcessingPage(pageIndex);
            setProcessingTotal(totalPages);
          }
        );
        setMenuData(finalData);
        setIsProcessingPages(false);
      } else {
        // 單頁用原方法（快速）
        const data = await parseMenuImage(
          base64Images,
          uiLang,
          false
        );
        setMenuData(data);
        setCart({});
        setCurrentView('ordering');
      }

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

  // ⭐ 儲存菜單到菜單庫 (含地圖分享)
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
            uploaderName: '菜單庫同步分享',
            userId: userEmail,
            itemCount: menuData.items.length,
          }),
        });
        if (res.ok) {
          toast.success('也成功同步分享至地圖囉！');
        } else {
          toast.error('地圖分享發生錯誤。');
        }
      } catch (err) {
        console.error('Map cache error:', err);
      }
    }

    setShowSaveMenuModal(false);
    setPendingMenuThumbnail('');
  };

  // ⭐ 從地圖選單載入菜單
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
        setOrderingBackTarget('map'); // ← 返回地圖探索
        setCurrentView('ordering');
        toast.dismiss('load-map-menu');
      } else {
        toast.error('Failed to load menu');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  // ⭐ 從菜單庫載入菜單
  const handleLoadFromLibrary = (savedMenu: SavedMenu) => {
    setMenuData(savedMenu.menuData);
    setCart({});
    setScanLocation(savedMenu.location);
    setOrderingBackTarget('library'); // ← 返回菜單庫
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
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
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
            setShowOnboarding(true);
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
          onLanguageChange={(lang) => {
            setUiLang(lang);
            localStorage.setItem('ui_language', lang);
          }}
        />
      </div>
    );
  }

  // 3. API Key 閘門 (暫時繞過 -> 重新啟用)
  if (!apiKey) {
    return (
      <div className="h-screen w-full font-sans text-gray-900 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #fffbeb, #fff7ed)' }}>
        <Toaster position="top-center" />
        <ApiKeyGate
          onSave={(key) => {
            setApiKey(key);
            localStorage.setItem('gemini_api_key', key);
          }}
          selectedLanguage={uiLang}
        />
      </div>
    );
  }

  // 4. 主 App
  return (
    <div className="h-screen w-full font-sans overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', transition: 'background 0.3s, color 0.3s' }}>
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' } }} />

      <AnimatePresence mode="wait">
        {currentView === 'welcome' && (
          <motion.div key="welcome" {...pageVariants} className="h-full">
            <WelcomeScreen
              onLanguageChange={setUiLang}
              selectedLanguage={uiLang}
              onImagesSelected={handleImagesSelected}
              onViewHistory={() => {
                if (isPro) setCurrentView('history');
                else setShowPaywall(true);
              }}
              onViewLibrary={() => {
                if (isPro) setCurrentView('library');
                else setShowPaywall(true);
              }}
              menuCount={menuCount}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isVerified={isPro}
              onUpgradeClick={() => setShowPaywall(true)}
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
              remainingUses={remainingUses}
              dailyLimit={dailyLimit}
              isPro={isPro}
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
              menuData={menuData}
              cart={cart}
              onUpdateCart={handleUpdateCart}
              onViewSummary={() => setCurrentView('summary')}
              onBack={() => setCurrentView(orderingBackTarget)}
              targetLang={uiLang}
              taxRate={taxRate}
              serviceRate={serviceRate}
              hidePrice={hidePrice}
              isLoadingMore={isProcessingPages}
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

        {/* 🗺️ 地圖探索頁面 */}
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
          currentTax={taxRate}
          currentService={serviceRate}
          targetLanguage={uiLang}
          onSave={(tax, service) => {
            setTaxRate(tax);
            setServiceRate(service);
            localStorage.setItem('tax_rate', tax.toString());
            localStorage.setItem('service_rate', service.toString());
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
          isOpen={isSettingsOpen}
          onResetApp={async () => {
            await handleLogout();
            setIsSettingsOpen(false);
          }}
        />
      )}

      {/* 💳 RevenueCat 付費牆 */}
      <Paywall
        isOpen={showPaywall || showExhaustedModal}
        targetLanguage={uiLang}
        onClose={() => {
          setShowPaywall(false);
          setShowExhaustedModal(false);
        }}
        onSuccess={() => {
          setIsPro(true);
          setShowPaywall(false);
          setShowExhaustedModal(false);
          toast.success("歡迎升級！現在您可以盡情翻譯菜單囉！");
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

      {/* 新手引導教學 */}
      <Onboarding
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        language={uiLang}
      />
    </div>
  );
};

export default App;