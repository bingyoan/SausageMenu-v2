export const COMPANION_SHARE_BUCKET = 'companion-order-images';
export const COMPANION_SHARE_TTL_HOURS = 24;
export const COMPANION_SHARE_MAX_BODY_BYTES = 10 * 1024 * 1024;
export const COMPANION_OWNER_SHARE_STORAGE_KEY = 'smp_companion_share_active';

export type CompanionShareMode = 'menu' | 'instant';

export interface SharedMenuItem {
  id: string;
  originalName: string;
  translatedName: string;
  price?: number;
  currency?: string;
}

export interface SharedInstantRegion {
  id: string;
  originalText: string;
  translatedText: string;
  kind?: 'dish' | 'description' | 'category' | 'other';
  polygon?: Array<{ x: number; y: number }>;
  orientation?: 'horizontal' | 'vertical';
  rotation?: number;
  confidence?: number;
}

export interface SharedInstantPage {
  id: string;
  width: number;
  height: number;
  imageAssetId: string;
  imageUrl?: string;
  regions: SharedInstantRegion[];
}

export interface CompanionSharePayload {
  mode: CompanionShareMode;
  title: string;
  restaurantName?: string;
  currency?: string;
  targetLanguage?: string;
  items?: SharedMenuItem[];
  pages?: SharedInstantPage[];
}

export interface CompanionOrderEntry {
  id: string;
  guest_id: string;
  guest_name: string;
  item_key: string;
  original_name: string;
  translated_name: string;
  quantity: number;
  confirmed_at?: string | null;
  updated_at: string;
}

export function getBearerToken(request: Request): string | null {
  const value = request.headers.get('authorization') || '';
  const match = /^Bearer\s+([A-Za-z0-9_-]{40,100})$/i.exec(value);
  return match?.[1] || null;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength)
    : '';
}

export function allowedShareItems(payload: CompanionSharePayload): Map<string, { original: string; translated: string; price?: number }> {
  const allowed = new Map<string, { original: string; translated: string; price?: number }>();

  if (payload.mode === 'menu') {
    for (const item of payload.items || []) {
      allowed.set(item.id, {
        original: item.originalName,
        translated: item.translatedName,
        price: item.price,
      });
    }
  } else {
    for (const page of payload.pages || []) {
      for (const region of page.regions) {
        const original = cleanText(region.originalText, 500);
        const translated = cleanText(region.translatedText, 500);
        if (!original && !translated) continue;
        allowed.set(`${page.id}:${region.id}`, {
          original: original || translated,
          translated,
        });
      }
    }
  }
  return allowed;
}

export function noStoreHeaders(): HeadersInit {
  return { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };
}
