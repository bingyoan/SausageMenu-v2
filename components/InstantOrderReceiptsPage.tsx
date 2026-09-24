import React from 'react';
import { ArrowLeft, ReceiptText, Trash2 } from 'lucide-react';
import { InstantOrderReceipt, TargetLanguage } from '../types';
import { getHomeCopy } from './homeCopy';

interface Props {
  receipts: InstantOrderReceipt[];
  uiLanguage: TargetLanguage;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const copyFor = (language: TargetLanguage) => {
  if (language === TargetLanguage.ChineseTW || language === TargetLanguage.ChineseHK) return {
    empty: '完成一拍即翻點餐後，收據會保存在這裡。', mine: '我', items: '項餐點', portions: '份',
    pages: (count: number) => `${count} 張菜單照片`, delete: '刪除收據', confirmDelete: '確定要刪除這張點餐收據嗎？',
  };
  if (language === TargetLanguage.Japanese) return {
    empty: 'ワンタップ翻訳で注文を完了すると、レシートがここに保存されます。', mine: '自分', items: '品', portions: '個',
    pages: (count: number) => `メニュー画像 ${count} 枚`, delete: 'レシートを削除', confirmDelete: 'この注文レシートを削除しますか？',
  };
  if (language === TargetLanguage.Korean) return {
    empty: '원터치 번역 주문을 완료하면 영수증이 여기에 저장됩니다.', mine: '나', items: '개 메뉴', portions: '인분',
    pages: (count: number) => `메뉴 사진 ${count}장`, delete: '영수증 삭제', confirmDelete: '이 주문 영수증을 삭제할까요?',
  };
  return {
    empty: 'Completed one-tap orders will be saved here.', mine: 'Me', items: ' items', portions: ' portions',
    pages: (count: number) => `${count} menu photos`, delete: 'Delete receipt', confirmDelete: 'Delete this order receipt?',
  };
};

export function InstantOrderReceiptsPage({ receipts, uiLanguage, onBack, onDelete }: Props) {
  const homeCopy = getHomeCopy(uiLanguage);
  const copy = copyFor(uiLanguage);
  const dateLocale = uiLanguage === TargetLanguage.ChineseTW ? 'zh-TW'
    : uiLanguage === TargetLanguage.ChineseHK ? 'zh-HK'
      : uiLanguage === TargetLanguage.Japanese ? 'ja-JP'
        : uiLanguage === TargetLanguage.Korean ? 'ko-KR' : 'en';

  return <main className="flex h-full min-h-0 flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
    <header className="safe-area-header safe-area-header-compact flex shrink-0 items-center gap-3 border-b px-3 py-2" style={{ borderColor: 'var(--glass-border)' }}>
      <button type="button" onClick={onBack} aria-label={homeCopy.home} className="rounded-xl p-2"><ArrowLeft size={22} /></button>
      <div className="min-w-0">
        <h1 className="font-extrabold">{homeCopy.orderReceipts || homeCopy.receiptRecords}</h1>
        <p className="text-xs opacity-60">{receipts.length}</p>
      </div>
    </header>

    <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      {!receipts.length ? <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 text-center opacity-60">
        <ReceiptText size={38} />
        <p className="max-w-xs text-sm">{copy.empty}</p>
      </div> : <div className="mx-auto max-w-xl space-y-4 pb-5">
        {receipts.map(receipt => {
          const totalQuantity = receipt.participants.reduce((sum, participant) => sum + participant.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
          const totalItems = receipt.participants.reduce((sum, participant) => sum + participant.items.length, 0);
          return <article key={receipt.id} className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-card)' }}>
            <header className="flex items-start justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="min-w-0">
                <h2 className="font-extrabold">{receipt.title}</h2>
                <p className="mt-1 text-xs opacity-60">{new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(receipt.createdAt))}</p>
                <p className="mt-1 text-xs opacity-60">{totalItems}{copy.items} · {totalQuantity}{copy.portions} · {copy.pages(receipt.pageCount)}</p>
              </div>
              <button type="button" onClick={() => {
                if (window.confirm(copy.confirmDelete)) onDelete(receipt.id);
              }} aria-label={copy.delete} className="rounded-lg p-2 opacity-60 hover:bg-black/5 hover:opacity-100"><Trash2 size={17} /></button>
            </header>

            <div className="space-y-4 p-4">
              {receipt.participants.map(participant => {
                const participantQuantity = participant.items.reduce((sum, item) => sum + item.quantity, 0);
                return <section key={participant.id}>
                  <h3 className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
                    <span>{participant.name || copy.mine}</span>
                    <span className="text-xs font-medium opacity-55">{participant.items.length}{copy.items} · {participantQuantity}{copy.portions}</span>
                  </h3>
                  <div className="space-y-2">
                    {participant.items.map(item => <div key={item.key} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-secondary)' }}>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-line text-sm font-bold">{item.originalName || item.translatedName}</p>
                        {item.translatedName && item.translatedName !== item.originalName && <p className="mt-0.5 whitespace-pre-line text-xs opacity-55">{item.translatedName}</p>}
                      </div>
                      <strong className="shrink-0 text-base">× {item.quantity}</strong>
                    </div>)}
                  </div>
                </section>;
              })}
            </div>
          </article>;
        })}
      </div>}
    </section>
  </main>;
}
