import { TargetLanguage } from '../types';

type LocalizedLabels = Partial<Record<TargetLanguage, string>> & { English: string };

interface KnowledgeRule {
  key: string;
  terms: string[];
  labels: LocalizedLabels;
}

interface DishRule {
  aliases: string[];
  names: LocalizedLabels;
}

const label = (english: string, chinese: string, japanese: string, korean: string): LocalizedLabels => ({
  English: english,
  [TargetLanguage.ChineseTW]: chinese,
  [TargetLanguage.ChineseHK]: chinese,
  [TargetLanguage.Japanese]: japanese,
  [TargetLanguage.Korean]: korean,
});

const ALLERGEN_RULES: KnowledgeRule[] = [
  { key: 'milk', terms: ['milk', 'cream', 'butter', 'cheese', 'lactose', 'lait', 'creme', 'beurre', 'queso', 'leche', 'latte', 'burro', 'milch', 'sahne', 'käse', '牛奶', '奶油', '起司', '芝士', '乳製品', '乳制品', 'ミルク', '牛乳', '乳製品', 'バター', 'チーズ', '우유', '버터', '치즈', 'นม', 'เนย', 'sữa', 'bơ'], labels: label('Milk', '牛奶／乳製品', '乳製品', '우유／유제품') },
  { key: 'egg', terms: ['egg', 'eggs', 'oeuf', 'huevo', 'uovo', 'eier', '雞蛋', '鸡蛋', '蛋黃', '蛋黄', '卵', 'たまご', '玉子', '계란', '달걀', 'ไข่', 'trứng'], labels: label('Egg', '蛋', '卵', '계란') },
  { key: 'peanut', terms: ['peanut', 'peanuts', 'groundnut', 'arachide', 'cacahuete', 'cacahuète', 'arachidi', 'erdnuss', '花生', 'ピーナッツ', '落花生', '땅콩', 'ถั่วลิสง', 'đậu phộng'], labels: label('Peanut', '花生', '落花生', '땅콩') },
  { key: 'tree_nut', terms: ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'amande', 'noix', 'anacardo', 'mandorla', 'mandel', '腰果', '杏仁', '核桃', '開心果', '开心果', 'アーモンド', 'カシューナッツ', 'くるみ', 'ピスタチオ', '아몬드', '캐슈넛', '호두', 'ถั่วอัลมอนด์', 'hạt điều'], labels: label('Tree nuts', '堅果', '木の実', '견과류') },
  { key: 'soy', terms: ['soy', 'soya', 'soybean', 'tofu', 'miso', 'edamame', 'soja', '大豆', '黃豆', '黄豆', '豆腐', '味噌', '枝豆', 'しょうゆ', '醤油', '간장', '된장', '두부', '콩', 'ถั่วเหลือง', 'đậu nành'], labels: label('Soy', '大豆', '大豆', '대두') },
  { key: 'wheat', terms: ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'farine', 'pain', 'harina', 'trigo', 'farina', 'weizen', 'mehl', '小麥', '小麦', '麵粉', '面粉', 'パン', '小麦', 'うどん', '라면', '밀가루', 'ข้าวสาลี', 'bột mì'], labels: label('Wheat', '小麥／麩質', '小麦', '밀') },
  { key: 'gluten', terms: ['gluten', '麩質', '麸质', 'グルテン', '글루텐'], labels: label('Gluten', '麩質', 'グルテン', '글루텐') },
  { key: 'fish', terms: ['fish', 'salmon', 'tuna', 'anchovy', 'sardine', 'poisson', 'saumon', 'thon', 'pescado', 'pesce', 'fisch', '魚', '鱼', '鮭魚', '鲑鱼', '鮪魚', '金枪鱼', '魚', 'サーモン', 'まぐろ', '참치', '연어', 'ปลา', 'cá'], labels: label('Fish', '魚類', '魚', '생선') },
  { key: 'shellfish', terms: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'oyster', 'mussel', 'crevette', 'crabe', 'homard', 'camarón', 'gamba', 'granchio', 'garnele', 'krabbe', '蝦', '虾', '蟹', '螃蟹', '龍蝦', '龙虾', '牡蠣', 'カニ', 'えび', '海老', 'エビ', 'かき', '새우', '게', '굴', 'กุ้ง', 'ปู', 'tôm', 'cua'], labels: label('Shellfish', '甲殼類／貝類', '甲殻類', '갑각류／조개류') },
  { key: 'sesame', terms: ['sesame', 'tahini', 'sésame', 'sesamo', 'sesam', '芝麻', '胡麻', 'ごま', '참깨', 'งา', 'mè'], labels: label('Sesame', '芝麻', 'ごま', '참깨') },
  { key: 'mustard', terms: ['mustard', 'moutarde', 'mostaza', 'senape', 'senf', '芥末', 'からし', 'マスタード', '겨자', 'มัสตาร์ด', 'mù tạt'], labels: label('Mustard', '芥末', 'からし', '겨자') },
  { key: 'celery', terms: ['celery', 'céleri', 'apio', 'sedano', 'sellerie', '芹菜', 'セロリ', '셀러리', 'ขึ้นฉ่าย', 'cần tây'], labels: label('Celery', '芹菜', 'セロリ', '셀러리') },
  { key: 'sulfite', terms: ['sulfite', 'sulphite', 'sulfites', 'sulfiti', 'sulfit', '亞硫酸鹽', '亚硫酸盐', '亜硫酸塩', '아황산염'], labels: label('Sulfites', '亞硫酸鹽', '亜硫酸塩', '아황산염') },
];

const INGREDIENT_RULES: KnowledgeRule[] = [
  { key: 'pork', terms: ['pork', 'bacon', 'ham', 'prosciutto', 'porc', 'jambon', 'cerdo', 'jamón', 'maiale', 'schwein', '豬', '猪', '豚', 'チャーシュー', '돼지', 'หมู', 'heo'], labels: label('Pork', '豬肉', '豚肉', '돼지고기') },
  { key: 'beef', terms: ['beef', 'boeuf', 'bœuf', 'boeuf', 'res', 'manzo', 'rind', '牛肉', '和牛', 'ビーフ', '牛', '소고기', '쇠고기', 'เนื้อวัว', 'thịt bò'], labels: label('Beef', '牛肉', '牛肉', '소고기') },
  { key: 'chicken', terms: ['chicken', 'poulet', 'pollo', 'huhn', '雞', '鸡', '鶏', 'チキン', '닭', 'ไก่', 'gà'], labels: label('Chicken', '雞肉', '鶏肉', '닭고기') },
  { key: 'lamb', terms: ['lamb', 'mutton', 'agneau', 'cordero', 'agnello', 'lamm', '羊肉', 'ラム', '양고기', 'แกะ', 'thịt cừu'], labels: label('Lamb', '羊肉', 'ラム', '양고기') },
  { key: 'alcohol', terms: ['alcohol', 'wine', 'beer', 'sake', 'mirin', 'liqueur', 'vin', 'bière', 'vino', 'cerveza', 'wein', 'bier', '酒', '米酒', '味醂', 'みりん', 'ワイン', '술', '맥주', 'ไวน์', 'เบียร์', 'rượu'], labels: label('Alcohol', '酒精', 'アルコール', '알코올') },
  { key: 'garlic', terms: ['garlic', 'ail', 'ajo', 'aglio', 'knoblauch', '蒜', '大蒜', 'にんにく', 'ニンニク', '마늘', 'กระเทียม', 'tỏi'], labels: label('Garlic', '大蒜', 'にんにく', '마늘') },
  { key: 'onion', terms: ['onion', 'oignon', 'cebolla', 'cipolla', 'zwiebel', '洋蔥', '洋葱', '蔥', '葱', '玉ねぎ', 'ねぎ', '양파', 'ต้นหอม', 'hành'], labels: label('Onion', '洋蔥／蔥', '玉ねぎ／ねぎ', '양파／파') },
  { key: 'spicy', terms: ['spicy', 'chili', 'chilli', 'hot sauce', 'piment', 'picante', 'peperoncino', 'scharf', '辣', '辣椒', '唐辛子', '辛口', '매운', '고추', 'เผ็ด', 'ớt'], labels: label('Spicy', '辣', '辛い', '매움') },
];

const DISH_RULES: DishRule[] = [
  { aliases: ['ramen', 'ラーメン', '拉麵', '拉面', '라멘'], names: label('Ramen', '拉麵', 'ラーメン', '라멘') },
  { aliases: ['udon', 'うどん', '烏龍麵', '乌冬面', '우동'], names: label('Udon noodles', '烏龍麵', 'うどん', '우동') },
  { aliases: ['soba', 'そば', '蕎麥麵', '荞麦面', '소바'], names: label('Soba noodles', '蕎麥麵', 'そば', '소바') },
  { aliases: ['gyoza', '餃子', '饺子', '교자'], names: label('Gyoza dumplings', '日式煎餃', '餃子', '교자') },
  { aliases: ['yakitori', '焼き鳥', '燒鳥', '烧鸟', '야키토리'], names: label('Yakitori chicken skewers', '日式烤雞肉串', '焼き鳥', '야키토리') },
  { aliases: ['tsukune', 'つくね', '츠쿠네'], names: label('Chicken meatball skewer', '雞肉丸串', 'つくね', '닭고기 완자 꼬치') },
  { aliases: ['okonomiyaki', 'お好み焼き', '大阪燒', '大阪烧', '오코노미야키'], names: label('Japanese savory pancake', '大阪燒', 'お好み焼き', '오코노미야키') },
  { aliases: ['takoyaki', 'たこ焼き', '章魚燒', '章鱼烧', '타코야키'], names: label('Takoyaki octopus balls', '章魚燒', 'たこ焼き', '타코야키') },
  { aliases: ['bibimbap', '비빔밥', '拌飯', '拌饭'], names: label('Bibimbap', '韓式拌飯', 'ビビンバ', '비빔밥') },
  { aliases: ['bulgogi', '불고기', '韓式烤肉', '韩式烤肉'], names: label('Korean grilled beef', '韓式烤牛肉', 'プルコギ', '불고기') },
  { aliases: ['kimchi', '김치', '泡菜'], names: label('Kimchi', '韓式泡菜', 'キムチ', '김치') },
  { aliases: ['pad thai', 'ผัดไทย', '泰式炒河粉'], names: label('Pad Thai', '泰式炒河粉', 'パッタイ', '팟타이') },
  { aliases: ['tom yum', 'ต้มยำ', '冬蔭功', '冬阴功'], names: label('Tom yum soup', '冬蔭功湯', 'トムヤムクン', '똠얌 수프') },
  { aliases: ['pho', 'phở', '越南河粉'], names: label('Vietnamese pho', '越南河粉', 'フォー', '베트남 쌀국수') },
  { aliases: ['banh mi', 'bánh mì', '越南法國麵包'], names: label('Vietnamese banh mi', '越南法國麵包', 'バインミー', '반미') },
  { aliases: ['carbonara', 'カルボナーラ', '卡邦尼', '까르보나라'], names: label('Carbonara', '培根蛋奶義大利麵', 'カルボナーラ', '까르보나라') },
  { aliases: ['margherita', 'マルゲリータ', '瑪格麗特披薩', '마르게리타'], names: label('Margherita pizza', '瑪格麗特披薩', 'マルゲリータピザ', '마르게리타 피자') },
  { aliases: ['paella', 'パエリア', '西班牙海鮮飯', '빠에야'], names: label('Paella', '西班牙海鮮飯', 'パエリア', '빠에야') },
  { aliases: ['croissant', 'クロワッサン', '可頌', '羊角麵包', '크루아상'], names: label('Croissant', '可頌', 'クロワッサン', '크루아상') },
  { aliases: ['tiramisu', 'ティラミス', '提拉米蘇', '티라미수'], names: label('Tiramisu', '提拉米蘇', 'ティラミス', '티라미수') },
];

const normalize = (value: string) => value
  .normalize('NFKC')
  .toLocaleLowerCase()
  .replace(/[\s\-_]+/g, ' ')
  .trim();

const containsTerm = (text: string, term: string) => {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  if (/^[a-z0-9 ]+$/.test(normalizedTerm) && normalizedTerm.length <= 3) {
    return new RegExp(`(^|[^a-z])${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i').test(text);
  }
  return text.includes(normalizedTerm);
};

const localize = (labels: LocalizedLabels, targetLanguage: TargetLanguage) =>
  labels[targetLanguage] || labels.English;

export const analyzeMenuKnowledge = (text: string, targetLanguage: TargetLanguage) => {
  const normalizedText = normalize(text);
  const matchedAllergens = ALLERGEN_RULES.filter(rule => rule.terms.some(term => containsTerm(normalizedText, term)));
  const matchedIngredients = INGREDIENT_RULES.filter(rule => rule.terms.some(term => containsTerm(normalizedText, term)));
  const dish = DISH_RULES.find(rule => rule.aliases.some(alias => normalize(alias) === normalizedText));

  return {
    translatedDishName: dish ? localize(dish.names, targetLanguage) : undefined,
    allergens: matchedAllergens.map(rule => localize(rule.labels, targetLanguage)),
    allergenKeys: matchedAllergens.map(rule => rule.key),
    dietaryTags: matchedIngredients.map(rule => localize(rule.labels, targetLanguage)),
  };
};

export const getDefaultCategoryName = (targetLanguage: TargetLanguage) => {
  const labels: LocalizedLabels = label('Menu', '菜單', 'メニュー', '메뉴');
  return localize(labels, targetLanguage);
};

const MENU_SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  鸡: '雞', 猪: '豬', 鸭: '鴨', 鹅: '鵝', 鱼: '魚', 虾: '蝦', 鲜: '鮮', 鲍: '鮑', 贝: '貝',
  龙: '龍', 鳗: '鰻', 鲑: '鮭', 鲔: '鮪', 鲭: '鯖', 鱿: '魷', 蚝: '蠔', 蛎: '蠣',
  面: '麵', 饭: '飯', 汤: '湯', 粥: '粥', 烧: '燒', 炖: '燉', 烩: '燴', 烫: '燙',
  酱: '醬', 葱: '蔥', 姜: '薑', 蒜: '蒜', 萝: '蘿', 卜: '蔔', 菇: '菇',
  饼: '餅', 馅: '餡', 锅: '鍋', 铁: '鐵', 丝: '絲', 块: '塊', 条: '條', 卷: '捲',
  饮: '飲', 热: '熱', 冰: '冰', 咸: '鹹', 盐: '鹽', 糖: '糖', 油: '油',
  红: '紅', 黄: '黃', 绿: '綠', 马: '馬', 铃: '鈴', 干: '乾', 荤: '葷',
  点: '點', 双: '雙', 份: '份', 盘: '盤', 碗: '碗', 杯: '杯', 瓶: '瓶',
  盖: '蓋', 夹: '夾', 脆: '脆', 软: '軟', 浓: '濃', 清: '清',
  奶: '奶', 芝: '芝', 士: '士', 蛋: '蛋', 肉: '肉', 菜: '菜', 素: '素',
};

export const normalizeOfflineTranslation = (text: string, targetLanguage: TargetLanguage) => {
  if (targetLanguage !== TargetLanguage.ChineseTW && targetLanguage !== TargetLanguage.ChineseHK) return text;
  return Array.from(text).map(character => MENU_SIMPLIFIED_TO_TRADITIONAL[character] || character).join('');
};
