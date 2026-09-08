import { TargetLanguage } from './types';

/**
 * UI 介面語言翻譯字典
 * 用於 WelcomeScreen 和其他元件的多語言支援
 */

// 介面語言選項（用於語言選擇器）
export const UI_LANGUAGE_OPTIONS = [
    { value: TargetLanguage.ChineseTW, label: '繁體中文', flag: '🇹🇼' },
    { value: TargetLanguage.ChineseHK, label: '繁體中文-HK', flag: '🇭🇰' },
    { value: TargetLanguage.Japanese, label: '日本語', flag: '🇯🇵' },
    { value: TargetLanguage.Korean, label: '한국어', flag: '🇰🇷' },
    { value: TargetLanguage.Thai, label: 'ไทย', flag: '🇹🇭' },
    { value: TargetLanguage.Vietnamese, label: 'Tiếng Việt', flag: '🇻🇳' },
    { value: TargetLanguage.Indonesian, label: 'Indonesia', flag: '🇮🇩' },
    { value: TargetLanguage.French, label: 'Français', flag: '🇫🇷' },
    { value: TargetLanguage.Spanish, label: 'Español', flag: '🇪🇸' },
    { value: TargetLanguage.English, label: 'English', flag: '🇺🇸' },
    { value: TargetLanguage.Filipino, label: 'Filipino', flag: '🇵🇭' },
    { value: TargetLanguage.German, label: 'Deutsch', flag: '🇩🇪' },
    { value: TargetLanguage.Russian, label: 'Русский', flag: '🇷🇺' },
    { value: TargetLanguage.Polish, label: 'Polski', flag: '🇵🇱' },
    { value: TargetLanguage.Malay, label: '繁中-馬來', flag: '🇲🇾' },
    { value: TargetLanguage.Italian, label: 'Italiano', flag: '🇮🇹' },
    { value: TargetLanguage.Portuguese, label: 'Português', flag: '🇵🇹' },
];

export const TARGET_LANG_TO_BCP47: Record<TargetLanguage, string> = {
    [TargetLanguage.ChineseTW]: 'zh-Hant-TW',
    [TargetLanguage.ChineseHK]: 'zh-Hant-HK',
    [TargetLanguage.English]: 'en',
    [TargetLanguage.Korean]: 'ko',
    [TargetLanguage.French]: 'fr',
    [TargetLanguage.Spanish]: 'es',
    [TargetLanguage.Thai]: 'th',
    [TargetLanguage.Filipino]: 'fil',
    [TargetLanguage.Vietnamese]: 'vi',
    [TargetLanguage.Japanese]: 'ja',
    [TargetLanguage.German]: 'de',
    [TargetLanguage.Russian]: 'ru',
    [TargetLanguage.Indonesian]: 'id',
    [TargetLanguage.Polish]: 'pl',
    [TargetLanguage.Malay]: 'ms',
    [TargetLanguage.Italian]: 'it',
    [TargetLanguage.Portuguese]: 'pt',
};

export const getTranslatedLanguageName = (targetLang: TargetLanguage, uiLang: TargetLanguage): string => {
    const targetBcp47 = TARGET_LANG_TO_BCP47[targetLang];
    const uiBcp47 = TARGET_LANG_TO_BCP47[uiLang];

    try {
        const translator = new Intl.DisplayNames([uiBcp47], { type: 'language' });
        const translatedName = translator.of(targetBcp47);
        if (translatedName) {
            // Capitalize the first letter (mostly for languages that return lowercase like french "anglais")
            return translatedName.charAt(0).toUpperCase() + translatedName.slice(1);
        }
    } catch (e) {
        console.warn("Intl.DisplayNames not supported or failed", e);
    }

    // Fallback to original label from UI_LANGUAGE_OPTIONS if Intl fails
    const fallback = UI_LANGUAGE_OPTIONS.find(opt => opt.value === targetLang);
    return fallback ? fallback.label : targetLang;
};

// UI 翻譯字典
export const UI_TRANSLATIONS: Record<TargetLanguage, {
    // Header
    proUnlimited: string;
    freeMode: string;

    // Main Content
    translateTo: string;
    hidePrice: string;
    hidePriceDesc: string;

    // Buttons
    shareEarn: string;
    takePhoto: string;
    uploadGallery: string;

    // Settings
    settings: string;
    history: string;

    // Preview Overlay
    selectedMenus: string;
    addPhoto: string;
    startScanning: string;
    maxPhotos: string;

    // Auth
    logout: string;

    // Phrases
    phrasesBtn: string;
    exploreMap: string;

    // Plan comparison
    planCompare: string;
    planFreeTitle: string;
    planFreeDesc: string;
    planProTitle: string;
    planProDesc: string;

    // Usage
    remainingUses: string;
    unlimitedUses: string;
    totalUsers: string;
}> = {
    [TargetLanguage.ChineseTW]: {
        proUnlimited: 'PRO 無限制',
        freeMode: '免費模式',
        translateTo: '翻譯成',
        hidePrice: '僅顯示餐點名稱',
        hidePriceDesc: '隱藏菜單上的價格顯示',
        shareEarn: '分享賺40%回饋金',
        takePhoto: '拍照',
        uploadGallery: '從相簿上傳',
        settings: '設定',
        history: '歷史紀錄',
        selectedMenus: '已選菜單',
        addPhoto: '新增圖片',
        startScanning: '開始掃描',
        maxPhotos: '最多4張',
        logout: '登出',
        phrasesBtn: '餐廳常用語',
        exploreMap: '探索菜單地圖',
        planCompare: '方案比較',
        planFreeTitle: '免費版',
        planFreeDesc: '3次免費體驗翻譯',
        planProTitle: '訂閱版',
        planProDesc: '無限制次數（依個人API額度）、菜單庫、歷史明細等功能解鎖',
        remainingUses: '免費體驗次數',
        unlimitedUses: 'PRO 無限使用',
        totalUsers: '已購買APP總用戶',
    },
    [TargetLanguage.ChineseHK]: {
        proUnlimited: 'PRO 無限制',
        freeMode: '免費模式',
        translateTo: '翻譯成',
        hidePrice: '僅顯示餐點名稱',
        hidePriceDesc: '隱藏菜單上的價格顯示',
        shareEarn: '分享賺40%回饋金',
        takePhoto: '拍照',
        uploadGallery: '從相簿上傳',
        settings: '設定',
        history: '歷史紀錄',
        selectedMenus: '已選菜單',
        addPhoto: '新增圖片',
        startScanning: '開始掃描',
        maxPhotos: '最多4張',
        logout: '登出',
        phrasesBtn: '餐廳常用語',
        exploreMap: '探索菜單地圖',
        planCompare: '方案比較',
        planFreeTitle: '免費版',
        planFreeDesc: '3次免費體驗翻譯',
        planProTitle: '訂閱版',
        planProDesc: '無限制次數（依個人API額度）、菜單庫、歷史明細等功能解鎖',
        remainingUses: '免費體驗次數',
        unlimitedUses: 'PRO 無限使用',
        totalUsers: '已購買APP總用戶',
    },
    [TargetLanguage.Japanese]: {
        proUnlimited: 'PRO 無制限',
        freeMode: '無料モード',
        translateTo: '翻訳先',
        hidePrice: '料理名のみ表示',
        hidePriceDesc: 'メニューの価格を非表示',
        shareEarn: 'シェアして40%還元',
        takePhoto: '写真を撮る',
        uploadGallery: 'ギャラリーから',
        settings: '設定',
        history: '履歴',
        selectedMenus: '選択したメニュー',
        addPhoto: '写真を追加',
        startScanning: 'スキャン開始',
        maxPhotos: '最大4枚',
        logout: 'ログアウト',
        phrasesBtn: 'レストラン会話',
        exploreMap: 'メニューマップを探索',
        planCompare: 'プラン比較',
        planFreeTitle: '無料版',
        planFreeDesc: '3回の無料体験翻訳',
        planProTitle: '有料版',
        planProDesc: '無制限翻訳、メニューライブラリ、履歴などの機能解除',
        remainingUses: '無料体験回数',
        unlimitedUses: 'PRO 無制限',
        totalUsers: 'アプリ購入者数',
    },
    [TargetLanguage.Korean]: {
        proUnlimited: 'PRO 무제한',
        freeMode: '무료 모드',
        translateTo: '번역 언어',
        hidePrice: '메뉴 이름만 표시',
        hidePriceDesc: '가격 숨기기',
        shareEarn: '공유하고 40% 리워드',
        takePhoto: '사진 촬영',
        uploadGallery: '갤러리에서',
        settings: '설정',
        history: '기록',
        selectedMenus: '선택한 메뉴',
        addPhoto: '사진 추가',
        startScanning: '스캔 시작',
        maxPhotos: '최대 4장',
        logout: '로그아웃',
        phrasesBtn: '식당 회화',
        exploreMap: '메뉴 지도 탐색',
        planCompare: '요금제 비교',
        planFreeTitle: '무료',
        planFreeDesc: '무료 체험 번역 3회',
        planProTitle: '구독',
        planProDesc: '무제한 번역, 메뉴 라이브러리, 히스토리 등 기능 해제',
        remainingUses: '무료 체험 횟수',
        unlimitedUses: 'PRO 무제한',
        totalUsers: '앱 구매 사용자 수',
    },
    [TargetLanguage.Thai]: {
        proUnlimited: 'PRO ไม่จำกัด',
        freeMode: 'โหมดฟรี',
        translateTo: 'แปลเป็น',
        hidePrice: 'แสดงเฉพาะชื่อเมนู',
        hidePriceDesc: 'ซ่อนราคา',
        shareEarn: 'แชร์รับ 40%',
        takePhoto: 'ถ่ายรูป',
        uploadGallery: 'อัปโหลดจากแกลเลอรี',
        settings: 'ตั้งค่า',
        history: 'ประวัติ',
        selectedMenus: 'เมนูที่เลือก',
        addPhoto: 'เพิ่มรูปภาพ',
        startScanning: 'เริ่มสแกน',
        maxPhotos: 'สูงสุด 4 รูป',
        logout: 'ออกจากระบบ',
        phrasesBtn: 'ประโยคในร้านอาหาร',
        exploreMap: 'สำรวจแผนที่เมนู',
        planCompare: 'เปรียบเทียบแพ็กเกจ',
        planFreeTitle: 'ฟรี',
        planFreeDesc: 'ทดลองแปลฟรี 3 ครั้ง',
        planProTitle: 'สมาชิก',
        planProDesc: 'แปลไม่จำกัด, คลังเมนู, ประวัติ และอื่นๆ',
        remainingUses: 'จำนวนครั้งทดลองใช้ฟรี',
        unlimitedUses: 'PRO ไม่จำกัด',
        totalUsers: 'จำนวนผู้ซื้อแอปทั้งหมด',
    },
    [TargetLanguage.Vietnamese]: {
        proUnlimited: 'PRO Không giới hạn',
        freeMode: 'Chế độ miễn phí',
        translateTo: 'Dịch sang',
        hidePrice: 'Chỉ hiển thị tên món',
        hidePriceDesc: 'Ẩn giá',
        shareEarn: 'Chia sẻ nhận 40%',
        takePhoto: 'Chụp ảnh',
        uploadGallery: 'Tải từ thư viện',
        settings: 'Cài đặt',
        history: 'Lịch sử',
        selectedMenus: 'Menu đã chọn',
        addPhoto: 'Thêm ảnh',
        startScanning: 'Bắt đầu quét',
        maxPhotos: 'Tối đa 4 ảnh',
        logout: 'Đăng xuất',
        phrasesBtn: 'Câu thường dùng',
        exploreMap: 'Khám phá bản đồ menu',
        planCompare: 'So sánh gói',
        planFreeTitle: 'Miễn phí',
        planFreeDesc: '3 lượt dịch dùng thử miễn phí',
        planProTitle: 'Pro',
        planProDesc: 'Dịch không giới hạn, Thư viện menu, Lịch sử và nhiều hơn',
        remainingUses: 'Lượt dùng thử miễn phí',
        unlimitedUses: 'PRO Không giới hạn',
        totalUsers: 'Tổng người mua ứng dụng',
    },
    [TargetLanguage.Indonesian]: {
        proUnlimited: 'PRO Tanpa Batas',
        freeMode: 'Mode Gratis',
        translateTo: 'Terjemahkan ke',
        hidePrice: 'Tampilkan nama saja',
        hidePriceDesc: 'Sembunyikan harga',
        shareEarn: 'Bagikan dapat 40%',
        takePhoto: 'Ambil Foto',
        uploadGallery: 'Unggah dari Galeri',
        settings: 'Pengaturan',
        history: 'Riwayat',
        selectedMenus: 'Menu Terpilih',
        addPhoto: 'Tambah Foto',
        startScanning: 'Mulai Pindai',
        maxPhotos: 'Maks. 4 foto',
        logout: 'Keluar',
        phrasesBtn: 'Frasa Restoran',
        exploreMap: 'Jelajahi Peta Menu',
        planCompare: 'Bandingkan Paket',
        planFreeTitle: 'Gratis',
        planFreeDesc: '3 terjemahan uji coba gratis',
        planProTitle: 'Pro',
        planProDesc: 'Tak terbatas, Perpustakaan Menu, Riwayat dan lainnya',
        remainingUses: 'Penggunaan uji coba gratis',
        unlimitedUses: 'PRO Tanpa Batas',
        totalUsers: 'Total pembeli aplikasi',
    },
    [TargetLanguage.French]: {
        proUnlimited: 'PRO Illimité',
        freeMode: 'Mode Gratuit',
        translateTo: 'Traduire en',
        hidePrice: 'Afficher noms seulement',
        hidePriceDesc: 'Masquer les prix',
        shareEarn: 'Partagez, gagnez 40%',
        takePhoto: 'Prendre Photo',
        uploadGallery: 'Depuis la Galerie',
        settings: 'Paramètres',
        history: 'Historique',
        selectedMenus: 'Menus sélectionnés',
        addPhoto: 'Ajouter photo',
        startScanning: 'Démarrer le scan',
        maxPhotos: 'Max 4 photos',
        logout: 'Déconnexion',
        phrasesBtn: 'Phrases utiles',
        exploreMap: 'Explorer la carte des menus',
        planCompare: 'Comparer les plans',
        planFreeTitle: 'Gratuit',
        planFreeDesc: '3 traductions d’essai gratuites',
        planProTitle: 'Pro',
        planProDesc: 'Traductions illimitées, Bibliothèque, Historique et plus',
        remainingUses: 'Essais gratuits',
        unlimitedUses: 'PRO Illimité',
        totalUsers: "Total d'acheteurs",
    },
    [TargetLanguage.Spanish]: {
        proUnlimited: 'PRO Ilimitado',
        freeMode: 'Modo Gratis',
        translateTo: 'Traducir a',
        hidePrice: 'Solo mostrar nombres',
        hidePriceDesc: 'Ocultar precios',
        shareEarn: 'Comparte y gana 40%',
        takePhoto: 'Tomar Foto',
        uploadGallery: 'Subir de Galería',
        settings: 'Ajustes',
        history: 'Historial',
        selectedMenus: 'Menús seleccionados',
        addPhoto: 'Añadir foto',
        startScanning: 'Iniciar escaneo',
        maxPhotos: 'Máx 4 fotos',
        logout: 'Cerrar sesión',
        phrasesBtn: 'Frases de restaurante',
        exploreMap: 'Explorar Mapa de Menús',
        planCompare: 'Comparar planes',
        planFreeTitle: 'Gratis',
        planFreeDesc: '3 traducciones de prueba gratuitas',
        planProTitle: 'Pro',
        planProDesc: 'Traducciones ilimitadas, Biblioteca, Historial y más',
        remainingUses: 'Usos de prueba gratuitos',
        unlimitedUses: 'PRO Ilimitado',
        totalUsers: 'Total de compradores',
    },
    [TargetLanguage.English]: {
        proUnlimited: 'PRO Unlimited',
        freeMode: 'Free Mode',
        translateTo: 'Translate to',
        hidePrice: 'Show names only',
        hidePriceDesc: 'Hide menu prices',
        shareEarn: 'Share & Earn 40%',
        takePhoto: 'Take Photo',
        uploadGallery: 'Upload from Gallery',
        settings: 'Settings',
        history: 'History',
        selectedMenus: 'Selected Menus',
        addPhoto: 'Add Photo',
        startScanning: 'Start Scanning',
        maxPhotos: 'Max 4 photos',
        logout: 'Log Out',
        phrasesBtn: 'Restaurant Phrases',
        exploreMap: 'Explore Menu Map',
        planCompare: 'Compare Plans',
        planFreeTitle: 'Free',
        planFreeDesc: '3 free trial translations',
        planProTitle: 'Pro',
        planProDesc: 'Unlimited translations, Menu Library, History & more',
        remainingUses: 'Free trial uses',
        unlimitedUses: 'PRO Unlimited',
        totalUsers: 'Total App Buyers',
    },
    [TargetLanguage.Filipino]: {
        proUnlimited: 'PRO Walang Limitasyon',
        freeMode: 'Libreng Mode',
        translateTo: 'Isalin sa',
        hidePrice: 'Ipakita lang ang pangalan',
        hidePriceDesc: 'Itago ang presyo',
        shareEarn: 'Ibahagi at kumita ng 40%',
        takePhoto: 'Kumuha ng Larawan',
        uploadGallery: 'Mag-upload mula sa Gallery',
        settings: 'Mga Setting',
        history: 'Kasaysayan',
        selectedMenus: 'Napiling Menu',
        addPhoto: 'Magdagdag ng Larawan',
        startScanning: 'Simulan ang Pag-scan',
        maxPhotos: 'Max 4 na larawan',
        logout: 'Mag-logout',
        phrasesBtn: 'Mga Parirala',
        exploreMap: 'I-explore ang Mapa ng Menu',
        planCompare: 'Ihambing ang Plano',
        planFreeTitle: 'Libre',
        planFreeDesc: '3 libreng pagsubok na pagsasalin',
        planProTitle: 'Pro',
        planProDesc: 'Walang limitasyon, Menu Library, History at iba pa',
        remainingUses: 'Libreng pagsubok',
        unlimitedUses: 'PRO Walang Limitasyon',
        totalUsers: 'Kabuuang Bumili ng App',
    },
    [TargetLanguage.German]: {
        proUnlimited: 'PRO Unbegrenzt',
        freeMode: 'Kostenloser Modus',
        translateTo: 'Übersetzen nach',
        hidePrice: 'Nur Namen anzeigen',
        hidePriceDesc: 'Preise ausblenden',
        shareEarn: 'Teilen & 40% verdienen',
        takePhoto: 'Foto aufnehmen',
        uploadGallery: 'Aus Galerie hochladen',
        settings: 'Einstellungen',
        history: 'Verlauf',
        selectedMenus: 'Ausgewählte Menüs',
        addPhoto: 'Foto hinzufügen',
        startScanning: 'Scan starten',
        maxPhotos: 'Max. 4 Fotos',
        logout: 'Abmelden',
        phrasesBtn: 'Restaurant-Phrasen',
        exploreMap: 'Menükarte erkunden',
        planCompare: 'Pläne vergleichen',
        planFreeTitle: 'Kostenlos',
        planFreeDesc: '3 kostenlose Testübersetzungen',
        planProTitle: 'Pro',
        planProDesc: 'Unbegrenzt, Menübibliothek, Verlauf und mehr',
        remainingUses: 'Kostenlose Testnutzungen',
        unlimitedUses: 'PRO Unbegrenzt',
        totalUsers: 'App-Käufer insgesamt',
    },
    [TargetLanguage.Russian]: {
        proUnlimited: 'PRO Безлимит',
        freeMode: 'Бесплатный режим',
        translateTo: 'Перевести на',
        hidePrice: 'Показать только названия',
        hidePriceDesc: 'Скрыть цены',
        shareEarn: 'Поделись и получи 40%',
        takePhoto: 'Сделать фото',
        uploadGallery: 'Загрузить из галереи',
        settings: 'Настройки',
        history: 'История',
        selectedMenus: 'Выбранные меню',
        addPhoto: 'Добавить фото',
        startScanning: 'Начать сканирование',
        maxPhotos: 'Макс. 4 фото',
        logout: 'Выйти',
        phrasesBtn: 'Фразы для ресторана',
        exploreMap: 'Исследовать карту меню',
        planCompare: 'Сравнить планы',
        planFreeTitle: 'Бесплатно',
        planFreeDesc: '3 бесплатных пробных перевода',
        planProTitle: 'Pro',
        planProDesc: 'Безлимитные переводы, Библиотека, История и многое другое',
        remainingUses: 'Бесплатные пробные переводы',
        unlimitedUses: 'PRO Безлимит',
        totalUsers: 'Всего покупателей',
    },
    [TargetLanguage.Polish]: {
        proUnlimited: 'PRO Bez limitu',
        freeMode: 'Tryb darmowy',
        translateTo: 'Przetłumacz na',
        hidePrice: 'Pokaż tylko nazwy',
        hidePriceDesc: 'Ukryj ceny',
        shareEarn: 'Udostępnij i zarabiaj 40%',
        takePhoto: 'Zrób zdjęcie',
        uploadGallery: 'Wgraj z galerii',
        settings: 'Ustawienia',
        history: 'Historia',
        selectedMenus: 'Wybrane menu',
        addPhoto: 'Dodaj zdjęcie',
        startScanning: 'Rozpocznij skanowanie',
        maxPhotos: 'Maks. 4 zdjęcia',
        logout: 'Wyloguj',
        phrasesBtn: 'Zwroty w restauracji',
        exploreMap: 'Eksploruj mapę menu',
        planCompare: 'Porównaj plany',
        planFreeTitle: 'Darmowy',
        planFreeDesc: '3 bezpłatne tłumaczenia próbne',
        planProTitle: 'Pro',
        planProDesc: 'Bez limitu tłumaczeń, Biblioteka menu, Historia i więcej',
        remainingUses: 'Bezpłatne użycia próbne',
        unlimitedUses: 'PRO Bez limitu',
        totalUsers: 'Łączna liczba kupujących',
    },
    [TargetLanguage.Malay]: {
        proUnlimited: 'PRO 無限制',
        freeMode: '免費模式',
        translateTo: '翻譯成',
        hidePrice: '僅顯示餐點名稱',
        hidePriceDesc: '隱藏菜單上的價格顯示',
        shareEarn: '分享賺40%回饋金',
        takePhoto: '拍照',
        uploadGallery: '從相簿上傳',
        settings: '設定',
        history: '歷史紀錄',
        selectedMenus: '已選菜單',
        addPhoto: '新增圖片',
        startScanning: '開始掃描',
        maxPhotos: '最多4張',
        logout: '登出',
        phrasesBtn: '餐廳常用語',
        exploreMap: '探索菜單地圖',
        planCompare: '方案比較',
        planFreeTitle: '免費版',
        planFreeDesc: '3 terjemahan percubaan percuma',
        planProTitle: '訂閱版',
        planProDesc: '無限制次數（依個人API額度）、菜單庫、歷史明細等功能解鎖',
        remainingUses: 'Penggunaan percubaan percuma',
        unlimitedUses: 'PRO 無限使用',
        totalUsers: '已購買APP總用戶',
    },
    [TargetLanguage.Italian]: {
        proUnlimited: 'PRO Illimitato',
        freeMode: 'Modalità Gratuita',
        translateTo: 'Traduci in',
        hidePrice: 'Mostra solo i nomi',
        hidePriceDesc: 'Nascondi i prezzi',
        shareEarn: 'Condividi e guadagna 40%',
        takePhoto: 'Scatta Foto',
        uploadGallery: 'Carica dalla Galleria',
        settings: 'Impostazioni',
        history: 'Cronologia',
        selectedMenus: 'Menu Selezionati',
        addPhoto: 'Aggiungi Foto',
        startScanning: 'Inizia Scansione',
        maxPhotos: 'Max 4 foto',
        logout: 'Esci',
        phrasesBtn: 'Frasi da Ristorante',
        exploreMap: 'Esplora Mappa dei Menu',
        planCompare: 'Confronta Piani',
        planFreeTitle: 'Gratuito',
        planFreeDesc: '3 traduzioni di prova gratuite',
        planProTitle: 'Pro',
        planProDesc: 'Traduzioni illimitate, Libreria Menu, Cronologia e altro',
        remainingUses: 'Utilizzi di prova gratuiti',
        unlimitedUses: 'PRO Illimitato',
        totalUsers: 'Acquirenti App Totali',
    },
    [TargetLanguage.Portuguese]: {
        proUnlimited: 'PRO Ilimitado',
        freeMode: 'Modo Gratuito',
        translateTo: 'Traduzir para',
        hidePrice: 'Mostrar apenas nomes',
        hidePriceDesc: 'Ocultar os preços',
        shareEarn: 'Partilhe e ganhe 40%',
        takePhoto: 'Tirar Foto',
        uploadGallery: 'Carregar da Galeria',
        settings: 'Definições',
        history: 'Histórico',
        selectedMenus: 'Menus Selecionados',
        addPhoto: 'Adicionar Foto',
        startScanning: 'Iniciar Digitalização',
        maxPhotos: 'Max 4 fotos',
        logout: 'Sair',
        phrasesBtn: 'Frases para Restaurantes',
        exploreMap: 'Explorar Mapa de Menus',
        planCompare: 'Comparar Planos',
        planFreeTitle: 'Gratuito',
        planFreeDesc: '3 traduções de avaliação gratuitas',
        planProTitle: 'Pro',
        planProDesc: 'Traduções ilimitadas, Biblioteca de Menus, Histórico e mais',
        remainingUses: 'Utilizações de avaliação gratuitas',
        unlimitedUses: 'PRO Ilimitado',
        totalUsers: 'Total de Compradores',
    },
};

// Helper function to get translations
export const getUIText = (lang: TargetLanguage) => {
    return UI_TRANSLATIONS[lang] || UI_TRANSLATIONS[TargetLanguage.English];
};

export interface ImageTranslationUIText {
    title: string; subtitle: string; back: string; cameraSettings: string; closeLanguageMenu: string;
    cameraPreview: string; requestingCamera: string; cameraUnavailable: string; cameraPermissionHint: string;
    requestPermission: string; chooseGallery: string; maxPhotos: string; selectedImage: string; removeImage: string;
    capture: string; upload: string; startTranslation: string; originalMenu: string; translatedMenu: string;
    panZoomHint: string; queued: string; recognizing: string; retryImage: string; partialNotice: string;
    orderList: string; orderListHint: string; orderListTitle: string; closeOrderList: string; emptyOrderList: string;
    backToTranslation: string; decrease: string; increase: string; adjustQuantity: string;
    historyTitle: string; historySubtitle: string; newTranslation: string; noHistory: string; noHistoryHint: string;
    translationPreview: string; completedImages: string; deleteHistory: string; confirmDeleteHistory: string;
    offline: string; preparingImages: string; imageReadFailed: string; recognitionFailed: string;
    quotaExceeded: string; noTextFound: string; aiNoResult: string;
}

const ONE_TAP_ENGLISH: ImageTranslationUIText = {
    title: 'Tap & Translate', subtitle: 'Take a photo to translate instantly', back: 'Back', cameraSettings: 'Camera settings',
    closeLanguageMenu: 'Close language menu', cameraPreview: 'Camera preview', requestingCamera: 'Requesting camera permission…',
    cameraUnavailable: 'Camera unavailable', cameraPermissionHint: 'Allow camera access in system settings, or choose photos from your gallery.',
    requestPermission: 'Request permission again', chooseGallery: 'Choose from gallery', maxPhotos: 'Up to 4 photos', selectedImage: 'Selected image',
    removeImage: 'Remove image', capture: 'Take photo', upload: 'Upload', startTranslation: 'Translate', originalMenu: 'Original menu',
    translatedMenu: 'Translated menu', panZoomHint: 'Drag to move · pinch / wheel to zoom', queued: 'Waiting to recognize…',
    recognizing: 'Recognizing and translating…', retryImage: 'Retry this image', partialNotice: 'Some text could not be confirmed. Compare with the original image.',
    orderList: 'Order list', orderListHint: 'Tap a translation box, then press + to add it', orderListTitle: 'Order list', closeOrderList: 'Close order list',
    emptyOrderList: 'Return to the translation screen and press + on an item to add it.', backToTranslation: 'Back to translation', decrease: 'Decrease quantity',
    increase: 'Increase quantity', adjustQuantity: 'Adjust quantity', historyTitle: 'History', historySubtitle: 'Image translation records',
    newTranslation: 'Start a new translation', noHistory: 'No translation records yet', noHistoryHint: 'Your records will appear here after you photograph or upload a menu.',
    translationPreview: 'Translation preview', completedImages: 'images completed', deleteHistory: 'Delete this record', confirmDeleteHistory: 'Delete this translation record?',
    offline: 'Please connect to the internet.', preparingImages: 'Preparing images…', imageReadFailed: 'Unable to read the image.', recognitionFailed: 'Image recognition failed. Please try again.', quotaExceeded: 'Translation limit reached. Please try again later.', noTextFound: 'No clear text was found. Try a closer or clearer photo.', aiNoResult: 'The AI did not return an image-recognition result. Please try again.'
};

const imageTranslationText = (overrides: Partial<ImageTranslationUIText>): ImageTranslationUIText => ({ ...ONE_TAP_ENGLISH, ...overrides });

export const IMAGE_TRANSLATION_UI: Record<TargetLanguage, ImageTranslationUIText> = {
    [TargetLanguage.ChineseTW]: imageTranslationText({ title: '一拍即翻', subtitle: '拍下菜單，立即翻譯', back: '返回', cameraSettings: '相機設定', closeLanguageMenu: '關閉語言選單', cameraPreview: '相機預覽', requestingCamera: '正在請求相機權限…', cameraUnavailable: '無法開啟相機', cameraPermissionHint: '請在系統設定允許相機權限，或改用相簿上傳圖片。', requestPermission: '重新請求權限', chooseGallery: '從相簿選擇', maxPhotos: '最多 4 張', selectedImage: '已選圖片', removeImage: '移除圖片', capture: '拍攝', upload: '上傳', startTranslation: '開始翻譯', originalMenu: '原始菜單', translatedMenu: '翻譯菜單', panZoomHint: '拖曳移動 · 雙指／滾輪縮放', queued: '等待辨識…', recognizing: '正在辨識與翻譯…', retryImage: '重試這張', partialNotice: '部分文字未能確認，請對照原圖。', orderList: '點餐清單', orderListHint: '點擊翻譯框後按下 + 即可加入', orderListTitle: '點餐清單', closeOrderList: '關閉點餐清單', emptyOrderList: '回到翻譯畫面，點擊品項後按下 + 即可加入。', backToTranslation: '回到翻譯畫面', decrease: '減少數量', increase: '增加數量', adjustQuantity: '調整數量', historyTitle: '歷史', historySubtitle: '圖片翻譯紀錄', newTranslation: '開始新的翻譯', noHistory: '還沒有翻譯紀錄', noHistoryHint: '拍攝或上傳菜單後，紀錄會顯示在這裡。', translationPreview: '翻譯紀錄預覽', completedImages: '張圖片已完成', deleteHistory: '刪除這筆翻譯紀錄', confirmDeleteHistory: '確定要刪除這筆圖片翻譯紀錄嗎？' }),
    [TargetLanguage.ChineseHK]: imageTranslationText({ title: '一拍即翻', subtitle: '影低餐牌，即刻翻譯', back: '返回', cameraSettings: '相機設定', closeLanguageMenu: '關閉語言選單', cameraPreview: '相機預覽', requestingCamera: '正在要求相機權限…', cameraUnavailable: '無法開啟相機', cameraPermissionHint: '請在系統設定允許相機權限，或從相簿上傳圖片。', requestPermission: '重新要求權限', chooseGallery: '從相簿選擇', maxPhotos: '最多 4 張', selectedImage: '已選圖片', removeImage: '移除圖片', capture: '拍攝', upload: '上載', startTranslation: '開始翻譯', originalMenu: '原餐牌', translatedMenu: '翻譯餐牌', panZoomHint: '拖曳移動 · 雙指／滾輪縮放', queued: '等待辨識…', recognizing: '正在辨識及翻譯…', retryImage: '重試這張', partialNotice: '部分文字未能確認，請對照原圖。', orderList: '點餐清單', orderListHint: '點擊翻譯框後按 + 加入', orderListTitle: '點餐清單', closeOrderList: '關閉點餐清單', emptyOrderList: '返回翻譯畫面，點擊品項後按 + 加入。', backToTranslation: '返回翻譯畫面', decrease: '減少數量', increase: '增加數量', adjustQuantity: '調整數量', historyTitle: '歷史', historySubtitle: '圖片翻譯紀錄', newTranslation: '開始新翻譯', noHistory: '暫時沒有翻譯紀錄', noHistoryHint: '拍攝或上載餐牌後，紀錄會顯示在這裡。', translationPreview: '翻譯紀錄預覽', completedImages: '張圖片已完成', deleteHistory: '刪除這筆紀錄', confirmDeleteHistory: '確定要刪除這筆圖片翻譯紀錄嗎？' }),
    [TargetLanguage.Japanese]: imageTranslationText({ title: 'かざして翻訳', subtitle: 'メニューを撮影してすぐ翻訳', back: '戻る', cameraSettings: 'カメラ設定', closeLanguageMenu: '言語メニューを閉じる', cameraPreview: 'カメラプレビュー', requestingCamera: 'カメラの許可をリクエスト中…', cameraUnavailable: 'カメラを起動できません', cameraPermissionHint: 'システム設定でカメラを許可するか、ギャラリーから画像を選択してください。', requestPermission: 'もう一度許可を求める', chooseGallery: 'ギャラリーから選択', maxPhotos: '最大4枚', selectedImage: '選択した画像', removeImage: '画像を削除', capture: '撮影', upload: 'アップロード', startTranslation: '翻訳を開始', originalMenu: '元のメニュー', translatedMenu: '翻訳メニュー', panZoomHint: 'ドラッグで移動 · ピンチ／ホイールで拡大縮小', queued: '認識を待っています…', recognizing: '認識・翻訳中…', retryImage: 'この画像を再試行', partialNotice: '確認できない文字があります。元画像を確認してください。', orderList: '注文リスト', orderListHint: '翻訳ボックスをタップして + で追加', orderListTitle: '注文リスト', closeOrderList: '注文リストを閉じる', emptyOrderList: '翻訳画面に戻り、項目の + を押して追加してください。', backToTranslation: '翻訳画面に戻る', decrease: '数量を減らす', increase: '数量を増やす', adjustQuantity: '数量を調整', historyTitle: '履歴', historySubtitle: '画像翻訳の記録', newTranslation: '新しい翻訳を開始', noHistory: '翻訳履歴はありません', noHistoryHint: 'メニューを撮影またはアップロードすると、ここに表示されます。', translationPreview: '翻訳プレビュー', completedImages: '枚完了', deleteHistory: 'この記録を削除', confirmDeleteHistory: 'この翻訳記録を削除しますか？' }),
    [TargetLanguage.Korean]: imageTranslationText({ title: '한 번에 번역', subtitle: '메뉴를 촬영하면 바로 번역합니다', back: '뒤로', cameraSettings: '카메라 설정', closeLanguageMenu: '언어 메뉴 닫기', cameraPreview: '카메라 미리보기', requestingCamera: '카메라 권한 요청 중…', cameraUnavailable: '카메라를 열 수 없습니다', cameraPermissionHint: '시스템 설정에서 카메라를 허용하거나 갤러리에서 이미지를 선택하세요.', requestPermission: '권한 다시 요청', chooseGallery: '갤러리에서 선택', maxPhotos: '최대 4장', selectedImage: '선택한 이미지', removeImage: '이미지 삭제', capture: '촬영', upload: '업로드', startTranslation: '번역 시작', originalMenu: '원본 메뉴', translatedMenu: '번역 메뉴', panZoomHint: '드래그로 이동 · 두 손가락／휠로 확대·축소', queued: '인식을 기다리는 중…', recognizing: '인식 및 번역 중…', retryImage: '이 이미지 다시 시도', partialNotice: '확인하지 못한 문자가 있습니다. 원본 이미지를 확인하세요.', orderList: '주문 목록', orderListHint: '번역 상자를 누른 후 +로 추가', orderListTitle: '주문 목록', closeOrderList: '주문 목록 닫기', emptyOrderList: '번역 화면으로 돌아가 항목의 +를 눌러 추가하세요.', backToTranslation: '번역 화면으로', decrease: '수량 줄이기', increase: '수량 늘리기', adjustQuantity: '수량 조정', historyTitle: '기록', historySubtitle: '이미지 번역 기록', newTranslation: '새 번역 시작', noHistory: '번역 기록이 없습니다', noHistoryHint: '메뉴를 촬영하거나 업로드하면 여기에 표시됩니다.', translationPreview: '번역 미리보기', completedImages: '장 완료', deleteHistory: '이 기록 삭제', confirmDeleteHistory: '이 번역 기록을 삭제할까요?' }),
    [TargetLanguage.Thai]: imageTranslationText({ title: 'ถ่ายปุ๊บแปลปั๊บ', subtitle: 'ถ่ายเมนูแล้วแปลทันที', back: 'ย้อนกลับ', cameraSettings: 'การตั้งค่ากล้อง', closeLanguageMenu: 'ปิดเมนูภาษา', cameraPreview: 'ตัวอย่างกล้อง', requestingCamera: 'กำลังขอสิทธิ์ใช้กล้อง…', cameraUnavailable: 'เปิดกล้องไม่ได้', cameraPermissionHint: 'อนุญาตการใช้กล้องในการตั้งค่าระบบ หรือเลือกภาพจากแกลเลอรี', requestPermission: 'ขอสิทธิ์อีกครั้ง', chooseGallery: 'เลือกจากแกลเลอรี', maxPhotos: 'สูงสุด 4 รูป', selectedImage: 'รูปที่เลือก', removeImage: 'ลบรูป', capture: 'ถ่ายภาพ', upload: 'อัปโหลด', startTranslation: 'เริ่มแปล', originalMenu: 'เมนูต้นฉบับ', translatedMenu: 'เมนูแปลแล้ว', panZoomHint: 'ลากเพื่อเลื่อน · ใช้สองนิ้ว／ล้อเมาส์เพื่อซูม', queued: 'รอการรู้จำ…', recognizing: 'กำลังรู้จำและแปล…', retryImage: 'ลองรูปนี้อีกครั้ง', partialNotice: 'ยืนยันข้อความบางส่วนไม่ได้ โปรดเทียบกับภาพต้นฉบับ', orderList: 'รายการสั่งอาหาร', orderListHint: 'แตะกรอบคำแปล แล้วกด + เพื่อเพิ่ม', orderListTitle: 'รายการสั่งอาหาร', closeOrderList: 'ปิดรายการสั่งอาหาร', emptyOrderList: 'กลับไปหน้าคำแปล แล้วกด + ที่รายการเพื่อเพิ่ม', backToTranslation: 'กลับไปหน้าคำแปล', decrease: 'ลดจำนวน', increase: 'เพิ่มจำนวน', adjustQuantity: 'ปรับจำนวน', historyTitle: 'ประวัติ', historySubtitle: 'ประวัติการแปลรูปภาพ', newTranslation: 'เริ่มการแปลใหม่', noHistory: 'ยังไม่มีประวัติการแปล', noHistoryHint: 'ประวัติจะแสดงที่นี่หลังถ่ายหรืออัปโหลดเมนู', translationPreview: 'ตัวอย่างคำแปล', completedImages: 'รูปเสร็จแล้ว', deleteHistory: 'ลบประวัตินี้', confirmDeleteHistory: 'ลบประวัติการแปลนี้หรือไม่?' }),
    [TargetLanguage.Vietnamese]: imageTranslationText({ title: 'Chụp là dịch', subtitle: 'Chụp thực đơn để dịch ngay', back: 'Quay lại', cameraSettings: 'Cài đặt máy ảnh', closeLanguageMenu: 'Đóng menu ngôn ngữ', cameraPreview: 'Xem trước máy ảnh', requestingCamera: 'Đang yêu cầu quyền máy ảnh…', cameraUnavailable: 'Không thể mở máy ảnh', cameraPermissionHint: 'Cho phép máy ảnh trong Cài đặt hệ thống hoặc chọn ảnh từ thư viện.', requestPermission: 'Yêu cầu lại quyền', chooseGallery: 'Chọn từ thư viện', maxPhotos: 'Tối đa 4 ảnh', selectedImage: 'Ảnh đã chọn', removeImage: 'Xóa ảnh', capture: 'Chụp', upload: 'Tải lên', startTranslation: 'Bắt đầu dịch', originalMenu: 'Thực đơn gốc', translatedMenu: 'Thực đơn đã dịch', panZoomHint: 'Kéo để di chuyển · chụm／cuộn để thu phóng', queued: 'Đang chờ nhận dạng…', recognizing: 'Đang nhận dạng và dịch…', retryImage: 'Thử lại ảnh này', partialNotice: 'Một số chữ chưa xác nhận được. Hãy đối chiếu ảnh gốc.', orderList: 'Danh sách gọi món', orderListHint: 'Nhấn hộp dịch rồi nhấn + để thêm', orderListTitle: 'Danh sách gọi món', closeOrderList: 'Đóng danh sách', emptyOrderList: 'Quay lại màn hình dịch và nhấn + ở món muốn thêm.', backToTranslation: 'Quay lại bản dịch', decrease: 'Giảm số lượng', increase: 'Tăng số lượng', adjustQuantity: 'Điều chỉnh số lượng', historyTitle: 'Lịch sử', historySubtitle: 'Lịch sử dịch ảnh', newTranslation: 'Bắt đầu bản dịch mới', noHistory: 'Chưa có lịch sử dịch', noHistoryHint: 'Lịch sử sẽ xuất hiện sau khi bạn chụp hoặc tải thực đơn.', translationPreview: 'Xem trước bản dịch', completedImages: 'ảnh đã xong', deleteHistory: 'Xóa bản ghi này', confirmDeleteHistory: 'Xóa bản ghi dịch này?' }),
    [TargetLanguage.Indonesian]: imageTranslationText({ title: 'Jepret & Terjemahkan', subtitle: 'Foto menu untuk langsung menerjemahkan', back: 'Kembali', cameraSettings: 'Pengaturan kamera', closeLanguageMenu: 'Tutup menu bahasa', cameraPreview: 'Pratinjau kamera', requestingCamera: 'Meminta izin kamera…', cameraUnavailable: 'Kamera tidak dapat dibuka', cameraPermissionHint: 'Izinkan kamera di Pengaturan sistem atau pilih foto dari galeri.', requestPermission: 'Minta izin lagi', chooseGallery: 'Pilih dari galeri', maxPhotos: 'Maks. 4 foto', selectedImage: 'Foto terpilih', removeImage: 'Hapus foto', capture: 'Ambil foto', upload: 'Unggah', startTranslation: 'Mulai terjemahan', originalMenu: 'Menu asli', translatedMenu: 'Menu terjemahan', panZoomHint: 'Seret untuk memindahkan · cubit／roda untuk memperbesar', queued: 'Menunggu pengenalan…', recognizing: 'Mengenali dan menerjemahkan…', retryImage: 'Coba foto ini lagi', partialNotice: 'Sebagian teks tidak dapat dikonfirmasi. Bandingkan dengan foto asli.', orderList: 'Daftar pesanan', orderListHint: 'Ketuk kotak terjemahan, lalu tekan + untuk menambah', orderListTitle: 'Daftar pesanan', closeOrderList: 'Tutup daftar pesanan', emptyOrderList: 'Kembali ke layar terjemahan dan tekan + pada item untuk menambah.', backToTranslation: 'Kembali ke terjemahan', decrease: 'Kurangi jumlah', increase: 'Tambah jumlah', adjustQuantity: 'Atur jumlah', historyTitle: 'Riwayat', historySubtitle: 'Riwayat terjemahan gambar', newTranslation: 'Mulai terjemahan baru', noHistory: 'Belum ada riwayat terjemahan', noHistoryHint: 'Riwayat muncul setelah Anda memotret atau mengunggah menu.', translationPreview: 'Pratinjau terjemahan', completedImages: 'gambar selesai', deleteHistory: 'Hapus riwayat ini', confirmDeleteHistory: 'Hapus riwayat terjemahan ini?' }),
    [TargetLanguage.French]: imageTranslationText({ title: 'Photo & traduction', subtitle: 'Photographiez le menu pour le traduire instantanément', back: 'Retour', cameraSettings: 'Réglages de l’appareil photo', closeLanguageMenu: 'Fermer le menu des langues', cameraPreview: 'Aperçu de la caméra', requestingCamera: 'Demande d’autorisation de caméra…', cameraUnavailable: 'Caméra indisponible', cameraPermissionHint: 'Autorisez la caméra dans les réglages système ou choisissez des photos dans la galerie.', requestPermission: 'Redemander l’autorisation', chooseGallery: 'Choisir dans la galerie', maxPhotos: '4 photos maximum', selectedImage: 'Image sélectionnée', removeImage: 'Supprimer l’image', capture: 'Prendre une photo', upload: 'Importer', startTranslation: 'Traduire', originalMenu: 'Menu original', translatedMenu: 'Menu traduit', panZoomHint: 'Glisser pour déplacer · pincer／molette pour zoomer', queued: 'En attente de reconnaissance…', recognizing: 'Reconnaissance et traduction…', retryImage: 'Réessayer cette image', partialNotice: 'Certains textes n’ont pas pu être confirmés. Comparez avec l’image originale.', orderList: 'Liste de commande', orderListHint: 'Touchez une traduction puis appuyez sur + pour l’ajouter', orderListTitle: 'Liste de commande', closeOrderList: 'Fermer la liste', emptyOrderList: 'Revenez à la traduction et appuyez sur + sur un article pour l’ajouter.', backToTranslation: 'Retour à la traduction', decrease: 'Diminuer la quantité', increase: 'Augmenter la quantité', adjustQuantity: 'Modifier la quantité', historyTitle: 'Historique', historySubtitle: 'Historique des traductions d’images', newTranslation: 'Nouvelle traduction', noHistory: 'Aucun historique', noHistoryHint: 'Vos traductions apparaîtront ici après une photo ou un import.', translationPreview: 'Aperçu de la traduction', completedImages: 'images terminées', deleteHistory: 'Supprimer cet historique', confirmDeleteHistory: 'Supprimer cet historique de traduction ?' }),
    [TargetLanguage.Spanish]: imageTranslationText({ title: 'Foto y traducción', subtitle: 'Fotografía el menú y tradúcelo al instante', back: 'Atrás', cameraSettings: 'Ajustes de cámara', closeLanguageMenu: 'Cerrar menú de idiomas', cameraPreview: 'Vista previa de cámara', requestingCamera: 'Solicitando permiso de cámara…', cameraUnavailable: 'No se puede abrir la cámara', cameraPermissionHint: 'Permite la cámara en Ajustes del sistema o elige fotos de la galería.', requestPermission: 'Solicitar permiso de nuevo', chooseGallery: 'Elegir de la galería', maxPhotos: 'Hasta 4 fotos', selectedImage: 'Imagen seleccionada', removeImage: 'Eliminar imagen', capture: 'Tomar foto', upload: 'Subir', startTranslation: 'Traducir', originalMenu: 'Menú original', translatedMenu: 'Menú traducido', panZoomHint: 'Arrastra para mover · pellizca／rueda para ampliar', queued: 'Esperando reconocimiento…', recognizing: 'Reconociendo y traduciendo…', retryImage: 'Reintentar esta imagen', partialNotice: 'No se pudo confirmar parte del texto. Compáralo con la imagen original.', orderList: 'Lista de pedido', orderListHint: 'Toca un recuadro y pulsa + para añadirlo', orderListTitle: 'Lista de pedido', closeOrderList: 'Cerrar lista de pedido', emptyOrderList: 'Vuelve a la traducción y pulsa + en un artículo para añadirlo.', backToTranslation: 'Volver a la traducción', decrease: 'Reducir cantidad', increase: 'Aumentar cantidad', adjustQuantity: 'Ajustar cantidad', historyTitle: 'Historial', historySubtitle: 'Historial de traducciones de imágenes', newTranslation: 'Iniciar nueva traducción', noHistory: 'Aún no hay historial', noHistoryHint: 'Tus traducciones aparecerán aquí después de fotografiar o subir un menú.', translationPreview: 'Vista previa de traducción', completedImages: 'imágenes completadas', deleteHistory: 'Eliminar este registro', confirmDeleteHistory: '¿Eliminar este registro de traducción?' }),
    [TargetLanguage.English]: ONE_TAP_ENGLISH,
    [TargetLanguage.Filipino]: imageTranslationText({ title: 'Kuha at Isalin', subtitle: 'Kuhanan ng larawan ang menu para agad isalin', back: 'Bumalik', cameraSettings: 'Mga setting ng camera', closeLanguageMenu: 'Isara ang menu ng wika', cameraPreview: 'Preview ng camera', requestingCamera: 'Humihingi ng pahintulot sa camera…', cameraUnavailable: 'Hindi mabuksan ang camera', cameraPermissionHint: 'Payagan ang camera sa system settings o pumili ng larawan mula sa gallery.', requestPermission: 'Humingi ulit ng pahintulot', chooseGallery: 'Pumili mula sa gallery', maxPhotos: 'Hanggang 4 na larawan', selectedImage: 'Napiling larawan', removeImage: 'Alisin ang larawan', capture: 'Kumuha ng larawan', upload: 'Mag-upload', startTranslation: 'Isalin', originalMenu: 'Orihinal na menu', translatedMenu: 'Isinaling menu', panZoomHint: 'I-drag para ilipat · pinch／wheel para mag-zoom', queued: 'Naghihintay ng pagkilala…', recognizing: 'Kinikilala at isinasalin…', retryImage: 'Subukan muli ang larawang ito', partialNotice: 'May tekstong hindi nakumpirma. Ihambing sa orihinal na larawan.', orderList: 'Listahan ng order', orderListHint: 'I-tap ang translation box, saka pindutin ang + para idagdag', orderListTitle: 'Listahan ng order', closeOrderList: 'Isara ang listahan', emptyOrderList: 'Bumalik sa translation screen at pindutin ang + sa item para idagdag.', backToTranslation: 'Bumalik sa translation', decrease: 'Bawasan ang dami', increase: 'Dagdagan ang dami', adjustQuantity: 'Ayusin ang dami', historyTitle: 'Kasaysayan', historySubtitle: 'Mga tala ng pagsasalin ng larawan', newTranslation: 'Bagong pagsasalin', noHistory: 'Wala pang tala', noHistoryHint: 'Lalabas dito ang mga tala pagkatapos mong kumuha o mag-upload ng menu.', translationPreview: 'Preview ng pagsasalin', completedImages: 'larawang kumpleto', deleteHistory: 'Tanggalin ang tala', confirmDeleteHistory: 'Tanggalin ang tala ng pagsasaling ito?' }),
    [TargetLanguage.German]: imageTranslationText({ title: 'Foto & Übersetzung', subtitle: 'Menü fotografieren und sofort übersetzen', back: 'Zurück', cameraSettings: 'Kameraeinstellungen', closeLanguageMenu: 'Sprachmenü schließen', cameraPreview: 'Kameravorschau', requestingCamera: 'Kameraberechtigung wird angefordert…', cameraUnavailable: 'Kamera nicht verfügbar', cameraPermissionHint: 'Erlauben Sie den Kamerazugriff in den Systemeinstellungen oder wählen Sie Bilder aus der Galerie.', requestPermission: 'Berechtigung erneut anfordern', chooseGallery: 'Aus Galerie wählen', maxPhotos: 'Bis zu 4 Fotos', selectedImage: 'Ausgewähltes Bild', removeImage: 'Bild entfernen', capture: 'Foto aufnehmen', upload: 'Hochladen', startTranslation: 'Übersetzen', originalMenu: 'Originalmenü', translatedMenu: 'Übersetztes Menü', panZoomHint: 'Ziehen zum Verschieben · Pinch／Rad zum Zoomen', queued: 'Warten auf Erkennung…', recognizing: 'Erkennung und Übersetzung…', retryImage: 'Dieses Bild erneut versuchen', partialNotice: 'Einige Texte konnten nicht bestätigt werden. Vergleichen Sie das Originalbild.', orderList: 'Bestellliste', orderListHint: 'Übersetzungsfeld antippen und mit + hinzufügen', orderListTitle: 'Bestellliste', closeOrderList: 'Bestellliste schließen', emptyOrderList: 'Zur Übersetzung zurückkehren und bei einem Artikel + drücken.', backToTranslation: 'Zur Übersetzung', decrease: 'Menge verringern', increase: 'Menge erhöhen', adjustQuantity: 'Menge anpassen', historyTitle: 'Verlauf', historySubtitle: 'Bildübersetzungsverlauf', newTranslation: 'Neue Übersetzung starten', noHistory: 'Noch kein Verlauf', noHistoryHint: 'Ihre Übersetzungen erscheinen hier nach dem Fotografieren oder Hochladen eines Menüs.', translationPreview: 'Übersetzungsvorschau', completedImages: 'Bilder abgeschlossen', deleteHistory: 'Diesen Eintrag löschen', confirmDeleteHistory: 'Diesen Übersetzungseintrag löschen?' }),
    [TargetLanguage.Russian]: imageTranslationText({ title: 'Сними и переведи', subtitle: 'Сфотографируйте меню для мгновенного перевода', back: 'Назад', cameraSettings: 'Настройки камеры', closeLanguageMenu: 'Закрыть меню языков', cameraPreview: 'Предпросмотр камеры', requestingCamera: 'Запрашивается доступ к камере…', cameraUnavailable: 'Не удаётся открыть камеру', cameraPermissionHint: 'Разрешите камеру в системных настройках или выберите фото из галереи.', requestPermission: 'Запросить доступ снова', chooseGallery: 'Выбрать из галереи', maxPhotos: 'До 4 фото', selectedImage: 'Выбранное фото', removeImage: 'Удалить фото', capture: 'Снять фото', upload: 'Загрузить', startTranslation: 'Перевести', originalMenu: 'Оригинальное меню', translatedMenu: 'Переведённое меню', panZoomHint: 'Перетаскивайте для перемещения · щипок／колесо для масштаба', queued: 'Ожидание распознавания…', recognizing: 'Распознавание и перевод…', retryImage: 'Повторить для этого фото', partialNotice: 'Не весь текст удалось подтвердить. Сравните с оригиналом.', orderList: 'Список заказа', orderListHint: 'Нажмите поле перевода, затем + для добавления', orderListTitle: 'Список заказа', closeOrderList: 'Закрыть список', emptyOrderList: 'Вернитесь к переводу и нажмите + у блюда, чтобы добавить его.', backToTranslation: 'К переводу', decrease: 'Уменьшить количество', increase: 'Увеличить количество', adjustQuantity: 'Изменить количество', historyTitle: 'История', historySubtitle: 'История перевода изображений', newTranslation: 'Начать новый перевод', noHistory: 'Истории переводов пока нет', noHistoryHint: 'Здесь появятся записи после съёмки или загрузки меню.', translationPreview: 'Предпросмотр перевода', completedImages: 'изображений готово', deleteHistory: 'Удалить запись', confirmDeleteHistory: 'Удалить эту запись перевода?' }),
    [TargetLanguage.Polish]: imageTranslationText({ title: 'Zrób zdjęcie i przetłumacz', subtitle: 'Zrób zdjęcie menu, aby od razu je przetłumaczyć', back: 'Wstecz', cameraSettings: 'Ustawienia aparatu', closeLanguageMenu: 'Zamknij menu języka', cameraPreview: 'Podgląd aparatu', requestingCamera: 'Prośba o dostęp do aparatu…', cameraUnavailable: 'Nie można otworzyć aparatu', cameraPermissionHint: 'Zezwól na aparat w ustawieniach systemu lub wybierz zdjęcia z galerii.', requestPermission: 'Poproś o dostęp ponownie', chooseGallery: 'Wybierz z galerii', maxPhotos: 'Do 4 zdjęć', selectedImage: 'Wybrane zdjęcie', removeImage: 'Usuń zdjęcie', capture: 'Zrób zdjęcie', upload: 'Prześlij', startTranslation: 'Tłumacz', originalMenu: 'Oryginalne menu', translatedMenu: 'Przetłumaczone menu', panZoomHint: 'Przeciągnij, aby przesunąć · uszczypnij／kółko, aby powiększyć', queued: 'Oczekiwanie na rozpoznanie…', recognizing: 'Rozpoznawanie i tłumaczenie…', retryImage: 'Spróbuj ponownie', partialNotice: 'Nie udało się potwierdzić części tekstu. Porównaj z oryginałem.', orderList: 'Lista zamówienia', orderListHint: 'Dotknij pola tłumaczenia i naciśnij +, aby dodać', orderListTitle: 'Lista zamówienia', closeOrderList: 'Zamknij listę', emptyOrderList: 'Wróć do tłumaczenia i naciśnij + przy pozycji, aby ją dodać.', backToTranslation: 'Wróć do tłumaczenia', decrease: 'Zmniejsz ilość', increase: 'Zwiększ ilość', adjustQuantity: 'Dostosuj ilość', historyTitle: 'Historia', historySubtitle: 'Historia tłumaczeń obrazów', newTranslation: 'Nowe tłumaczenie', noHistory: 'Brak historii tłumaczeń', noHistoryHint: 'Historia pojawi się po zrobieniu lub przesłaniu zdjęcia menu.', translationPreview: 'Podgląd tłumaczenia', completedImages: 'ukończonych zdjęć', deleteHistory: 'Usuń wpis', confirmDeleteHistory: 'Usunąć ten wpis tłumaczenia?' }),
    [TargetLanguage.Malay]: imageTranslationText({ title: 'Tangkap & Terjemah', subtitle: 'Ambil gambar menu untuk terjemahan segera', back: 'Kembali', cameraSettings: 'Tetapan kamera', closeLanguageMenu: 'Tutup menu bahasa', cameraPreview: 'Pratonton kamera', requestingCamera: 'Meminta kebenaran kamera…', cameraUnavailable: 'Kamera tidak tersedia', cameraPermissionHint: 'Benarkan kamera dalam Tetapan sistem atau pilih foto dari galeri.', requestPermission: 'Minta kebenaran lagi', chooseGallery: 'Pilih dari galeri', maxPhotos: 'Maksimum 4 foto', selectedImage: 'Foto dipilih', removeImage: 'Buang foto', capture: 'Ambil foto', upload: 'Muat naik', startTranslation: 'Terjemah', originalMenu: 'Menu asal', translatedMenu: 'Menu terjemahan', panZoomHint: 'Seret untuk alih · cubit／roda untuk zum', queued: 'Menunggu pengecaman…', recognizing: 'Mengecam dan menterjemah…', retryImage: 'Cuba foto ini lagi', partialNotice: 'Sebahagian teks tidak dapat disahkan. Bandingkan dengan foto asal.', orderList: 'Senarai pesanan', orderListHint: 'Ketik kotak terjemahan, kemudian tekan + untuk menambah', orderListTitle: 'Senarai pesanan', closeOrderList: 'Tutup senarai pesanan', emptyOrderList: 'Kembali ke skrin terjemahan dan tekan + pada item untuk menambah.', backToTranslation: 'Kembali ke terjemahan', decrease: 'Kurangkan kuantiti', increase: 'Tambah kuantiti', adjustQuantity: 'Laraskan kuantiti', historyTitle: 'Sejarah', historySubtitle: 'Rekod terjemahan imej', newTranslation: 'Mulakan terjemahan baharu', noHistory: 'Belum ada rekod terjemahan', noHistoryHint: 'Rekod akan muncul selepas anda mengambil atau memuat naik menu.', translationPreview: 'Pratonton terjemahan', completedImages: 'foto selesai', deleteHistory: 'Padam rekod ini', confirmDeleteHistory: 'Padam rekod terjemahan ini?' }),
    [TargetLanguage.Italian]: imageTranslationText({ title: 'Scatta e traduci', subtitle: 'Fotografa il menu e traducilo subito', back: 'Indietro', cameraSettings: 'Impostazioni fotocamera', closeLanguageMenu: 'Chiudi menu lingue', cameraPreview: 'Anteprima fotocamera', requestingCamera: 'Richiesta autorizzazione fotocamera…', cameraUnavailable: 'Fotocamera non disponibile', cameraPermissionHint: 'Consenti la fotocamera nelle impostazioni di sistema o scegli foto dalla galleria.', requestPermission: 'Richiedi di nuovo l’autorizzazione', chooseGallery: 'Scegli dalla galleria', maxPhotos: 'Massimo 4 foto', selectedImage: 'Immagine selezionata', removeImage: 'Rimuovi immagine', capture: 'Scatta foto', upload: 'Carica', startTranslation: 'Traduci', originalMenu: 'Menu originale', translatedMenu: 'Menu tradotto', panZoomHint: 'Trascina per spostare · pizzica／rotella per zoomare', queued: 'In attesa del riconoscimento…', recognizing: 'Riconoscimento e traduzione…', retryImage: 'Riprova questa immagine', partialNotice: 'Parte del testo non è stata confermata. Confronta con l’originale.', orderList: 'Lista ordine', orderListHint: 'Tocca il riquadro e premi + per aggiungerlo', orderListTitle: 'Lista ordine', closeOrderList: 'Chiudi lista ordine', emptyOrderList: 'Torna alla traduzione e premi + su un elemento per aggiungerlo.', backToTranslation: 'Torna alla traduzione', decrease: 'Diminuisci quantità', increase: 'Aumenta quantità', adjustQuantity: 'Modifica quantità', historyTitle: 'Cronologia', historySubtitle: 'Cronologia traduzioni immagini', newTranslation: 'Nuova traduzione', noHistory: 'Nessuna cronologia', noHistoryHint: 'Le traduzioni appariranno qui dopo aver fotografato o caricato un menu.', translationPreview: 'Anteprima traduzione', completedImages: 'immagini completate', deleteHistory: 'Elimina questo record', confirmDeleteHistory: 'Eliminare questo record di traduzione?' }),
    [TargetLanguage.Portuguese]: imageTranslationText({ title: 'Fotografe e traduza', subtitle: 'Fotografe o menu para traduzí-lo na hora', back: 'Voltar', cameraSettings: 'Definições da câmara', closeLanguageMenu: 'Fechar menu de idiomas', cameraPreview: 'Pré-visualização da câmara', requestingCamera: 'A pedir permissão da câmara…', cameraUnavailable: 'Não foi possível abrir a câmara', cameraPermissionHint: 'Permita o acesso à câmara nas definições do sistema ou escolha fotos da galeria.', requestPermission: 'Pedir permissão novamente', chooseGallery: 'Escolher da galeria', maxPhotos: 'Até 4 fotos', selectedImage: 'Imagem selecionada', removeImage: 'Remover imagem', capture: 'Tirar foto', upload: 'Carregar', startTranslation: 'Traduzir', originalMenu: 'Menu original', translatedMenu: 'Menu traduzido', panZoomHint: 'Arraste para mover · pince／roda para ampliar', queued: 'A aguardar reconhecimento…', recognizing: 'A reconhecer e traduzir…', retryImage: 'Tentar esta imagem novamente', partialNotice: 'Não foi possível confirmar algum texto. Compare com a imagem original.', orderList: 'Lista de pedidos', orderListHint: 'Toque na caixa e prima + para adicionar', orderListTitle: 'Lista de pedidos', closeOrderList: 'Fechar lista de pedidos', emptyOrderList: 'Volte à tradução e prima + num item para o adicionar.', backToTranslation: 'Voltar à tradução', decrease: 'Diminuir quantidade', increase: 'Aumentar quantidade', adjustQuantity: 'Ajustar quantidade', historyTitle: 'Histórico', historySubtitle: 'Histórico de traduções de imagens', newTranslation: 'Nova tradução', noHistory: 'Ainda não há histórico', noHistoryHint: 'O histórico aparece depois de fotografar ou carregar um menu.', translationPreview: 'Pré-visualização da tradução', completedImages: 'imagens concluídas', deleteHistory: 'Eliminar este registo', confirmDeleteHistory: 'Eliminar este registo de tradução?' }),
};

const IMAGE_TRANSLATION_MESSAGE_OVERRIDES: Partial<Record<TargetLanguage, Partial<ImageTranslationUIText>>> = {
    [TargetLanguage.ChineseTW]: { offline: '請確認網路連線。', preparingImages: '正在準備圖片…', imageReadFailed: '圖片讀取失敗。', recognitionFailed: '圖片辨識失敗，請稍後重試。', quotaExceeded: '目前翻譯額度不足，請稍後再試。', noTextFound: '找不到清楚文字，請靠近或換一張更清楚的照片。', aiNoResult: 'AI 沒有回傳圖片辨識結果，請重試。' },
    [TargetLanguage.ChineseHK]: { offline: '請確認網絡連線。', preparingImages: '正在準備圖片…', imageReadFailed: '圖片讀取失敗。', recognitionFailed: '圖片辨識失敗，請稍後重試。', quotaExceeded: '目前翻譯額度不足，請稍後再試。', noTextFound: '找不到清晰文字，請靠近或換一張更清晰的相片。', aiNoResult: 'AI 沒有回傳圖片辨識結果，請重試。' },
    [TargetLanguage.Japanese]: { offline: 'インターネット接続を確認してください。', preparingImages: '画像を準備中…', imageReadFailed: '画像を読み込めませんでした。', recognitionFailed: '画像認識に失敗しました。もう一度お試しください。', quotaExceeded: '翻訳上限に達しました。しばらくしてからお試しください。', noTextFound: '明瞭な文字が見つかりません。近づいて、より鮮明に撮影してください。', aiNoResult: 'AIから認識結果が返りませんでした。もう一度お試しください。' },
    [TargetLanguage.Korean]: { offline: '인터넷 연결을 확인하세요.', preparingImages: '이미지 준비 중…', imageReadFailed: '이미지를 읽을 수 없습니다.', recognitionFailed: '이미지 인식에 실패했습니다. 다시 시도하세요.', quotaExceeded: '번역 한도에 도달했습니다. 잠시 후 다시 시도하세요.', noTextFound: '선명한 텍스트를 찾지 못했습니다. 더 가까이, 선명하게 촬영하세요.', aiNoResult: 'AI가 인식 결과를 반환하지 않았습니다. 다시 시도하세요.' },
    [TargetLanguage.Thai]: { offline: 'โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต', preparingImages: 'กำลังเตรียมรูปภาพ…', imageReadFailed: 'อ่านรูปภาพไม่ได้', recognitionFailed: 'รู้จำรูปภาพไม่สำเร็จ โปรดลองอีกครั้ง', quotaExceeded: 'ถึงขีดจำกัดการแปลแล้ว โปรดลองภายหลัง', noTextFound: 'ไม่พบข้อความที่ชัดเจน โปรดถ่ายให้ใกล้และชัดขึ้น', aiNoResult: 'AI ไม่ส่งผลการรู้จำภาพ โปรดลองอีกครั้ง' },
    [TargetLanguage.Vietnamese]: { offline: 'Vui lòng kiểm tra kết nối Internet.', preparingImages: 'Đang chuẩn bị hình ảnh…', imageReadFailed: 'Không thể đọc hình ảnh.', recognitionFailed: 'Nhận dạng hình ảnh không thành công. Vui lòng thử lại.', quotaExceeded: 'Đã đạt giới hạn dịch. Vui lòng thử lại sau.', noTextFound: 'Không tìm thấy văn bản rõ ràng. Hãy chụp gần hơn và rõ hơn.', aiNoResult: 'AI không trả về kết quả nhận dạng hình ảnh. Vui lòng thử lại.' },
    [TargetLanguage.Indonesian]: { offline: 'Periksa koneksi internet Anda.', preparingImages: 'Menyiapkan gambar…', imageReadFailed: 'Gambar tidak dapat dibaca.', recognitionFailed: 'Pengenalan gambar gagal. Silakan coba lagi.', quotaExceeded: 'Batas terjemahan tercapai. Coba lagi nanti.', noTextFound: 'Tidak menemukan teks yang jelas. Ambil foto lebih dekat dan jelas.', aiNoResult: 'AI tidak mengembalikan hasil pengenalan gambar. Silakan coba lagi.' },
    [TargetLanguage.French]: { offline: 'Veuillez vérifier votre connexion Internet.', preparingImages: 'Préparation des images…', imageReadFailed: 'Impossible de lire l’image.', recognitionFailed: 'Échec de la reconnaissance de l’image. Réessayez.', quotaExceeded: 'Limite de traduction atteinte. Réessayez plus tard.', noTextFound: 'Aucun texte lisible trouvé. Prenez une photo plus proche et plus nette.', aiNoResult: 'L’IA n’a renvoyé aucun résultat de reconnaissance. Réessayez.' },
    [TargetLanguage.Spanish]: { offline: 'Comprueba la conexión a Internet.', preparingImages: 'Preparando imágenes…', imageReadFailed: 'No se pudo leer la imagen.', recognitionFailed: 'La detección de imagen falló. Inténtalo de nuevo.', quotaExceeded: 'Se alcanzó el límite de traducciones. Inténtalo más tarde.', noTextFound: 'No se encontró texto claro. Toma una foto más cercana y nítida.', aiNoResult: 'La IA no devolvió un resultado de reconocimiento. Inténtalo de nuevo.' },
    [TargetLanguage.Filipino]: { offline: 'Pakisuri ang koneksyon sa internet.', preparingImages: 'Inihahanda ang mga larawan…', imageReadFailed: 'Hindi mabasa ang larawan.', recognitionFailed: 'Hindi nakilala ang larawan. Subukan muli.', quotaExceeded: 'Naabot na ang limitasyon ng pagsasalin. Subukan muli mamaya.', noTextFound: 'Walang malinaw na teksto. Kumuha ng mas malapit at malinaw na larawan.', aiNoResult: 'Walang ibinalik na resulta ng pagkilala ng larawan ang AI. Subukan muli.' },
    [TargetLanguage.German]: { offline: 'Bitte prüfen Sie Ihre Internetverbindung.', preparingImages: 'Bilder werden vorbereitet…', imageReadFailed: 'Das Bild konnte nicht gelesen werden.', recognitionFailed: 'Die Bilderkennung ist fehlgeschlagen. Bitte erneut versuchen.', quotaExceeded: 'Übersetzungslimit erreicht. Bitte später erneut versuchen.', noTextFound: 'Kein klarer Text gefunden. Bitte näher und schärfer fotografieren.', aiNoResult: 'Die KI hat kein Bilderkennungsergebnis zurückgegeben. Bitte erneut versuchen.' },
    [TargetLanguage.Russian]: { offline: 'Проверьте подключение к интернету.', preparingImages: 'Подготовка изображений…', imageReadFailed: 'Не удалось прочитать изображение.', recognitionFailed: 'Не удалось распознать изображение. Попробуйте ещё раз.', quotaExceeded: 'Достигнут лимит переводов. Попробуйте позже.', noTextFound: 'Чёткий текст не найден. Снимите ближе и чётче.', aiNoResult: 'ИИ не вернул результат распознавания изображения. Попробуйте ещё раз.' },
    [TargetLanguage.Polish]: { offline: 'Sprawdź połączenie z internetem.', preparingImages: 'Przygotowywanie obrazów…', imageReadFailed: 'Nie można odczytać obrazu.', recognitionFailed: 'Rozpoznawanie obrazu nie powiodło się. Spróbuj ponownie.', quotaExceeded: 'Osiągnięto limit tłumaczeń. Spróbuj ponownie później.', noTextFound: 'Nie znaleziono wyraźnego tekstu. Zrób bliższe i wyraźniejsze zdjęcie.', aiNoResult: 'AI nie zwróciło wyniku rozpoznawania obrazu. Spróbuj ponownie.' },
    [TargetLanguage.Malay]: { offline: 'Sila semak sambungan internet.', preparingImages: 'Menyediakan imej…', imageReadFailed: 'Tidak dapat membaca imej.', recognitionFailed: 'Pengecaman imej gagal. Sila cuba lagi.', quotaExceeded: 'Had terjemahan dicapai. Sila cuba lagi kemudian.', noTextFound: 'Tiada teks jelas ditemui. Ambil gambar yang lebih dekat dan jelas.', aiNoResult: 'AI tidak mengembalikan hasil pengecaman imej. Sila cuba lagi.' },
    [TargetLanguage.Italian]: { offline: 'Controlla la connessione Internet.', preparingImages: 'Preparazione delle immagini…', imageReadFailed: 'Impossibile leggere l’immagine.', recognitionFailed: 'Riconoscimento immagine non riuscito. Riprova.', quotaExceeded: 'Limite di traduzione raggiunto. Riprova più tardi.', noTextFound: 'Nessun testo nitido trovato. Scatta una foto più ravvicinata e nitida.', aiNoResult: 'L’IA non ha restituito un risultato di riconoscimento. Riprova.' },
    [TargetLanguage.Portuguese]: { offline: 'Verifique a ligação à Internet.', preparingImages: 'A preparar as imagens…', imageReadFailed: 'Não foi possível ler a imagem.', recognitionFailed: 'Falha no reconhecimento da imagem. Tente novamente.', quotaExceeded: 'Limite de traduções atingido. Tente novamente mais tarde.', noTextFound: 'Não foi encontrado texto nítido. Tire uma foto mais próxima e nítida.', aiNoResult: 'A IA não devolveu um resultado de reconhecimento. Tente novamente.' },
};

export const getImageTranslationUIText = (lang: TargetLanguage): ImageTranslationUIText => {
    const base = IMAGE_TRANSLATION_UI[lang] || IMAGE_TRANSLATION_UI[TargetLanguage.English];
    return { ...base, ...(IMAGE_TRANSLATION_MESSAGE_OVERRIDES[lang] || {}) };
};
