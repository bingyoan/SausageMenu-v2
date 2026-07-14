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
  [/(?:JPY|JP¥|[¥￥円])/i, 'JPY'],
  [/(?:KRW|₩|원)/i, 'KRW'],
  [/(?:EUR|€)/i, 'EUR'],
  [/(?:GBP|£)/i, 'GBP'],
  [/(?:THB|฿)/i, 'THB'],
  [/(?:VND|₫)/i, 'VND'],
  [/(?:PHP|₱)/i, 'PHP'],
  [/(?:RUB|₽)/i, 'RUB'],
  [/(?:INR|₹)/i, 'INR'],
  [/(?:CNY|RMB|[元圓])/i, 'CNY'],
  [/(?:AUD|A\$)/i, 'AUD'],
  [/(?:CAD|C\$)/i, 'CAD'],
  [/(?:MYR|RM)/i, 'MYR'],
  [/(?:IDR|Rp)/i, 'IDR'],
];

const PRICE_ONLY_PATTERN = /^(?:NT\$|HK\$|US\$|A\$|C\$|S\$|RM|Rp|[$¥￥₩€£฿₫₱₽₹])?\s*\d{1,7}(?:[.,]\d{1,3})*(?:\s*(?:TWD|HKD|USD|JPY|KRW|EUR|GBP|THB|VND|PHP|RUB|INR|CNY|RMB|AUD|CAD|MYR|IDR|円|元|圓|원))?$/i;
const CURRENCY_MARKER_PATTERN = /(?:NT\$|HK\$|US\$|A\$|C\$|S\$|RM|Rp|[$¥￥₩€£฿₫₱₽₹]|TWD|HKD|USD|JPY|KRW|EUR|GBP|THB|VND|PHP|RUB|INR|CNY|RMB|AUD|CAD|MYR|IDR|円|元|圓|원)/i;
const BULLET_PATTERN = /^[\s·•・‧●◦▪▫\-–—]+/;
const METADATA_PATTERN = /(?:\b(?:last\s*order|open|closed|tel|phone|www\.|https?:|tax|service\s*charge|vat)\b|\d{1,2}:\d{2}\s*(?:[-~–—到至]\s*\d{1,2}:\d{2})?|\d{1,2}[\/:月]\d{1,2}|\d{1,3}%)/i;
const MENU_TITLE_PATTERN = /^(?:(?:breakfast|brunch|lunch|dinner|food|drink|drinks|restaurant|grand)\s+)?menu$/i;

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();
const stripBullet = (value: string) => cleanText(value.replace(BULLET_PATTERN, ''));

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

interface StructuredOCRRow {
  lines: NativeOCRLine[];
  priceParts: string[];
}

const lineCenterY = (line: NativeOCRLine) => line.y + line.height / 2;

const standalonePrice = (line: NativeOCRLine) => {
  const protectedPrice = cleanText(line.protectedPrice || '');
  const contentText = cleanText(line.contentText);
  if (protectedPrice && !contentText) return protectedPrice;
  if (protectedPrice) return '';
  const text = cleanText(line.originalText);
  if (!PRICE_ONLY_PATTERN.test(text) || /[:%]/.test(text)) return '';
  if (!CURRENCY_MARKER_PATTERN.test(text) && line.x < 0.3) return '';
  return text;
};

const isNoiseLine = (line: NativeOCRLine) => {
  const text = cleanText(line.originalText);
  if (!text || line.confidence < 0.12) return true;
  if (!/[\p{L}\p{N}]/u.test(text)) return true;
  if (line.y < 0.07 && /(?:上午|下午|午前|午後|星期|週|周|battery|\d{1,3}%)/i.test(text)) return true;
  return false;
};

const rowCenterY = (row: StructuredOCRRow) =>
  row.lines.reduce((sum, line) => sum + lineCenterY(line), 0) / row.lines.length;

const rowBounds = (row: StructuredOCRRow) => ({
  left: Math.min(...row.lines.map(line => line.x)),
  right: Math.max(...row.lines.map(line => line.x + line.width)),
});

const buildStructuredRows = (allLines: NativeOCRLine[]) => {
  const usableLines = allLines.filter(line => !isNoiseLine(line));
  const typicalHeight = median(usableLines.map(line => line.height));
  const priceLines = usableLines.filter(line => standalonePrice(line));
  const contentLines = usableLines.filter(line => !standalonePrice(line) && cleanText(line.contentText));
  const rows: StructuredOCRRow[] = [];

  for (const line of [...contentLines].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x)) {
    const centerY = lineCenterY(line);
    let bestRow: StructuredOCRRow | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const row of rows) {
      if (row.lines[0].page !== line.page) continue;
      const yDistance = Math.abs(centerY - rowCenterY(row));
      const bounds = rowBounds(row);
      const lineRight = line.x + line.width;
      const horizontalGap = line.x > bounds.right
        ? line.x - bounds.right
        : bounds.left > lineRight
          ? bounds.left - lineRight
          : 0;
      const yTolerance = Math.max(0.012, typicalHeight * 0.55, line.height * 0.55);
      const gapTolerance = Math.max(0.035, typicalHeight * 2.5);
      if (yDistance <= yTolerance && horizontalGap <= gapTolerance) {
        const score = yDistance * 4 + horizontalGap;
        if (score < bestScore) {
          bestScore = score;
          bestRow = row;
        }
      }
    }

    if (bestRow) {
      bestRow.lines.push(line);
      bestRow.lines.sort((a, b) => a.x - b.x);
    } else {
      rows.push({
        lines: [line],
        priceParts: line.protectedPrice ? [cleanText(line.protectedPrice)] : [],
      });
    }
  }

  for (const row of rows) {
    for (const line of row.lines) {
      const price = cleanText(line.protectedPrice || '');
      if (price && !row.priceParts.includes(price)) row.priceParts.push(price);
    }
  }

  for (const priceLine of priceLines) {
    const price = standalonePrice(priceLine);
    let bestRow: StructuredOCRRow | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const row of rows) {
      if (row.lines[0].page !== priceLine.page || row.priceParts.length > 0) continue;
      const bounds = rowBounds(row);
      if (bounds.left > priceLine.x + 0.02 || bounds.right > priceLine.x + priceLine.width + 0.04) continue;
      const yDistance = Math.abs(lineCenterY(priceLine) - rowCenterY(row));
      const yTolerance = Math.max(0.025, typicalHeight * 1.35, priceLine.height * 1.25);
      if (yDistance > yTolerance) continue;
      const horizontalDistance = Math.max(0, priceLine.x - bounds.right);
      const score = yDistance * 8 + horizontalDistance;
      if (score < bestScore) {
        bestScore = score;
        bestRow = row;
      }
    }

    if (bestRow) bestRow.priceParts.push(price);
  }

  return rows.sort((a, b) =>
    a.lines[0].page - b.lines[0].page || rowCenterY(a) - rowCenterY(b) || rowBounds(a).left - rowBounds(b).left
  );
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

const isMostlyUppercaseHeading = (text: string) => {
  const letters = text.match(/[A-Za-z]/g) || [];
  if (letters.length < 3) return false;
  const uppercase = letters.filter(letter => letter === letter.toUpperCase()).length;
  return uppercase / letters.length >= 0.85;
};

const isMetadataText = (text: string, y: number) => {
  const normalized = cleanText(text);
  if (!normalized || normalized.length > 140) return true;
  if (METADATA_PATTERN.test(normalized)) return true;
  if (MENU_TITLE_PATTERN.test(normalized)) return true;
  if (y < 0.22 && /\b(?:menu|restaurant)\b/i.test(normalized)) return true;
  if (/^[\(（\[].*(?:order|時間|時|税|税込|營業|营业).*[\)）\]]$/i.test(normalized)) return true;
  return false;
};

const structureMenu = async (
  result: NativeMenuResult,
  targetLanguage: TargetLanguage,
  sourceImages: string[]
): Promise<MenuData> => {
  const rows = buildStructuredRows(result.lines);
  const typicalHeight = median(rows.flatMap(row => row.lines.map(line => line.height)));
  const defaultCategory = getDefaultCategoryName(targetLanguage);
  const categoryAnchors: Array<{
    page: number;
    y: number;
    left: number;
    right: number;
    name: string;
  }> = [];
  let itemCounter = 0;
  const items: MenuItem[] = [];

  for (const row of rows) {
    const contentLines = row.lines.filter(line => cleanText(line.contentText).length > 0);
    const originalWithBullet = cleanText(contentLines.map(line => line.contentText).join(' '));
    const originalName = stripBullet(originalWithBullet);
    const translatedName = normalizeOfflineTranslation(
      stripBullet(contentLines.map(line => line.translatedText || line.contentText).join(' ')),
      targetLanguage
    );
    if (!originalName) continue;

    const y = Math.min(...row.lines.map(line => line.y));
    const maxHeight = Math.max(...row.lines.map(line => line.height));
    const hasPrice = row.priceParts.length > 0;
    const bounds = rowBounds(row);
    if (!hasPrice && isMetadataText(originalName, y)) continue;

    const isLikelyCategory = !hasPrice && originalName.length <= 48 && (
      maxHeight >= typicalHeight * 1.22 || isMostlyUppercaseHeading(originalName)
    );
    if (isLikelyCategory) {
      categoryAnchors.push({
        page: row.lines[0].page,
        y,
        left: bounds.left,
        right: bounds.right,
        name: translatedName || originalName,
      });
      continue;
    }

    const category = categoryAnchors
      .filter(anchor => anchor.page === row.lines[0].page && anchor.y <= y + 0.01)
      .map(anchor => {
        const horizontalDistance = bounds.left < anchor.left
          ? anchor.left - bounds.left
          : bounds.left > anchor.right
            ? bounds.left - anchor.right
            : 0;
        return {
          anchor,
          score: Math.max(0, y - anchor.y) + horizontalDistance * 1.8,
        };
      })
      .filter(candidate => candidate.anchor.right - candidate.anchor.left > 0.45 || Math.abs(bounds.left - candidate.anchor.left) < 0.34)
      .sort((a, b) => a.score - b.score)[0]?.anchor.name || defaultCategory;

    const hadBullet = BULLET_PATTERN.test(originalWithBullet);
    const isPlausibleUnpricedDish = hadBullet || (
      category !== defaultCategory &&
      originalName.length >= 2 &&
      originalName.length <= 80 &&
      maxHeight >= typicalHeight * 0.78 &&
      !/^[\(（\[].*[\)）\]]$/.test(originalName)
    );
    if (!hasPrice && !isPlausibleUnpricedDish) continue;

    const knowledge = analyzeMenuKnowledge(originalName, targetLanguage);
    const sourceBox = {
      x: Math.min(...row.lines.map(line => line.x)),
      y: Math.min(...row.lines.map(line => line.y)),
      width: Math.max(...row.lines.map(line => line.x + line.width)) - Math.min(...row.lines.map(line => line.x)),
      height: Math.max(...row.lines.map(line => line.y + line.height)) - Math.min(...row.lines.map(line => line.y)),
    };
    const priceText = row.priceParts[0] || '';

    items.push({
      id: `offline-${Date.now()}-${itemCounter++}`,
      originalName,
      translatedName: knowledge.translatedDishName || translatedName || originalName,
      price: parseNumericPrice(priceText),
      priceText,
      category,
      allergy_warning: knowledge.allergens.length > 0,
      allergens: knowledge.allergens,
      dietary_tags: knowledge.dietaryTags,
      sourcePage: row.lines[0].page,
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
