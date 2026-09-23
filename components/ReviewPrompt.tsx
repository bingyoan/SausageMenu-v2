'use client';

import React, { useState } from 'react';
import { Check, ExternalLink, Star, X } from 'lucide-react';
import { TargetLanguage } from '../types';

type ReviewPromptProps = {
  language: TargetLanguage;
  onDismiss: () => void;
  onRate: (rating: number) => void;
  onOpenStore: () => void;
};

const copyByLanguage: Partial<Record<TargetLanguage, {
  title: string;
  subtitle: string;
  selected: string;
  store: string;
  later: string;
  close: string;
  star: (rating: number) => string;
}>> = {
  [TargetLanguage.ChineseTW]: {
    title: '覺得我們對你有幫助嗎？',
    subtitle: '給這次翻譯一個評分，幫助我們持續改進。',
    selected: '謝謝你的回饋！如果方便，歡迎到商店留下評價。',
    store: '前往商店評價',
    later: '稍後再說',
    close: '關閉',
    star: (rating) => `評分 ${rating} 顆星`,
  },
  [TargetLanguage.English]: {
    title: 'Was this translation helpful?',
    subtitle: 'Rate this translation to help us improve.',
    selected: 'Thanks for your feedback! If you have a moment, leave a review in the store.',
    store: 'Review in the store',
    later: 'Maybe later',
    close: 'Close',
    star: (rating) => `${rating} star rating`,
  },
  [TargetLanguage.Japanese]: {
    title: '翻訳は役に立ちましたか？',
    subtitle: '評価を送って、改善にご協力ください。',
    selected: 'ご回答ありがとうございます。よろしければストアで評価してください。',
    store: 'ストアで評価する',
    later: '後で',
    close: '閉じる',
    star: (rating) => `${rating}つ星の評価`,
  },
  [TargetLanguage.Korean]: {
    title: '번역이 도움이 되었나요?',
    subtitle: '평가를 남겨 주시면 더 나은 서비스에 도움이 됩니다.',
    selected: '소중한 의견 감사합니다. 괜찮다면 스토어에서 평가해 주세요.',
    store: '스토어에서 평가하기',
    later: '나중에',
    close: '닫기',
    star: (rating) => `${rating}점 평가`,
  },
};

const fallbackCopy = copyByLanguage[TargetLanguage.English]!;

export const ReviewPrompt: React.FC<ReviewPromptProps> = ({
  language,
  onDismiss,
  onRate,
  onOpenStore,
}) => {
  const [rating, setRating] = useState(0);
  const copy = copyByLanguage[language] || fallbackCopy;

  const handleRate = (value: number) => {
    setRating(value);
    onRate(value);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="review-prompt-title">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-black/5"
          aria-label={copy.close}
        >
          <X size={18} />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-500 dark:bg-amber-500/15">
          <Star size={30} fill="currentColor" strokeWidth={1.8} />
        </div>
        <h2 id="review-prompt-title" className="pr-8 text-center text-xl font-bold text-[var(--text-primary)]">
          {copy.title}
        </h2>
        <p className="mt-2 text-center text-sm leading-6 text-[var(--text-secondary)]">
          {copy.subtitle}
        </p>

        <div className="mt-5 flex justify-center gap-2" aria-label={rating ? copy.star(rating) : copy.subtitle}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRate(value)}
              className="rounded-full p-1 text-amber-400 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              aria-label={copy.star(value)}
              aria-pressed={rating === value}
            >
              <Star size={34} fill={value <= rating ? 'currentColor' : 'transparent'} strokeWidth={1.8} />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="mt-5 rounded-2xl bg-[var(--bg-secondary)] p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <Check size={17} className="text-emerald-500" />
              {copy.selected}
            </div>
            <button
              type="button"
              onClick={onOpenStore}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <ExternalLink size={16} />
              {copy.store}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-black/5"
        >
          {copy.later}
        </button>
      </div>
    </div>
  );
};
