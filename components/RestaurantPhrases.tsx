'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, MessageCircle, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { TargetLanguage } from '../types';
import { useTTS, getLanguageCode, detectedLangToTargetLang } from '../hooks/useTTS';

interface RestaurantPhrasesProps {
    isOpen: boolean;
    onClose: () => void;
    detectedLanguage?: string; // 菜單的偵測語言（可選，首頁模式時無此值）
    userLanguage: TargetLanguage; // 用戶的語言
}

interface PhraseCategory {
    icon: string;
    nameKey: string;
    phrases: {
        key: string;
        translations: Record<string, string>;
    }[];
}

// 可選的當地語言列表（首頁模式用）
const LOCAL_LANG_OPTIONS = [
    { value: '日本語', label: '🇯🇵 日本語', labelZH: '🇯🇵 日文' },
    { value: '한국어', label: '🇰🇷 한국어', labelZH: '🇰🇷 韓文' },
    { value: 'English', label: '🇺🇸 English', labelZH: '🇺🇸 英文' },
    { value: 'Français', label: '🇫🇷 Français', labelZH: '🇫🇷 法文' },
    { value: 'Español', label: '🇪🇸 Español', labelZH: '🇪🇸 西班牙文' },
    { value: 'Deutsch', label: '🇩🇪 Deutsch', labelZH: '🇩🇪 德文' },
    { value: 'ไทย', label: '🇹🇭 ไทย', labelZH: '🇹🇭 泰文' },
    { value: 'Tiếng Việt', label: '🇻🇳 Tiếng Việt', labelZH: '🇻🇳 越南文' },
    { value: 'Русский', label: '🇷🇺 Русский', labelZH: '🇷🇺 俄文' },
    { value: 'Bahasa Indonesia', label: '🇮🇩 Bahasa Indonesia', labelZH: '🇮🇩 印尼文' },
    { value: 'Tagalog', label: '🇵🇭 Tagalog', labelZH: '🇵🇭 菲律賓文' },
    { value: 'Polski', label: '🇵🇱 Polski', labelZH: '🇵🇱 波蘭文' },
    { value: 'Bahasa Melayu', label: '🇲🇾 Bahasa Melayu', labelZH: '🇲🇾 馬來文' },
    { value: 'Italiano', label: '🇮🇹 Italiano', labelZH: '🇮🇹 義大利文' },
    { value: 'Português', label: '🇵🇹 Português', labelZH: '🇵🇹 葡萄牙文' },
];

// UI 文字翻譯
const UI_TEXT: Record<string, { title: string; subtitle: string; tapToPlay: string; yourLang: string; localLang: string; selectLocal: string }> = {
    '繁體中文': { title: '餐廳常用語', subtitle: '點擊播放當地語言', tapToPlay: '點擊 🔊 播放', yourLang: '你的語言', localLang: '當地語言', selectLocal: '選擇當地語言' },
    '繁體中文-HK': { title: '餐廳常用語', subtitle: '點擊播放當地語言', tapToPlay: '點擊 🔊 播放', yourLang: '你的語言', localLang: '當地語言', selectLocal: '選擇當地語言' },
    'English': { title: 'Restaurant Phrases', subtitle: 'Tap to play in local language', tapToPlay: 'Tap 🔊 to play', yourLang: 'Your language', localLang: 'Local language', selectLocal: 'Select local language' },
    '한국어': { title: '식당 회화', subtitle: '탭하여 현지 언어로 재생', tapToPlay: '🔊 탭하여 재생', yourLang: '당신의 언어', localLang: '현지 언어', selectLocal: '현지 언어 선택' },
    '日本語': { title: 'レストラン会話', subtitle: 'タップして現地語で再生', tapToPlay: '🔊 をタップ', yourLang: 'あなたの言語', localLang: '現地語', selectLocal: '現地語を選択' },
    'Français': { title: 'Phrases de restaurant', subtitle: 'Appuyez pour écouter', tapToPlay: 'Appuyez sur 🔊', yourLang: 'Votre langue', localLang: 'Langue locale', selectLocal: 'Choisir la langue' },
    'Español': { title: 'Frases de restaurante', subtitle: 'Toca para reproducir', tapToPlay: 'Toca 🔊', yourLang: 'Tu idioma', localLang: 'Idioma local', selectLocal: 'Elegir idioma' },
    'ไทย': { title: 'ประโยคในร้านอาหาร', subtitle: 'แตะเพื่อเล่นภาษาท้องถิ่น', tapToPlay: 'แตะ 🔊 เพื่อเล่น', yourLang: 'ภาษาของคุณ', localLang: 'ภาษาท้องถิ่น', selectLocal: 'เลือกภาษา' },
    'Tiếng Việt': { title: 'Câu thường dùng', subtitle: 'Nhấn để phát bằng ngôn ngữ địa phương', tapToPlay: 'Nhấn 🔊 để phát', yourLang: 'Ngôn ngữ của bạn', localLang: 'Ngôn ngữ địa phương', selectLocal: 'Chọn ngôn ngữ' },
    'Deutsch': { title: 'Restaurant-Phrasen', subtitle: 'Tippen zum Abspielen', tapToPlay: '🔊 antippen', yourLang: 'Ihre Sprache', localLang: 'Landessprache', selectLocal: 'Sprache wählen' },
    'Русский': { title: 'Фразы для ресторана', subtitle: 'Нажмите для воспроизведения', tapToPlay: 'Нажмите 🔊', yourLang: 'Ваш язык', localLang: 'Местный язык', selectLocal: 'Выбрать язык' },
    'Tagalog': { title: 'Mga Parirala sa Restaurant', subtitle: 'I-tap para i-play', tapToPlay: 'I-tap ang 🔊', yourLang: 'Iyong wika', localLang: 'Lokal na wika', selectLocal: 'Pumili ng wika' },
    'Bahasa Indonesia': { title: 'Frasa Restoran', subtitle: 'Ketuk untuk memutar', tapToPlay: 'Ketuk 🔊', yourLang: 'Bahasa Anda', localLang: 'Bahasa lokal', selectLocal: 'Pilih bahasa' },
    'Polski': { title: 'Zwroty w restauracji', subtitle: 'Stuknij, aby odtworzyć', tapToPlay: 'Stuknij 🔊, aby odtworzyć', yourLang: 'Twój język', localLang: 'Język lokalny', selectLocal: 'Wybierz język' },
    'Bahasa Melayu': { title: 'Frasa Restoran', subtitle: 'Ketik untuk memainkan', tapToPlay: 'Ketik 🔊 untuk memainkan', yourLang: 'Bahasa anda', localLang: 'Bahasa tempatan', selectLocal: 'Pilih bahasa' },
    'Italiano': { title: 'Frasi Ristorante', subtitle: 'Tocca per riprodurre', tapToPlay: 'Tocca 🔊 per riprodurre', yourLang: 'La tua lingua', localLang: 'Lingua locale', selectLocal: 'Scegli la lingua' },
    'Português': { title: 'Frases de Restaurante', subtitle: 'Toque para ouvir', tapToPlay: 'Toque 🔊 para ouvir', yourLang: 'O seu idioma', localLang: 'Idioma local', selectLocal: 'Escolha o idioma' }
};

// 短語資料庫 - 更口語、更道地的翻譯
const PHRASE_CATEGORIES: PhraseCategory[] = [
    {
        icon: '👋',
        nameKey: 'greeting',
        phrases: [
            {
                key: 'excuse_me',
                translations: {
                    '繁體中文': '不好意思',
                    '繁體中文-HK': '唔好意思',
                    'English': 'Excuse me',
                    '한국어': '저기요!',
                    '日本語': 'すみません！',
                    'Français': 'Excusez-moi !',
                    'Español': '¡Disculpe!',
                    'ไทย': 'ขอโทษครับ/ค่ะ',
                    'Tiếng Việt': 'Anh/chị ơi!',
                    'Deutsch': 'Entschuldigung!',
                    'Русский': 'Извините!',
                    'Tagalog': 'Excuse po!',
                    'Bahasa Indonesia': 'Permisi!',
                    'Polski': 'Przepraszam!',
                    'Bahasa Melayu': 'Maafkan saya!',
                    'Italiano': 'Scusi!',
                    'Português': 'Com licença!',
                }
            },
            {
                key: 'table_for',
                translations: {
                    '繁體中文': '我們有__個人',
                    '繁體中文-HK': '我哋有__個人',
                    'English': 'Table for __, please',
                    '한국어': '__명이요',
                    '日本語': '__人なんですけど',
                    'Français': 'Pour __, s\'il vous plaît',
                    'Español': 'Somos __',
                    'ไทย': '__ที่นั่งครับ/ค่ะ',
                    'Tiếng Việt': 'Cho __ người ạ',
                    'Deutsch': 'Wir sind __ Personen',
                    'Русский': 'Нас __ человек',
                    'Tagalog': '__ kami po',
                    'Bahasa Indonesia': 'Kami __ orang',
                    'Polski': 'Stolik dla __ osób',
                    'Bahasa Melayu': 'Meja untuk __ orang',
                    'Italiano': 'Un tavolo per __, per favore',
                    'Português': 'Uma mesa para __, por favor',
                }
            },
            {
                key: 'menu_please',
                translations: {
                    '繁體中文': '請給我菜單',
                    '繁體中文-HK': '唔該畀個餐牌我',
                    'English': 'Can I see the menu?',
                    '한국어': '메뉴판 좀 주세요',
                    '日本語': 'メニューお願いします',
                    'Français': 'La carte, s\'il vous plaît',
                    'Español': '¿Me da la carta?',
                    'ไทย': 'ขอเมนูหน่อยครับ/ค่ะ',
                    'Tiếng Việt': 'Cho tôi xem menu ạ',
                    'Deutsch': 'Die Karte, bitte',
                    'Русский': 'Можно меню?',
                    'Tagalog': 'Patingin po ng menu',
                    'Bahasa Indonesia': 'Boleh lihat menunya?',
                    'Polski': 'Poproszę menu',
                    'Bahasa Melayu': 'Boleh saya lihat menu?',
                    'Italiano': 'Posso avere il menù?',
                    'Português': 'O menu, por favor',
                }
            },
            {
                key: 'reservation',
                translations: {
                    '繁體中文': '我有訂位，姓__',
                    '繁體中文-HK': '我有訂位，姓__',
                    'English': 'I have a reservation under __',
                    '한국어': '__로 예약했어요',
                    '日本語': '予約してるんですけど、__です',
                    'Français': 'J\'ai réservé au nom de __',
                    'Español': 'Tengo reserva a nombre de __',
                    'ไทย': 'จองไว้ชื่อ__ครับ/ค่ะ',
                    'Tiếng Việt': 'Tôi đã đặt bàn, tên __',
                    'Deutsch': 'Ich habe reserviert, auf den Namen __',
                    'Русский': 'У меня бронь на имя __',
                    'Tagalog': 'May reservation po ako, pangalan __',
                    'Bahasa Indonesia': 'Saya sudah reservasi, atas nama __',
                    'Polski': 'Mam rezerwację na nazwisko __',
                    'Bahasa Melayu': 'Saya ada tempahan atas nama __',
                    'Italiano': 'Ho una prenotazione a nome __',
                    'Português': 'Tenho uma reserva em nome de __',
                }
            },
            {
                key: 'wait_time',
                translations: {
                    '繁體中文': '要等多久？',
                    '繁體中文-HK': '要等幾耐？',
                    'English': 'How long is the wait?',
                    '한국어': '얼마나 기다려야 돼요?',
                    '日本語': 'どれくらい待ちますか？',
                    'Français': 'C\'est combien l\'attente ?',
                    'Español': '¿Cuánto hay que esperar?',
                    'ไทย': 'ต้องรอนานไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Phải đợi bao lâu ạ?',
                    'Deutsch': 'Wie lange ist die Wartezeit?',
                    'Русский': 'Сколько ждать?',
                    'Tagalog': 'Gaano po katagal ang hintay?',
                    'Bahasa Indonesia': 'Antri berapa lama ya?',
                    'Polski': 'Jak długo trzeba czekać?',
                    'Bahasa Melayu': 'Berapa lama kena tunggu?',
                    'Italiano': 'Quanto c\'è da aspettare?',
                    'Português': 'Quanto tempo de espera?',
                }
            },
        ]
    },
    {
        icon: '🍽️',
        nameKey: 'ordering',
        phrases: [
            {
                key: 'i_want_this',
                translations: {
                    '繁體中文': '我要這個',
                    '繁體中文-HK': '我要呢個',
                    'English': 'I\'ll have this one',
                    '한국어': '이거 주세요',
                    '日本語': 'これください',
                    'Français': 'Je prends ça',
                    'Español': 'Quiero esto',
                    'ไทย': 'เอาอันนี้ครับ/ค่ะ',
                    'Tiếng Việt': 'Cho tôi món này',
                    'Deutsch': 'Das nehme ich',
                    'Русский': 'Мне вот это',
                    'Tagalog': 'Ito na lang po',
                    'Bahasa Indonesia': 'Saya mau yang ini',
                    'Polski': 'Poproszę to',
                    'Bahasa Melayu': 'Saya nak yang ini',
                    'Italiano': 'Prendo questo',
                    'Português': 'Quero este',
                }
            },
            {
                key: 'recommend',
                translations: {
                    '繁體中文': '你們推薦什麼？',
                    '繁體中文-HK': '有咩推介？',
                    'English': 'What\'s good here?',
                    '한국어': '여기 뭐가 맛있어요?',
                    '日本語': 'おすすめは何ですか？',
                    'Français': 'Qu\'est-ce qui est bon ici ?',
                    'Español': '¿Qué me recomienda?',
                    'ไทย': 'มีอะไรอร่อยบ้างครับ/ค่ะ',
                    'Tiếng Việt': 'Ở đây có gì ngon ạ?',
                    'Deutsch': 'Was ist hier gut?',
                    'Русский': 'Что посоветуете?',
                    'Tagalog': 'Ano po ang masarap dito?',
                    'Bahasa Indonesia': 'Yang enak apa ya?',
                    'Polski': 'Co polecacie?',
                    'Bahasa Melayu': 'Apa yang sedap di sini?',
                    'Italiano': 'Cosa mi consiglia?',
                    'Português': 'O que recomenda?',
                }
            },
            {
                key: 'popular',
                translations: {
                    '繁體中文': '什麼最熱門？',
                    '繁體中文-HK': '邊個最受歡迎？',
                    'English': 'What\'s your most popular dish?',
                    '한국어': '제일 인기 있는 메뉴가 뭐예요?',
                    '日本語': '一番人気は何ですか？',
                    'Français': 'C\'est quoi votre plat star ?',
                    'Español': '¿Cuál es el plato estrella?',
                    'ไทย': 'เมนูยอดนิยมคืออะไรครับ/ค่ะ',
                    'Tiếng Việt': 'Món nào bán chạy nhất ạ?',
                    'Deutsch': 'Was ist Ihr beliebtestes Gericht?',
                    'Русский': 'Что у вас самое популярное?',
                    'Tagalog': 'Ano po ang pinaka-sikat dito?',
                    'Bahasa Indonesia': 'Yang paling laris apa?',
                    'Polski': 'Które danie jest najpopularniejsze?',
                    'Bahasa Melayu': 'Apa menu paling popular?',
                    'Italiano': 'Qual è il piatto più richiesto?',
                    'Português': 'Qual é o prato mais popular?',
                }
            },
            {
                key: 'not_spicy',
                translations: {
                    '繁體中文': '不要辣',
                    '繁體中文-HK': '唔好辣',
                    'English': 'Not spicy, please',
                    '한국어': '안 맵게 해주세요',
                    '日本語': '辛くしないでください',
                    'Français': 'Pas piquant, s\'il vous plaît',
                    'Español': 'Sin picante, por favor',
                    'ไทย': 'ไม่เผ็ดครับ/ค่ะ',
                    'Tiếng Việt': 'Không cay nha',
                    'Deutsch': 'Nicht scharf, bitte',
                    'Русский': 'Не острое, пожалуйста',
                    'Tagalog': 'Hindi po maanghang',
                    'Bahasa Indonesia': 'Jangan pedas ya',
                    'Polski': 'Poproszę nieostre',
                    'Bahasa Melayu': 'Tak nak pedas',
                    'Italiano': 'Non piccante, per favore',
                    'Português': 'Sem pimenta, por favor',
                }
            },
            {
                key: 'less_salt',
                translations: {
                    '繁體中文': '少鹽',
                    '繁體中文-HK': '少鹽',
                    'English': 'Less salt, please',
                    '한국어': '싱겁게 해주세요',
                    '日本語': '塩少なめでお願いします',
                    'Français': 'Moins salé, s\'il vous plaît',
                    'Español': 'Poca sal, por favor',
                    'ไทย': 'เกลือน้อยครับ/ค่ะ',
                    'Tiếng Việt': 'Ít muối giùm',
                    'Deutsch': 'Weniger Salz, bitte',
                    'Русский': 'Поменьше соли',
                    'Tagalog': 'Konting asin lang po',
                    'Bahasa Indonesia': 'Kurangi garamnya ya',
                    'Polski': 'Mniej soli',
                    'Bahasa Melayu': 'Kurangkan garam',
                    'Italiano': 'Meno sale, per favore',
                    'Português': 'Menos sal, por favor',
                }
            },
            {
                key: 'one_more',
                translations: {
                    '繁體中文': '再來一份這個',
                    '繁體中文-HK': '再嚟多一份呢個',
                    'English': 'One more of this, please',
                    '한국어': '이거 하나 더 주세요',
                    '日本語': 'これもう一つお願いします',
                    'Français': 'Encore un, s\'il vous plaît',
                    'Español': 'Otro más de esto',
                    'ไทย': 'เอาอันนี้อีกหนึ่งครับ/ค่ะ',
                    'Tiếng Việt': 'Cho thêm một phần này nữa',
                    'Deutsch': 'Davon noch eins, bitte',
                    'Русский': 'Ещё одну порцию этого',
                    'Tagalog': 'Isa pa po nito',
                    'Bahasa Indonesia': 'Tambah satu lagi yang ini',
                    'Polski': 'Poproszę jeszcze jedno takie',
                    'Bahasa Melayu': 'Bagi satu lagi yang ini',
                    'Italiano': 'Un altro di questo, per favore',
                    'Português': 'Mais um deste, por favor',
                }
            },
            {
                key: 'ready_order',
                translations: {
                    '繁體中文': '我要點餐了',
                    '繁體中文-HK': '我要落單啦',
                    'English': 'We\'re ready to order',
                    '한국어': '주문할게요',
                    '日本語': '注文お願いします',
                    'Français': 'On est prêts à commander',
                    'Español': 'Ya sabemos qué queremos',
                    'ไทย': 'สั่งเลยครับ/ค่ะ',
                    'Tiếng Việt': 'Cho gọi món ạ',
                    'Deutsch': 'Wir möchten bestellen',
                    'Русский': 'Мы готовы заказать',
                    'Tagalog': 'Order na po kami',
                    'Bahasa Indonesia': 'Mau pesan ya',
                    'Polski': 'Jesteśmy gotowi złożyć zamówienie',
                    'Bahasa Melayu': 'Kami dah sedia nak pesan',
                    'Italiano': 'Siamo pronti per ordinare',
                    'Português': 'Estamos prontos para pedir',
                }
            },
        ]
    },
    {
        icon: '⚠️',
        nameKey: 'allergy',
        phrases: [
            {
                key: 'allergic_peanut',
                translations: {
                    '繁體中文': '我對花生過敏',
                    '繁體中文-HK': '我對花生敏感',
                    'English': 'I\'m allergic to peanuts',
                    '한국어': '땅콩 알레르기 있어요',
                    '日本語': 'ピーナッツアレルギーがあるんです',
                    'Français': 'Je suis allergique aux cacahuètes',
                    'Español': 'Soy alérgico/a a los cacahuetes',
                    'ไทย': 'แพ้ถั่วลิสงครับ/ค่ะ',
                    'Tiếng Việt': 'Tôi bị dị ứng đậu phộng',
                    'Deutsch': 'Ich habe eine Erdnussallergie',
                    'Русский': 'У меня аллергия на арахис',
                    'Tagalog': 'Allergic po ako sa mani',
                    'Bahasa Indonesia': 'Saya alergi kacang tanah',
                    'Polski': 'Mam alergię na orzeszki ziemne',
                    'Bahasa Melayu': 'Saya alah kepada kacang tanah',
                    'Italiano': 'Sono allergico/a alle arachidi',
                    'Português': 'Sou alérgico/a a amendoim',
                }
            },
            {
                key: 'allergic_seafood',
                translations: {
                    '繁體中文': '我對海鮮過敏',
                    '繁體中文-HK': '我對海鮮敏感',
                    'English': 'I can\'t eat seafood',
                    '한국어': '해산물 못 먹어요',
                    '日本語': '海鮮アレルギーがあるんです',
                    'Français': 'Je ne peux pas manger de fruits de mer',
                    'Español': 'No puedo comer mariscos',
                    'ไทย': 'แพ้อาหารทะเลครับ/ค่ะ',
                    'Tiếng Việt': 'Tôi dị ứng hải sản',
                    'Deutsch': 'Ich kann keine Meeresfrüchte essen',
                    'Русский': 'Мне нельзя морепродукты',
                    'Tagalog': 'Hindi po ako pwede sa seafood',
                    'Bahasa Indonesia': 'Saya alergi seafood',
                    'Polski': 'Nie mogę jeść owoców morza',
                    'Bahasa Melayu': 'Saya tak boleh makan makanan laut',
                    'Italiano': 'Non posso mangiare frutti di mare',
                    'Português': 'Não posso comer frutos do mar',
                }
            },
            {
                key: 'vegetarian',
                translations: {
                    '繁體中文': '有素食嗎？',
                    '繁體中文-HK': '有冇素食㗎？',
                    'English': 'Do you have anything vegetarian?',
                    '한국어': '채식 메뉴 있나요?',
                    '日本語': 'ベジタリアンメニューありますか？',
                    'Français': 'Vous avez des plats végétariens ?',
                    'Español': '¿Tienen algo vegetariano?',
                    'ไทย': 'มีเมนูเจไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Có món chay không ạ?',
                    'Deutsch': 'Haben Sie was Vegetarisches?',
                    'Русский': 'Есть что-нибудь вегетарианское?',
                    'Tagalog': 'Meron po ba kayong vegetarian?',
                    'Bahasa Indonesia': 'Ada menu vegetarian nggak?',
                    'Polski': 'Czy macie dania wegetariańskie?',
                    'Bahasa Melayu': 'Ada makanan vegetarian?',
                    'Italiano': 'Avete opzioni vegetariane?',
                    'Português': 'Tem opções vegetarianas?',
                }
            },
            {
                key: 'no_pork',
                translations: {
                    '繁體中文': '不能吃豬肉',
                    '繁體中文-HK': '唔食得豬肉',
                    'English': 'I can\'t eat pork',
                    '한국어': '돼지고기 못 먹어요',
                    '日本語': '豚肉は食べられないんです',
                    'Français': 'Je ne mange pas de porc',
                    'Español': 'No como cerdo',
                    'ไทย': 'ไม่ทานหมูครับ/ค่ะ',
                    'Tiếng Việt': 'Tôi không ăn thịt heo',
                    'Deutsch': 'Ich esse kein Schweinefleisch',
                    'Русский': 'Я не ем свинину',
                    'Tagalog': 'Hindi po ako kumakain ng baboy',
                    'Bahasa Indonesia': 'Saya nggak makan babi',
                    'Polski': 'Nie jem wieprzowiny',
                    'Bahasa Melayu': 'Saya tak makan babi',
                    'Italiano': 'Non mangio maiale',
                    'Português': 'Não como carne de porco',
                }
            },
            {
                key: 'gluten_free',
                translations: {
                    '繁體中文': '有無麩質的餐點嗎？',
                    '繁體中文-HK': '有冇無麩質嘅餐點？',
                    'English': 'Do you have gluten-free options?',
                    '한국어': '글루텐 프리 메뉴 있어요?',
                    '日本語': 'グルテンフリーのメニューありますか？',
                    'Français': 'Vous avez des plats sans gluten ?',
                    'Español': '¿Tienen opciones sin gluten?',
                    'ไทย': 'มีเมนูปลอดกลูเตนไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Có món không chứa gluten không?',
                    'Deutsch': 'Haben Sie glutenfreie Optionen?',
                    'Русский': 'Есть безглютеновые блюда?',
                    'Tagalog': 'May gluten-free po ba kayo?',
                    'Bahasa Indonesia': 'Ada pilihan bebas gluten?',
                    'Polski': 'Czy macie opcje bezglutenowe?',
                    'Bahasa Melayu': 'Ada pilihan bebas gluten?',
                    'Italiano': 'Avete opzioni senza glutine?',
                    'Português': 'Têm opções sem glúten?',
                }
            },
        ]
    },
    {
        icon: '🧊',
        nameKey: 'drinks',
        phrases: [
            {
                key: 'water',
                translations: {
                    '繁體中文': '請給我一杯水',
                    '繁體中文-HK': '唔該一杯水',
                    'English': 'Can I get some water?',
                    '한국어': '물 좀 주세요',
                    '日本語': 'お水ください',
                    'Français': 'De l\'eau, s\'il vous plaît',
                    'Español': '¿Me trae agua?',
                    'ไทย': 'ขอน้ำเปล่าครับ/ค่ะ',
                    'Tiếng Việt': 'Cho tôi ly nước ạ',
                    'Deutsch': 'Wasser, bitte',
                    'Русский': 'Можно воды?',
                    'Tagalog': 'Pabigay po ng tubig',
                    'Bahasa Indonesia': 'Minta air putih dong',
                    'Polski': 'Poproszę wodę',
                    'Bahasa Melayu': 'Boleh bagi air kosong?',
                    'Italiano': 'Dell\'acqua, per favore',
                    'Português': 'Água, por favor',
                }
            },
            {
                key: 'beer',
                translations: {
                    '繁體中文': '來一杯啤酒',
                    '繁體中文-HK': '一杯啤酒唔該',
                    'English': 'I\'ll have a beer',
                    '한국어': '맥주 한 잔 주세요',
                    '日本語': '生ビールください',
                    'Français': 'Une bière, s\'il vous plaît',
                    'Español': 'Ponme una cerveza',
                    'ไทย': 'ขอเบียร์หนึ่งแก้วครับ/ค่ะ',
                    'Tiếng Việt': 'Cho một ly bia ạ',
                    'Deutsch': 'Ein Bier, bitte',
                    'Русский': 'Мне пиво, пожалуйста',
                    'Tagalog': 'Isang beer po',
                    'Bahasa Indonesia': 'Bir satu ya',
                    'Polski': 'Poproszę piwo',
                    'Bahasa Melayu': 'Bagi satu bir',
                    'Italiano': 'Cameriere, una birra',
                    'Português': 'Uma cerveja, por favor',
                }
            },
            {
                key: 'no_ice',
                translations: {
                    '繁體中文': '不要冰',
                    '繁體中文-HK': '走冰',
                    'English': 'No ice, please',
                    '한국어': '얼음 빼주세요',
                    '日本語': '氷なしで',
                    'Français': 'Sans glaçons',
                    'Español': 'Sin hielo',
                    'ไทย': 'ไม่ใส่น้ำแข็งครับ/ค่ะ',
                    'Tiếng Việt': 'Không đá nha',
                    'Deutsch': 'Ohne Eis',
                    'Русский': 'Без льда',
                    'Tagalog': 'Walang yelo po',
                    'Bahasa Indonesia': 'Tanpa es ya',
                    'Polski': 'Bez lodu',
                    'Bahasa Melayu': 'Tanpa ais',
                    'Italiano': 'Senza ghiaccio',
                    'Português': 'Sem gelo',
                }
            },
            {
                key: 'local_drink',
                translations: {
                    '繁體中文': '你們有什麼當地特色飲料？',
                    '繁體中文-HK': '有咩特色飲品？',
                    'English': 'Any local specialty drinks?',
                    '한국어': '이 지역 특별한 음료 있어요?',
                    '日本語': 'この地方の特別な飲み物ありますか？',
                    'Français': 'Vous avez des boissons locales ?',
                    'Español': '¿Tienen alguna bebida típica?',
                    'ไทย': 'มีเครื่องดื่มท้องถิ่นไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Có đồ uống đặc sản gì không?',
                    'Deutsch': 'Haben Sie lokale Spezialgetränke?',
                    'Русский': 'Есть какие-нибудь местные напитки?',
                    'Tagalog': 'May local drink po ba kayo?',
                    'Bahasa Indonesia': 'Ada minuman khas daerah?',
                    'Polski': 'Czy macie jakieś lokalne specjały do picia?',
                    'Bahasa Melayu': 'Ada minuman khas tempatan?',
                    'Italiano': 'Avete bevande tipiche locali?',
                    'Português': 'Tem alguma bebida típica local?',
                }
            },
        ]
    },
    {
        icon: '💰',
        nameKey: 'payment',
        phrases: [
            {
                key: 'check_please',
                translations: {
                    '繁體中文': '買單',
                    '繁體中文-HK': '埋單',
                    'English': 'Check, please!',
                    '한국어': '계산이요!',
                    '日本語': 'お会計お願いします！',
                    'Français': 'L\'addition !',
                    'Español': '¡La cuenta!',
                    'ไทย': 'เช็คบิลครับ/ค่ะ',
                    'Tiếng Việt': 'Tính tiền giùm!',
                    'Deutsch': 'Zahlen bitte!',
                    'Русский': 'Счёт, пожалуйста!',
                    'Tagalog': 'Bill po!',
                    'Bahasa Indonesia': 'Minta bon-nya!',
                    'Polski': 'Poproszę rachunek!',
                    'Bahasa Melayu': 'Kira!',
                    'Italiano': 'Il conto, per favore!',
                    'Português': 'A conta, por favor!',
                }
            },
            {
                key: 'card_ok',
                translations: {
                    '繁體中文': '可以刷卡嗎？',
                    '繁體中文-HK': '可以碌卡嗎？',
                    'English': 'Do you take cards?',
                    '한국어': '카드 돼요?',
                    '日本語': 'カード使えますか？',
                    'Français': 'Vous prenez la carte ?',
                    'Español': '¿Aceptan tarjeta?',
                    'ไทย': 'รับบัตรไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Có quẹt thẻ được không?',
                    'Deutsch': 'Kann ich mit Karte zahlen?',
                    'Русский': 'Карту принимаете?',
                    'Tagalog': 'Tumatanggap po ba ng card?',
                    'Bahasa Indonesia': 'Bisa bayar pakai kartu?',
                    'Polski': 'Można płacić kartą?',
                    'Bahasa Melayu': 'Boleh bayar guna kad?',
                    'Italiano': 'Accettate carte di credito?',
                    'Português': 'Aceitam cartão?',
                }
            },
            {
                key: 'separate_bills',
                translations: {
                    '繁體中文': '可以分開算嗎？',
                    '繁體中文-HK': '可以分開計嗎？',
                    'English': 'Can we split the bill?',
                    '한국어': '따로 계산해주세요',
                    '日本語': '別々でお願いします',
                    'Français': 'On peut payer séparément ?',
                    'Español': '¿Podemos pagar por separado?',
                    'ไทย': 'แยกบิลได้ไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Tính riêng được không ạ?',
                    'Deutsch': 'Können wir getrennt zahlen?',
                    'Русский': 'Можно раздельный счёт?',
                    'Tagalog': 'Pwede po bang hiwalay?',
                    'Bahasa Indonesia': 'Bisa bayar terpisah?',
                    'Polski': 'Czy możemy zapłacić osobno?',
                    'Bahasa Melayu': 'Boleh bayar asing-asing?',
                    'Italiano': 'Possiamo pagare separatamente?',
                    'Português': 'Podemos pagar separados?',
                }
            },
            {
                key: 'how_much',
                translations: {
                    '繁體中文': '這個多少錢？',
                    '繁體中文-HK': '呢個幾錢？',
                    'English': 'How much is this?',
                    '한국어': '이거 얼마예요?',
                    '日本語': 'これいくらですか？',
                    'Français': 'C\'est combien ?',
                    'Español': '¿Cuánto cuesta esto?',
                    'ไทย': 'อันนี้เท่าไหร่ครับ/ค่ะ',
                    'Tiếng Việt': 'Cái này bao nhiêu ạ?',
                    'Deutsch': 'Was kostet das?',
                    'Русский': 'Сколько это стоит?',
                    'Tagalog': 'Magkano po ito?',
                    'Bahasa Indonesia': 'Ini berapa ya?',
                    'Polski': 'Ile to kosztuje?',
                    'Bahasa Melayu': 'Ini berapa harga?',
                    'Italiano': 'Quanto costa questo?',
                    'Português': 'Quanto custa isto?',
                }
            },
        ]
    },
    {
        icon: '🎌',
        nameKey: 'dining_culture',
        phrases: [
            {
                key: 'before_meal',
                translations: {
                    '繁體中文': '我開動了',
                    '繁體中文-HK': '我開動啦',
                    'English': 'Let\'s eat! / Bon appétit!',
                    '한국어': '잘 먹겠습니다!',
                    '日本語': 'いただきます！',
                    'Français': 'Bon appétit !',
                    'Español': '¡Buen provecho!',
                    'ไทย': 'กินข้าวกันเถอะ!',
                    'Tiếng Việt': 'Mời mọi người ăn!',
                    'Deutsch': 'Guten Appetit!',
                    'Русский': 'Приятного аппетита!',
                    'Tagalog': 'Kain na tayo!',
                    'Bahasa Indonesia': 'Selamat makan!',
                    'Polski': 'Smacznego!',
                    'Bahasa Melayu': 'Jemput makan!',
                    'Italiano': 'Buon appetito!',
                    'Português': 'Bom apetite!',
                }
            },
            {
                key: 'after_meal',
                translations: {
                    '繁體中文': '謝謝招待，吃得很滿足',
                    '繁體中文-HK': '多謝招待，食得好滿足',
                    'English': 'Thank you for the wonderful meal!',
                    '한국어': '잘 먹었습니다!',
                    '日本語': 'ごちそうさまでした！',
                    'Français': 'C\'était un délice, merci !',
                    'Español': '¡Estuvo delicioso, gracias!',
                    'ไทย': 'อิ่มมากครับ/ค่ะ ขอบคุณ!',
                    'Tiếng Việt': 'Ăn no lắm rồi, cảm ơn!',
                    'Deutsch': 'Das war wunderbar, danke!',
                    'Русский': 'Было очень вкусно, спасибо!',
                    'Tagalog': 'Busog na busog, salamat!',
                    'Bahasa Indonesia': 'Kenyang banget, terima kasih!',
                    'Polski': 'Dziękuję, było pyszne!',
                    'Bahasa Melayu': 'Kenyang alhamdulillah, terima kasih!',
                    'Italiano': 'Era tutto delizioso, grazie!',
                    'Português': 'Estava delicioso, obrigado/a!',
                }
            },
            {
                key: 'cheers',
                translations: {
                    '繁體中文': '乾杯！',
                    '繁體中文-HK': '飲杯！',
                    'English': 'Cheers!',
                    '한국어': '건배!',
                    '日本語': '乾杯！',
                    'Français': 'Santé !',
                    'Español': '¡Salud!',
                    'ไทย': 'ชนแก้ว!',
                    'Tiếng Việt': 'Dô! / Trăm phần trăm!',
                    'Deutsch': 'Prost!',
                    'Русский': 'За здоровье!',
                    'Tagalog': 'Tagay!',
                    'Bahasa Indonesia': 'Bersulang!',
                    'Polski': 'Na zdrowie!',
                    'Bahasa Melayu': 'Sumbit!',
                    'Italiano': 'Salute!',
                    'Português': 'Saúde!',
                }
            },
            {
                key: 'compliment_chef',
                translations: {
                    '繁體中文': '請轉告廚師，真的太好吃了',
                    '繁體中文-HK': '請轉告廚師，真係好正',
                    'English': 'My compliments to the chef!',
                    '한국어': '셰프님한테 정말 맛있다고 전해주세요!',
                    '日本語': 'シェフに美味しかったとお伝えください！',
                    'Français': 'Mes félicitations au chef !',
                    'Español': '¡Felicite al chef de mi parte!',
                    'ไทย': 'ช่วยบอกเชฟว่าอร่อยมากครับ/ค่ะ!',
                    'Tiếng Việt': 'Nhờ khen đầu bếp giùm, ngon lắm!',
                    'Deutsch': 'Richten Sie dem Koch mein Lob aus!',
                    'Русский': 'Передайте шефу, что было великолепно!',
                    'Tagalog': 'Sabihin po sa chef, ang sarap!',
                    'Bahasa Indonesia': 'Tolong sampaikan ke chef, enak banget!',
                    'Polski': 'Proszę przekazać pochwały szefowi kuchni!',
                    'Bahasa Melayu': 'Tolong beritahu chef, memang sedap!',
                    'Italiano': 'I miei complimenti allo chef!',
                    'Português': 'Meus cumprimentos ao chef!',
                }
            },
            {
                key: 'first_time',
                translations: {
                    '繁體中文': '我第一次來這裡，很棒的體驗！',
                    '繁體中文-HK': '我第一次嚟，好正嘅體驗！',
                    'English': 'This is my first time here, great experience!',
                    '한국어': '처음 왔는데 너무 좋아요!',
                    '日本語': '初めて来ましたが、最高です！',
                    'Français': 'C\'est ma première fois ici, quelle expérience !',
                    'Español': '¡Es mi primera vez aquí, qué experiencia!',
                    'ไทย': 'มาครั้งแรก ประทับใจมากครับ/ค่ะ!',
                    'Tiếng Việt': 'Lần đầu tới đây, tuyệt vời quá!',
                    'Deutsch': 'Bin zum ersten Mal hier, toll!',
                    'Русский': 'Я тут впервые, потрясающе!',
                    'Tagalog': 'First time ko dito, ang ganda!',
                    'Bahasa Indonesia': 'Pertama kali ke sini, luar biasa!',
                    'Polski': 'Jestem tu pierwszy raz, wspaniałe doświadczenie!',
                    'Bahasa Melayu': 'Ni first time saya datang, memang best!',
                    'Italiano': 'È la mia prima volta qui, un\'ottima esperienza!',
                    'Português': 'É a minha primeira vez aqui, excelente experiência!',
                }
            },
            {
                key: 'will_come_again',
                translations: {
                    '繁體中文': '下次一定還會再來！',
                    '繁體中文-HK': '下次一定會再嚟！',
                    'English': 'I\'ll definitely come back!',
                    '한국어': '꼭 다시 올게요!',
                    '日本語': 'また絶対来ます！',
                    'Français': 'Je reviendrai, c\'est sûr !',
                    'Español': '¡Volveré seguro!',
                    'ไทย': 'จะมาอีกแน่นอนครับ/ค่ะ!',
                    'Tiếng Việt': 'Chắc chắn sẽ quay lại!',
                    'Deutsch': 'Ich komme bestimmt wieder!',
                    'Русский': 'Обязательно вернусь!',
                    'Tagalog': 'Babalik talaga ako!',
                    'Bahasa Indonesia': 'Pasti balik lagi!',
                    'Polski': 'Na pewno tu wrócę!',
                    'Bahasa Melayu': 'Nanti saya datang lagi!',
                    'Italiano': 'Tornerò sicuramente!',
                    'Português': 'Com certeza voltarei!',
                }
            },
        ]
    },
    {
        icon: '🙏',
        nameKey: 'general',
        phrases: [
            {
                key: 'thank_you',
                translations: {
                    '繁體中文': '謝謝',
                    '繁體中文-HK': '多謝',
                    'English': 'Thank you!',
                    '한국어': '감사합니다!',
                    '日本語': 'ありがとうございます！',
                    'Français': 'Merci !',
                    'Español': '¡Gracias!',
                    'ไทย': 'ขอบคุณครับ/ค่ะ',
                    'Tiếng Việt': 'Cảm ơn!',
                    'Deutsch': 'Danke!',
                    'Русский': 'Спасибо!',
                    'Tagalog': 'Salamat po!',
                    'Bahasa Indonesia': 'Terima kasih!',
                    'Polski': 'Dziękuję!',
                    'Bahasa Melayu': 'Terima kasih!',
                    'Italiano': 'Grazie!',
                    'Português': 'Obrigado/a!',
                }
            },
            {
                key: 'delicious',
                translations: {
                    '繁體中文': '超好吃！',
                    '繁體中文-HK': '好正呀！',
                    'English': 'This is amazing!',
                    '한국어': '진짜 맛있어요!',
                    '日本語': 'めっちゃ美味しい！',
                    'Français': 'C\'est trop bon !',
                    'Español': '¡Está buenísimo!',
                    'ไทย': 'อร่อยมากครับ/ค่ะ!',
                    'Tiếng Việt': 'Ngon quá trời!',
                    'Deutsch': 'Das ist mega lecker!',
                    'Русский': 'Просто восхитительно!',
                    'Tagalog': 'Ang sarap!',
                    'Bahasa Indonesia': 'Enak banget!',
                    'Polski': 'Pyszne!',
                    'Bahasa Melayu': 'Sedap gila!',
                    'Italiano': 'Squisito!',
                    'Português': 'Delicioso!',
                }
            },
            {
                key: 'restroom',
                translations: {
                    '繁體中文': '洗手間在哪？',
                    '繁體中文-HK': '洗手間喺邊？',
                    'English': 'Where\'s the restroom?',
                    '한국어': '화장실 어디예요?',
                    '日本語': 'トイレどこですか？',
                    'Français': 'Les toilettes, c\'est où ?',
                    'Español': '¿Dónde está el baño?',
                    'ไทย': 'ห้องน้ำอยู่ไหนครับ/ค่ะ',
                    'Tiếng Việt': 'Nhà vệ sinh ở đâu ạ?',
                    'Deutsch': 'Wo sind die Toiletten?',
                    'Русский': 'Где тут туалет?',
                    'Tagalog': 'Saan po ang CR?',
                    'Bahasa Indonesia': 'Toiletnya di mana ya?',
                    'Polski': 'Gdzie jest toaleta?',
                    'Bahasa Melayu': 'Tandas kat mana?',
                    'Italiano': 'Dov\'è il bagno?',
                    'Português': 'Onde é a casa de banho/banheiro?',
                }
            },
            {
                key: 'takeaway',
                translations: {
                    '繁體中文': '可以外帶嗎？',
                    '繁體中文-HK': '可以外賣嗎？',
                    'English': 'Can I get this to go?',
                    '한국어': '포장해 주세요',
                    '日本語': 'テイクアウトできますか？',
                    'Français': 'Je peux avoir à emporter ?',
                    'Español': 'Para llevar, por favor',
                    'ไทย': 'ห่อกลับได้ไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Gói mang về được không?',
                    'Deutsch': 'Kann ich das mitnehmen?',
                    'Русский': 'Можно с собой?',
                    'Tagalog': 'Pwede po bang i-take out?',
                    'Bahasa Indonesia': 'Bisa dibungkus?',
                    'Polski': 'Czy mogę wziąć to na wynos?',
                    'Bahasa Melayu': 'Boleh tapau?',
                    'Italiano': 'Posso avere questo da asporto?',
                    'Português': 'Posso levar para viagem?',
                }
            },
            {
                key: 'photo_ok',
                translations: {
                    '繁體中文': '可以拍照嗎？',
                    '繁體中文-HK': '可以影相嗎？',
                    'English': 'Can I take a photo?',
                    '한국어': '사진 찍어도 돼요?',
                    '日本語': '写真撮ってもいいですか？',
                    'Français': 'Je peux prendre une photo ?',
                    'Español': '¿Puedo tomar una foto?',
                    'ไทย': 'ถ่ายรูปได้ไหมครับ/ค่ะ',
                    'Tiếng Việt': 'Chụp hình được không ạ?',
                    'Deutsch': 'Darf ich ein Foto machen?',
                    'Русский': 'Можно сфотографировать?',
                    'Tagalog': 'Pwede po bang mag-picture?',
                    'Bahasa Indonesia': 'Boleh foto nggak?',
                    'Polski': 'Mogę zrobić zdjęcie?',
                    'Bahasa Melayu': 'Boleh ambil gambar?',
                    'Italiano': 'Posso fare una foto?',
                    'Português': 'Posso tirar uma foto?',
                }
            },
            {
                key: 'wifi',
                translations: {
                    '繁體中文': 'WiFi 密碼是什麼？',
                    '繁體中文-HK': 'WiFi 密碼幾多？',
                    'English': 'What\'s the WiFi password?',
                    '한국어': '와이파이 비번 뭐예요?',
                    '日本語': 'WiFiのパスワード教えてもらえますか？',
                    'Français': 'C\'est quoi le code WiFi ?',
                    'Español': '¿Cuál es la contraseña del WiFi?',
                    'ไทย': 'รหัส WiFi อะไรครับ/ค่ะ',
                    'Tiếng Việt': 'Mật khẩu WiFi là gì ạ?',
                    'Deutsch': 'Wie ist das WLAN-Passwort?',
                    'Русский': 'Какой пароль от WiFi?',
                    'Tagalog': 'Ano po ang WiFi password?',
                    'Bahasa Indonesia': 'Password WiFi-nya apa ya?',
                    'Polski': 'Jakie jest hasło do WiFi?',
                    'Bahasa Melayu': 'Apa password WiFi?',
                    'Italiano': 'Qual è la password del WiFi?',
                    'Português': 'Qual è a senha do WiFi?',
                }
            },
        ]
    }
];

// 分類名稱翻譯
const CATEGORY_NAMES: Record<string, Record<string, string>> = {
    'greeting': {
        '繁體中文': '打招呼', '繁體中文-HK': '打招呼', 'English': 'Greeting',
        '한국어': '인사', '日本語': '挨拶', 'Français': 'Salutation', 'Español': 'Saludo',
        'ไทย': 'ทักทาย', 'Tiếng Việt': 'Chào hỏi', 'Deutsch': 'Begrüßung',
        'Русский': 'Приветствие', 'Tagalog': 'Pagbati', 'Bahasa Indonesia': 'Sapaan',
        'Polski': 'Powitanie', 'Bahasa Melayu': 'Sapaan', 'Italiano': 'Saluti', 'Português': 'Saudações',
    },
    'ordering': {
        '繁體中文': '點餐', '繁體中文-HK': '點餐', 'English': 'Ordering',
        '한국어': '주문', '日本語': '注文', 'Français': 'Commander', 'Español': 'Pedir',
        'ไทย': 'สั่งอาหาร', 'Tiếng Việt': 'Gọi món', 'Deutsch': 'Bestellen',
        'Русский': 'Заказ', 'Tagalog': 'Pag-order', 'Bahasa Indonesia': 'Pesan',
        'Polski': 'Zamawianie', 'Bahasa Melayu': 'Memesan', 'Italiano': 'Ordinazione', 'Português': 'Pedidos',
    },
    'allergy': {
        '繁體中文': '過敏 / 飲食', '繁體中文-HK': '敏感 / 飲食', 'English': 'Allergy / Diet',
        '한국어': '알레르기', '日本語': 'アレルギー', 'Français': 'Allergie', 'Español': 'Alergia',
        'ไทย': 'แพ้อาหาร', 'Tiếng Việt': 'Dị ứng', 'Deutsch': 'Allergie',
        'Русский': 'Аллергия', 'Tagalog': 'Allergy', 'Bahasa Indonesia': 'Alergi',
        'Polski': 'Alergia', 'Bahasa Melayu': 'Alahan', 'Italiano': 'Allergie', 'Português': 'Alergias',
    },
    'drinks': {
        '繁體中文': '飲料', '繁體中文-HK': '飲品', 'English': 'Drinks',
        '한국어': '음료', '日本語': '飲み物', 'Français': 'Boissons', 'Español': 'Bebidas',
        'ไทย': 'เครื่องดื่ม', 'Tiếng Việt': 'Đồ uống', 'Deutsch': 'Getränke',
        'Русский': 'Напитки', 'Tagalog': 'Inumin', 'Bahasa Indonesia': 'Minuman',
        'Polski': 'Napoje', 'Bahasa Melayu': 'Minuman', 'Italiano': 'Bevande', 'Português': 'Bebidas',
    },
    'payment': {
        '繁體中文': '結帳', '繁體中文-HK': '埋單', 'English': 'Payment',
        '한국어': '결제', '日本語': 'お会計', 'Français': 'Paiement', 'Español': 'Pago',
        'ไทย': 'ชำระเงิน', 'Tiếng Việt': 'Thanh toán', 'Deutsch': 'Zahlung',
        'Русский': 'Оплата', 'Tagalog': 'Bayad', 'Bahasa Indonesia': 'Pembayaran',
        'Polski': 'Płatność', 'Bahasa Melayu': 'Pembayaran', 'Italiano': 'Pagamento', 'Português': 'Pagamento',
    },
    'dining_culture': {
        '繁體中文': '用餐禮儀', '繁體中文-HK': '用餐禮儀', 'English': 'Dining Culture',
        '한국어': '식사 문화', '日本語': '食事マナー', 'Français': 'Culture culinaire', 'Español': 'Cultura gastronómica',
        'ไทย': 'วัฒนธรรมอาหาร', 'Tiếng Việt': 'Văn hóa ẩm thực', 'Deutsch': 'Esskultur',
        'Русский': 'Культура еды', 'Tagalog': 'Kultura sa Pagkain', 'Bahasa Indonesia': 'Budaya Makan',
        'Polski': 'Kultura jedzenia', 'Bahasa Melayu': 'Budaya Makan', 'Italiano': 'Cultura Gastronomica', 'Português': 'Cultura Gastronômica',
    },
    'general': {
        '繁體中文': '實用對話', '繁體中文-HK': '實用對話', 'English': 'Useful',
        '한국어': '유용한 표현', '日本語': '便利な表現', 'Français': 'Utile', 'Español': 'Útiles',
        'ไทย': 'ทั่วไป', 'Tiếng Việt': 'Hữu ích', 'Deutsch': 'Nützlich',
        'Русский': 'Полезное', 'Tagalog': 'Kapaki-pakinabang', 'Bahasa Indonesia': 'Berguna',
        'Polski': 'Ogólne', 'Bahasa Melayu': 'Umum', 'Italiano': 'Utili', 'Português': 'Úteis',
    },
};

export const RestaurantPhrases: React.FC<RestaurantPhrasesProps> = ({
    isOpen,
    onClose,
    detectedLanguage,
    userLanguage,
}) => {
    const { speakWithId, speakingId, isSupported } = useTTS();
    const [expandedCategory, setExpandedCategory] = useState<string | null>('greeting');

    // 首頁模式：允許用戶選擇當地語言
    const [selectedLocalLang, setSelectedLocalLang] = useState<string>('日本語');

    const ui = UI_TEXT[userLanguage] || UI_TEXT['English'];

    // 🔑 決定當地語言 key
    // 如果有 detectedLanguage（從菜單來），使用轉換後的值
    // 如果沒有（首頁模式），使用用戶選擇的語言
    const localLangKey = detectedLanguage
        ? detectedLangToTargetLang(detectedLanguage)
        : selectedLocalLang;

    // 確保不會顯示跟用戶語言一樣的翻譯
    const effectiveLocalLang = localLangKey === userLanguage ? 'English' : localLangKey;

    if (!isOpen) return null;

    const isStandaloneMode = !detectedLanguage; // 首頁模式

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(12px)' }}>
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col" style={{ background: 'var(--bg-tertiary)', boxShadow: 'var(--card-shadow)' }}
            >
                {/* Header */}
                <div className="px-6 py-4 rounded-t-3xl flex justify-between items-center shrink-0" style={{ background: 'var(--brand-gradient)' }}>
                    <div>
                        <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                            <MessageCircle size={20} />
                            {ui.title}
                        </h3>
                        <p className="text-white/60 text-xs mt-0.5">{ui.subtitle}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* 首頁模式：語言選擇器 */}
                {isStandaloneMode && (
                    <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'var(--brand-bg-light)', borderBottom: '1px solid var(--glass-border)' }}>
                        <Globe size={16} style={{ color: 'var(--brand-primary)' }} className="shrink-0" />
                        <span className="text-xs font-bold shrink-0" style={{ color: 'var(--brand-primary)' }}>{ui.selectLocal}</span>
                        <select
                            value={selectedLocalLang}
                            onChange={(e) => setSelectedLocalLang(e.target.value)}
                            className="flex-1 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
                        >
                            {LOCAL_LANG_OPTIONS.filter(opt => opt.value !== userLanguage).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {userLanguage.includes('中文') ? opt.labelZH : opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {PHRASE_CATEGORIES.map((category) => {
                        const isExpanded = expandedCategory === category.nameKey;
                        const catName = CATEGORY_NAMES[category.nameKey]?.[userLanguage] || category.nameKey;

                        return (
                            <div key={category.nameKey} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--glass-border)' }}>
                                {/* Category Header */}
                                <button
                                    onClick={() => setExpandedCategory(isExpanded ? null : category.nameKey)}
                                    className="w-full flex items-center justify-between p-4 transition-colors" style={{ background: 'var(--glass-bg)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{category.icon}</span>
                                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{catName}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--glass-bg)', color: 'var(--text-tertiary)' }}>
                                            {category.phrases.length}
                                        </span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />}
                                </button>

                                {/* Phrases */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div style={{ borderTop: '1px solid var(--glass-border)' }}>
                                                {category.phrases.map((phrase) => {
                                                    const userText = phrase.translations[userLanguage] || phrase.translations['English'];
                                                    const localText = phrase.translations[effectiveLocalLang] || phrase.translations['English'];
                                                    const phraseId = `phrase-${phrase.key}`;
                                                    const isPlaying = speakingId === phraseId;

                                                    return (
                                                        <div
                                                            key={phrase.key}
                                                            className="p-4 transition-colors" style={{ borderBottom: '1px solid var(--glass-border)' }}
                                                        >
                                                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{ui.yourLang}</p>
                                                            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{userText}</p>

                                                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--brand-primary)' }}>{ui.localLang}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="flex-1 font-bold text-base" style={{ color: 'var(--text-primary)' }}>{localText}</p>
                                                                {isSupported && (
                                                                    <button
                                                                        onClick={() => speakWithId(localText, effectiveLocalLang, phraseId)}
                                                                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying
                                                                            ? 'animate-pulse'
                                                                            : 'active:scale-90'
                                                                            }`}
                                                                        style={isPlaying ? { background: 'var(--brand-primary)', color: 'white', boxShadow: '0 4px 15px var(--brand-glow)' } : { background: 'var(--brand-bg)', color: 'var(--brand-primary)' }}
                                                                    >
                                                                        <Volume2 size={18} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};
