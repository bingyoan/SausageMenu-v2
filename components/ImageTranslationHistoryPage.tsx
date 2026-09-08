import React from 'react';
import { ArrowLeft, Camera, ChevronRight, Images, Trash2 } from 'lucide-react';
import { ImageTranslationHistoryRecord, TargetLanguage } from '../types';
import { getImageTranslationUIText, getTranslatedLanguageName } from '../i18n';

interface ImageTranslationHistoryPageProps {
  records: ImageTranslationHistoryRecord[];
  uiLanguage: TargetLanguage;
  onBack: () => void;
  onOpenCamera: () => void;
  onSelect: (record: ImageTranslationHistoryRecord) => void;
  onDelete: (recordId: string) => void;
}

const formatDate = (timestamp: number, language: TargetLanguage) => {
  try {
    return new Intl.DateTimeFormat(language === TargetLanguage.ChineseTW ? 'zh-TW' : undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
};

export const ImageTranslationHistoryPage: React.FC<ImageTranslationHistoryPageProps> = ({
  records,
  uiLanguage,
  onBack,
  onOpenCamera,
  onSelect,
  onDelete,
}) => {
  const imageTranslationUi = getImageTranslationUIText(uiLanguage);
  return (
  <div className="h-full overflow-y-auto" style={{ background: '#241708', color: '#fff' }}>
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-[#241708]/95 px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur">
      <button onClick={onBack} className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center active:scale-95" aria-label={imageTranslationUi.back}><ArrowLeft size={23} /></button>
      <div className="flex-1">
        <p className="text-2xl font-black tracking-wide">{imageTranslationUi.historyTitle}</p>
        <p className="text-xs text-white/55">{imageTranslationUi.historySubtitle}</p>
      </div>
      <button onClick={onOpenCamera} className="h-11 w-11 rounded-full bg-white flex items-center justify-center text-[#6d3219] active:scale-95" aria-label={imageTranslationUi.newTranslation}><Camera size={22} /></button>
    </header>

    <main className="mx-auto w-full max-w-lg space-y-4 px-4 pb-12 pt-5">
      {records.length === 0 ? (
        <div className="flex min-h-[55vh] flex-col items-center justify-center text-center text-white/60">
          <Images size={62} className="mb-4 text-white/25" />
          <p className="text-lg font-bold text-white/80">{imageTranslationUi.noHistory}</p>
          <p className="mt-1 text-sm">{imageTranslationUi.noHistoryHint}</p>
        </div>
      ) : records.map(record => {
        const firstPage = record.pages[0];
        return (
          <div
            key={record.id}
            className="group relative block w-full overflow-hidden rounded-[24px] border border-white/35 bg-black/30 text-left shadow-[0_8px_25px_rgba(0,0,0,0.28)] transition-transform active:scale-[0.985]"
          >
            <button type="button" onClick={() => onSelect(record)} className="block w-full text-left">
              <div className="relative h-44 w-full overflow-hidden bg-black">
                {firstPage && <img src={firstPage.imageDataUrl} alt={imageTranslationUi.translationPreview} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                {record.pages.length > 1 && <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold">{record.pages.length}</span>}
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-[#43200d]">{formatDate(record.createdAt, uiLanguage)}</span>
                <span className="absolute bottom-3 right-3 max-w-[62%] truncate rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-[#43200d]">{getTranslatedLanguageName(record.targetLanguage, uiLanguage)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 pr-16">
                <span className="text-sm text-white/65">{record.pages.filter(page => page.status === 'ready').length || record.pages.length} {imageTranslationUi.completedImages}</span>
                <ChevronRight size={19} className="text-white/55" />
              </div>
            </button>
            <button type="button" onClick={() => onDelete(record.id)} className="absolute bottom-2 right-2 rounded-full bg-red-500/85 p-2.5 text-white shadow-lg transition hover:bg-red-500" aria-label={imageTranslationUi.deleteHistory}><Trash2 size={17}/></button>
          </div>
        );
      })}
    </main>
  </div>
  );
};

export default ImageTranslationHistoryPage;
