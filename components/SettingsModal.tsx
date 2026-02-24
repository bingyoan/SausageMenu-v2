import React, { useState, useEffect } from 'react';
import { X, Percent, Receipt, LogOut, Key, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tax: number, service: number) => void;
  currentTax: number;
  currentService: number;
  onResetApp?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTax,
  currentService,
  onResetApp
}) => {
  const [taxRate, setTaxRate] = useState(currentTax.toString());
  const [serviceRate, setServiceRate] = useState(currentService.toString());
  const [apiKey, setApiKey] = useState('');
  const [gumroadEmail, setGumroadEmail] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreGumroad = async () => {
    if (!gumroadEmail.includes('@')) {
      toast.error('請輸入有效的 Email / Invalid Email');
      return;
    }
    const currentGoogleEmail = localStorage.getItem('smp_user_email');
    if (!currentGoogleEmail) {
      toast.error('請先使用 Google 登入 / Please login first');
      return;
    }

    setIsRestoring(true);
    const toastId = toast.loading('驗證中... / Verifying...');
    try {
      const res = await fetch('/api/restore-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gumroadEmail: gumroadEmail.trim(),
          currentGoogleEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
        localStorage.setItem('is_pro', 'true');
        // 自動重整頁面以套用 PRO 狀態
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.message || '找不到紀錄 / Record not found', { id: toastId });
      }
    } catch (e: any) {
      toast.error('連線錯誤 / Connection error', { id: toastId });
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    setTaxRate(currentTax.toString());
    setServiceRate(currentService.toString());
    setApiKey(localStorage.getItem('gemini_api_key') || '');
  }, [currentTax, currentService, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-sausage-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Receipt size={20} className="text-sausage-300" />
            App Settings
          </h3>
          <button onClick={onClose} className="text-sausage-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Pricing Logic Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sausage-800 font-bold text-sm">
              <Receipt size={16} /> Price Estimation Settings
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500">Tax Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-sausage-500 focus:outline-none"
                  />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500">Service Fee (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={serviceRate}
                    onChange={(e) => setServiceRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-sausage-500 focus:outline-none"
                  />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              These rates will be applied to the base price to estimate the final bill (e.g. +10% service charge).
            </p>
          </div>

          {/* API Key Settings */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sausage-800 font-bold text-sm">
              <Key size={16} /> API Key Settings
            </div>
            <p className="text-xs text-gray-500 flex flex-col items-start gap-1">
              <span>你可以在此更新 Google Gemini API Key。</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sausage-600 hover:text-sausage-800 font-bold transition-colors"
              >
                前往 Google AI Studio 獲取金鑰 <ExternalLink size={12} />
              </a>
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-sausage-500 focus:outline-none text-sm font-mono"
            />
          </div>

          {/* Legacy Purchase Restore */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sausage-800 font-bold text-sm">
              <Key size={16} /> 恢復舊版購買 / Restore Legacy Purchase
            </div>
            <p className="text-xs text-gray-500">
              如果你之前有在 Gumroad 上購買過不限次數授權，請輸入你當時購買的 Email 綁定至現在的 Google 帳號。
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Gumroad Email"
                value={gumroadEmail}
                onChange={(e) => setGumroadEmail(e.target.value)}
                className="flex-1 p-2 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-sausage-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleRestoreGumroad}
                disabled={isRestoring || !gumroadEmail}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
              >
                驗證
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                if (apiKey) localStorage.setItem('gemini_api_key', apiKey.trim());
                onSave(Number(taxRate) || 0, Number(serviceRate) || 0);
                onClose();
                // 如果 API Key 被修改了最好重整一下以套用
                if (apiKey !== localStorage.getItem('gemini_api_key')) {
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-sausage-600 hover:bg-sausage-700 text-white rounded-xl font-bold shadow-md transition-transform active:scale-95"
            >
              Save Settings
            </button>

            {onResetApp && (
              <button
                onClick={() => {
                  if (confirm('登出帳號並回到語言選擇畫面？\nLog out and return to language selection?')) {
                    onResetApp();
                  }
                }}
                className="w-full py-3 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <LogOut size={16} /> 登出帳號 / Log Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};