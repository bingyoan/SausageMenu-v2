import { useCallback, useState, useRef } from 'react';

const LANG_CODE_MAP: Record<string, string> = {
    '繁體中文': 'zh-TW', '繁體中文-HK': 'zh-HK', 'English': 'en-US', '한국어': 'ko-KR',
    '日本語': 'ja-JP', 'Français': 'fr-FR', 'Español': 'es-ES', 'ไทย': 'th-TH',
    'Tiếng Việt': 'vi-VN', 'Deutsch': 'de-DE', 'Русский': 'ru-RU', 'Tagalog': 'fil-PH',
    'Bahasa Indonesia': 'id-ID',
};

const DETECTED_LANG_MAP: Record<string, string> = {
    'japanese': 'ja-JP', 'korean': 'ko-KR', 'chinese': 'zh-CN', 'thai': 'th-TH',
    'vietnamese': 'vi-VN', 'french': 'fr-FR', 'spanish': 'es-ES', 'german': 'de-DE',
    'russian': 'ru-RU', 'english': 'en-US', 'indonesian': 'id-ID', 'tagalog': 'fil-PH',
    'filipino': 'fil-PH', 'italian': 'it-IT', 'portuguese': 'pt-BR', 'arabic': 'ar-SA',
    'hindi': 'hi-IN', 'malay': 'ms-MY', 'turkish': 'tr-TR',
    '日語': 'ja-JP', '日文': 'ja-JP', '韓語': 'ko-KR', '韓文': 'ko-KR',
    '泰語': 'th-TH', '泰文': 'th-TH', '越南語': 'vi-VN', '越南文': 'vi-VN',
    '法語': 'fr-FR', '法文': 'fr-FR', '西班牙語': 'es-ES', '西班牙文': 'es-ES',
    '德語': 'de-DE', '德文': 'de-DE', '俄語': 'ru-RU', '俄文': 'ru-RU',
    '英語': 'en-US', '英文': 'en-US', '印尼語': 'id-ID', '印尼文': 'id-ID', '中文': 'zh-TW',
};

const DETECTED_TO_TARGET_LANG: Record<string, string> = {
    'japanese': '日本語', 'ja': '日本語', '日本語': '日本語', '日語': '日本語', '日文': '日本語',
    'korean': '한국어', 'ko': '한국어', '한국어': '한국어', '韓語': '한국어', '韓文': '한국어',
    'chinese': '繁體中文', 'zh': '繁體中文', '中文': '繁體中文', '繁體中文': '繁體中文',
    'thai': 'ไทย', 'th': 'ไทย', 'ไทย': 'ไทย', '泰語': 'ไทย', '泰文': 'ไทย',
    'vietnamese': 'Tiếng Việt', 'vi': 'Tiếng Việt', '越南語': 'Tiếng Việt', '越南文': 'Tiếng Việt',
    'french': 'Français', 'fr': 'Français', '法語': 'Français', '法文': 'Français',
    'spanish': 'Español', 'es': 'Español', '西班牙語': 'Español', '西班牙文': 'Español',
    'german': 'Deutsch', 'de': 'Deutsch', '德語': 'Deutsch', '德文': 'Deutsch',
    'russian': 'Русский', 'ru': 'Русский', '俄語': 'Русский', '俄文': 'Русский',
    'english': 'English', 'en': 'English', '英語': 'English', '英文': 'English',
    'indonesian': 'Bahasa Indonesia', 'id': 'Bahasa Indonesia', '印尼語': 'Bahasa Indonesia',
    'tagalog': 'Tagalog', 'filipino': 'Tagalog', 'tl': 'Tagalog',
    'italian': 'English', 'portuguese': 'English', 'malay': 'Bahasa Indonesia',
};

export function detectedLangToTargetLang(detectedLanguage: string): string {
    if (LANG_CODE_MAP[detectedLanguage]) return detectedLanguage;
    const lower = detectedLanguage.toLowerCase().trim();
    if (DETECTED_TO_TARGET_LANG[lower]) return DETECTED_TO_TARGET_LANG[lower];
    for (const [key, value] of Object.entries(DETECTED_TO_TARGET_LANG)) {
        if (lower.includes(key) || key.includes(lower)) return value;
    }
    return 'English';
}

export function getLanguageCode(lang: string): string {
    if (LANG_CODE_MAP[lang]) return LANG_CODE_MAP[lang];
    const lower = lang.toLowerCase().trim();
    if (DETECTED_LANG_MAP[lower]) return DETECTED_LANG_MAP[lower];
    for (const [key, code] of Object.entries(DETECTED_LANG_MAP)) {
        if (lower.includes(key) || key.includes(lower)) return code;
    }
    return 'en-US';
}

function getGoogleTTSLangCode(langCode: string): string {
    if (langCode.startsWith('zh')) return langCode;
    return langCode.split('-')[0];
}

interface UseTTSReturn {
    speak: (text: string, lang: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    speakingId: string | null;
    speakWithId: (text: string, lang: string, id: string) => void;
    isSupported: boolean;
}

export function useTTS(): UseTTSReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isSupported = typeof window !== 'undefined';

    const stop = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setSpeakingId(null);
    }, []);

    const speak = useCallback((text: string, lang: string) => {
        if (!isSupported) return;
        stop();
        const langCode = getLanguageCode(lang);
        const googleLang = getGoogleTTSLangCode(langCode);
        const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(googleLang)}`;
        const audio = new Audio(ttsUrl);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => { setIsSpeaking(false); setSpeakingId(null); audioRef.current = null; };
        audio.onerror = () => {
            audioRef.current = null;
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = langCode;
                utterance.rate = 0.85;
                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => { setIsSpeaking(false); setSpeakingId(null); };
                utterance.onerror = () => { setIsSpeaking(false); setSpeakingId(null); };
                window.speechSynthesis.speak(utterance);
            } else { setIsSpeaking(false); setSpeakingId(null); }
        };
        audio.play().catch(() => { audio.onerror?.(new Event('error')); });
    }, [isSupported, stop]);

    const speakWithId = useCallback((text: string, lang: string, id: string) => {
        if (speakingId === id) { stop(); return; }
        setSpeakingId(id);
        speak(text, lang);
    }, [speak, stop, speakingId]);

    return { speak, stop, isSpeaking, speakingId, speakWithId, isSupported };
}
