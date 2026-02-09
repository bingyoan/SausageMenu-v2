import React, { useState } from 'react';
import { Key, ExternalLink, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { SausageDogLogo, PawPrint } from './DachshundAssets';
import toast from 'react-hot-toast';

interface ApiKeyGateProps {
  onSave: (key: string) => void;
  selectedLanguage?: string;
}

// 多語言翻譯 - 支援所有 13 種語言
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
}> = {
  '繁體中文': {
    welcome: '歡迎！',
    description: '要開始使用香腸熱狗菜單夥伴，您需要提供自己的 Google Gemini API Key。',
    yourApiKey: '您的 API 金鑰',
    placeholder: 'AIzaSy...',
    startBtn: '開始使用',
    keySafe: '您的金鑰是安全的',
    keySafeDesc: '它儲存在您的裝置上（瀏覽器儲存），並直接傳送到 Google。沒有中間伺服器。',
    getKeyLink: '在這裡獲取免費 API Key',
    errorEmpty: '請輸入 API 金鑰',
    errorFormat: '格式無效。API Key 通常以 \'AIza\' 開頭。',
    successMsg: '歡迎使用香腸熱狗菜單夥伴！',
  },
  '繁體中文-HK': {
    welcome: '歡迎！',
    description: '要開始使用香腸熱狗菜單夥伴，您需要提供自己的 Google Gemini API Key。',
    yourApiKey: '您的 API 金鑰',
    placeholder: 'AIzaSy...',
    startBtn: '開始使用',
    keySafe: '您的金鑰是安全的',
    keySafeDesc: '它儲存在您的裝置上（瀏覽器儲存），並直接傳送到 Google。沒有中間伺服器。',
    getKeyLink: '在這裡獲取免費 API Key',
    errorEmpty: '請輸入 API 金鑰',
    errorFormat: '格式無效。API Key 通常以 \'AIza\' 開頭。',
    successMsg: '歡迎使用香腸熱狗菜單夥伴！',
  },
  'English': {
    welcome: 'Welcome!',
    description: 'To start using Sausage Dog Menu Pal, you need to provide your own Google Gemini API Key.',
    yourApiKey: 'Your API Key',
    placeholder: 'AIzaSy...',
    startBtn: 'Start Ordering',
    keySafe: 'Your key is safe',
    keySafeDesc: 'It is stored locally on your device (Browser Storage) and sent directly to Google. No middleman servers.',
    getKeyLink: 'Get a free API Key here',
    errorEmpty: 'Please enter an API Key.',
    errorFormat: "Invalid format. API Keys usually start with 'AIza'.",
    successMsg: 'Welcome to Sausage Dog Menu Pal!',
  },
  '日本語': {
    welcome: 'ようこそ！',
    description: 'ソーセージドッグ メニューパルを使用するには、Google Gemini API キーが必要です。',
    yourApiKey: 'APIキー',
    placeholder: 'AIzaSy...',
    startBtn: '注文を開始',
    keySafe: 'キーは安全です',
    keySafeDesc: 'キーはデバイスにローカル保存され、Googleに直接送信されます。中間サーバーはありません。',
    getKeyLink: '無料のAPIキーを取得',
    errorEmpty: 'APIキーを入力してください',
    errorFormat: '無効な形式です。APIキーは通常「AIza」で始まります。',
    successMsg: 'ソーセージドッグ メニューパルへようこそ！',
  },
  '한국어': {
    welcome: '환영합니다!',
    description: '소시지독 메뉴 팔을 사용하려면 Google Gemini API 키가 필요합니다.',
    yourApiKey: 'API 키',
    placeholder: 'AIzaSy...',
    startBtn: '주문 시작',
    keySafe: '키는 안전합니다',
    keySafeDesc: '키는 기기에 로컬로 저장되고 Google로 직접 전송됩니다. 중간 서버가 없습니다.',
    getKeyLink: '무료 API 키 받기',
    errorEmpty: 'API 키를 입력하세요',
    errorFormat: '잘못된 형식입니다. API 키는 일반적으로 \'AIza\'로 시작합니다.',
    successMsg: '소시지독 메뉴 팔에 오신 것을 환영합니다!',
  },
  'Français': {
    welcome: 'Bienvenue !',
    description: 'Pour utiliser Sausage Dog Menu Pal, vous devez fournir votre propre clé API Google Gemini.',
    yourApiKey: 'Votre clé API',
    placeholder: 'AIzaSy...',
    startBtn: 'Commencer',
    keySafe: 'Votre clé est sécurisée',
    keySafeDesc: 'Elle est stockée localement sur votre appareil et envoyée directement à Google. Pas de serveur intermédiaire.',
    getKeyLink: 'Obtenir une clé API gratuite',
    errorEmpty: 'Veuillez entrer une clé API',
    errorFormat: 'Format invalide. Les clés API commencent généralement par \'AIza\'.',
    successMsg: 'Bienvenue sur Sausage Dog Menu Pal !',
  },
  'Español': {
    welcome: '¡Bienvenido!',
    description: 'Para usar Sausage Dog Menu Pal, necesitas proporcionar tu propia clave API de Google Gemini.',
    yourApiKey: 'Tu clave API',
    placeholder: 'AIzaSy...',
    startBtn: 'Comenzar',
    keySafe: 'Tu clave está segura',
    keySafeDesc: 'Se almacena localmente en tu dispositivo y se envía directamente a Google. Sin servidores intermedios.',
    getKeyLink: 'Obtener una clave API gratis',
    errorEmpty: 'Por favor ingresa una clave API',
    errorFormat: 'Formato inválido. Las claves API suelen comenzar con \'AIza\'.',
    successMsg: '¡Bienvenido a Sausage Dog Menu Pal!',
  },
  'ไทย': {
    welcome: 'ยินดีต้อนรับ!',
    description: 'หากต้องการใช้ Sausage Dog Menu Pal คุณต้องระบุ Google Gemini API Key ของคุณเอง',
    yourApiKey: 'API Key ของคุณ',
    placeholder: 'AIzaSy...',
    startBtn: 'เริ่มสั่งอาหาร',
    keySafe: 'คีย์ของคุณปลอดภัย',
    keySafeDesc: 'จะถูกเก็บไว้ในเครื่องของคุณและส่งตรงไปยัง Google ไม่มีเซิร์ฟเวอร์ตัวกลาง',
    getKeyLink: 'รับ API Key ฟรีที่นี่',
    errorEmpty: 'กรุณาใส่ API Key',
    errorFormat: 'รูปแบบไม่ถูกต้อง API Key มักจะเริ่มต้นด้วย \'AIza\'',
    successMsg: 'ยินดีต้อนรับสู่ Sausage Dog Menu Pal!',
  },
  'Tiếng Việt': {
    welcome: 'Chào mừng!',
    description: 'Để sử dụng Sausage Dog Menu Pal, bạn cần cung cấp Google Gemini API Key của riêng mình.',
    yourApiKey: 'API Key của bạn',
    placeholder: 'AIzaSy...',
    startBtn: 'Bắt đầu đặt món',
    keySafe: 'Key của bạn được bảo mật',
    keySafeDesc: 'Nó được lưu trữ cục bộ trên thiết bị của bạn và gửi trực tiếp đến Google. Không có máy chủ trung gian.',
    getKeyLink: 'Nhận API Key miễn phí tại đây',
    errorEmpty: 'Vui lòng nhập API Key',
    errorFormat: 'Định dạng không hợp lệ. API Key thường bắt đầu bằng \'AIza\'.',
    successMsg: 'Chào mừng đến với Sausage Dog Menu Pal!',
  },
  'Deutsch': {
    welcome: 'Willkommen!',
    description: 'Um Sausage Dog Menu Pal zu verwenden, müssen Sie Ihren eigenen Google Gemini API-Schlüssel angeben.',
    yourApiKey: 'Ihr API-Schlüssel',
    placeholder: 'AIzaSy...',
    startBtn: 'Bestellung starten',
    keySafe: 'Ihr Schlüssel ist sicher',
    keySafeDesc: 'Er wird lokal auf Ihrem Gerät gespeichert und direkt an Google gesendet. Keine Zwischenserver.',
    getKeyLink: 'Holen Sie sich hier einen kostenlosen API-Schlüssel',
    errorEmpty: 'Bitte geben Sie einen API-Schlüssel ein',
    errorFormat: 'Ungültiges Format. API-Schlüssel beginnen normalerweise mit \'AIza\'.',
    successMsg: 'Willkommen bei Sausage Dog Menu Pal!',
  },
  'Русский': {
    welcome: 'Добро пожаловать!',
    description: 'Чтобы использовать Sausage Dog Menu Pal, вам нужен собственный Google Gemini API ключ.',
    yourApiKey: 'Ваш API ключ',
    placeholder: 'AIzaSy...',
    startBtn: 'Начать заказ',
    keySafe: 'Ваш ключ в безопасности',
    keySafeDesc: 'Он хранится локально на вашем устройстве и отправляется напрямую в Google. Никаких промежуточных серверов.',
    getKeyLink: 'Получите бесплатный API ключ здесь',
    errorEmpty: 'Пожалуйста, введите API ключ',
    errorFormat: 'Неверный формат. API ключи обычно начинаются с \'AIza\'.',
    successMsg: 'Добро пожаловать в Sausage Dog Menu Pal!',
  },
  'Tagalog': {
    welcome: 'Maligayang pagdating!',
    description: 'Para magamit ang Sausage Dog Menu Pal, kailangan mong magbigay ng sarili mong Google Gemini API Key.',
    yourApiKey: 'Ang iyong API Key',
    placeholder: 'AIzaSy...',
    startBtn: 'Simulan',
    keySafe: 'Ligtas ang iyong key',
    keySafeDesc: 'Ito ay naka-imbak sa lokal ng iyong device at direktang ipinapadala sa Google. Walang mga server sa gitna.',
    getKeyLink: 'Kumuha ng libreng API Key dito',
    errorEmpty: 'Mangyaring maglagay ng API Key',
    errorFormat: 'Di-wastong format. Ang mga API Key ay karaniwang nagsisimula sa \'AIza\'.',
    successMsg: 'Maligayang pagdating sa Sausage Dog Menu Pal!',
  },
  'Bahasa Indonesia': {
    welcome: 'Selamat datang!',
    description: 'Untuk menggunakan Sausage Dog Menu Pal, Anda perlu menyediakan Google Gemini API Key Anda sendiri.',
    yourApiKey: 'API Key Anda',
    placeholder: 'AIzaSy...',
    startBtn: 'Mulai Memesan',
    keySafe: 'Key Anda aman',
    keySafeDesc: 'Disimpan secara lokal di perangkat Anda dan dikirim langsung ke Google. Tidak ada server perantara.',
    getKeyLink: 'Dapatkan API Key gratis di sini',
    errorEmpty: 'Silakan masukkan API Key',
    errorFormat: 'Format tidak valid. API Key biasanya dimulai dengan \'AIza\'.',
    successMsg: 'Selamat datang di Sausage Dog Menu Pal!',
  },
};

export const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ onSave, selectedLanguage = 'English' }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 取得翻譯文字 (預設使用英文)
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS['English'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedKey = inputKey.trim();

    if (!cleanedKey) {
      setError(t.errorEmpty);
      return;
    }

    // Basic format validation for Google API Keys
    if (!cleanedKey.startsWith('AIza')) {
      setError(t.errorFormat);
      return;
    }

    // Save and proceed
    localStorage.setItem('gemini_api_key', cleanedKey);
    onSave(cleanedKey);
    toast.success(t.successMsg);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-sausage-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <PawPrint className="absolute top-10 left-[-20px] w-32 h-32 text-sausage-100 rotate-[-15deg]" />
      <PawPrint className="absolute bottom-10 right-[-20px] w-48 h-48 text-sausage-100 rotate-[15deg]" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-sausage-100 relative z-10 animate-in fade-in zoom-in duration-300">

        <div className="flex flex-col items-center text-center mb-8">
          <SausageDogLogo className="w-32 h-20 mb-4" />
          <h1 className="text-3xl font-black text-sausage-900 mb-2">{t.welcome}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {t.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-sausage-100 transition-all font-mono text-sm ${error ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-sausage-500'}`}
              />
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

        <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
          <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div className="text-left">
              <p className="text-xs font-bold text-blue-800 mb-1">{t.keySafe}</p>
              <p className="text-[10px] text-blue-600 leading-tight mb-2">
                {t.keySafeDesc}
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:underline hover:text-blue-800"
              >
                {t.getKeyLink} <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};