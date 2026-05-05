import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'] });

// =========================================================
// 📱 1. 視口與主題設定 (PWA 與行動裝置最佳化)
// Next.js 建議將 viewport 與 metadata 分開寫
// =========================================================
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ea580c',
  // 🔧 Capacitor Safe Area 支援
  viewportFit: 'cover',
};

// =========================================================
// 🌏 2. SEO 核心設定 (這是你的網站名片)
// =========================================================
export const metadata: Metadata = {
  // 網站標題
  title: {
    default: "SausageMenu - AI Menu Translator & Currency Converter",
    template: "%s | SausageMenu",
  },

  // 網站描述 (包含你的 PWA 描述與 SEO 關鍵字)
  description: "The ultimate travel companion for foodies. AI-powered menu translator for travelers. Snap a photo, understand the dish, and know the price in your currency.",

  // 關鍵字 (中英混合，為了抓到全球流量)
  keywords: [
    "Menu Translator",
    "Food OCR",
    "AI Menu Reader",
    "Currency Converter",
    "Travel App",
    "Japan Travel Tool",
    "菜單翻譯",
    "出國點餐",
    "SausageMenu"
  ],

  // PWA 相關
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png', // 取代原本 head 裡的 link rel="icon"
    apple: '/icon-192.png',
  },

  // 作者資訊
  authors: [{ name: "SausageMenu Team" }],
  creator: "SausageMenu",

  // 社群分享卡片 (Open Graph)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sausagemenu.zeabur.app/", // ⚠️ 請記得改成你真正的網址
    title: "SausageMenu - Don't Just Eat, Understand.",
    description: "Translate menus and convert prices instantly with AI. The best tool for travelers.",
    siteName: "SausageMenu",
  },

  // Twitter 卡片
  twitter: {
    card: "summary_large_image",
    title: "SausageMenu - AI Menu Translator",
    description: "Travel smarter. Translate menus and check prices in seconds.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Phosphor Icons 圖標庫 (保持不變) */}
        <script src="https://unpkg.com/@phosphor-icons/web" async></script>
      </head>
      <body className={`${inter.className} antialiased h-screen`}>

        <div id="root" className="h-full w-full">
          {children}
        </div>
      </body>
    </html>
  );
}
