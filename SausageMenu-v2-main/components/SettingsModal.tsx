import React, { useState, useEffect } from 'react';
import { X, Percent, Receipt, LogOut, Key, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, tax: number, service: number) => void;
  currentKey?: string;
  currentTax: number;
  currentService: number;
  onLogout?: () => void;
  targetLanguage?: string;
}

const TRANSLATIONS: Record<string, any> = {
  '繁體中文': {
    title: 'App 設定',
    priceTitle: '價格試算設定 (不影響原價)',
    taxLabel: '稅率 (%)',
    serviceLabel: '服務費 (%)',
    priceHint: '這些費率將應用於基準價格以估算最終帳單（例如 +10% 服務費）。',
    apiTitle: 'API Key 設定',
    apiHint: '你可以在此更新 Google Gemini API Key。',
    apiLink: '前往 Google AI Studio 獲取金鑰',
    restoreTitle: '恢復舊版購買 / Restore Legacy Purchase',
    restoreHint: '如果你之前有在 Gumroad 上購買過不限次數授權，請輸入你當時購買的 Email。',
    verifyBtn: '驗證',
    saveBtn: '儲存設定 (Save Settings)',
    logoutBtn: '登出帳號 / Log Out',
    logoutAsk: '確定要登出？這將會清除本機所有資料喔！\nAre you sure to log out?',
    errEmail: '請輸入有效的 Email / Invalid Email'
  },
  'English': {
    title: 'App Settings',
    priceTitle: 'Price Estimation Settings',
    taxLabel: 'Tax Rate (%)',
    serviceLabel: 'Service Fee (%)',
    priceHint: 'These rates will be applied to the base price to estimate the final bill.',
    apiTitle: 'API Key Settings',
    apiHint: 'Update your Google Gemini API Key here.',
    apiLink: 'Get key from Google AI Studio',
    restoreTitle: 'Restore Legacy Purchase',
    restoreHint: 'If you bought an unlimited license on Gumroad before, enter your email.',
    verifyBtn: 'Verify',
    saveBtn: 'Save Settings',
    logoutBtn: 'Log Out',
    logoutAsk: 'Log out? This will clear all local data.\nAre you sure?',
    errEmail: 'Invalid Email'
  },
  '日本語': {
    title: 'アプリ設定',
    priceTitle: '料金計算設定',
    taxLabel: '税率 (%)',
    serviceLabel: 'サービス料 (%)',
    priceHint: 'これらの料金は基本価格に適用され、最終的な請求額が見積もられます。',
    apiTitle: 'APIキー設定',
    apiHint: 'ここでGoogle Gemini APIキーを更新できます。',
    apiLink: 'Google AI Studioでキーを取得',
    restoreTitle: '以前の購入を復元',
    restoreHint: '以前Gumroadでライセンスを購入した場合は、そのメールアドレスを入力してください。',
    verifyBtn: '確認',
    saveBtn: '設定を保存',
    logoutBtn: 'ログアウト',
    logoutAsk: 'ログアウトしますか？すべてのデータが消去されます。',
    errEmail: '無効なメールアドレスです'
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentKey = '',
  currentTax,
  currentService,
  onLogout,
  targetLanguage = 'English'
}) => {
  const t = TRANSLATIONS[targetLanguage] || TRANSLATIONS['English'];

  const [taxRate, setTaxRate] = useState(currentTax.toString());
  const [serviceRate, setServiceRate] = useState(currentService.toString());
  const [apiKey, setApiKey] = useState(currentKey);
  const [gumroadEmail, setGumroadEmail] = useState('');

  const handleRestoreGumroad = async () => {
    if (!gumroadEmail.includes('@')) {
      toast.error(t.errEmail);
      return;
    }
    // 這裡只是做個假動作演示，因為舊版沒有後台
    toast.success("Legacy purchase verified. (Demo)");
    localStorage.setItem('is_pro', 'true');
    setTimeout(() => window.location.reload(), 1500);
  };

  useEffect(() => {
    setTaxRate(currentTax.toString());
    setServiceRate(currentService.toString());
    setApiKey(currentKey);
  }, [currentTax, currentService, currentKey, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[1.5rem] overflow-hidden animate-in fade-in zoom-in duration-200 bg-white shadow-2xl border border-gray-100">

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-orange-600 to-orange-400">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Receipt size={20} className="opacity-80" />
            {t.title}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Price Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-gray-500">
              <Receipt size={16} /> {t.priceTitle}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400">{t.taxLabel}</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-orange-500 text-gray-800" />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400">{t.serviceLabel}</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-orange-500 text-gray-800" />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>
            <p className="text-[10px] leading-tight text-gray-400">{t.priceHint}</p>
          </div>

          {/* API Key Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 font-bold text-sm text-gray-500">
              <Key size={16} /> {t.apiTitle}
            </div>
            <p className="text-xs flex flex-col items-start gap-1 text-gray-400">
              <span>{t.apiHint}</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold transition-colors text-orange-500 hover:text-orange-600">
                {t.apiLink} <ExternalLink size={12} />
              </a>
            </p>
            <input type="password" placeholder="AIzaSy..." value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-orange-500 text-sm font-mono text-gray-800" />
          </div>

          {/* Legacy Purchase Restore */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 font-bold text-sm text-gray-500">
              <Key size={16} /> {t.restoreTitle}
            </div>
            <p className="text-xs text-gray-400">{t.restoreHint}</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Gumroad Email" value={gumroadEmail} onChange={(e) => setGumroadEmail(e.target.value)}
                className="flex-1 p-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none text-sm text-gray-800 focus:border-orange-500" />
              <button onClick={handleRestoreGumroad} disabled={!gumroadEmail}
                className="px-4 py-2 rounded-lg font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
                {t.verifyBtn}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button onClick={() => {
              onSave(apiKey, Number(taxRate) || 0, Number(serviceRate) || 0);
              onClose();
            }}
              className="w-full py-3 rounded-xl font-bold transition-transform active:scale-95 bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md">
              {t.saveBtn}
            </button>

            {onLogout && (
              <button onClick={() => { if (confirm(t.logoutAsk)) onLogout(); }}
                className="w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm bg-red-50 text-red-500 hover:bg-red-100">
                <LogOut size={16} /> {t.logoutBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};