import React, { useEffect, useState } from 'react';
import { ArrowLeft, Camera, ReceiptText } from 'lucide-react';
import { HistoryRecord, ImageTranslationHistoryRecord, TargetLanguage } from '../types';
import { HistoryPage } from './HistoryPage';
import { ImageTranslationHistoryPage } from './ImageTranslationHistoryPage';
import { getHomeCopy } from './homeCopy';

export interface RecordsPageProps {
  history: HistoryRecord[];
  imageRecords: ImageTranslationHistoryRecord[];
  uiLanguage: TargetLanguage;
  initialTab: 'receipts' | 'instant';
  onBack: () => void;
  onDeleteReceipt: (id: string) => void;
  onOpenCamera: () => void;
  onSelectImage: (record: ImageTranslationHistoryRecord) => void;
  onDeleteImage: (id: string) => void;
  canViewReceipts?: boolean;
  onLockedReceipts?: () => void;
}

export const RecordsPage: React.FC<RecordsPageProps> = ({
  history, imageRecords, uiLanguage, initialTab, onBack, onDeleteReceipt, onOpenCamera,
  onSelectImage, onDeleteImage, canViewReceipts = true, onLockedReceipts,
}) => {
  const [tab, setTab] = useState<'receipts' | 'instant'>(initialTab);
  const copy = getHomeCopy(uiLanguage);

  useEffect(() => {
    setTab(initialTab === 'receipts' && !canViewReceipts ? 'instant' : initialTab);
  }, [initialTab, canViewReceipts]);

  const chooseTab = (nextTab: 'receipts' | 'instant') => {
    if (nextTab === 'receipts' && !canViewReceipts) {
      onLockedReceipts?.();
      return;
    }
    setTab(nextTab);
  };

  return <div className="flex h-full flex-col overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
    <header className="safe-area-header flex items-center gap-3 border-b px-4 py-3" style={{ background: 'var(--header-bg)', borderColor: 'var(--glass-border)', backdropFilter: 'blur(18px)' }}>
      <button type="button" onClick={onBack} className="rounded-full p-2" style={{ color: 'var(--text-secondary)' }} aria-label={copy.home}><ArrowLeft size={22} /></button>
      <h1 className="flex-1 text-xl font-extrabold">{copy.records}</h1>
      <button type="button" onClick={onOpenCamera} className="rounded-xl p-2.5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--accent-green)' }} aria-label={copy.instantRecords}><Camera size={20} /></button>
    </header>
    <div className="grid grid-cols-2 gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
      <TabButton active={tab === 'receipts'} icon={ReceiptText} label={copy.receiptRecords} onClick={() => chooseTab('receipts')} />
      <TabButton active={tab === 'instant'} icon={Camera} label={copy.instantRecords} onClick={() => chooseTab('instant')} />
    </div>
    <div className="min-h-0 flex-1">
      {tab === 'receipts'
        ? <HistoryPage history={history} onBack={onBack} onDelete={onDeleteReceipt} embedded />
        : <ImageTranslationHistoryPage records={imageRecords} uiLanguage={uiLanguage} onBack={onBack} onOpenCamera={onOpenCamera} onSelect={onSelectImage} onDelete={onDeleteImage} embedded />}
    </div>
  </div>;
};

const TabButton: React.FC<{ active: boolean; icon: React.ElementType; label: string; onClick: () => void }> = ({ active, icon: Icon, label, onClick }) => <button type="button" onClick={onClick} className="flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-bold transition" style={{ background: active ? 'var(--brand-bg)' : 'var(--glass-bg)', border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--glass-border)'}`, color: active ? 'var(--brand-primary)' : 'var(--text-secondary)' }}><Icon size={17} /><span className="truncate">{label}</span></button>;

export default RecordsPage;
