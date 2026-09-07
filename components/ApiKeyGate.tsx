'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, ExternalLink } from 'lucide-react';
import { TargetLanguage } from '../types';

interface ApiKeyGateProps {
  selectedLanguage: TargetLanguage;
  onSave: (apiKey: string) => void;
}

const COPY: Record<string, {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  save: string;
  guide: string;
  privacy: string;
  invalid: string;
}> = {
  '繁體中文': {
    title: '輸入 Gemini API Key',
    description: '網頁版使用您自己的 Google Gemini API Key。金鑰只會儲存在這個瀏覽器。',
    label: '您的 API Key',
    placeholder: 'AIzaSy…',
    save: '儲存並開始使用',
    guide: '前往 Google AI Studio 取得免費金鑰',
    privacy: '金鑰只透過加密連線使用，不會寫入伺服器資料庫。',
    invalid: '請輸入有效的 Gemini API Key。',
  },
  '繁體中文-HK': {
    title: '輸入 Gemini API Key',
    description: '網頁版使用你自己的 Google Gemini API Key。金鑰只會儲存在此瀏覽器。',
    label: '你的 API Key',
    placeholder: 'AIzaSy…',
    save: '儲存並開始使用',
    guide: '前往 Google AI Studio 取得免費金鑰',
    privacy: '金鑰只透過加密連線使用，不會寫入伺服器資料庫。',
    invalid: '請輸入有效的 Gemini API Key。',
  },
  English: {
    title: 'Enter your Gemini API Key',
    description: 'The web version uses your own Google Gemini API Key. It stays in this browser.',
    label: 'Your API Key',
    placeholder: 'AIzaSy…',
    save: 'Save and continue',
    guide: 'Get a free key from Google AI Studio',
    privacy: 'Your key is sent only over HTTPS and is never stored in our database.',
    invalid: 'Enter a valid Gemini API Key.',
  },
  日本語: {
    title: 'Gemini API Keyを入力',
    description: 'Web版ではご自身のGoogle Gemini API Keyを使用します。キーはこのブラウザに保存されます。',
    label: 'API Key',
    placeholder: 'AIzaSy…',
    save: '保存して開始',
    guide: 'Google AI Studioで無料キーを取得',
    privacy: 'キーはHTTPS経由でのみ使用し、サーバーのデータベースには保存しません。',
    invalid: '有効なGemini API Keyを入力してください。',
  },
  한국어: {
    title: 'Gemini API Key 입력',
    description: '웹 버전은 본인의 Google Gemini API Key를 사용합니다. 키는 이 브라우저에만 저장됩니다.',
    label: 'API Key',
    placeholder: 'AIzaSy…',
    save: '저장하고 시작',
    guide: 'Google AI Studio에서 무료 키 받기',
    privacy: '키는 HTTPS로만 전송되며 서버 데이터베이스에 저장되지 않습니다.',
    invalid: '유효한 Gemini API Key를 입력하세요.',
  },
};

export const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ selectedLanguage, onSave }) => {
  const t = COPY[selectedLanguage] || COPY.English;
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanedKey = apiKey.trim();
    if (!cleanedKey || /\s/.test(cleanedKey) || cleanedKey.length < 20) {
      setError(t.invalid);
      return;
    }
    setError('');
    onSave(cleanedKey);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-5" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="w-full max-w-md rounded-3xl p-7 space-y-5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-gradient)', color: 'white' }}>
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl font-extrabold">{t.title}</h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-bold" htmlFor="web-gemini-api-key">{t.label}</label>
          <div className="relative">
            <input
              id="web-gemini-api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(event) => { setApiKey(event.target.value); setError(''); }}
              placeholder={t.placeholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl p-3 pr-12 text-sm focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
            />
            <button type="button" onClick={() => setShowKey((visible) => !visible)} className="absolute right-3 top-3" style={{ color: 'var(--text-muted)' }} aria-label={showKey ? 'Hide API key' : 'Show API key'}>
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--danger-color)' }}>{error}</p>}
          <button type="submit" className="w-full rounded-xl py-3 font-bold" style={{ background: 'var(--brand-gradient)', color: 'white' }}>
            {t.save}
          </button>
        </form>

        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 text-sm font-bold underline" style={{ color: 'var(--accent-color, #f97316)' }}>
          {t.guide} <ExternalLink size={14} />
        </a>
        <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t.privacy}</p>
      </div>
    </div>
  );
};

