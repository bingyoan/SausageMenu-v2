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
];

// UI 翻譯字典
export const UI_TRANSLATIONS: Record<TargetLanguage, {
    // Header
    proUnlimited: string;
    freeMode: string;

    // Main Content
    translateTo: string;
    handwritingMode: string;
    handwritingDesc: string;
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
}> = {
    [TargetLanguage.ChineseTW]: {
        proUnlimited: 'PRO 無限制',
        freeMode: '免費模式',
        translateTo: '翻譯成',
        handwritingMode: '手寫模式',
        handwritingDesc: '適用於書法和直式文字',
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
    },
    [TargetLanguage.ChineseHK]: {
        proUnlimited: 'PRO 無限制',
        freeMode: '免費模式',
        translateTo: '翻譯成',
        handwritingMode: '手寫模式',
        handwritingDesc: '適用於書法和直式文字',
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
    },
    [TargetLanguage.Japanese]: {
        proUnlimited: 'PRO 無制限',
        freeMode: '無料モード',
        translateTo: '翻訳先',
        handwritingMode: '手書きモード',
        handwritingDesc: '書道や縦書きテキスト用',
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
    },
    [TargetLanguage.Korean]: {
        proUnlimited: 'PRO 무제한',
        freeMode: '무료 모드',
        translateTo: '번역 언어',
        handwritingMode: '손글씨 모드',
        handwritingDesc: '서예 및 세로쓰기용',
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
    },
    [TargetLanguage.Thai]: {
        proUnlimited: 'PRO ไม่จำกัด',
        freeMode: 'โหมดฟรี',
        translateTo: 'แปลเป็น',
        handwritingMode: 'โหมดลายมือ',
        handwritingDesc: 'สำหรับตัวอักษรแนวตั้ง',
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
    },
    [TargetLanguage.Vietnamese]: {
        proUnlimited: 'PRO Không giới hạn',
        freeMode: 'Chế độ miễn phí',
        translateTo: 'Dịch sang',
        handwritingMode: 'Chế độ viết tay',
        handwritingDesc: 'Cho chữ thư pháp và dọc',
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
    },
    [TargetLanguage.Indonesian]: {
        proUnlimited: 'PRO Tanpa Batas',
        freeMode: 'Mode Gratis',
        translateTo: 'Terjemahkan ke',
        handwritingMode: 'Mode Tulisan Tangan',
        handwritingDesc: 'Untuk kaligrafi & teks vertikal',
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
    },
    [TargetLanguage.French]: {
        proUnlimited: 'PRO Illimité',
        freeMode: 'Mode Gratuit',
        translateTo: 'Traduire en',
        handwritingMode: 'Mode Manuscrit',
        handwritingDesc: 'Pour calligraphie et texte vertical',
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
    },
    [TargetLanguage.Spanish]: {
        proUnlimited: 'PRO Ilimitado',
        freeMode: 'Modo Gratis',
        translateTo: 'Traducir a',
        handwritingMode: 'Modo Manuscrito',
        handwritingDesc: 'Para caligrafía y texto vertical',
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
    },
    [TargetLanguage.English]: {
        proUnlimited: 'PRO Unlimited',
        freeMode: 'Free Mode',
        translateTo: 'Translate to',
        handwritingMode: 'Handwriting Mode',
        handwritingDesc: 'For calligraphy & vertical text',
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
    },
    [TargetLanguage.Filipino]: {
        proUnlimited: 'PRO Walang Limitasyon',
        freeMode: 'Libreng Mode',
        translateTo: 'Isalin sa',
        handwritingMode: 'Handwriting Mode',
        handwritingDesc: 'Para sa calligraphy at vertical text',
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
    },
    [TargetLanguage.German]: {
        proUnlimited: 'PRO Unbegrenzt',
        freeMode: 'Kostenloser Modus',
        translateTo: 'Übersetzen nach',
        handwritingMode: 'Handschrift-Modus',
        handwritingDesc: 'Für Kalligrafie & vertikalen Text',
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
    },
    [TargetLanguage.Russian]: {
        proUnlimited: 'PRO Безлимит',
        freeMode: 'Бесплатный режим',
        translateTo: 'Перевести на',
        handwritingMode: 'Рукописный режим',
        handwritingDesc: 'Для каллиграфии и вертикального текста',
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
    },
};

// Helper function to get translations
export const getUIText = (lang: TargetLanguage) => {
    return UI_TRANSLATIONS[lang] || UI_TRANSLATIONS[TargetLanguage.English];
};
