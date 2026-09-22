import { TargetLanguage } from '../types';

export interface HomeCopy {
  home: string;
  records: string;
  receiptRecords: string;
  instantRecords: string;
  favorites: string;
  my: string;
  totalPaidUsers: string;
  notificationsComingSoon: string;
  menu: string;
  settings: string;
  help: string;
  map: string;
  theme: string;
  logout: string;
  upgrade: string;
  menuSource: string;
}

const HOME_COPY: Partial<Record<TargetLanguage, HomeCopy>> = {
  [TargetLanguage.ChineseTW]: {
    home: '首頁', records: '翻譯紀錄', receiptRecords: '收據紀錄', instantRecords: '一拍即翻紀錄', favorites: '收藏', my: '我的',
    totalPaidUsers: '目前 PRO 用戶', notificationsComingSoon: '通知功能即將推出', menu: '選單', settings: '設定', help: '操作教學',
    map: '地圖探索', theme: '切換主題', logout: '登出', upgrade: '升級 PRO', menuSource: '拍攝／上傳菜單',
  },
  [TargetLanguage.ChineseHK]: {
    home: '首頁', records: '翻譯紀錄', receiptRecords: '收據紀錄', instantRecords: '一拍即翻紀錄', favorites: '收藏', my: '我的',
    totalPaidUsers: '目前 PRO 用戶', notificationsComingSoon: '通知功能即將推出', menu: '選單', settings: '設定', help: '操作教學',
    map: '地圖探索', theme: '切換主題', logout: '登出', upgrade: '升級 PRO', menuSource: '拍攝／上載餐牌',
  },
  [TargetLanguage.English]: {
    home: 'Home', records: 'Translation history', receiptRecords: 'Receipt history', instantRecords: 'One-tap translation', favorites: 'Favorites', my: 'My',
    totalPaidUsers: 'Current PRO users', notificationsComingSoon: 'Notifications are coming soon', menu: 'Menu', settings: 'Settings', help: 'How to use',
    map: 'Explore map', theme: 'Switch theme', logout: 'Log out', upgrade: 'Upgrade to PRO', menuSource: 'Take / Upload Menu',
  },
  [TargetLanguage.Japanese]: {
    home: 'ホーム', records: '翻訳履歴', receiptRecords: 'レシート履歴', instantRecords: 'ワンタップ翻訳履歴', favorites: 'お気に入り', my: 'マイページ',
    totalPaidUsers: '現在のPROユーザー', notificationsComingSoon: '通知機能は近日公開', menu: 'メニュー', settings: '設定', help: '使い方',
    map: '地図を探索', theme: 'テーマ切替', logout: 'ログアウト', upgrade: 'PROにアップグレード', menuSource: 'メニューを撮影／アップロード',
  },
  [TargetLanguage.Korean]: {
    home: '홈', records: '번역 기록', receiptRecords: '영수증 기록', instantRecords: '원터치 번역 기록', favorites: '즐겨찾기', my: '내 정보',
    totalPaidUsers: '현재 PRO 사용자', notificationsComingSoon: '알림 기능 준비 중', menu: '메뉴', settings: '설정', help: '사용 방법',
    map: '지도 탐색', theme: '테마 전환', logout: '로그아웃', upgrade: 'PRO 업그레이드', menuSource: '메뉴 촬영／업로드',
  },
  [TargetLanguage.Thai]: {
    home: 'หน้าหลัก', records: 'ประวัติการแปล', receiptRecords: 'ประวัติใบเสร็จ', instantRecords: 'ประวัติแปลทันที', favorites: 'รายการโปรด', my: 'ของฉัน',
    totalPaidUsers: 'ผู้ใช้ PRO ปัจจุบัน', notificationsComingSoon: 'ฟีเจอร์แจ้งเตือนเร็ว ๆ นี้', menu: 'เมนู', settings: 'การตั้งค่า', help: 'วิธีใช้งาน',
    map: 'สำรวจแผนที่', theme: 'เปลี่ยนธีม', logout: 'ออกจากระบบ', upgrade: 'อัปเกรดเป็น PRO', menuSource: 'ถ่ายภาพ／อัปโหลดเมนู',
  },
  [TargetLanguage.Vietnamese]: {
    home: 'Trang chủ', records: 'Lịch sử dịch', receiptRecords: 'Lịch sử hóa đơn', instantRecords: 'Lịch sử dịch một chạm', favorites: 'Yêu thích', my: 'Của tôi',
    totalPaidUsers: 'Người dùng PRO hiện tại', notificationsComingSoon: 'Tính năng thông báo sắp ra mắt', menu: 'Menu', settings: 'Cài đặt', help: 'Hướng dẫn sử dụng',
    map: 'Khám phá bản đồ', theme: 'Đổi giao diện', logout: 'Đăng xuất', upgrade: 'Nâng cấp PRO', menuSource: 'Chụp／tải thực đơn lên',
  },
  [TargetLanguage.Indonesian]: {
    home: 'Beranda', records: 'Riwayat Terjemahan', receiptRecords: 'Riwayat Struk', instantRecords: 'Riwayat Terjemahan Sekali Ketuk', favorites: 'Favorit', my: 'Saya',
    totalPaidUsers: 'Pengguna PRO saat ini', notificationsComingSoon: 'Fitur notifikasi segera hadir', menu: 'Menu', settings: 'Pengaturan', help: 'Panduan penggunaan',
    map: 'Jelajahi peta', theme: 'Ganti tema', logout: 'Keluar', upgrade: 'Tingkatkan ke PRO', menuSource: 'Ambil／unggah menu',
  },
  [TargetLanguage.French]: {
    home: 'Accueil', records: 'Historique des traductions', receiptRecords: 'Historique des reçus', instantRecords: 'Traduction instantanée', favorites: 'Favoris', my: 'Mon compte',
    totalPaidUsers: 'Utilisateurs PRO actuels', notificationsComingSoon: 'Les notifications arrivent bientôt', menu: 'Menu', settings: 'Paramètres', help: 'Guide d’utilisation',
    map: 'Explorer la carte', theme: 'Changer de thème', logout: 'Déconnexion', upgrade: 'Passer à PRO', menuSource: 'Photographier／importer le menu',
  },
  [TargetLanguage.Spanish]: {
    home: 'Inicio', records: 'Historial de traducciones', receiptRecords: 'Historial de recibos', instantRecords: 'Traducción en un toque', favorites: 'Favoritos', my: 'Mi cuenta',
    totalPaidUsers: 'Usuarios PRO actuales', notificationsComingSoon: 'Las notificaciones estarán disponibles pronto', menu: 'Menú', settings: 'Ajustes', help: 'Guía de uso',
    map: 'Explorar mapa', theme: 'Cambiar tema', logout: 'Cerrar sesión', upgrade: 'Mejorar a PRO', menuSource: 'Fotografiar／subir menú',
  },
  [TargetLanguage.Filipino]: {
    home: 'Home', records: 'Kasaysayan ng pagsasalin', receiptRecords: 'Mga resibo', instantRecords: 'One-tap na pagsasalin', favorites: 'Mga paborito', my: 'Akin',
    totalPaidUsers: 'Kasalukuyang PRO user', notificationsComingSoon: 'Malapit nang ilunsad ang mga notification', menu: 'Menu', settings: 'Mga Setting', help: 'Gabay sa paggamit',
    map: 'Tuklasin ang mapa', theme: 'Palitan ang tema', logout: 'Mag-log out', upgrade: 'Mag-upgrade sa PRO', menuSource: 'Kunan／mag-upload ng menu',
  },
  [TargetLanguage.German]: {
    home: 'Startseite', records: 'Übersetzungsverlauf', receiptRecords: 'Belegverlauf', instantRecords: 'Ein-Tipp-Übersetzung', favorites: 'Favoriten', my: 'Mein Bereich',
    totalPaidUsers: 'Aktuelle PRO-Nutzer', notificationsComingSoon: 'Benachrichtigungen folgen in Kürze', menu: 'Menü', settings: 'Einstellungen', help: 'Anleitung',
    map: 'Karte entdecken', theme: 'Design wechseln', logout: 'Abmelden', upgrade: 'Auf PRO upgraden', menuSource: 'Menü fotografieren／hochladen',
  },
  [TargetLanguage.Russian]: {
    home: 'Главная', records: 'История переводов', receiptRecords: 'История чеков', instantRecords: 'Перевод в одно касание', favorites: 'Избранное', my: 'Мой профиль',
    totalPaidUsers: 'Текущие пользователи PRO', notificationsComingSoon: 'Уведомления скоро появятся', menu: 'Меню', settings: 'Настройки', help: 'Руководство',
    map: 'Карта заведений', theme: 'Сменить тему', logout: 'Выйти', upgrade: 'Перейти на PRO', menuSource: 'Снять／загрузить меню',
  },
  [TargetLanguage.Polish]: {
    home: 'Strona główna', records: 'Historia tłumaczeń', receiptRecords: 'Historia paragonów', instantRecords: 'Tłumaczenie jednym dotknięciem', favorites: 'Ulubione', my: 'Moje konto',
    totalPaidUsers: 'Obecni użytkownicy PRO', notificationsComingSoon: 'Powiadomienia już wkrótce', menu: 'Menu', settings: 'Ustawienia', help: 'Instrukcja',
    map: 'Odkrywaj mapę', theme: 'Zmień motyw', logout: 'Wyloguj', upgrade: 'Przejdź na PRO', menuSource: 'Zrób／prześlij menu',
  },
  [TargetLanguage.Malay]: {
    home: 'Laman utama', records: 'Sejarah terjemahan', receiptRecords: 'Sejarah resit', instantRecords: 'Terjemahan satu sentuhan', favorites: 'Kegemaran', my: 'Saya',
    totalPaidUsers: 'Pengguna PRO saat ini', notificationsComingSoon: 'Ciri pemberitahuan akan datang', menu: 'Menu', settings: 'Tetapan', help: 'Panduan penggunaan',
    map: 'Teroka peta', theme: 'Tukar tema', logout: 'Log keluar', upgrade: 'Naik taraf ke PRO', menuSource: 'Ambil／muat naik menu',
  },
  [TargetLanguage.Italian]: {
    home: 'Home', records: 'Cronologia traduzioni', receiptRecords: 'Cronologia ricevute', instantRecords: 'Traduzione con un tocco', favorites: 'Preferiti', my: 'Il mio profilo',
    totalPaidUsers: 'Utenti PRO attuali', notificationsComingSoon: 'Le notifiche arriveranno presto', menu: 'Menu', settings: 'Impostazioni', help: 'Guida',
    map: 'Esplora la mappa', theme: 'Cambia tema', logout: 'Esci', upgrade: 'Passa a PRO', menuSource: 'Scatta／carica menu',
  },
  [TargetLanguage.Portuguese]: {
    home: 'Início', records: 'Histórico de traduções', receiptRecords: 'Histórico de recibos', instantRecords: 'Tradução com um toque', favorites: 'Favoritos', my: 'Minha conta',
    totalPaidUsers: 'Usuários PRO atuais', notificationsComingSoon: 'As notificações estarão disponíveis em breve', menu: 'Menu', settings: 'Definições', help: 'Guia de utilização',
    map: 'Explorar mapa', theme: 'Alterar tema', logout: 'Terminar sessão', upgrade: 'Atualizar para PRO', menuSource: 'Fotografar／enviar menu',
  },
};

export const getHomeCopy = (language: TargetLanguage): HomeCopy =>
  HOME_COPY[language] || HOME_COPY[TargetLanguage.English]!;
