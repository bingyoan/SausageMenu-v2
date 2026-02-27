import React, { useState } from 'react';
import { Key, ExternalLink, ArrowRight, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, X, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { SausageDogLogo, PawPrint } from './DachshundAssets';
import toast from 'react-hot-toast';

interface ApiKeyGateProps {
  onSave: (key: string) => void;
  selectedLanguage?: string;
}

// 多語言翻譯
const TRANSLATIONS: Record<string, {
  welcome: string;
  description: string;
  yourApiKey: string;
  placeholder: string;
  startBtn: string;
  keySafe: string;
  keySafeDesc: string;
  getKeyLink: string;
  errorEmpty: string;
  errorFormat: string;
  successMsg: string;
  tutorialTitle: string;
  tutorialSteps: string[];
  tutorialNote: string;
  tutorialImageBtn?: string;
}> = {
  '繁體中文': {
    welcome: '歡迎！',
    description: '要開始使用，您需要提供自己的 Google Gemini API Key（免費申請）。',
    yourApiKey: '您的 API 金鑰',
    placeholder: 'AIzaSy...',
    startBtn: '開始生成菜單',
    keySafe: '您的金鑰是安全的',
    keySafeDesc: '儲存在您的裝置上，直接傳送到 Google，無中間伺服器。',
    getKeyLink: '👉 點我前往申請免費 API Key',
    errorEmpty: '請輸入 API 金鑰',
    errorFormat: '格式無效。API Key 通常以 \'AIza\' 開頭。',
    successMsg: '歡迎使用香腸熱狗菜單夥伴！',
    tutorialTitle: '📖 不會申請？3 步驟教學',
    tutorialSteps: [
      '點下方藍色連結，前往 Google AI Studio',
      '用 Google 帳號登入，點「Create API Key」按鈕',
      '複製產生的 Key（以 AIza 開頭），貼到上方欄位即可',
    ],
    tutorialNote: '💡 完全免費，每日有免費額度可使用！',
  },
  '繁體中文-HK': {
    welcome: '歡迎！',
    description: '要開始使用，您需要提供自己的 Google Gemini API Key（免費申請）。',
    yourApiKey: '您的 API 金鑰',
    placeholder: 'AIzaSy...',
    startBtn: '開始生成菜單',
    keySafe: '您的金鑰是安全的',
    keySafeDesc: '儲存在您的裝置上，直接傳送到 Google，無中間伺服器。',
    getKeyLink: '👉 點我前往申請免費 API Key',
    errorEmpty: '請輸入 API 金鑰',
    errorFormat: '格式無效。API Key 通常以 \'AIza\' 開頭。',
    successMsg: '歡迎使用香腸熱狗菜單夥伴！',
    tutorialTitle: '📖 不會申請？3 步驟教學',
    tutorialSteps: [
      '點下方藍色連結，前往 Google AI Studio',
      '用 Google 帳號登入，點「Create API Key」按鈕',
      '複製產生的 Key（以 AIza 開頭），貼到上方欄位即可',
    ],
    tutorialNote: '💡 完全免費，每日有免費額度可使用！',
  },
  'English': {
    welcome: 'Welcome!',
    description: 'To get started, you need your own Google Gemini API Key (free to create).',
    yourApiKey: 'Your API Key',
    placeholder: 'AIzaSy...',
    startBtn: 'Start Ordering',
    keySafe: 'Your key is safe',
    keySafeDesc: 'Stored locally on your device, sent directly to Google. No middleman.',
    getKeyLink: '👉 Get a free API Key here',
    errorEmpty: 'Please enter an API Key.',
    errorFormat: "Invalid format. API Keys usually start with 'AIza'.",
    successMsg: 'Welcome to Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Need help? 3-step guide',
    tutorialSteps: [
      'Click the blue link below to go to Google AI Studio',
      'Sign in with Google, then click "Create API Key"',
      'Copy the generated key (starts with AIza) and paste it above',
    ],
    tutorialNote: '💡 Completely free! Daily free quota included.',
  },
  '日本語': {
    welcome: 'ようこそ！',
    description: '始めるには、Google Gemini API Key が必要です（無料で取得可能）。',
    yourApiKey: 'APIキー',
    placeholder: 'AIzaSy...',
    startBtn: '注文を開始',
    keySafe: 'キーは安全です',
    keySafeDesc: 'デバイスにローカル保存、Googleに直接送信。中間サーバー無し。',
    getKeyLink: '👉 無料のAPIキーを取得',
    errorEmpty: 'APIキーを入力してください',
    errorFormat: '無効な形式。APIキーは通常「AIza」で始まります。',
    successMsg: 'ソーセージドッグ メニューパルへようこそ！',
    tutorialTitle: '📖 申請方法 3ステップ',
    tutorialSteps: [
      '下のリンクから Google AI Studio へ移動',
      'Googleアカウントでログイン → 「Create API Key」をクリック',
      '生成されたKey（AIza開始）をコピーして上の欄に貼り付け',
    ],
    tutorialNote: '💡 完全無料！毎日の無料枠あり。',
  },
  '한국어': {
    welcome: '환영합니다!',
    description: '시작하려면 Google Gemini API 키가 필요합니다 (무료 생성 가능).',
    yourApiKey: 'API 키',
    placeholder: 'AIzaSy...',
    startBtn: '주문 시작',
    keySafe: '키는 안전합니다',
    keySafeDesc: '기기에 로컬 저장, Google로 직접 전송. 중간 서버 없음.',
    getKeyLink: '👉 무료 API 키 받기',
    errorEmpty: 'API 키를 입력하세요',
    errorFormat: '잘못된 형식. API 키는 \'AIza\'로 시작합니다.',
    successMsg: '소시지독 메뉴 팔에 오신 것을 환영합니다!',
    tutorialTitle: '📖 신청 방법 3단계',
    tutorialSteps: [
      '아래 파란 링크를 클릭하여 Google AI Studio로 이동',
      'Google 계정으로 로그인 → "Create API Key" 클릭',
      '생성된 Key (AIza로 시작)를 복사하여 위에 붙여넣기',
    ],
    tutorialNote: '💡 완전 무료! 매일 무료 할당량 포함.',
  },
  'Français': {
    welcome: 'Bienvenue !',
    description: 'Pour commencer, vous avez besoin d\'une clé API Google Gemini (gratuite).',
    yourApiKey: 'Votre clé API',
    placeholder: 'AIzaSy...',
    startBtn: 'Commencer',
    keySafe: 'Votre clé est sécurisée',
    keySafeDesc: 'Stockée localement, envoyée directement à Google. Pas de serveur intermédiaire.',
    getKeyLink: '👉 Obtenir une clé API gratuite',
    errorEmpty: 'Veuillez entrer une clé API',
    errorFormat: 'Format invalide. Les clés commencent par \'AIza\'.',
    successMsg: 'Bienvenue sur Sausage Dog Menu Pal !',
    tutorialTitle: '📖 Besoin d\'aide ? Guide en 3 étapes',
    tutorialSteps: [
      'Cliquez le lien bleu ci-dessous → Google AI Studio',
      'Connectez-vous avec Google → cliquez "Create API Key"',
      'Copiez la clé (commence par AIza) et collez ci-dessus',
    ],
    tutorialNote: '💡 Totalement gratuit ! Quota quotidien inclus.',
  },
  'Español': {
    welcome: '¡Bienvenido!',
    description: 'Para empezar necesitas tu propia clave API de Google Gemini (gratis).',
    yourApiKey: 'Tu clave API',
    placeholder: 'AIzaSy...',
    startBtn: 'Comenzar',
    keySafe: 'Tu clave está segura',
    keySafeDesc: 'Almacenada localmente, enviada directamente a Google. Sin intermediarios.',
    getKeyLink: '👉 Obtener clave API gratis',
    errorEmpty: 'Por favor ingresa una clave API',
    errorFormat: 'Formato inválido. Comienza con \'AIza\'.',
    successMsg: '¡Bienvenido a Sausage Dog Menu Pal!',
    tutorialTitle: '📖 ¿Necesitas ayuda? 3 pasos',
    tutorialSteps: [
      'Haz clic en el enlace azul → Google AI Studio',
      'Inicia sesión con Google → clic en "Create API Key"',
      'Copia la clave (empieza con AIza) y pégala arriba',
    ],
    tutorialNote: '💡 ¡Totalmente gratis! Cuota diaria incluida.',
  },
  'ไทย': {
    welcome: 'ยินดีต้อนรับ!',
    description: 'ต้องมี Google Gemini API Key ของคุณเอง (สมัครฟรี)',
    yourApiKey: 'API Key ของคุณ',
    placeholder: 'AIzaSy...',
    startBtn: 'เริ่มสั่งอาหาร',
    keySafe: 'คีย์ของคุณปลอดภัย',
    keySafeDesc: 'เก็บไว้ในเครื่อง ส่งตรงถึง Google ไม่มีเซิร์ฟเวอร์ตัวกลาง',
    getKeyLink: '👉 รับ API Key ฟรีที่นี่',
    errorEmpty: 'กรุณาใส่ API Key',
    errorFormat: 'รูปแบบไม่ถูกต้อง ต้องขึ้นต้นด้วย \'AIza\'',
    successMsg: 'ยินดีต้อนรับสู่ Sausage Dog Menu Pal!',
    tutorialTitle: '📖 ไม่แน่ใจ? สมัครง่าย 3 ขั้นตอน',
    tutorialSteps: [
      'กดลิงก์สีน้ำเงินด้านล่าง → ไปที่ Google AI Studio',
      'ล็อกอินด้วย Google → กด "Create API Key"',
      'คัดลอก Key (ขึ้นต้นด้วย AIza) แล้ววางในช่องด้านบน',
    ],
    tutorialNote: '💡 ฟรีสมบูรณ์! มีโควต้าฟรีทุกวัน',
  },
  'Tiếng Việt': {
    welcome: 'Chào mừng!',
    description: 'Để bắt đầu, bạn cần Google Gemini API Key (tạo miễn phí).',
    yourApiKey: 'API Key của bạn',
    placeholder: 'AIzaSy...',
    startBtn: 'Bắt đầu đặt món',
    keySafe: 'Key được bảo mật',
    keySafeDesc: 'Lưu trữ cục bộ, gửi trực tiếp đến Google. Không máy chủ trung gian.',
    getKeyLink: '👉 Nhận API Key miễn phí',
    errorEmpty: 'Vui lòng nhập API Key',
    errorFormat: 'Định dạng không hợp lệ. Bắt đầu bằng \'AIza\'.',
    successMsg: 'Chào mừng đến với Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Cần hướng dẫn? 3 bước đơn giản',
    tutorialSteps: [
      'Nhấn liên kết xanh bên dưới → Google AI Studio',
      'Đăng nhập Google → nhấn "Create API Key"',
      'Sao chép Key (bắt đầu bằng AIza) và dán vào ô phía trên',
    ],
    tutorialNote: '💡 Hoàn toàn miễn phí! Có hạn mức hàng ngày.',
  },
  'Deutsch': {
    welcome: 'Willkommen!',
    description: 'Um zu starten, benötigen Sie einen Google Gemini API-Schlüssel (kostenlos).',
    yourApiKey: 'Ihr API-Schlüssel',
    placeholder: 'AIzaSy...',
    startBtn: 'Bestellung starten',
    keySafe: 'Ihr Schlüssel ist sicher',
    keySafeDesc: 'Lokal gespeichert, direkt an Google gesendet. Keine Zwischenserver.',
    getKeyLink: '👉 Kostenlosen API-Schlüssel holen',
    errorEmpty: 'Bitte API-Schlüssel eingeben',
    errorFormat: 'Ungültiges Format. Beginnt mit \'AIza\'.',
    successMsg: 'Willkommen bei Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Hilfe? 3-Schritte-Anleitung',
    tutorialSteps: [
      'Klicken Sie den blauen Link → Google AI Studio',
      'Mit Google anmelden → "Create API Key" klicken',
      'Key kopieren (beginnt mit AIza) und oben einfügen',
    ],
    tutorialNote: '💡 Komplett kostenlos! Tägliches Gratis-Kontingent.',
  },
  'Русский': {
    welcome: 'Добро пожаловать!',
    description: 'Для начала нужен Google Gemini API ключ (бесплатный).',
    yourApiKey: 'Ваш API ключ',
    placeholder: 'AIzaSy...',
    startBtn: 'Начать заказ',
    keySafe: 'Ваш ключ в безопасности',
    keySafeDesc: 'Хранится локально, отправляется напрямую в Google. Без посредников.',
    getKeyLink: '👉 Получить бесплатный API ключ',
    errorEmpty: 'Введите API ключ',
    errorFormat: 'Неверный формат. Начинается с \'AIza\'.',
    successMsg: 'Добро пожаловать в Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Нужна помощь? 3 шага',
    tutorialSteps: [
      'Нажмите синюю ссылку ниже → Google AI Studio',
      'Войдите через Google → нажмите "Create API Key"',
      'Скопируйте ключ (начинается с AIza) и вставьте выше',
    ],
    tutorialNote: '💡 Полностью бесплатно! Ежедневная квота включена.',
  },
  'Tagalog': {
    welcome: 'Maligayang pagdating!',
    description: 'Para magsimula, kailangan mo ng Google Gemini API Key (libreng gumawa).',
    yourApiKey: 'Ang iyong API Key',
    placeholder: 'AIzaSy...',
    startBtn: 'Simulan',
    keySafe: 'Ligtas ang iyong key',
    keySafeDesc: 'Naka-imbak sa device mo, direktang ipinapadala sa Google. Walang middleman.',
    getKeyLink: '👉 Kumuha ng libreng API Key',
    errorEmpty: 'Maglagay ng API Key',
    errorFormat: 'Di-wastong format. Nagsisimula sa \'AIza\'.',
    successMsg: 'Maligayang pagdating sa Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Kailangan ng tulong? 3 hakbang',
    tutorialSteps: [
      'I-click ang asul na link → Google AI Studio',
      'Mag-sign in sa Google → i-click "Create API Key"',
      'Kopyahin ang Key (nagsisimula sa AIza) at i-paste sa itaas',
    ],
    tutorialNote: '💡 Libre! May libreng daily quota.',
  },
  'Bahasa Indonesia': {
    welcome: 'Selamat datang!',
    description: 'Untuk mulai, Anda perlu Google Gemini API Key (gratis dibuat).',
    yourApiKey: 'API Key Anda',
    placeholder: 'AIzaSy...',
    startBtn: 'Mulai Memesan',
    keySafe: 'Key Anda aman',
    keySafeDesc: 'Disimpan lokal, dikirim langsung ke Google. Tanpa server perantara.',
    getKeyLink: '👉 Dapatkan API Key gratis',
    errorEmpty: 'Masukkan API Key',
    errorFormat: 'Format tidak valid. Dimulai dengan \'AIza\'.',
    successMsg: 'Selamat datang di Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Butuh bantuan? 3 langkah mudah',
    tutorialSteps: [
      'Klik link biru di bawah → Google AI Studio',
      'Login dengan Google → klik "Create API Key"',
      'Salin Key (dimulai AIza) dan tempel di kolom atas',
    ],
    tutorialNote: '💡 Gratis! Kuota harian gratis tersedia.',
  },
  'Polski': {
    welcome: 'Witaj!',
    description: 'Aby zacząć, potrzebujesz klucza Google Gemini API (darmowy).',
    yourApiKey: 'Twój klucz API',
    placeholder: 'AIzaSy...',
    startBtn: 'Rozpocznij',
    keySafe: 'Twój klucz jest bezpieczny',
    keySafeDesc: 'Przechowywany lokalnie, wysyłany bezpośrednio do Google. Bez pośredników.',
    getKeyLink: '👉 Pobierz darmowy klucz API',
    errorEmpty: 'Wprowadź klucz API',
    errorFormat: 'Nieprawidłowy format. Zaczyna się od \'AIza\'.',
    successMsg: 'Witaj w Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Potrzebujesz pomocy? 3 kroki',
    tutorialSteps: [
      'Kliknij niebieski link → Google AI Studio',
      'Zaloguj się przez Google → kliknij "Create API Key"',
      'Skopiuj klucz (zaczyna się od AIza) i wklej powyżej',
    ],
    tutorialNote: '💡 Całkowicie za darmo! Dzienny limit gratis.',
  },
  'Bahasa Melayu': {
    welcome: '歡迎！',
    description: '要開始使用，您需要提供自己的 Google Gemini API Key（免費申請）。',
    yourApiKey: '您的 API 金鑰',
    placeholder: 'AIzaSy...',
    startBtn: '開始生成菜單',
    keySafe: '您的金鑰是安全的',
    keySafeDesc: '儲存在您的裝置上，直接傳送到 Google，無中間伺服器。',
    getKeyLink: '👉 點我前往申請免費 API Key',
    errorEmpty: '請輸入 API 金鑰',
    errorFormat: '格式無效。API Key 通常以 \'AIza\' 開頭。',
    successMsg: '歡迎使用香腸熱狗菜單夥伴！',
    tutorialTitle: '📖 不會申請？3 步驟教學',
    tutorialSteps: [
      '點下方藍色連結，前往 Google AI Studio',
      '用 Google 帳號登入，點「Create API Key」按鈕',
      '複製產生的 Key（以 AIza 開頭），貼到上方欄位即可',
    ],
    tutorialNote: '💡 完全免費，每日有免費額度可使用！',
  },
  'Italiano': {
    welcome: 'Benvenuto!',
    description: 'Per iniziare, hai bisogno della tua chiave API Google Gemini (gratuita).',
    yourApiKey: 'La tua Chiave API',
    placeholder: 'AIzaSy...',
    startBtn: 'Inizia a Ordinare',
    keySafe: 'La tua chiave è al sicuro',
    keySafeDesc: 'Memorizzata localmente sul tuo dispositivo, inviata direttamente a Google. Nessun intermediario.',
    getKeyLink: '👉 Ottieni una chiave API gratuita qui',
    errorEmpty: 'Inserisci una chiave API.',
    errorFormat: "Formato non valido. Le chiavi API di solito iniziano con 'AIza'.",
    successMsg: 'Benvenuto in Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Serve aiuto? Guida in 3 passi',
    tutorialSteps: [
      'Clicca sul link blu qui sotto per andare su Google AI Studio',
      'Accedi con Google, poi clicca su "Create API Key"',
      'Copia la chiave generata (inizia con AIza) e incollala qui sopra',
    ],
    tutorialNote: '💡 Completamente gratuito! Quota giornaliera gratuita inclusa.',
  },
  'Português': {
    welcome: 'Bem-vindo!',
    description: 'Para começar, você precisa fornecer sua própria Chave de API Google Gemini (gratuita).',
    yourApiKey: 'Sua Chave API',
    placeholder: 'AIzaSy...',
    startBtn: 'Começar a Pedir',
    keySafe: 'Sua chave está segura',
    keySafeDesc: 'Armazenada localmente no seu dispositivo, enviada diretamente para o Google. Sem intermediários.',
    getKeyLink: '👉 Obtenha uma Chave API gratuita aqui',
    errorEmpty: 'Por favor, insira uma Chave API.',
    errorFormat: "Formato inválido. Chaves API geralmente começam com 'AIza'.",
    successMsg: 'Bem-vindo ao Sausage Dog Menu Pal!',
    tutorialTitle: '📖 Precisa de ajuda? Guia em 3 passos',
    tutorialSteps: [
      'Clique no link azul abaixo para acessar o Google AI Studio',
      'Faça login com o Google, depois clique em "Create API Key"',
      'Copie a chave gerada (começa com AIza) e cole-a acima',
    ],
    tutorialNote: '💡 Totalmente gratuito! Cota diária gratuita inclusa.',
  },
};

export const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ onSave, selectedLanguage = 'English' }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true); // 自動彈出教學
  const [showGuideImage, setShowGuideImage] = useState(false); // 圖示解說 Modal

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS['English'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedKey = inputKey.trim();

    if (!cleanedKey) {
      setError(t.errorEmpty);
      return;
    }

    if (!cleanedKey.startsWith('AIza')) {
      setError(t.errorFormat);
      return;
    }

    localStorage.setItem('gemini_api_key', cleanedKey);
    onSave(cleanedKey);
    toast.success(t.successMsg);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-sausage-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <PawPrint className="absolute top-10 left-[-20px] w-32 h-32 text-sausage-100 rotate-[-15deg]" />
      <PawPrint className="absolute bottom-10 right-[-20px] w-48 h-48 text-sausage-100 rotate-[15deg]" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-sausage-100 relative z-10 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">

        <div className="flex flex-col items-center text-center mb-6">
          <SausageDogLogo className="w-32 h-20 mb-4" />
          <h1 className="text-3xl font-black text-sausage-900 mb-2">{t.welcome}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {t.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-sausage-800 uppercase tracking-wider ml-1">
              {t.yourApiKey}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="text-gray-400" size={18} />
              </div>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setError(null);
                }}
                placeholder={t.placeholder}
                className={`w-full pl-10 pr-12 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-sausage-100 transition-all font-mono text-sm ${error ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-sausage-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <div className="w-6 h-6 rounded-full border-[2.5px] border-blue-600 text-blue-600 flex items-center justify-center font-black text-[14px] hover:bg-blue-50 transition-colors shadow-sm">
                  ?
                </div>
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1 text-red-500 text-xs font-bold animate-pulse">
                <AlertCircle size={12} /> {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-sausage-600 hover:bg-sausage-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            {t.startBtn} <ArrowRight size={20} />
          </button>
        </form>

        {/* 彈出式教學區塊 Modal */}
        {showTutorial && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 isolate">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative z-50 animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10 hover:rotate-90 pointer-events-auto"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-5 mt-2">
                <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-2 opacity-90" />
                <h2 className="text-xl font-black text-gray-800">{t.tutorialTitle}</h2>
              </div>

              <div className="space-y-4">
                {t.tutorialSteps.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-sm font-black shadow-md mt-0.5 ml-2">
                      {i + 1}
                    </div>
                    <p className="text-sm font-bold text-gray-700 leading-snug pt-1">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-center relative z-50">
                <button
                  type="button"
                  onClick={() => setShowGuideImage(true)}
                  className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm pointer-events-auto group"
                >
                  <ImageIcon size={18} className="group-hover:scale-110 transition-transform" />
                  {t.tutorialImageBtn || '圖示解說'}
                </button>
              </div>

              <div className="mt-6 space-y-3 relative z-50">
                <p className="text-xs font-bold text-gray-500 text-center">{t.tutorialNote}</p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full relative z-[60] inline-flex items-center justify-center gap-2 text-sm font-black text-blue-600 bg-blue-50 border-2 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 py-3 rounded-xl transition-all shadow-sm active:scale-95 group select-none pointer-events-auto"
                >
                  {t.getKeyLink} <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 全螢幕圖片教學 Modal */}
        {showGuideImage && (
          <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 isolate">
            <button
              onClick={() => setShowGuideImage(false)}
              className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-50 pointer-events-auto"
            >
              <X size={32} />
            </button>
            <div className="relative w-full h-full max-w-lg flex items-center justify-center pointer-events-auto">
              <img
                src="/api_key_guide.jpg"
                alt="API Key Guide"
                className="max-w-full max-h-full object-contain rounded-xl animate-in zoom-in duration-300"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};