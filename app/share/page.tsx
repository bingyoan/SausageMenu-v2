import type { Metadata } from 'next';
import { SharedCompanionPage } from '@/components/SharedCompanionPage';

export const metadata: Metadata = {
  title: '旅伴共用點餐清單 | Sausage Menu Pal',
  robots: { index: false, follow: false, noarchive: true },
};

export default function CompanionSharePage() {
  return <SharedCompanionPage />;
}
