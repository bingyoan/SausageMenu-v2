export enum TargetLanguage {
  ChineseTW = '繁體中文',
  ChineseHK = '繁體中文-HK',
  English = 'English',
  Korean = '한국어',
  French = 'Français',
  Spanish = 'Español',
  Thai = 'ไทย',
  Filipino = 'Tagalog',
  Vietnamese = 'Tiếng Việt',
  Japanese = '日本語',
  German = 'Deutsch',
  Russian = 'Русский',
  Indonesian = 'Bahasa Indonesia',
  Polish = 'Polski',
  Malay = 'Bahasa Melayu',
  Italian = 'Italiano',
  Portuguese = 'Português'
}

export interface MenuOption {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string; // Frontend generated ID
  originalName: string;
  translatedName: string;
  price: number; // Base price
  category?: string;
  options?: MenuOption[]; // For dual pricing (e.g. Small/Large)
  shortDescription?: string;
  allergy_warning?: boolean;
  dietary_tags?: string[];
  allergens?: string[]; // Specific detected allergens
}

export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export type ImageTranslationRegionKind = 'dish' | 'description' | 'category' | 'other';

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface ImageTranslationRegion {
  id: string;
  originalText: string;
  translatedText: string;
  polygon: [NormalizedPoint, NormalizedPoint, NormalizedPoint, NormalizedPoint];
  orientation: 'horizontal' | 'vertical';
  rotation: number;
  confidence: number;
  kind: ImageTranslationRegionKind;
}

export interface ImageOverlayResult {
  detectedLanguage: string;
  regions: ImageTranslationRegion[];
  partial?: boolean;
  usageMetadata?: TokenUsage;
}

export type ImageOverlayPageStatus = 'queued' | 'processing' | 'ready' | 'error';

export interface ImageOverlayPage {
  id: string;
  imageDataUrl: string;
  imageBase64: string;
  width: number;
  height: number;
  status: ImageOverlayPageStatus;
  regions: ImageTranslationRegion[];
  detectedLanguage?: string;
  error?: string;
  partial?: boolean;
}

/** A completed image-translation session saved locally for quick access. */
export interface ImageTranslationHistoryRecord {
  id: string;
  createdAt: number;
  targetLanguage: TargetLanguage;
  pages: ImageOverlayPage[];
}

export interface MenuData {
  items: MenuItem[];
  originalCurrency: string;
  targetCurrency: string;
  exchangeRate: number;
  detectedLanguage: string;
  restaurantName?: string; // For navigation
  restaurantCategory?: string; // Restaurant type (e.g. Ramen, Cafe)
  usageMetadata?: TokenUsage; // Feature: Token Usage Tracking
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type Cart = Record<string, CartItem>;

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  items: CartItem[];
  totalOriginalPrice: number;
  currency: string;
  restaurantName?: string;
  paidBy?: string; // Who paid first
  location?: GeoLocation; // GPS Coordinates
  taxRate?: number;
  serviceRate?: number;
}

export interface AppSettings {
  taxRate: number;
  serviceRate: number;
}

export type AppState = 'welcome' | 'processing' | 'ordering' | 'summary' | 'history' | 'library' | 'map' | 'image-compare' | 'quick-camera' | 'image-translation-history';

// 菜單庫 - 儲存的菜單
export interface SavedMenu {
  id: string;                      // 唯一識別碼
  createdAt: number;               // 建立時間
  customName: string;              // 用戶自訂名稱
  restaurantName?: string;         // AI 辨識的餐廳名稱
  thumbnailBase64: string;         // 菜單縮略圖 (壓縮後)
  menuData: MenuData;              // 完整菜單資料
  location?: GeoLocation;          // GPS 位置
  targetLanguage: TargetLanguage;  // 翻譯目標語言
  itemCount: number;               // 菜單項目數量
}

export interface UserCountryStat {
  countryCode: string;
  countryName: string;
  flag: string;
  userCount: number;
}
