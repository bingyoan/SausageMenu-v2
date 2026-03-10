import { useCallback, useState, useRef } from 'react';

/**
 * 語言代碼對應表
 * Web Speech API 需要 BCP-47 語言代碼
 */
const LANG_CODE_MAP: Record<string, string> = {
    '繁體中文': 'zh-TW',
    '繁體中文-HK': 'zh-HK',
    'English': 'en-US',
    '한국어': 'ko-KR',
    '日本語': 'ja-JP',
    'Français': 'fr-FR',
    'Español': 'es-ES',
    'ไทย': 'th-TH',
    'Tiếng Việt': 'vi-VN',
    'Deutsch': 'de-DE',
    'Русский': 'ru-RU',
    'Tagalog': 'fil-PH',
    'Bahasa Indonesia': 'id-ID',
};

/**
 * 根據菜單偵測的語言獲取語言代碼
 * detectedLanguage 可能是 "Japanese", "Korean", "Thai" 等英文名稱
 */
const DETECTED_LANG_MAP: Record<string, string> = {
    'japanese': 'ja-JP',
    'korean': 'ko-KR',
    'chinese': 'zh-CN',
    'thai': 'th-TH',
    'vietnamese': 'vi-VN',
    'french': 'fr-FR',
    'spanish': 'es-ES',
    'german': 'de-DE',
    'russian': 'ru-RU',
    'english': 'en-US',
    'indonesian': 'id-ID',
    'tagalog': 'fil-PH',
    'filipino': 'fil-PH',
    'italian': 'it-IT',
    'portuguese': 'pt-BR',
    'arabic': 'ar-SA',
    'hindi': 'hi-IN',
    'malay': 'ms-MY',
    'turkish': 'tr-TR',
    // 中文語言名稱（Gemini 可能用中文回傳）
    '日語': 'ja-JP',
    '日文': 'ja-JP',
    '韓語': 'ko-KR',
    '韓文': 'ko-KR',
    '韩语': 'ko-KR',
    '韩文': 'ko-KR',
    '泰語': 'th-TH',
    '泰文': 'th-TH',
    '泰语': 'th-TH',
    '越南語': 'vi-VN',
    '越南文': 'vi-VN',
    '越南语': 'vi-VN',
    '法語': 'fr-FR',
    '法文': 'fr-FR',
    '法语': 'fr-FR',
    '西班牙語': 'es-ES',
    '西班牙文': 'es-ES',
    '西班牙语': 'es-ES',
    '德語': 'de-DE',
    '德文': 'de-DE',
    '德语': 'de-DE',
    '俄語': 'ru-RU',
    '俄文': 'ru-RU',
    '俄语': 'ru-RU',
    '英語': 'en-US',
    '英文': 'en-US',
    '英语': 'en-US',
    '印尼語': 'id-ID',
    '印尼文': 'id-ID',
    '印尼语': 'id-ID',
    '中文': 'zh-TW',
};

/**
 * 偵測語言名稱 → TargetLanguage enum 值的映射
 * Gemini API 可能回傳各種格式：英文名、中文名、原文名、ISO 代碼等
 * 例如 "Japanese", "日語", "日本語", "ja" 都要映射到 "日本語"
 */
const DETECTED_TO_TARGET_LANG: Record<string, string> = {
    // Japanese 各種可能的寫法
    'japanese': '日本語',
    'ja': '日本語',
    '日本語': '日本語',
    '日語': '日本語',
    '日文': '日本語',

    // Korean
    'korean': '한국어',
    'ko': '한국어',
    '한국어': '한국어',
    '韓語': '한국어',
    '韓文': '한국어',
    '韩语': '한국어',
    '韩文': '한국어',

    // Chinese
    'chinese': '繁體中文',
    'zh': '繁體中文',
    '中文': '繁體中文',
    '繁體中文': '繁體中文',
    '簡體中文': '繁體中文',
    '华语': '繁體中文',
    '華語': '繁體中文',

    // Thai
    'thai': 'ไทย',
    'th': 'ไทย',
    'ไทย': 'ไทย',
    '泰語': 'ไทย',
    '泰文': 'ไทย',
    '泰语': 'ไทย',

    // Vietnamese
    'vietnamese': 'Tiếng Việt',
    'vi': 'Tiếng Việt',
    'tiếng việt': 'Tiếng Việt',
    '越南語': 'Tiếng Việt',
    '越南文': 'Tiếng Việt',
    '越南语': 'Tiếng Việt',

    // French
    'french': 'Français',
    'fr': 'Français',
    'français': 'Français',
    'francais': 'Français',
    '法語': 'Français',
    '法文': 'Français',
    '法语': 'Français',

    // Spanish
    'spanish': 'Español',
    'es': 'Español',
    'español': 'Español',
    'espanol': 'Español',
    '西班牙語': 'Español',
    '西班牙文': 'Español',
    '西班牙语': 'Español',

    // German
    'german': 'Deutsch',
    'de': 'Deutsch',
    'deutsch': 'Deutsch',
    '德語': 'Deutsch',
    '德文': 'Deutsch',
    '德语': 'Deutsch',

    // Russian
    'russian': 'Русский',
    'ru': 'Русский',
    'русский': 'Русский',
    '俄語': 'Русский',
    '俄文': 'Русский',
    '俄语': 'Русский',

    // English
    'english': 'English',
    'en': 'English',
    '英語': 'English',
    '英文': 'English',
    '英语': 'English',

    // Indonesian
    'indonesian': 'Bahasa Indonesia',
    'id': 'Bahasa Indonesia',
    'bahasa indonesia': 'Bahasa Indonesia',
    '印尼語': 'Bahasa Indonesia',
    '印尼文': 'Bahasa Indonesia',
    '印尼语': 'Bahasa Indonesia',

    // Tagalog / Filipino
    'tagalog': 'Tagalog',
    'filipino': 'Tagalog',
    'tl': 'Tagalog',
    '菲律賓語': 'Tagalog',
    '菲律宾语': 'Tagalog',
    '他加祿語': 'Tagalog',

    // Other languages (fallback to English)
    'italian': 'English',
    'portuguese': 'English',
    'arabic': 'English',
    'malay': 'Bahasa Indonesia',
    'turkish': 'English',
};

/**
 * 將偵測語言名稱轉換為 TargetLanguage enum 值
 * 例如 "Japanese" → "日本語", "日語" → "日本語", "日文" → "日本語"
 */
export function detectedLangToTargetLang(detectedLanguage: string): string {
    // 如果已經是 TargetLanguage enum 值，直接返回
    if (LANG_CODE_MAP[detectedLanguage]) return detectedLanguage;

    const lower = detectedLanguage.toLowerCase().trim();

    // 精確匹配
    if (DETECTED_TO_TARGET_LANG[lower]) {
        return DETECTED_TO_TARGET_LANG[lower];
    }

    // 部分匹配
    for (const [key, value] of Object.entries(DETECTED_TO_TARGET_LANG)) {
        if (lower.includes(key) || key.includes(lower)) {
            return value;
        }
    }

    return 'English'; // 預設
}

export function getLanguageCode(lang: string): string {
    // 先從 TargetLanguage enum 值對應
    if (LANG_CODE_MAP[lang]) return LANG_CODE_MAP[lang];

    // 再嘗試從偵測語言名稱對應
    const lower = lang.toLowerCase().trim();
    if (DETECTED_LANG_MAP[lower]) return DETECTED_LANG_MAP[lower];

    // 嘗試部分匹配
    for (const [key, code] of Object.entries(DETECTED_LANG_MAP)) {
        if (lower.includes(key) || key.includes(lower)) return code;
    }

    return 'en-US'; // 預設英文
}

interface UseTTSReturn {
    speak: (text: string, lang: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    speakingId: string | null;
    speakWithId: (text: string, lang: string, id: string) => void;
    isSupported: boolean;
}

/**
 * 從語言代碼中取得 Google Translate TTS 需要的短代碼
 * 例如 "ja-JP" → "ja", "zh-TW" → "zh-TW"
 */
function getGoogleTTSLangCode(langCode: string): string {
    // Google TTS 對中文需要完整代碼
    if (langCode.startsWith('zh')) return langCode;
    // 其他語言只需要前綴
    return langCode.split('-')[0];
}

/**
 * Text-to-Speech Hook
 * 優先使用 Google Translate TTS（免費、免安裝、支援所有語言）
 * 失敗時自動降級為瀏覽器內建 Web Speech API
 */
export function useTTS(): UseTTSReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const isSupported = typeof window !== 'undefined';

    const stop = useCallback(() => {
        // 停止 Google TTS Audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        // 也停止 Web Speech API（作為備用）
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setSpeakingId(null);
    }, []);

    const speak = useCallback((text: string, lang: string) => {
        if (!isSupported) return;

        // 先停止任何正在播放的語音
        stop();

        const langCode = getLanguageCode(lang);
        const googleLang = getGoogleTTSLangCode(langCode);

        // 透過我們的 API 代理 Google Translate TTS（繞過 CORS）
        const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(googleLang)}`;

        const audio = new Audio(ttsUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
            setIsSpeaking(false);
            setSpeakingId(null);
            audioRef.current = null;
        };
        audio.onerror = () => {
            console.warn('[TTS] Google TTS proxy failed, falling back to Web Speech API');
            audioRef.current = null;

            // Fallback: 使用 Web Speech API
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = langCode;
                utterance.rate = 0.85;
                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => {
                    setIsSpeaking(false);
                    setSpeakingId(null);
                };
                utterance.onerror = () => {
                    setIsSpeaking(false);
                    setSpeakingId(null);
                };
                window.speechSynthesis.speak(utterance);
            } else {
                setIsSpeaking(false);
                setSpeakingId(null);
            }
        };

        audio.play().catch(() => {
            // play() promise rejection - 同樣 fallback
            audio.onerror?.(new Event('error'));
        });
    }, [isSupported, stop]);

    const speakWithId = useCallback((text: string, lang: string, id: string) => {
        if (speakingId === id) {
            stop();
            return;
        }
        setSpeakingId(id);
        speak(text, lang);
    }, [speak, stop, speakingId]);

    return { speak, stop, isSpeaking, speakingId, speakWithId, isSupported };
}
