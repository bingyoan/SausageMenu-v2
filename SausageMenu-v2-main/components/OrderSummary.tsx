import React, { useState, useEffect } from 'react';
import { X, Home, Users, Download, RefreshCw } from 'lucide-react';
import { Cart, MenuData, CartItem, TargetLanguage } from '../types';
import { SausageDogLogo } from './DachshundAssets';
import { AdPopup } from './AdPopup';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const TRANSLATIONS = {
    '繁體中文': {
        checkout: '結帳明細',
        friendsOrders: '朋友的點餐',
        waitingFriends: '尚無點餐，等待朋友中...',
        people: '人',
        subtotal: '小計',
        tax: '稅金',
        service: '服務費',
        total: '總計',
        est: '約合',
        dishListOnly: '僅顯示菜單列表',
        noPriceData: '無價格資料',
        paidByLabel: '先付款的人：',
        paidByPlaceholder: '輸入名稱 (選填)',
        splitCalculator: '分帳計算機',
        persons: '人數',
        perPerson: '每人應付：',
        receiptImg: '圖片收據',
        finishOrder: '完成訂單',
        bigSpender: '★ 本餐最貴 ★',
        split: '分帳',
        thankYou: '謝謝惠顧',
        groupOrder: '多人點餐',
        paidBy: '由誰代墊：'
    },
    'English': {
        checkout: 'Checkout',
        friendsOrders: "Friends' Orders",
        waitingFriends: 'No orders yet. Waiting for friends...',
        people: 'people',
        subtotal: 'Subtotal',
        tax: 'Tax',
        service: 'Service',
        total: 'Total',
        est: 'Est.',
        dishListOnly: 'Dish List Only',
        noPriceData: 'No price data available',
        paidByLabel: 'Who Paid First?',
        paidByPlaceholder: 'Enter Name (Optional)',
        splitCalculator: 'Split Calculator',
        persons: 'PERSONS',
        perPerson: 'Per Person:',
        receiptImg: 'Receipt Img',
        finishOrder: 'Finish Order',
        bigSpender: '★ BIG SPENDER ITEM ★',
        split: 'Split',
        thankYou: 'THANK YOU FOR EATING',
        groupOrder: 'Group Order',
        paidBy: 'PAID BY:'
    },
    '日本語': {
        checkout: 'お会計',
        friendsOrders: '友達の注文',
        waitingFriends: 'まだ注文がありません。友達を待っています...',
        people: '人',
        subtotal: '小計',
        tax: '税金',
        service: 'サービス料',
        total: '合計',
        est: '約',
        dishListOnly: 'メニューリストのみ',
        noPriceData: '価格データなし',
        paidByLabel: '立て替え人:',
        paidByPlaceholder: '名前を入力 (任意)',
        splitCalculator: '割り勘計算',
        persons: '人数',
        perPerson: '一人当たり:',
        receiptImg: '画像レシート',
        finishOrder: '注文完了',
        bigSpender: '★ 最高額商品 ★',
        split: '割り勘',
        thankYou: 'ありがとうございました',
        groupOrder: 'グループ注文',
        paidBy: '立て替え:'
    },
    '한국어': {
        checkout: '결제 내역',
        friendsOrders: '친구들의 주문',
        waitingFriends: '아직 주문이 없습니다. 친구들을 기다리는 중...',
        people: '명',
        subtotal: '소계',
        tax: '세금',
        service: '서비스 요금',
        total: '총액',
        est: '약',
        dishListOnly: '메뉴 리스트만',
        noPriceData: '가격 데이터 없음',
        paidByLabel: '누가 먼저 계산했나요?',
        paidByPlaceholder: '이름 입력 (선택)',
        splitCalculator: '더치페이 계산기',
        persons: '인원',
        perPerson: '인당:',
        receiptImg: '영수증 이미지',
        finishOrder: '주문 완료',
        bigSpender: '★ 최고가 메뉴 ★',
        split: '더치페이',
        thankYou: '이용해 주셔서 감사합니다',
        groupOrder: '그룹 주문',
        paidBy: '결제자:'
    },
    'Français': {
        checkout: 'Paiement',
        friendsOrders: 'Commandes des amis',
        waitingFriends: 'Aucune commande. En attente des amis...',
        people: 'personnes',
        subtotal: 'Sous-total',
        tax: 'Taxe',
        service: 'Service',
        total: 'Total',
        est: 'Est.',
        dishListOnly: 'Liste des plats uniquement',
        noPriceData: 'Aucun prix disponible',
        paidByLabel: 'Payé par :',
        paidByPlaceholder: 'Nom (Optionnel)',
        splitCalculator: 'Partager la note',
        persons: 'PERSONNES',
        perPerson: 'Par personne :',
        receiptImg: 'Reçu image',
        finishOrder: 'Terminer',
        bigSpender: '★ LE PLUS CHER ★',
        split: 'Partager',
        thankYou: 'MERCI POUR VOTRE REPAS',
        groupOrder: 'Commande de groupe',
        paidBy: 'PAYÉ PAR :'
    },
    'Español': {
        checkout: 'Cuenta',
        friendsOrders: 'Pedidos de amigos',
        waitingFriends: 'Sin pedidos aún. Esperando amigos...',
        people: 'personas',
        subtotal: 'Subtotal',
        tax: 'Impuesto',
        service: 'Servicio',
        total: 'Total',
        est: 'Est.',
        dishListOnly: 'Solo lista de platos',
        noPriceData: 'Sin datos de precio',
        paidByLabel: '¿Quién pagó primero?',
        paidByPlaceholder: 'Nombre (Opcional)',
        splitCalculator: 'Dividir cuenta',
        persons: 'PERSONAS',
        perPerson: 'Por persona:',
        receiptImg: 'Imagen recibo',
        finishOrder: 'Finalizar',
        bigSpender: '★ LO MÁS CARO ★',
        split: 'Dividir',
        thankYou: '¡GRACIAS POR COMER!',
        groupOrder: 'Pedido grupal',
        paidBy: 'PAGADO POR:'
    },
    'ไทย': {
        checkout: 'ชำระเงิน',
        friendsOrders: 'ออเดอร์ของเพื่อน',
        waitingFriends: 'ยังไม่มีออเดอร์ กำลังรอเพื่อน...',
        people: 'คน',
        subtotal: 'ยอดรวม',
        tax: 'ภาษี',
        service: 'ค่าบริการ',
        total: 'รวมทั้งสิ้น',
        est: 'ประมาณ',
        dishListOnly: 'รายการเท่านั้น',
        noPriceData: 'ไม่มีข้อมูลราคา',
        paidByLabel: 'ใครจ่ายก่อน?',
        paidByPlaceholder: 'ชื่อ (ไม่บังคับ)',
        splitCalculator: 'หารค่าอาหาร',
        persons: 'จำนวนคน',
        perPerson: 'คนละ:',
        receiptImg: 'รูปใบเสร็จ',
        finishOrder: 'เสร็จสิ้น',
        bigSpender: '★ แพงที่สุด ★',
        split: 'หาร',
        thankYou: 'ขอบคุณที่มาทาน',
        groupOrder: 'สั่งเป็นกลุ่ม',
        paidBy: 'จ่ายโดย:'
    },
    'Tagalog': {
        checkout: 'Bayaran',
        friendsOrders: 'Order ng mga Kaibigan',
        waitingFriends: 'Wala pang order. Naghihintay ng kaibigan...',
        people: 'tao',
        subtotal: 'Subtotal',
        tax: 'Buwis',
        service: 'Serbisyo',
        total: 'Kabuuan',
        est: 'Est.',
        dishListOnly: 'Listahan lang ng pagkain',
        noPriceData: 'Walang presyo',
        paidByLabel: 'Sino ang nagbayad?',
        paidByPlaceholder: 'Pangalan (Opsyonal)',
        splitCalculator: 'Hatiin ang bayad',
        persons: 'TAO',
        perPerson: 'Bawat isa:',
        receiptImg: 'Larawan ng Resibo',
        finishOrder: 'Tapusin',
        bigSpender: '★ PINAKAMAHAL ★',
        split: 'Hatiin',
        thankYou: 'SALAMAT SA PAGKAIN',
        groupOrder: 'Group Order',
        paidBy: 'BINAYARAN NI:'
    },
    'Tiếng Việt': {
        checkout: 'Thanh toán',
        friendsOrders: 'Món bạn bè gọi',
        waitingFriends: 'Chưa có đơn. Đang chờ bạn bè...',
        people: 'người',
        subtotal: 'Tạm tính',
        tax: 'Thuế',
        service: 'Phí dịch vụ',
        total: 'Tổng cộng',
        est: 'Khoảng',
        dishListOnly: 'Chỉ danh sách món',
        noPriceData: 'Không có giá',
        paidByLabel: 'Ai trả trước?',
        paidByPlaceholder: 'Tên (Tùy chọn)',
        splitCalculator: 'Chia tiền',
        persons: 'NGƯỜI',
        perPerson: 'Mỗi người:',
        receiptImg: 'Ảnh biên lai',
        finishOrder: 'Hoàn tất',
        bigSpender: '★ MÓN ĐẮT NHẤT ★',
        split: 'Chia',
        thankYou: 'CẢM ƠN QUÝ KHÁCH',
        groupOrder: 'Đặt theo nhóm',
        paidBy: 'THANH TOÁN BỞI:'
    },
    'Deutsch': {
        checkout: 'Kasse',
        friendsOrders: 'Bestellungen der Freunde',
        waitingFriends: 'Noch keine Bestellungen. Warte auf Freunde...',
        people: 'Personen',
        subtotal: 'Zwischensumme',
        tax: 'Steuer',
        service: 'Service',
        total: 'Gesamt',
        est: 'Ca.',
        dishListOnly: 'Nur Gerichtsliste',
        noPriceData: 'Keine Preisdaten',
        paidByLabel: 'Wer hat bezahlt?',
        paidByPlaceholder: 'Name (Optional)',
        splitCalculator: 'Rechnung teilen',
        persons: 'PERSONEN',
        perPerson: 'Pro Person:',
        receiptImg: 'Quittungsbild',
        finishOrder: 'Abschließen',
        bigSpender: '★ TEUERSTES GERICHT ★',
        split: 'Teilen',
        thankYou: 'DANKE FÜRS ESSEN',
        groupOrder: 'Gruppenbestellung',
        paidBy: 'BEZAHLT VON:'
    },
    'Русский': {
        checkout: 'Оплата',
        friendsOrders: 'Заказы друзей',
        waitingFriends: 'Пока нет заказов. Ждём друзей...',
        people: 'чел.',
        subtotal: 'Подитог',
        tax: 'Налог',
        service: 'Обслуживание',
        total: 'Итого',
        est: 'Прим.',
        dishListOnly: 'Только список блюд',
        noPriceData: 'Нет данных о цене',
        paidByLabel: 'Кто заплатил?',
        paidByPlaceholder: 'Имя (Необязательно)',
        splitCalculator: 'Разделить счёт',
        persons: 'ЧЕЛОВЕК',
        perPerson: 'На каждого:',
        receiptImg: 'Фото чека',
        finishOrder: 'Завершить',
        bigSpender: '★ САМОЕ ДОРОГОЕ ★',
        split: 'Разделить',
        thankYou: 'СПАСИБО ЗА ВИЗИТ',
        groupOrder: 'Групповой заказ',
        paidBy: 'ОПЛАТИЛ:'
    },
    'Bahasa Indonesia': {
        checkout: 'Pembayaran',
        friendsOrders: 'Pesanan Teman',
        waitingFriends: 'Belum ada pesanan. Menunggu teman...',
        people: 'orang',
        subtotal: 'Subtotal',
        tax: 'Pajak',
        service: 'Layanan',
        total: 'Total',
        est: 'Perk.',
        dishListOnly: 'Hanya daftar menu',
        noPriceData: 'Tidak ada data harga',
        paidByLabel: 'Siapa yang bayar?',
        paidByPlaceholder: 'Nama (Opsional)',
        splitCalculator: 'Bagi tagihan',
        persons: 'ORANG',
        perPerson: 'Per orang:',
        receiptImg: 'Gambar struk',
        finishOrder: 'Selesai',
        bigSpender: '★ PALING MAHAL ★',
        split: 'Bagi',
        thankYou: 'TERIMA KASIH',
        groupOrder: 'Pesanan grup',
        paidBy: 'DIBAYAR OLEH:'
    },
    'Polski': {
        checkout: 'Kasa',
        friendsOrders: 'Zamówienia znajomych',
        waitingFriends: 'Brak zamówień. Czekamy na znajomych...',
        people: 'osób',
        subtotal: 'Suma częściowa',
        tax: 'Podatek',
        service: 'Obsługa',
        total: 'Suma',
        est: 'Około',
        dishListOnly: 'Tylko lista dań',
        noPriceData: 'Brak danych o cenie',
        paidByLabel: 'Kto zapłacił?',
        paidByPlaceholder: 'Imię (Opcjonalnie)',
        splitCalculator: 'Podział rachunku',
        persons: 'OSÓB',
        perPerson: 'Na osobę:',
        receiptImg: 'Zdjęcie paragonu',
        finishOrder: 'Zakończ',
        bigSpender: '★ NAJDROŻSZE DANIE ★',
        split: 'Podziel',
        thankYou: 'DZIĘKUJEMY ZA WIZYTĘ',
        groupOrder: 'Zamówienie grupowe',
        paidBy: 'ZAPŁACONE PRZEZ:'
    },
    'Bahasa Melayu': {
        checkout: 'Pembayaran',
        friendsOrders: 'Pesanan Rakan',
        waitingFriends: 'Tiada pesanan lagi. Menunggu rakan...',
        people: 'orang',
        subtotal: 'Subjumlah',
        tax: 'Cukai',
        service: 'Perkhidmatan',
        total: 'Jumlah',
        est: 'Angg.',
        dishListOnly: 'Senarai hidangan sahaja',
        noPriceData: 'Tiada data harga',
        paidByLabel: 'Siapa yang bayar?',
        paidByPlaceholder: 'Nama (Pilihan)',
        splitCalculator: 'Bahagi bil',
        persons: 'ORANG',
        perPerson: 'Seorang:',
        receiptImg: 'Gambar resit',
        finishOrder: 'Selesai',
        bigSpender: '★ PALING MAHAL ★',
        split: 'Bahagi',
        thankYou: 'TERIMA KASIH',
        groupOrder: 'Pesanan berkumpulan',
        paidBy: 'DIBAYAR OLEH:'
    },
    'Italiano': {
        checkout: 'Conto',
        friendsOrders: 'Ordini degli amici',
        waitingFriends: 'Nessun ordine ancora. In attesa degli amici...',
        people: 'persone',
        subtotal: 'Subtotale',
        tax: 'Tasse',
        service: 'Servizio',
        total: 'Totale',
        est: 'Stima',
        dishListOnly: 'Solo lista piatti',
        noPriceData: 'Nessun dato di prezzo',
        paidByLabel: 'Chi ha pagato?',
        paidByPlaceholder: 'Nome (Opzionale)',
        splitCalculator: 'Dividi il conto',
        persons: 'PERSONE',
        perPerson: 'A persona:',
        receiptImg: 'Foto scontrino',
        finishOrder: 'Concludi',
        bigSpender: '★ PIATTO PIÙ CARO ★',
        split: 'Dividi',
        thankYou: 'GRAZIE PER IL PASTO',
        groupOrder: 'Ordine di gruppo',
        paidBy: 'PAGATO DA:'
    },
    'Português': {
        checkout: 'Pagamento',
        friendsOrders: 'Pedidos dos amigos',
        waitingFriends: 'Sem pedidos ainda. Aguardando amigos...',
        people: 'pessoas',
        subtotal: 'Subtotal',
        tax: 'Imposto',
        service: 'Serviço',
        total: 'Total',
        est: 'Est.',
        dishListOnly: 'Apenas lista de pratos',
        noPriceData: 'Sem dados de preço',
        paidByLabel: 'Quem pagou primeiro?',
        paidByPlaceholder: 'Nome (Opcional)',
        splitCalculator: 'Dividir conta',
        persons: 'PESSOAS',
        perPerson: 'Por pessoa:',
        receiptImg: 'Imagem do recibo',
        finishOrder: 'Finalizar',
        bigSpender: '★ PRATO MAIS CARO ★',
        split: 'Dividir',
        thankYou: 'OBRIGADO PELA REFEIÇÃO',
        groupOrder: 'Pedido em grupo',
        paidBy: 'PAGO POR:'
    }
} as const;

interface OrderSummaryProps {
    cart: Cart;
    menuData: MenuData;
    onClose: () => void;
    onFinish: (paidBy: string) => void;
    taxRate: number;
    serviceRate: number;
    hidePrice?: boolean;
    shareSessionId?: string | null;
    targetLanguage?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    cart,
    menuData,
    onClose,
    onFinish,
    taxRate,
    serviceRate,
    hidePrice = false,
    targetLanguage = '繁體中文'
}) => {
    const [personCount, setPersonCount] = useState(1);
    const [paidBy, setPaidBy] = useState('');
    const [showAd, setShowAd] = useState(false);
    const [pendingAction, setPendingAction] = useState<'close' | 'finish' | null>(null);
    const cartItems = Object.values(cart) as CartItem[];

    // T mapping
    const lookupLang = targetLanguage === '繁體中文-HK' ? '繁體中文' : targetLanguage;
    const t = TRANSLATIONS[lookupLang as keyof typeof TRANSLATIONS] || TRANSLATIONS['English'];

    // ===== Guest Orders State =====
    const [guestOrders, setGuestOrders] = useState<Record<string, any[]>>({});
    const [guestOrdersLoading, setGuestOrdersLoading] = useState(false);
    const [showGuestOrders, setShowGuestOrders] = useState(false);
    const [totalGuests, setTotalGuests] = useState(0);

    // 從 localStorage 取得 shareSessionId
    const shareSessionId = typeof window !== 'undefined' ? localStorage.getItem('current_share_session_id') : null;

    // 自動每 10 秒刷新朋友訂單
    const fetchGuestOrders = async () => {
        if (!shareSessionId) return;
        setGuestOrdersLoading(true);
        try {
            const res = await fetch(`/api/share-order?sessionId=${shareSessionId}`);
            const data = await res.json();
            if (data.success) {
                setGuestOrders(data.orders || {});
                setTotalGuests(data.totalGuests || 0);
            }
        } catch (err) {
            console.error('Failed to fetch guest orders:', err);
        }
        setGuestOrdersLoading(false);
    };

    useEffect(() => {
        if (shareSessionId) {
            fetchGuestOrders();
            const interval = setInterval(fetchGuestOrders, 10000);
            return () => clearInterval(interval);
        }
    }, [shareSessionId]);

    // 處理關閉：先顯示廣告
    const handleClose = () => {
        setPendingAction('close');
        setShowAd(true);
    };

    // 處理完成訂單：先顯示廣告
    const handleFinish = () => {
        setPendingAction('finish');
        setShowAd(true);
    };

    // 廣告關閉後執行對應動作
    const handleAdClose = () => {
        setShowAd(false);
        if (pendingAction === 'close') {
            onClose();
        } else if (pendingAction === 'finish') {
            onFinish(paidBy);
        }
        setPendingAction(null);
    };

    // ===== 合併發起者 + 所有朋友的點餐項目 =====
    type MergedItem = { translatedName: string; originalName: string; price: number; quantity: number; id: string };

    const mergedItemsMap: Record<string, MergedItem> = {};

    // 1. 加入發起者自己的菜
    cartItems.forEach(({ item, quantity }) => {
        const key = item.id;
        if (mergedItemsMap[key]) {
            mergedItemsMap[key].quantity += quantity;
        } else {
            mergedItemsMap[key] = {
                id: item.id,
                translatedName: item.translatedName,
                originalName: item.originalName,
                price: item.price,
                quantity,
            };
        }
    });

    // 2. 加入朋友們的菜
    Object.values(guestOrders).forEach((items: any[]) => {
        items.forEach((item: any) => {
            const key = item.itemId;
            if (mergedItemsMap[key]) {
                mergedItemsMap[key].quantity += item.quantity;
            } else {
                mergedItemsMap[key] = {
                    id: item.itemId,
                    translatedName: item.itemTranslated || item.itemOriginal,
                    originalName: item.itemOriginal || item.itemTranslated,
                    price: item.price,
                    quantity: item.quantity,
                };
            }
        });
    });

    const allItems = Object.values(mergedItemsMap);
    const hasGuestOrders = Object.keys(guestOrders).length > 0;

    const totalPrice = allItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Feature 1: Calculation Logic
    const taxAmount = totalPrice * (taxRate / 100);
    const serviceAmount = totalPrice * (serviceRate / 100);
    const finalPrice = totalPrice + taxAmount + serviceAmount;

    const finalConverted = finalPrice * menuData.exchangeRate;

    // Split Calculations
    const splitPriceOriginal = Math.ceil(finalPrice / personCount);
    const splitPriceConverted = Math.ceil(finalConverted / personCount);

    // Identify most expensive item
    const mostExpensiveItem = allItems.length > 0 ? allItems.reduce((prev, current) =>
        (prev.price * prev.quantity) > (current.price * current.quantity) ? prev : current
        , allItems[0]) : null;

    const handleShare = async () => {
        const element = document.getElementById('receipt-view');
        if (!element) return;
        const toastId = toast.loading('Printing receipt...');
        try {
            const originalRadius = element.style.borderRadius;
            element.style.borderRadius = '0';

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#fff',
                logging: false
            });

            element.style.borderRadius = originalRadius;

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `SausageReceipt_${Date.now()}.png`;
            link.click();
            toast.success('Receipt printed to gallery!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Printer jammed!', { id: toastId });
        }
    };

    return (
        <div className="fixed inset-0 bg-sausage-900 z-50 flex flex-col h-full">
            <div className="bg-gray-100 flex-1 flex flex-col overflow-hidden m-2 mb-0 rounded-t-3xl">
                {/* Header */}
                <div className="p-4 bg-white flex justify-between items-center shadow-sm z-10 sticky top-0">
                    <h2 className="text-xl font-black text-sausage-900">{t.checkout}</h2>
                    <button onClick={handleClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                    <div id="receipt-view" className="bg-white p-6 rounded-none shadow-sm border border-gray-200 relative overflow-hidden mb-6 mx-auto max-w-sm font-mono">
                        {/* Jagged Edge Top */}
                        <div className="absolute top-0 left-0 right-0 h-4 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:20px_20px] rotate-180 -mt-2"></div>

                        <div className="flex flex-col items-center mb-6 border-b-2 border-dashed border-black pb-4 mt-2">
                            <SausageDogLogo className="w-20 h-12 text-black mb-2" />
                            <h3 className="font-black text-black text-2xl uppercase tracking-widest">SAUSAGE PAL</h3>
                            <p className="text-gray-500 text-xs text-center uppercase">
                                {menuData.restaurantName || "STREET FOOD & GOOD VIBES"}<br />
                                {new Date().toLocaleString()}
                            </p>
                            {hasGuestOrders && (
                                <p className="mt-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                                    👥 {t.groupOrder} • {totalGuests + 1} {t.people}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 mb-6">
                            {allItems.map((mergedItem) => {
                                const lineTotalOriginal = mergedItem.price * mergedItem.quantity;
                                const lineTotalConverted = (lineTotalOriginal * menuData.exchangeRate).toFixed(0);
                                return (
                                    <div key={mergedItem.id} className="flex justify-between items-start text-sm">
                                        <div className="flex gap-2 items-start">
                                            <span className="font-bold text-black min-w-[20px]">{mergedItem.quantity}x</span>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase leading-none mb-0.5">{mergedItem.translatedName}</p>
                                                <p className="font-black text-sausage-900 text-sm leading-tight">{mergedItem.originalName}</p>
                                            </div>
                                        </div>
                                        {!hidePrice && (
                                            <div className="text-right">
                                                <span className="font-bold text-black block">
                                                    {lineTotalOriginal.toFixed(0)}
                                                </span>
                                                <span className="text-[10px] text-gray-400 block font-bold">
                                                    ≈ {lineTotalConverted}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {mostExpensiveItem && !hidePrice && (
                            <div className="mb-4 border border-black p-2 text-center">
                                <p className="text-[10px] uppercase font-bold">{t.bigSpender}</p>
                                <p className="text-xs font-bold">{mostExpensiveItem.translatedName}</p>
                            </div>
                        )}

                        <div className="border-t-2 border-dashed border-black pt-4">
                            {!hidePrice ? (
                                <>
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="font-bold text-gray-500 uppercase">{t.subtotal}</span>
                                        <span className="font-bold">{totalPrice}</span>
                                    </div>
                                    {taxRate > 0 && (
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-gray-500 uppercase">{t.tax} ({taxRate}%)</span>
                                            <span>{taxAmount.toFixed(0)}</span>
                                        </div>
                                    )}
                                    {serviceRate > 0 && (
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-gray-500 uppercase">{t.service} ({serviceRate}%)</span>
                                            <span>{serviceAmount.toFixed(0)}</span>
                                        </div>
                                    )}

                                    {/* Dual Currency Total Display */}
                                    <div className="flex justify-between items-end mb-2 mt-2 pt-2 border-t border-dashed border-black">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-black uppercase text-sm">{t.total}</span>
                                            <span className="text-[10px] text-gray-500">{menuData.originalCurrency}</span>
                                        </div>
                                        <span className="font-black text-3xl text-black">{finalPrice.toFixed(0)}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-black text-white p-2 rounded-lg">
                                        <span className="font-bold uppercase text-xs">{t.est} {menuData.targetCurrency}</span>
                                        <span className="font-black text-xl">≈ {finalConverted.toFixed(0)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-6 border-b-2 border-dashed border-black mb-4">
                                    <p className="font-black text-black tracking-widest uppercase">{t.dishListOnly}</p>
                                    <p className="text-[10px] text-gray-400 italic">{t.noPriceData}</p>
                                </div>
                            )}

                            {paidBy && (
                                <div className="mt-2 text-right text-xs uppercase font-bold text-black">
                                    {t.paidBy} {paidBy}
                                </div>
                            )}
                        </div>

                        {personCount > 1 && !hidePrice && !hasGuestOrders && (
                            <div className="mt-4 pt-3 border-t-2 border-dashed border-black">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-black uppercase">{t.split} ({personCount})</span>
                                    <span className="font-black text-lg text-black">
                                        {splitPriceOriginal} <span className="text-[10px]">{menuData.originalCurrency}</span>
                                    </span>
                                </div>
                                <div className="flex justify-end items-center text-gray-600">
                                    <span className="text-sm font-bold">≈ {splitPriceConverted} {menuData.targetCurrency} / ea</span>
                                </div>
                            </div>
                        )}

                        {/* Barcode Stub */}
                        <div className="mt-6 flex flex-col items-center opacity-80">
                            <div className="h-8 w-full bg-[repeating-linear-gradient(90deg,black,black_2px,white_2px,white_4px)]"></div>
                            <p className="text-[10px] text-center mt-1">{t.thankYou}</p>
                        </div>

                        {/* Jagged Edge Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:20px_20px] mb-[-10px]"></div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-sausage-800 uppercase mb-1 block">{t.paidByLabel}</label>
                            <input
                                type="text"
                                value={paidBy}
                                onChange={(e) => setPaidBy(e.target.value)}
                                placeholder={t.paidByPlaceholder}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-sausage-500"
                            />
                        </div>

                        {!hidePrice && !hasGuestOrders && (
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-sausage-800 font-bold text-sm">
                                    <Users size={16} /> {t.splitCalculator}
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl">
                                    <button onClick={() => setPersonCount(Math.max(1, personCount - 1))} className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold text-gray-600">-</button>
                                    <div className="text-center">
                                        <span className="font-black text-xl text-gray-800 block leading-none">{personCount}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{t.persons}</span>
                                    </div>
                                    <button onClick={() => setPersonCount(personCount + 1)} className="w-10 h-10 bg-sausage-600 text-white rounded-lg shadow-sm flex items-center justify-center font-bold">+</button>
                                </div>

                                {/* Real-time Split Preview */}
                                <div className="mt-2 p-2 bg-sausage-50 rounded-lg border border-sausage-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-sausage-800">{t.perPerson}</span>
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-sausage-900">{splitPriceOriginal} {menuData.originalCurrency}</span>
                                        <span className="block text-xs font-bold text-sausage-600">≈ {splitPriceConverted} {menuData.targetCurrency}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== Guest Orders Section ===== */}
                    {shareSessionId && (
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setShowGuestOrders(!showGuestOrders)}
                                    className="flex items-center gap-2 text-sm font-bold text-orange-700"
                                >
                                    <Users size={16} />
                                    {t.friendsOrders}
                                    {totalGuests > 0 && (
                                        <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-black">
                                            {totalGuests} {t.people}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={fetchGuestOrders}
                                    className={`p-1.5 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition-colors ${guestOrdersLoading ? 'animate-spin' : ''}`}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>

                            {showGuestOrders && (
                                <div className="space-y-3 mt-2">
                                    {Object.keys(guestOrders).length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">{t.waitingFriends}</p>
                                    ) : (
                                        (Object.entries(guestOrders) as [string, any[]][]).map(([guestName, items]) => {
                                            const guestTotal = (items as any[]).reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                                            return (
                                                <div key={guestName} className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-black text-sm text-orange-800">👤 {guestName}</span>
                                                        {!hidePrice && (
                                                            <span className="text-xs font-bold text-orange-600">
                                                                {guestTotal.toFixed(0)} {menuData.originalCurrency}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        {items.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-xs">
                                                                <span className="text-gray-600">
                                                                    {item.quantity}x {item.itemTranslated || item.itemOriginal}
                                                                </span>
                                                                {!hidePrice && (
                                                                    <span className="font-bold text-gray-700">
                                                                        {(item.price * item.quantity).toFixed(0)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Fixed Footer Actions */}
                <div className="bg-white p-4 border-t border-gray-200 grid grid-cols-2 gap-3 safe-area-bottom shrink-0">
                    <button onClick={handleShare} className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold gap-1">
                        <Download size={20} /> <span className="text-xs">{t.receiptImg}</span>
                    </button>
                    <button onClick={handleFinish} className="flex flex-col items-center justify-center p-3 rounded-xl bg-sausage-600 text-white hover:bg-sausage-700 font-bold gap-1 shadow-md">
                        <Home size={20} /> <span className="text-xs">{t.finishOrder}</span>
                    </button>
                </div>
            </div>

            {/* 廣告彈窗 */}
            <AdPopup isOpen={showAd} onClose={handleAdClose} />
        </div>
    );
};