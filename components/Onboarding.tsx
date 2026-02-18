'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { TargetLanguage } from '../types';

interface OnboardingProps {
    isOpen: boolean;
    onComplete: () => void;
    language: TargetLanguage;
}

// 3 步驟的多語言翻譯
const STEP_TRANSLATIONS: Record<string, Record<TargetLanguage, { title: string; desc: string }>> = {
    upload: {
        [TargetLanguage.ChineseTW]: { title: '上傳或拍攝菜單', desc: '拍下或從相簿上傳外語菜單，AI 自動辨識並翻譯所有菜品名稱和價格。' },
        [TargetLanguage.ChineseHK]: { title: '上傳或影相餐牌', desc: '影低或從相簿上傳外語餐牌，AI 自動辨識並翻譯所有菜式名同價錢。' },
        [TargetLanguage.Japanese]: { title: 'メニューを撮影・アップロード', desc: 'メニューを撮影またはアルバムからアップロード。AIが自動で料理名と価格を翻訳します。' },
        [TargetLanguage.Korean]: { title: '메뉴 촬영 또는 업로드', desc: '메뉴를 촬영하거나 앨범에서 업로드하면 AI가 자동으로 모든 음식 이름과 가격을 번역합니다.' },
        [TargetLanguage.English]: { title: 'Upload or Snap a Menu', desc: 'Take a photo or upload a foreign menu from your album. AI instantly recognizes and translates all dishes and prices.' },
        [TargetLanguage.Thai]: { title: 'อัปโหลดหรือถ่ายรูปเมนู', desc: 'ถ่ายรูปหรืออัปโหลดเมนูภาษาต่างประเทศ AI จะแปลชื่ออาหารและราคาให้อัตโนมัติ' },
        [TargetLanguage.Vietnamese]: { title: 'Tải lên hoặc chụp thực đơn', desc: 'Chụp ảnh hoặc tải lên thực đơn nước ngoài từ album. AI tự động dịch tất cả món ăn và giá.' },
        [TargetLanguage.French]: { title: 'Télécharger ou photographier', desc: 'Prenez une photo ou téléchargez un menu étranger. L\'IA traduit instantanément tous les plats et prix.' },
        [TargetLanguage.Spanish]: { title: 'Subir o fotografiar menú', desc: 'Toma una foto o sube un menú extranjero. La IA traduce automáticamente todos los platos y precios.' },
        [TargetLanguage.German]: { title: 'Speisekarte hochladen', desc: 'Fotografieren oder laden Sie eine fremdsprachige Speisekarte hoch. KI übersetzt automatisch alle Gerichte und Preise.' },
        [TargetLanguage.Russian]: { title: 'Загрузите или сфотографируйте', desc: 'Сфотографируйте или загрузите меню на иностранном языке. ИИ автоматически переведёт все блюда и цены.' },
        [TargetLanguage.Filipino]: { title: 'I-upload o kunan ng litrato', desc: 'Kunan ng litrato o i-upload ang menu. Awtomatikong isasalin ng AI ang lahat ng pagkain at presyo.' },
        [TargetLanguage.Indonesian]: { title: 'Unggah atau foto menu', desc: 'Foto atau unggah menu asing dari album. AI otomatis menerjemahkan semua hidangan dan harga.' },
    },
    ordering: {
        [TargetLanguage.ChineseTW]: { title: '自動生成點餐介面', desc: 'AI 翻譯後自動分類菜品，顯示價格和過敏原。選好想吃的菜，一鍵生成雙語訂單！' },
        [TargetLanguage.ChineseHK]: { title: '自動生成點餐介面', desc: 'AI 翻譯後自動分類菜式，顯示價錢同過敏原。揀好想食嘅餸，一鍵生成雙語訂單！' },
        [TargetLanguage.Japanese]: { title: '注文画面を自動生成', desc: 'AI翻訳後に自動で料理を分類し、価格やアレルゲンを表示。食べたい料理を選んで注文票を作成！' },
        [TargetLanguage.Korean]: { title: '주문 화면 자동 생성', desc: 'AI 번역 후 자동으로 메뉴를 분류하고 가격과 알레르기 정보를 표시합니다. 원하는 메뉴를 선택하여 주문서를 생성하세요!' },
        [TargetLanguage.English]: { title: 'Auto-Generated Ordering', desc: 'AI translates and categorizes dishes, showing prices and allergens. Select what you want and generate a bilingual order!' },
        [TargetLanguage.Thai]: { title: 'หน้าสั่งอาหารอัตโนมัติ', desc: 'AI แปลและจัดหมวดอาหาร แสดงราคาและสารก่อภูมิแพ้ เลือกเมนูที่ต้องการแล้วสร้างออเดอร์ 2 ภาษา!' },
        [TargetLanguage.Vietnamese]: { title: 'Tạo giao diện gọi món', desc: 'AI dịch và phân loại món ăn, hiển thị giá và chất gây dị ứng. Chọn món và tạo phiếu gọi món song ngữ!' },
        [TargetLanguage.French]: { title: 'Interface de commande auto', desc: 'L\'IA traduit et catégorise les plats avec prix et allergènes. Sélectionnez et générez une commande bilingue !' },
        [TargetLanguage.Spanish]: { title: 'Interfaz de pedido auto', desc: 'La IA traduce y categoriza los platos con precios y alérgenos. ¡Selecciona y genera un pedido bilingüe!' },
        [TargetLanguage.German]: { title: 'Automatische Bestellseite', desc: 'KI übersetzt und kategorisiert Gerichte mit Preisen und Allergenen. Wählen Sie aus und erstellen Sie eine zweisprachige Bestellung!' },
        [TargetLanguage.Russian]: { title: 'Автоматический заказ', desc: 'ИИ переводит и классифицирует блюда с ценами и аллергенами. Выберите блюда и создайте двуязычный заказ!' },
        [TargetLanguage.Filipino]: { title: 'Auto-Generated na Order', desc: 'Isasalin at ikakategorya ng AI ang mga pagkain. Pumili at gumawa ng bilingual na order!' },
        [TargetLanguage.Indonesian]: { title: 'Halaman pesan otomatis', desc: 'AI menerjemahkan dan mengkategorikan hidangan dengan harga dan alergen. Pilih dan buat pesanan dwibahasa!' },
    },
    save: {
        [TargetLanguage.ChineseTW]: { title: '提前儲存菜單，開啟更即時', desc: '翻譯完成後可儲存到菜單庫。下次造訪同一家餐廳，直接開啟已翻譯的菜單，不用重新掃描！' },
        [TargetLanguage.ChineseHK]: { title: '提前儲存餐牌，開啟更即時', desc: '翻譯完成後可儲存到餐牌庫。下次去同一間餐廳，直接開舊翻譯，唔使重新掃描！' },
        [TargetLanguage.Japanese]: { title: 'メニューを保存して素早くアクセス', desc: '翻訳したメニューをライブラリに保存。次回同じレストランに行く時、再スキャン不要で即アクセス！' },
        [TargetLanguage.Korean]: { title: '메뉴 저장으로 빠른 접근', desc: '번역된 메뉴를 라이브러리에 저장하세요. 다음에 같은 식당에 가면 다시 스캔할 필요 없이 바로 열람!' },
        [TargetLanguage.English]: { title: 'Save Menus for Instant Access', desc: 'Save translated menus to your library. Next time you visit the same restaurant, open it instantly — no re-scanning needed!' },
        [TargetLanguage.Thai]: { title: 'บันทึกเมนูเพื่อเข้าถึงทันที', desc: 'บันทึกเมนูที่แปลแล้วไว้ในคลัง ครั้งหน้าไปร้านเดิม เปิดเมนูเดิมได้เลยไม่ต้องสแกนใหม่!' },
        [TargetLanguage.Vietnamese]: { title: 'Lưu thực đơn để mở nhanh hơn', desc: 'Lưu thực đơn đã dịch vào thư viện. Lần sau đến cùng nhà hàng, mở trực tiếp không cần quét lại!' },
        [TargetLanguage.French]: { title: 'Sauvegardez pour un accès rapide', desc: 'Sauvegardez les menus traduits. La prochaine fois, ouvrez-les instantanément sans re-scanner !' },
        [TargetLanguage.Spanish]: { title: 'Guarda menús para acceso rápido', desc: 'Guarda los menús traducidos en tu biblioteca. ¡La próxima vez no necesitas escanear de nuevo!' },
        [TargetLanguage.German]: { title: 'Menüs speichern für schnellen Zugriff', desc: 'Speichern Sie übersetzte Speisekarten in Ihrer Bibliothek. Nächstes Mal sofort öffnen — kein erneutes Scannen!' },
        [TargetLanguage.Russian]: { title: 'Сохраняйте для быстрого доступа', desc: 'Сохраните переведённые меню в библиотеку. В следующий раз откройте мгновенно — без повторного сканирования!' },
        [TargetLanguage.Filipino]: { title: 'I-save para sa mabilis na access', desc: 'I-save ang mga na-translate na menu sa library. Sa susunod na bisita, buksan agad — walang re-scan!' },
        [TargetLanguage.Indonesian]: { title: 'Simpan menu untuk akses cepat', desc: 'Simpan menu yang sudah diterjemahkan ke perpustakaan. Kunjungan berikutnya langsung buka — tanpa scan ulang!' },
    },
};

// 按鈕文字翻譯
const BUTTON_TEXT: Record<TargetLanguage, { next: string; start: string }> = {
    [TargetLanguage.ChineseTW]: { next: '下一步', start: '開始使用' },
    [TargetLanguage.ChineseHK]: { next: '下一步', start: '開始使用' },
    [TargetLanguage.Japanese]: { next: '次へ', start: '始めましょう' },
    [TargetLanguage.Korean]: { next: '다음', start: '시작하기' },
    [TargetLanguage.English]: { next: 'Next', start: 'Get Started' },
    [TargetLanguage.Thai]: { next: 'ถัดไป', start: 'เริ่มใช้งาน' },
    [TargetLanguage.Vietnamese]: { next: 'Tiếp', start: 'Bắt đầu' },
    [TargetLanguage.French]: { next: 'Suivant', start: 'Commencer' },
    [TargetLanguage.Spanish]: { next: 'Siguiente', start: 'Empezar' },
    [TargetLanguage.German]: { next: 'Weiter', start: 'Loslegen' },
    [TargetLanguage.Russian]: { next: 'Далее', start: 'Начать' },
    [TargetLanguage.Filipino]: { next: 'Susunod', start: 'Magsimula' },
    [TargetLanguage.Indonesian]: { next: 'Lanjut', start: 'Mulai' },
};

const STEP_KEYS = ['upload', 'ordering', 'save'] as const;
const STEP_IMAGES = ['/onboarding/step1_upload.png', '/onboarding/step2_ordering.png', '/onboarding/step3_save.png'];
const STEP_BG_COLORS = ['bg-orange-50', 'bg-blue-50', 'bg-amber-50'];
const STEP_GRADIENT = [
    'from-orange-400 to-red-400',
    'from-blue-400 to-indigo-400',
    'from-amber-400 to-orange-400',
];

export const Onboarding: React.FC<OnboardingProps> = ({ isOpen, onComplete, language }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const btn = BUTTON_TEXT[language] || BUTTON_TEXT[TargetLanguage.English];

    const getStepContent = (stepIndex: number) => {
        const key = STEP_KEYS[stepIndex];
        const translations = STEP_TRANSLATIONS[key];
        return translations[language] || translations[TargetLanguage.English];
    };

    const handleNext = () => {
        if (currentStep < STEP_KEYS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('has_seen_onboarding', 'true');
        setCurrentStep(0);
        onComplete();
    };

    if (!isOpen) return null;

    const stepContent = getStepContent(currentStep);
    const isLastStep = currentStep === STEP_KEYS.length - 1;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* 卡片 */}
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* 跳過按鈕 */}
                <button
                    onClick={handleComplete}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* 圖片區域 */}
                <div className={`${STEP_BG_COLORS[currentStep]} relative overflow-hidden`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -60 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="flex justify-center items-center px-6 pt-8 pb-4"
                        >
                            <div className="w-56 h-64 rounded-2xl overflow-hidden shadow-xl border-4 border-white/80">
                                <img
                                    src={STEP_IMAGES[currentStep]}
                                    alt={stepContent.title}
                                    className="w-full h-full object-cover object-top"
                                />
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* 進度指示器 */}
                    <div className="flex justify-center gap-2 pb-4">
                        {STEP_KEYS.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'w-8 bg-gray-800'
                                        : index < currentStep
                                            ? 'w-4 bg-gray-400'
                                            : 'w-4 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* 文字內容 */}
                <div className="px-8 py-5">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -30, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${STEP_GRADIENT[currentStep]} text-white`}>
                                    {currentStep + 1}/{STEP_KEYS.length}
                                </span>
                            </div>
                            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                                {stepContent.title}
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {stepContent.desc}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* 底部按鈕 */}
                <div className="px-8 pb-8 flex items-center gap-3">
                    {currentStep > 0 && (
                        <button
                            onClick={handlePrev}
                            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className={`flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isLastStep
                                ? 'bg-gradient-to-r from-sausage-500 to-orange-500 hover:from-sausage-600 hover:to-orange-600'
                                : 'bg-gray-900 hover:bg-gray-800'
                            }`}
                    >
                        {isLastStep ? (
                            <>
                                <Sparkles size={18} />
                                {btn.start}
                            </>
                        ) : (
                            <>
                                {btn.next}
                                <ChevronRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
