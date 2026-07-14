import { Capacitor, registerPlugin } from '@capacitor/core';
import { getTargetCurrency } from '../constants';
import { MenuData, MenuItem, TargetLanguage } from '../types';
import { analyzeMenuKnowledge, getDefaultCategoryName, normalizeOfflineTranslation } from '../data/menuKnowledgeBase';

interface NativeOCRLine {
  page: number;
  originalText: string;
  contentText: string;
  translatedText: string;
  protectedPrice?: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NativeMenuResult {
  lines: NativeOCRLine[];
  detectedLanguage: string;
  targetLanguage: string;
  modelDownloaded: boolean;
}

interface OfflineMenuPlugin {
  getStatus(): Promise<{ available: boolean; engine: string }>;
  processMenu(options: {
    images: string[];
    targetLanguage: string;
    allowsCellularDownload?: boolean;
  }): Promise<NativeMenuResult>;
}

const OfflineMenu = registerPlugin<OfflineMenuPlugin>('OfflineMenu');

const CURRENCY_PATTERNS: Array<[RegExp, string]> = [
  [/(?:NT\$|TWD)/i, 'TWD'],
  [/(?:HK\$|HKD)/i, 'HKD'],
  [/(?:US\$|USD)/i, 'USD'],
  [/(?:JP¥|JPY|円)/i, 'JPY'],
  [/(?:KRW|₩|원)/i, 'KRW'],
  [/(?:EUR|€)/i, 'EUR'],
  [/(?:GBP|£)/i, 'GBP'],
  [/(?:THB|฿)/i, 'THB'],
  [/(?:VND|₫)/i, 'VND'],
  [/(?:PHP|₱)/i, 'PHP'],
  [/(?:RUB|₽)/i, 'RUB'],
  [/(?:INR|₹)/i, 'INR'],
  [/(?:CNY|RMB|元)/i, 'CNY'],
  [/(?:AUD|A\$)/i, 'AUD'],
  [/(?:CAD|C\$)/i, 'CAD'],
  [/(?:MYR|RM)/i, 'MYR'],
  [/(?:IDR|Rp)/i, 'IDR'],
];

const PRICE_ONLY_PATTERN = /^(?:NT\$|HK\$|US\$|A\$|C\$|[$€£¥₩฿₫₱₹₽])?\s*\d[\d.,]*(?:\s*(?:TWD|HKD|USD|JPY|KRW|EUR|GBP|THB|VND|PHP|RUB|INR|CNY|RMB|AUD|CAD|円|元|원))?$/i;

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const parseNumericPrice = (raw?: string) => {
  if (!raw) return 0;
  const numeric = raw.replace(/[^0-9.,]/g, '');
  if (!numeric) return 0;

  const lastComma = numeric.lastIndexOf(',');
  const lastDot = numeric.lastIndexOf('.');
  const separator = Math.max(lastComma, lastDot);
  if (separator >= 0) {
    const decimals = numeric.length - separator - 1;
    if (decimals === 1 || decimals === 2) {
      const whole = numeric.slice(0, separator).replace(/[.,]/g, '');
      const fraction = numeric.slice(separator + 1);
      return Number(`${whole || '0'}.${fraction}`) || 0;
    }
  }
  return Number(numeric.replace(/[.,]/g, '')) || 0;
};

const detectCurrency = (text: string, detectedLanguage: string) => {
  for (const [pattern, currency] of CURRENCY_PATTERNS) {
    if (pattern.test(text)) return currency;
  }
  const language = detectedLanguage.toLowerCase();
  if (language.startsWith('ja')) return 'JPY';
  if (language.startsWith('ko')) return 'KRW';
  if (language.startsWith('th')) return 'THB';
  if (language.startsWith('vi')) return 'VND';
  if (language.startsWith('ru')) return 'RUB';
  if (language.startsWith('id')) return 'IDR';
  if (language.startsWith('ms')) return 'MYR';
  if (language.startsWith('tl')) return 'PHP';
  if (language.startsWith('zh')) return 'CNY';
  return 'USD';
};

const median = (values: number[]) => {
  if (!values.length) return 0.025;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const groupIntoRows = (lines: NativeOCRLine[]) => {
  const sorted = [...lines].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);
  const rows: NativeOCRLine[][] = [];

  for (const line of sorted) {
    const centerY = line.y + line.height / 2;
    const previous = rows[rows.length - 1];
    const previousCenter = previous
      ? previous.reduce((sum, item) => sum + item.y + item.height / 2, 0) / previous.length
      : -1;
    const tolerance = Math.max(0.014, line.height * 0.65);

    if (previous && previous[0].page === line.page && Math.abs(centerY - previousCenter) <= tolerance) {
      previous.push(line);
      previous.sort((a, b) => a.x - b.x);
    } else {
      rows.push([line]);
    }
  }
  return rows;
};

const readCachedRates = (): Record<string, number> | undefined => {
  try {
    const raw = localStorage.getItem('offline_exchange_rates');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?.rates;
  } catch {
    return undefined;
  }
};

const resolveExchangeRate = async (originalCurrency: string, targetCurrency: string) => {
  let rates = readCachedRates();
  if (navigator.onLine) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('/api/rates', { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        if (data?.rates) {
          rates = data.rates;
          localStorage.setItem('offline_exchange_rates', JSON.stringify({ rates, savedAt: Date.now() }));
        }
      }
    } catch {
      // Currency conversion is optional in offline mode.
    }
  }

  const originalToTwd = rates?.[originalCurrency];
  const targetToTwd = rates?.[targetCurrency];
  if (originalToTwd && targetToTwd) {
    return { targetCurrency, exchangeRate: originalToTwd / targetToTwd };
  }
  return { targetCurrency: originalCurrency, exchangeRate: 1 };
};

const structureMenu = async (
  result: NativeMenuResult,
  targetLanguage: TargetLanguage,
  sourceImages: string[]
): Promise<MenuData> => {
  const rows = groupIntoRows(result.lines);
  const typicalHeight = median(result.lines.map(line => line.height));
  const defaultCategory = getDefaultCategoryName(targetLanguage);
  let currentCategory = defaultCategory;
  let itemCounter = 0;
  const items: MenuItem[] = [];

  for (const row of rows) {
    const contentLines = row.filter(line => cleanText(line.contentText).length > 0);
    const priceParts = row
      .map(line => line.protectedPrice || (PRICE_ONLY_PATTERN.test(cleanText(line.originalText)) ? line.originalText : ''))
      .map(cleanText)
      .filter(Boolean);

    const originalName = cleanText(contentLines.map(line => line.contentText).join(' '));
    const translatedName = normalizeOfflineTranslation(
      cleanText(contentLines.map(line => line.translatedText || line.contentText).join(' ')),
      targetLanguage
    );
    if (!originalName) continue;

    const maxHeight = Math.max(...row.map(line => line.height));
    const isLikelyCategory = priceParts.length === 0 && originalName.length <= 42 && maxHeight >= typicalHeight * 1.28;
    if (isLikelyCategory) {
      currentCategory = translatedName || originalName;
      continue;
    }

    const knowledge = analyzeMenuKnowledge(originalName, targetLanguage);
    const sourceBox = {
      x: Math.min(...row.map(line => line.x)),
      y: Math.min(...row.map(line => line.y)),
      width: Math.max(...row.map(line => line.x + line.width)) - Math.min(...row.map(line => line.x)),
      height: Math.max(...row.map(line => line.y + line.height)) - Math.min(...row.map(line => line.y)),
    };
    const priceText = priceParts[0] || '';

    items.push({
      id: `offline-${Date.now()}-${itemCounter++}`,
      originalName,
      translatedName: knowledge.translatedDishName || translatedName || originalName,
      price: parseNumericPrice(priceText),
      priceText,
      category: currentCategory,
      allergy_warning: knowledge.allergens.length > 0,
      allergens: knowledge.allergens,
      dietary_tags: knowledge.dietaryTags,
      sourcePage: row[0].page,
      sourceBox,
    });
  }

  if (!items.length) {
    throw new Error('No menu items were recognized. Please retake the photo with better lighting.');
  }

  const allText = result.lines.map(line => `${line.originalText} ${line.protectedPrice || ''}`).join(' ');
  const originalCurrency = detectCurrency(allText, result.detectedLanguage);
  const preferredCurrency = getTargetCurrency(targetLanguage);
  const currency = await resolveExchangeRate(originalCurrency, preferredCurrency);

  return {
    items,
    originalCurrency,
    targetCurrency: currency.targetCurrency,
    exchangeRate: currency.exchangeRate,
    detectedLanguage: result.detectedLanguage || 'Unknown',
    restaurantCategory: defaultCategory,
    sourceImages,
    processingMode: 'offline-device',
  };
};

export const isOfflineMenuAvailable = () =>
  Capacitor.isNativePlatform() && ['ios', 'android'].includes(Capacitor.getPlatform());

export const parseMenuOffline = async (
  base64Images: string[],
  targetLanguage: TargetLanguage,
  onPageComplete?: (data: MenuData, pageIndex: number, totalPages: number) => void,
  onPageStart?: (pageIndex: number, totalPages: number) => void
) => {
  if (!isOfflineMenuAvailable()) {
    throw new Error('Offline menu translation is only available in the iOS or Android app.');
  }

  const accumulatedImages: string[] = [];
  const accumulatedLines: NativeOCRLine[] = [];
  let latestData: MenuData | undefined;
  let detectedLanguage = 'Unknown';

  for (let pageIndex = 0; pageIndex < base64Images.length; pageIndex++) {
    onPageStart?.(pageIndex, base64Images.length);
    accumulatedImages.push(base64Images[pageIndex]);
    const nativeResult = await OfflineMenu.processMenu({
      images: [base64Images[pageIndex]],
      targetLanguage,
      allowsCellularDownload: true,
    });
    if (detectedLanguage === 'Unknown') detectedLanguage = nativeResult.detectedLanguage;
    accumulatedLines.push(...nativeResult.lines.map(line => ({ ...line, page: pageIndex })));
    latestData = await structureMenu({
      ...nativeResult,
      lines: [...accumulatedLines],
      detectedLanguage,
    }, targetLanguage, [...accumulatedImages]);
    onPageComplete?.(latestData, pageIndex, base64Images.length);
  }

  if (!latestData) throw new Error('No menu image was provided.');
  return latestData;
};

export const getOfflineMenuStatus = () => OfflineMenu.getStatus();
