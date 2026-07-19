import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Loader2, LogOut, Percent, Receipt, Trash2, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tax: number, service: number) => void;
  currentTax: number;
  currentService: number;
  onResetApp?: () => void;
  onDeleteAccount?: () => Promise<void>;
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
    restoreHint: '如果你之前有在 Gumroad 上購買過不限次數授權，請輸入你當時購買的 Email 綁定至現在的 Google 帳號。',
    verifyBtn: '驗證',
    saveBtn: '儲存設定 (Save Settings)',
    logoutBtn: '登出帳號 / Log Out',
    logoutAsk: '單純登出目前帳號，並回到首頁重新選擇？\nAre you sure to log out?',
    errEmail: '請輸入有效的 Email / Invalid Email',
    errLogin: '請先使用 Google 登入 / Please login first',
    verifying: '驗證中... / Verifying...',
    connErr: '連線錯誤 / Connection error',
    notFound: '找不到紀錄 / Record not found'
  },
  '繁體中文-HK': {
    title: 'App 設定',
    priceTitle: '價格試算設定 (不影響原價)',
    taxLabel: '稅率 (%)',
    serviceLabel: '服務費 (%)',
    priceHint: '這些費率將應用於基準價格以估算最終帳單（例如 +10% 服務費）。',
    apiTitle: 'API Key 設定',
    apiHint: '你可以在此更新 Google Gemini API Key。',
    apiLink: '前往 Google AI Studio 獲取金鑰',
    restoreTitle: '恢復舊版購買 / Restore Legacy Purchase',
    restoreHint: '如果你之前有在 Gumroad 上購買過不限次數授權，請輸入你當時購買的 Email 綁定至現在的 Google 帳號。',
    verifyBtn: '驗證',
    saveBtn: '儲存設定 (Save Settings)',
    logoutBtn: '登出帳號 / Log Out',
    logoutAsk: '單純登出目前帳號，並回到首頁重新選擇？\nAre you sure to log out?',
    errEmail: '請輸入有效的 Email',
    errLogin: '請先使用 Google 登入',
    verifying: '驗證中...',
    connErr: '連線錯誤',
    notFound: '找不到紀錄'
  },
  'English': {
    title: 'App Settings',
    priceTitle: 'Price Estimation Settings',
    taxLabel: 'Tax Rate (%)',
    serviceLabel: 'Service Fee (%)',
    priceHint: 'These rates will be applied to the base price to estimate the final bill (e.g. +10% service charge).',
    apiTitle: 'API Key Settings',
    apiHint: 'Update your Google Gemini API Key here.',
    apiLink: 'Get key from Google AI Studio',
    restoreTitle: 'Restore Legacy Purchase',
    restoreHint: 'If you bought an unlimited license on Gumroad before, enter your email to bind it to your current Google account.',
    verifyBtn: 'Verify',
    saveBtn: 'Save Settings',
    logoutBtn: 'Log Out',
    logoutAsk: 'Log out from current Google account and return to start?',
    errEmail: 'Invalid Email',
    errLogin: 'Please login with Google first',
    verifying: 'Verifying...',
    connErr: 'Connection error',
    notFound: 'Record not found'
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
    restoreHint: '以前Gumroadで無制限ライセンスを購入した場合は、そのメールアドレスを入力してGoogleアカウントに紐付けてください。',
    verifyBtn: '確認',
    saveBtn: '設定を保存',
    logoutBtn: 'ログアウト',
    logoutAsk: '現在のアカウントからログアウトしますか？',
    errEmail: '無効なメールアドレスです',
    errLogin: '先にGoogleログインしてください',
    verifying: '確認中...',
    connErr: '通信エラー',
    notFound: '記録が見つかりません'
  },
  '한국어': {
    title: '앱 설정',
    priceTitle: '가격 계산 설정',
    taxLabel: '세율 (%)',
    serviceLabel: '서비스 요금 (%)',
    priceHint: '이 요율은 예상 최종 금액을 위해 기본 가격에 적용됩니다.',
    apiTitle: 'API 키 설정',
    apiHint: '여기서 Google Gemini API 키를 업데이트하세요.',
    apiLink: 'Google AI Studio에서 키 받기',
    restoreTitle: '이전 구매 복원',
    restoreHint: '이전에 Gumroad에서 라이선스를 구매했다면 해당 이메일을 입력하세요.',
    verifyBtn: '확인',
    saveBtn: '설정 저장',
    logoutBtn: '로그아웃',
    logoutAsk: '로그아웃하시겠습니까?',
    errEmail: '잘못된 이메일입니다',
    errLogin: '먼저 Google 로그인을 해주세요',
    verifying: '확인 중...',
    connErr: '연결 오류',
    notFound: '기록을 찾을 수 없습니다'
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTax,
  currentService,
  onResetApp,
  onDeleteAccount,
  targetLanguage = 'English'
}) => {
  const t = TRANSLATIONS[targetLanguage] || TRANSLATIONS['English'];

  const [taxRate, setTaxRate] = useState(currentTax.toString());
  const [serviceRate, setServiceRate] = useState(currentService.toString());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setTaxRate(currentTax.toString());
    setServiceRate(currentService.toString());
    setShowDeleteConfirmation(false);
    setDeleteConfirmation('');
    setDeleteError('');
  }, [currentTax, currentService, isOpen]);

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount || deleteConfirmation !== 'DELETE') return;

    setIsDeleting(true);
    setDeleteError('');
    try {
      await onDeleteAccount();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Account deletion failed. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-200" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center" style={{ background: 'var(--brand-gradient)' }}>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Receipt size={20} style={{ opacity: 0.8 }} />
            {t.title}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Receipt size={16} /> {t.priceTitle}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>{t.taxLabel}</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 rounded-lg focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
                  <Percent size={14} className="absolute right-3 top-3" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>{t.serviceLabel}</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)}
                    className="w-full p-2 pl-3 pr-8 rounded-lg focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }} />
                  <Percent size={14} className="absolute right-3 top-3" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{t.priceHint}</p>
          </div>


          <div className="flex flex-col gap-3 pt-2">
            <button onClick={() => {
              onSave(Number(taxRate) || 0, Number(serviceRate) || 0);
              onClose();
            }}
              className="w-full py-3 rounded-xl font-bold shadow-md transition-transform active:scale-95"
              style={{ background: 'var(--brand-gradient)', color: 'white' }}>
              {t.saveBtn}
            </button>

            {onResetApp && (
              <button onClick={() => { if (confirm(t.logoutAsk)) onResetApp(); }}
                className="w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger-color)' }}>
                <LogOut size={16} /> {t.logoutBtn}
              </button>
            )}

            {onDeleteAccount && !showDeleteConfirmation && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm border"
                style={{ background: 'transparent', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
              >
                <Trash2 size={16} /> 刪除帳號 / Delete Account
              </button>
            )}

            {onDeleteAccount && showDeleteConfirmation && (
              <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--danger-color)', background: 'var(--danger-bg)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--danger-color)' }} />
                  <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <p className="font-bold" style={{ color: 'var(--danger-color)' }}>
                      此動作無法復原 / This cannot be undone
                    </p>
                    <p>
                      將永久刪除帳號、個人資料、AI 使用紀錄及您上傳的雲端菜單。
                      Your account, profile, AI usage records, and uploaded cloud menus will be permanently deleted.
                    </p>
                    <p>
                      刪除帳號不會自動取消 App Store 訂閱。若仍在訂閱，請先前往 Apple 訂閱管理取消，否則可能繼續扣款。
                    </p>
                    <a
                      href="https://apps.apple.com/account/subscriptions"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold underline"
                      style={{ color: 'var(--danger-color)' }}
                    >
                      管理 Apple 訂閱 / Manage Subscriptions <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                <label className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  輸入 DELETE 以確認 / Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  autoCapitalize="characters"
                  autoComplete="off"
                  disabled={isDeleting}
                  className="w-full p-3 rounded-lg focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                  aria-label="Type DELETE to confirm account deletion"
                />

                {deleteError && (
                  <p className="text-xs font-medium" style={{ color: 'var(--danger-color)' }}>{deleteError}</p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setDeleteConfirmation('');
                      setDeleteError('');
                    }}
                    disabled={isDeleting}
                    className="py-3 rounded-lg text-sm font-bold border"
                    style={{ borderColor: 'var(--border-input)', color: 'var(--text-secondary)' }}
                  >
                    取消 / Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                    className="py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                    style={{ background: 'var(--danger-color)', color: 'white' }}
                  >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {isDeleting ? '刪除中...' : '永久刪除'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
