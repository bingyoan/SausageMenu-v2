import { TargetLanguage } from './types';

export const GUMROAD_PRODUCT_PERMALINK = 'ihrnvp';

// 廣告彈窗設定
export const GUMROAD_AD_LINK = 'https://bingyoan.gumroad.com/l/ihrnvp';
export const AD_PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/f97316/ffffff?text=Your+Ad+Here';

// 用戶國家統計假資料 (Mock Data)
export interface UserCountryStat {
  countryCode: string;
  countryName: string;
  flag: string;
  userCount: number;
}

export const USER_COUNTRY_STATS: UserCountryStat[] = [
  { countryCode: 'TW', countryName: '台灣', flag: '🇹🇼', userCount: 16 },
  { countryCode: 'ID', countryName: '印尼', flag: '🇮🇩', userCount: 1 },
  { countryCode: 'JP', countryName: '日本', flag: '🇯🇵', userCount: 0 },
  { countryCode: 'KR', countryName: '韓國', flag: '🇰🇷', userCount: 0 },
  { countryCode: 'TH', countryName: '泰國', flag: '🇹🇭', userCount: 0 },
  { countryCode: 'US', countryName: '美國', flag: '🇺🇸', userCount: 0 },
  { countryCode: 'HK', countryName: '香港', flag: '🇭🇰', userCount: 0 },
  { countryCode: 'VN', countryName: '越南', flag: '🇻🇳', userCount: 0 },
];

export const LANGUAGE_OPTIONS = [
  { value: TargetLanguage.ChineseTW, label: '繁體中文 (Traditional Chinese)', currency: 'TWD' },
  { value: TargetLanguage.ChineseHK, label: '繁體中文-HK (Hong Kong)', currency: 'HKD' },
  { value: TargetLanguage.English, label: 'English', currency: 'USD' },
  { value: TargetLanguage.Korean, label: '한국어 (Korean)', currency: 'KRW' },
  { value: TargetLanguage.French, label: 'Français (French)', currency: 'EUR' },
  { value: TargetLanguage.Spanish, label: 'Español (Spanish)', currency: 'EUR' },
  { value: TargetLanguage.Thai, label: 'ไทย (Thai)', currency: 'THB' },
  { value: TargetLanguage.Filipino, label: 'Tagalog (Filipino)', currency: 'PHP' },
  { value: TargetLanguage.Vietnamese, label: 'Tiếng Việt (Vietnamese)', currency: 'VND' },
  { value: TargetLanguage.Japanese, label: '日本語 (Japanese)', currency: 'JPY' },
  { value: TargetLanguage.German, label: 'Deutsch (German)', currency: 'EUR' },
  { value: TargetLanguage.Russian, label: 'Русский (Russian)', currency: 'RUB' },
  { value: TargetLanguage.Indonesian, label: 'Bahasa Indonesia', currency: 'IDR' },
  { value: TargetLanguage.Polish, label: 'Polski (Polish)', currency: 'PLN' },
  { value: TargetLanguage.Malay, label: '繁中-馬來 (Malay)', currency: 'MYR' },
  { value: TargetLanguage.Italian, label: 'Italiano (Italian)', currency: 'EUR' },
  { value: TargetLanguage.Portuguese, label: 'Português (Portuguese)', currency: 'EUR' },
];

export const getTargetCurrency = (lang: TargetLanguage): string => {
  const option = LANGUAGE_OPTIONS.find(opt => opt.value === lang);
  return option ? option.currency : 'USD';
};

// 語言 → 國家代碼對應表 (用於用戶統計)
export const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  [TargetLanguage.ChineseTW]: 'TW',
  [TargetLanguage.ChineseHK]: 'HK',
  [TargetLanguage.Japanese]: 'JP',
  [TargetLanguage.Korean]: 'KR',
  [TargetLanguage.English]: 'US',
  [TargetLanguage.Thai]: 'TH',
  [TargetLanguage.Vietnamese]: 'VN',
  [TargetLanguage.Indonesian]: 'ID',
  [TargetLanguage.French]: 'FR',
  [TargetLanguage.Spanish]: 'ES',
  [TargetLanguage.German]: 'DE',
  [TargetLanguage.Russian]: 'RU',
  [TargetLanguage.Filipino]: 'PH',
  [TargetLanguage.Polish]: 'PL',
  [TargetLanguage.Malay]: 'MY',
  [TargetLanguage.Italian]: 'IT',
  [TargetLanguage.Portuguese]: 'PT',
};

export const ALLERGENS_MAP: Record<TargetLanguage, Record<string, string>> = {
  [TargetLanguage.ChineseTW]: {
    "Beef": "牛肉", "Pork": "豬肉", "Peanuts": "花生", "Shrimp": "蝦類", "Seafood": "海鮮",
    "Coriander": "香菜", "Nuts": "堅果", "Soy": "大豆", "Eggs": "蛋類", "Milk": "乳製品"
  },
  [TargetLanguage.ChineseHK]: {
    "Beef": "牛肉", "Pork": "豬肉", "Peanuts": "花生", "Shrimp": "蝦類", "Seafood": "海鮮",
    "Coriander": "香菜", "Nuts": "堅果", "Soy": "大豆", "Eggs": "蛋類", "Milk": "乳製品"
  },
  [TargetLanguage.English]: {
    "Beef": "Beef", "Pork": "Pork", "Peanuts": "Peanuts", "Shrimp": "Shrimp", "Seafood": "Seafood",
    "Coriander": "Coriander", "Nuts": "Nuts", "Soy": "Soy", "Eggs": "Eggs", "Milk": "Milk"
  },
  [TargetLanguage.Japanese]: {
    "Beef": "牛肉", "Pork": "豚肉", "Peanuts": "落花生", "Shrimp": "海老", "Seafood": "シーフード",
    "Coriander": "パクチー", "Nuts": "ナッツ", "Soy": "大豆", "Eggs": "卵", "Milk": "乳製品"
  },
  [TargetLanguage.Korean]: {
    "Beef": "소고기", "Pork": "돼지고기", "Peanuts": "땅콩", "Shrimp": "새우", "Seafood": "해산물",
    "Coriander": "고수", "Nuts": "견과류", "Soy": "콩", "Eggs": "계란", "Milk": "우유"
  },
  [TargetLanguage.French]: {
    "Beef": "Bœuf", "Pork": "Porc", "Peanuts": "Cacahuètes", "Shrimp": "Crevettes", "Seafood": "Fruits de mer",
    "Coriander": "Coriandre", "Nuts": "Noix", "Soy": "Soja", "Eggs": "Œufs", "Milk": "Lait"
  },
  [TargetLanguage.Spanish]: {
    "Beef": "Vaca", "Pork": "Cerdo", "Peanuts": "Cacahuetes", "Shrimp": "Camarones", "Seafood": "Mariscos",
    "Coriander": "Cilantro", "Nuts": "Nueces", "Soy": "Soja", "Eggs": "Huevos", "Milk": "Leche"
  },
  [TargetLanguage.Thai]: {
    "Beef": "เนื้อวัว", "Pork": "เนื้อหมู", "Peanuts": "ถั่วลิสง", "Shrimp": "กุ้ง", "Seafood": "อาหารทะเล",
    "Coriander": "ผักชี", "Nuts": "ถั่ว", "Soy": "ถั่วเหลือง", "Eggs": "ไข่", "Milk": "นม"
  },
  [TargetLanguage.Filipino]: {
    "Beef": "Baka", "Pork": "Baboy", "Peanuts": "Mani", "Shrimp": "Hipon", "Seafood": "Pagkaing-dagat",
    "Coriander": "Wansoy", "Nuts": "Nuts", "Soy": "Soya", "Eggs": "Itlog", "Milk": "Gatas"
  },
  [TargetLanguage.Vietnamese]: {
    "Beef": "Thịt bò", "Pork": "Thịt lợn", "Peanuts": "Lạc", "Shrimp": "Tôm", "Seafood": "Hải sản",
    "Coriander": "Rau mùi", "Nuts": "Hạt", "Soy": "Đậu nành", "Eggs": "Trứng", "Milk": "Sữa"
  },
  [TargetLanguage.German]: {
    "Beef": "Rindfleisch", "Pork": "Schweinefleisch", "Peanuts": "Erdnüsse", "Shrimp": "Garnelen", "Seafood": "Meeresfrüchte",
    "Coriander": "Koriander", "Nuts": "Nüsse", "Soy": "Soja", "Eggs": "Eier", "Milk": "Milch"
  },
  [TargetLanguage.Russian]: {
    "Beef": "Говядина", "Pork": "Свинина", "Peanuts": "Арахис", "Shrimp": "Креветки", "Seafood": "Морепродукты",
    "Coriander": "Кориандр", "Nuts": "Орехи", "Soy": "Соя", "Eggs": "Яйца", "Milk": "Молоко"
  },
  [TargetLanguage.Indonesian]: {
    "Beef": "Daging Sapi", "Pork": "Daging Babi", "Peanuts": "Kacang Tanah", "Shrimp": "Udang", "Seafood": "Makanan Laut",
    "Coriander": "Ketumbar", "Nuts": "Kacang", "Soy": "Kedelai", "Eggs": "Telur", "Milk": "Susu"
  },
  [TargetLanguage.Polish]: {
    "Beef": "Wołowina", "Pork": "Wieprzowina", "Peanuts": "Orzeszki ziemne", "Shrimp": "Krewetki", "Seafood": "Owoce morza",
    "Coriander": "Kolendra", "Nuts": "Orzechy", "Soy": "Soja", "Eggs": "Jajka", "Milk": "Mleko"
  },
  [TargetLanguage.Malay]: {
    "Beef": "Daging Lembu", "Pork": "Daging Babi", "Peanuts": "Kacang Tanah", "Shrimp": "Udang", "Seafood": "Makanan Laut",
    "Coriander": "Ketumbar", "Nuts": "Kacang", "Soy": "Kacang Soya", "Eggs": "Telur", "Milk": "Susu"
  },
  [TargetLanguage.Italian]: {
    "Beef": "Manzo", "Pork": "Maiale", "Peanuts": "Arachidi", "Shrimp": "Gamberi", "Seafood": "Frutti di mare",
    "Coriander": "Coriandolo", "Nuts": "Noci", "Soy": "Soia", "Eggs": "Uova", "Milk": "Latte"
  },
  [TargetLanguage.Portuguese]: {
    "Beef": "Carne de bovino", "Pork": "Porco", "Peanuts": "Amendoins", "Shrimp": "Camarão", "Seafood": "Frutos do mar",
    "Coriander": "Coentro", "Nuts": "Nozes", "Soy": "Soja", "Eggs": "Ovos", "Milk": "Leite"
  }
};

export const ALLERGENS_LIST = Object.keys(ALLERGENS_MAP[TargetLanguage.English]);

// Feature 10: Dining Etiquette Tips (Replaced from translations)
export interface EtiquetteTip {
  countryCodes: string[];
  countryName: string;
  content: Partial<Record<TargetLanguage, string>>;
}

export const ETIQUETTE_TIPS: EtiquetteTip[] = [
  {
    countryCodes: ['GB', 'UK'],
    countryName: "UK",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在英國喝茶時，湯匙不可以留在杯子裡。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在英國喝茶時，湯匙不可以留在杯子裡。",
      [TargetLanguage.English]: "Did you know? In the UK, you shouldn't leave your spoon in the cup while drinking tea.",
      [TargetLanguage.Japanese]: "知っていますか？イギリスで紅茶を飲む際、スプーンをカップの中に入れたままにしてはいけません。",
      [TargetLanguage.Korean]: "알고 계셨나요? 영국에서 차를 마실 때 티스푼을 컵 안에 그대로 두면 안 됩니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Anh, không nên để thìa trong tách khi đang uống trà.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในอังกฤษเวลาดื่มชา ไม่ควรแช่ช้อนทิ้งไว้ในถ้วย",
      [TargetLanguage.French]: "Le saviez-vous ? En Angleterre, il ne faut pas laisser la cuillère dans la tasse en buvant du thé.",
      [TargetLanguage.Spanish]: "¿Sabías que? En el Reino Unido, no debes dejar la cuchara dentro de la taza mientras bebes té.",
      [TargetLanguage.Italian]: "Lo sapevi? Nel Regno Unito, non dovresti lasciare il cucchiaino nella tazza mentre bevi il tè."
    }
  },
  {
    countryCodes: ['TR'],
    countryName: "Turkey",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在土耳其用餐完畢後，如果不想續杯茶請將茶匙橫放。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在土耳其用餐完畢後，如果不想續杯茶請將茶匙橫放。",
      [TargetLanguage.English]: "Did you know? In Turkey, place your teaspoon across the tea glass if you don't want a refill.",
      [TargetLanguage.Japanese]: "知っていますか？トルコでおかわりが不要な場合は、ティースプーンをグラスの上に横に置きます。",
      [TargetLanguage.Korean]: "알고 계셨나요? 터키에서 차를 더 마시고 싶지 않다면 티스푼을 컵 위에 가로로 올려두세요.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Thổ Nhĩ Kỳ, hãy đặt thìa nằm ngang trên miệng ly nếu bạn không muốn rót thêm trà.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในตุรกีเมื่อดื่มชาเสร็จแล้ว หากไม่ต้องการเติมเพิ่มให้วางช้อนชาพาดไว้บนขอบแก้ว",
      [TargetLanguage.French]: "Le saviez-vous ? En Turquie, posez votre cuillère sur le verre si vous ne voulez plus de thé.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Turquía, coloca la cucharilla sobre el vaso si no quieres que te sirvan más té.",
      [TargetLanguage.Italian]: "Lo sapevi? In Turchia, appoggia il cucchiaino sul bicchiere se non vuoi altro tè."
    }
  },
  {
    countryCodes: ['MX'],
    countryName: "Mexico",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在墨西哥吃塔可，當地人通常會直接用手抓著吃。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在墨西哥吃塔可，當地人通常會直接用手抓著吃。",
      [TargetLanguage.English]: "Did you know? In Mexico, people usually eat tacos with their hands, not cutlery.",
      [TargetLanguage.Japanese]: "知っていますか？メキシコでタコスを食べる際、現地の人は通常手で直接持って食べます。",
      [TargetLanguage.Korean]: "알고 계셨나요? 멕시코에서 타코를 먹을 때 현지인들은 보통 손으로 직접 들고 먹습니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Mexico, người dân địa phương thường dùng tay trực tiếp để ăn taco.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในเม็กซิโก การกินทาโก้มักจะใช้มือหยิบกินโดยตรง",
      [TargetLanguage.French]: "Le saviez-vous ? Au Mexique, on mange généralement les tacos avec les mains.",
      [TargetLanguage.Spanish]: "¿Sabías que? En México, la gente suele comer los tacos directamente con las manos.",
      [TargetLanguage.Italian]: "Lo sapevi? In Messico, di solito si mangiano i tacos con le mani."
    }
  },
  {
    countryCodes: ['IT'],
    countryName: "Italy",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在義大利吃海鮮義大利麵，通常是不加起司粉的。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在義大利吃海鮮義大利麵，通常是不加起司粉的。",
      [TargetLanguage.English]: "Did you know? In Italy, it's uncommon to add cheese to seafood pasta.",
      [TargetLanguage.Japanese]: "知っていますか？イタリアでは海鮮パスタに粉チーズをかけないのが一般的です。",
      [TargetLanguage.Korean]: "알고 계셨나요? 이탈리아에서 해산물 파스타를 먹을 때는 보통 치즈 가루를 뿌리지 않습니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Ý, người ta thường không cho thêm phô mai vào mì Ý hải sản.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในอิตาลี การกินพาสต้าอาหารทะเลมักจะไม่โรยชีส",
      [TargetLanguage.French]: "Le saviez-vous ? En Italie, on n'ajoute généralement pas de fromage sur les pâtes aux fruits de mer.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Italia, no se suele añadir queso a la pasta de mariscos.",
      [TargetLanguage.Italian]: "Lo sapevi? In Italia, non si aggiunge quasi mai il formaggio alla pasta ai frutti di mare."
    }
  },
  {
    countryCodes: ['DE'],
    countryName: "Germany",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在德國與人碰杯時，視線必須看著對方的眼睛。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在德國與人碰杯時，視線必須看著對方的眼睛。",
      [TargetLanguage.English]: "Did you know? In Germany, you must maintain eye contact when clinking glasses.",
      [TargetLanguage.Japanese]: "知っていますか？ドイツで乾杯する際、相手の目を見てグラスを合わせるのがマナーです。",
      [TargetLanguage.Korean]: "알고 계셨나요? 독일에서 건배할 때는 반드시 상대방의 눈을 쳐다봐야 합니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Đức, khi chạm ly, bạn phải nhìn thẳng vào mắt đối phương.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในเยอรมนีเวลาชนแก้ว คุณต้องสบตาอีกฝ่ายด้วย",
      [TargetLanguage.French]: "Le saviez-vous ? En Allemagne, il faut regarder l'autre dans les yeux au moment de trinquer.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Alemania, debes mirar a los ojos de la otra persona al brindar.",
      [TargetLanguage.Italian]: "Lo sapevi? In Germania, devi guardare negli occhi l'altra persona quando si brinda."
    }
  },
  {
    countryCodes: ['RU'],
    countryName: "Russia",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在俄羅斯收下酒後如果不喝掉，會被視為不禮貌。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在俄羅斯收下酒後如果不喝掉，會被視為不禮貌。",
      [TargetLanguage.English]: "Did you know? In Russia, refusing to finish a drink offered to you is considered impolite.",
      [TargetLanguage.Japanese]: "知っていますか？ロシアでお酒を勧められた際、飲み干さないのは失礼にあたります。",
      [TargetLanguage.Korean]: "알고 계셨나요? 러시아에서 술을 받은 후 다 마시지 않으면 무례한 행동으로 간주됩니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Nga, nếu đã nhận rượu mà không uống hết sẽ bị coi là bất lịch sự.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในรัสเซียเมื่อได้รับเหล้าแล้วหากไม่ดื่มให้หมด จะถือว่าเสียมารยาท",
      [TargetLanguage.French]: "Le saviez-vous ? En Russie, il est impoli de ne pas finir un verre d'alcool que l'on vous a offert.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Rusia, se considera de mala educación no terminarse una bebida ofrecida.",
      [TargetLanguage.Italian]: "Lo sapevi? In Russia, è scortese non finire una bevanda che ti viene offerta."
    }
  },
  {
    countryCodes: ['ES'],
    countryName: "Spain",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在西班牙用餐，通常要到下午兩點後才開始吃午餐。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在西班牙用餐，通常要到下午兩點後才開始吃午餐。",
      [TargetLanguage.English]: "Did you know? In Spain, lunch usually doesn't start until after 2 PM.",
      [TargetLanguage.Japanese]: "知っていますか？スペインでの昼食は、通常午後2時以降に始まります。",
      [TargetLanguage.Korean]: "알고 계셨나요? 스페인에서는 보통 오후 2시가 넘어야 점심 식사를 시작합니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Tây Ban Nha, bữa trưa thường chỉ bắt đầu sau 2 giờ chiều.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในสเปน มื้อกลางวันมักจะเริ่มกินกันหลังบ่ายสองโมงเป็นต้นไป",
      [TargetLanguage.French]: "Le saviez-vous ? En Espagne, le déjeuner ne commence généralement qu'après 14 heures.",
      [TargetLanguage.Spanish]: "¿Sabías que? En España, el almuerzo no suele empezar hasta después de las dos de la tarde.",
      [TargetLanguage.Italian]: "Lo sapevi? In Spagna, il pranzo di solito non inizia prima delle 14:00."
    }
  },
  {
    countryCodes: ['EG'],
    countryName: "Egypt",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在埃及鹽罐通常不在桌上，要求加鹽代表廚師手藝不佳。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在埃及鹽罐通常不在桌上，要求加鹽代表廚師手藝不佳。",
      [TargetLanguage.English]: "Did you know? In Egypt, asking for salt means you find the chef's cooking inadequate.",
      [TargetLanguage.Japanese]: "知っていますか？エジプトで塩を求めるのは、料理が不十分だという意味になり失礼です。",
      [TargetLanguage.Korean]: "알고 계셨나요? 이집트에서 소금을 달라고 하는 것은 요리사의 솜씨가 부족하다는 뜻입니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Ai Cập, yêu cầu thêm muối đồng nghĩa với việc chê đầu bếp nấu ăn không ngon.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในอียิปต์ การขอเกลือเพิ่มหมายถึงคุณคิดว่าพ่อครัวปรุงอาหารได้ไม่อร่อย",
      [TargetLanguage.French]: "Le saviez-vous ? En Égypte, demander du sel signifie que vous trouvez la cuisine du chef médiocre.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Egipto, pedir sal significa que consideras que la comida del chef no es buena.",
      [TargetLanguage.Italian]: "Lo sapevi? In Egitto, chiedere il sale significa che reputi la cucina dello chef inadeguata."
    }
  },
  {
    countryCodes: ['MA'],
    countryName: "Morocco",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在摩洛哥吃飯，通常會從共用的圓盤中取用食物。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在摩洛哥吃飯，通常會從共用的圓盤中取用食物。",
      [TargetLanguage.English]: "Did you know? In Morocco, people usually eat from a shared communal plate.",
      [TargetLanguage.Japanese]: "知っていますか？モロッコでは通常、大きな皿を共有して食事をします。",
      [TargetLanguage.Korean]: "알고 계셨나요? 모로코에서는 보통 커다란 공용 접시 하나에서 음식을 함께 나눠 먹습니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Maroc, mọi người thường ăn chung từ một đĩa lớn dùng chung.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในโมร็อกโก การกินข้าวมักจะตักแบ่งกินจากจานกลางใบใหญ่ร่วมกัน",
      [TargetLanguage.French]: "Le saviez-vous ? Au Maroc, on mange généralement tous dans un grand plat commun.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Marruecos, la gente suele comer de un plato común compartido.",
      [TargetLanguage.Italian]: "Lo sapevi? In Marocco, di solito si mangia condividendo un grande piatto comune."
    }
  },
  {
    countryCodes: ['BG'],
    countryName: "Bulgaria",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在保加利亞點頭代表不同意，搖頭反而代表同意。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在保加利亞點頭代表不同意，搖頭反而代表同意。",
      [TargetLanguage.English]: "Did you know? In Bulgaria, nodding means \"no\" and shaking your head means \"yes.\"",
      [TargetLanguage.Japanese]: "知っていますか？ブルガリアでは、頷くと「いいえ」、首を振ると「はい」を意味します。",
      [TargetLanguage.Korean]: "알고 계셨나요? 불가리아에서는 고개를 끄덕이면 아니오, 가로저으면 예를 의미합니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Bulgaria, gật đầu nghĩa là không, còn lắc đầu lại nghĩa là đồng ý.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในบัลแกเรีย การพยักหน้าหมายถึงไม่ แต่การส่ายหน้าหมายถึงใช่",
      [TargetLanguage.French]: "Le saviez-vous ? En Bulgarie, hocher la tête signifie « non » et secouer la tête signifie « oui ».",
      [TargetLanguage.Spanish]: "¿Sabías que? En Bulgaria, asentir con la cabeza significa \"no\" y negar con la cabeza significa \"sí\".",
      [TargetLanguage.Italian]: "Lo sapevi? In Bulgaria, annuire significa \"no\" e scuotere la testa significa \"sì\"."
    }
  },
  {
    countryCodes: ['JP'],
    countryName: "Japan",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在日本吃拉麵時，發出吸麵的聲音代表你覺得很好吃，是一種禮貌。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在日本吃拉麵時，發出吸麵的聲音代表你覺得很好吃，是一種禮貌。",
      [TargetLanguage.English]: "Did you know? In Japan, slurping your noodles loudly is a sign of enjoyment and respect to the chef.",
      [TargetLanguage.Japanese]: "知っていますか？日本ではラーメンをすする音を立てて食べるのは、美味しさの表現であり礼儀です。",
      [TargetLanguage.Korean]: "알고 계셨나요? 일본에서 라면을 후룩후룩 소리 내며 먹는 것은 맛있다는 표현이자 예의입니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Nhật, húp mì ramen thật to là một cách thể hiện sự thích thú và tôn trọng đầu bếp.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในญี่ปุ่นการซดราเม็งเสียงดังถือเป็นมารยาทที่ดี แสดงว่าอร่อย",
      [TargetLanguage.French]: "Le saviez-vous ? Au Japon, aspirer bruyamment ses nouilles est un signe de plaisir et de respect envers le chef.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Japón, sorber los fideos ruidosamente es señal de que disfrutas la comida.",
      [TargetLanguage.Italian]: "Lo sapevi? In Giappone, risucchiare rumorosamente i noodles è segno di apprezzamento verso lo chef."
    }
  },
  {
    countryCodes: ['TH'],
    countryName: "Thailand",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在泰國吃飯時，叉子只是用來把食物推到湯匙上，不會直接用叉子送入口中。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在泰國吃飯時，叉子只是用來把食物推到湯匙上，不會直接用叉子送入口中。",
      [TargetLanguage.English]: "Did you know? In Thailand, the fork is only used to push food onto the spoon — you never put the fork in your mouth.",
      [TargetLanguage.Japanese]: "知っていますか？タイではフォークは食べ物をスプーンに押し乗せる道具で、口に入れるのはスプーンだけです。",
      [TargetLanguage.Korean]: "알고 계셨나요? 태국에서 포크는 음식을 숟가락 위에 올려놓는 용도로만 사용합니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Thái Lan, nĩa chỉ dùng để gạt thức ăn lên thìa, không bao giờ đưa nĩa vào miệng.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในประเทศไทย ส้อมใช้ตักอาหารใส่ช้อนเท่านั้น ไม่ใช้ส้อมเข้าปากโดยตรง",
      [TargetLanguage.French]: "Le saviez-vous ? En Thaïlande, la fourchette sert uniquement à pousser la nourriture sur la cuillère.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Tailandia, el tenedor solo se usa para empujar la comida a la cuchara.",
      [TargetLanguage.Italian]: "Lo sapevi? In Thailandia, la forchetta serve solo a spingere il cibo sul cucchiaio."
    }
  },
  {
    countryCodes: ['CN'],
    countryName: "China",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在中國把筷子插在飯上是大忌，因為這像是祭拜往生者的香。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在中國把筷子插在飯上是大忌，因為這像是祭拜往生者的香。",
      [TargetLanguage.English]: "Did you know? In China, sticking chopsticks upright in rice is taboo — it resembles incense for the dead.",
      [TargetLanguage.Japanese]: "知っていますか？中国でご飯に箸を突き立てるのはタブーです。お葬式の線香に見えるためです。",
      [TargetLanguage.Korean]: "알고 계셨나요? 중국에서 젓가락을 밥에 꽂아두는 것은 금기입니다. 장례식의 향을 연상시키기 때문이에요.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Trung Quốc, cắm đũa thẳng đứng trong bát cơm là điều cấm kỵ vì trông giống hương cúng.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในจีน การปักตะเกียบตั้งตรงในชามข้าวเป็นสิ่งต้องห้าม เพราะคล้ายธูปไหว้ผู้เสียชีวิต",
      [TargetLanguage.French]: "Le saviez-vous ? En Chine, planter des baguettes dans le riz est tabou — cela rappelle l'encens funéraire.",
      [TargetLanguage.Spanish]: "¿Sabías que? En China, clavar los palillos en el arroz es tabú — se parece al incienso funerario.",
      [TargetLanguage.Italian]: "Lo sapevi? In Cina, piantare le bacchette nel riso è un tabù — ricorda l'incenso funebre."
    }
  },
  {
    countryCodes: ['IN'],
    countryName: "India",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在印度只能用右手吃飯，因為左手被認為是不潔的。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在印度只能用右手吃飯，因為左手被認為是不潔的。",
      [TargetLanguage.English]: "Did you know? In India, you should only eat with your right hand — the left hand is considered unclean.",
      [TargetLanguage.Japanese]: "知っていますか？インドでは右手だけで食事をします。左手は不浄とされているためです。",
      [TargetLanguage.Korean]: "알고 계셨나요? 인도에서는 오른손으로만 식사합니다. 왼손은 부정한 것으로 여겨집니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Ấn Độ, bạn chỉ nên ăn bằng tay phải vì tay trái được coi là không sạch sẽ.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในอินเดียต้องใช้มือขวากินข้าวเท่านั้น เพราะมือซ้ายถือว่าไม่สะอาด",
      [TargetLanguage.French]: "Le saviez-vous ? En Inde, on ne mange qu'avec la main droite — la gauche est jugée impure.",
      [TargetLanguage.Spanish]: "¿Sabías que? En India, solo se come con la mano derecha — la izquierda se considera impura.",
      [TargetLanguage.Italian]: "Lo sapevi? In India, si mangia solo con la mano destra — la sinistra è considerata impura."
    }
  },
  {
    countryCodes: ['FR'],
    countryName: "France",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在法國，麵包不放在盤子裡，而是直接放在桌巾上，這才是正式禮儀。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在法國，麵包不放在盤子裡，而是直接放在桌巾上，這才是正式禮儀。",
      [TargetLanguage.English]: "Did you know? In France, bread is placed directly on the tablecloth, not on a plate — that's proper etiquette.",
      [TargetLanguage.Japanese]: "知っていますか？フランスでは、パンは皿の上ではなくテーブルクロスの上に直接置くのが正式なマナーです。",
      [TargetLanguage.Korean]: "알고 계셨나요? 프랑스에서는 빵을 접시가 아닌 테이블보 위에 직접 놓아야 올바른 예절입니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Pháp, bánh mì được đặt trực tiếp trên khăn trải bàn chứ không phải trên đĩa.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในฝรั่งเศส ขนมปังจะวางบนผ้าปูโต๊ะโดยตรง ไม่ใช่วางบนจาน",
      [TargetLanguage.French]: "Le saviez-vous ? En France, le pain se pose directement sur la nappe, pas dans l'assiette.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Francia, el pan se coloca directamente sobre el mantel, no en el plato.",
      [TargetLanguage.Italian]: "Lo sapevi? In Francia, il pane si mette direttamente sulla tovaglia, non nel piatto."
    }
  },
  {
    countryCodes: ['KR'],
    countryName: "South Korea",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在韓國，如果長輩還沒開始吃，晚輩是不能先動筷子的。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在韓國，如果長輩還沒開始吃，晚輩是不能先動筷子的。",
      [TargetLanguage.English]: "Did you know? In South Korea, you must wait for the eldest person to start eating before you begin.",
      [TargetLanguage.Japanese]: "知っていますか？韓国では、年長者が食べ始めるまで箸をつけてはいけません。",
      [TargetLanguage.Korean]: "알고 계셨나요? 한국에서는 어른이 먼저 수저를 들기 전에 식사를 시작하면 안 됩니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Hàn Quốc, bạn phải đợi người lớn tuổi nhất bắt đầu ăn trước.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในเกาหลีใต้ ต้องรอให้ผู้อาวุโสเริ่มกินก่อนจึงจะหยิบตะเกียบได้",
      [TargetLanguage.French]: "Le saviez-vous ? En Corée du Sud, il faut attendre que l'aîné commence à manger avant de toucher à son plat.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Corea del Sur, debes esperar a que la persona mayor empiece a comer antes de empezar tú.",
      [TargetLanguage.Italian]: "Lo sapevi? In Corea del Sud, devi aspettare che il più anziano inizi a mangiare prima di iniziare tu."
    }
  },
  {
    countryCodes: ['ET'],
    countryName: "Ethiopia",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在衣索比亞，把食物親手餵進別人嘴裡叫做「古沙」，是表達友情與愛的方式。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在衣索比亞，把食物親手餵進別人嘴裡叫做「古沙」，是表達友情與愛的方式。",
      [TargetLanguage.English]: "Did you know? In Ethiopia, hand-feeding someone (called 'Gursha') is a gesture of love and friendship.",
      [TargetLanguage.Japanese]: "知っていますか？エチオピアでは、相手の口に直接食べ物を入れる「グルシャ」は友情と愛の表現です。",
      [TargetLanguage.Korean]: "알고 계셨나요? 에티오피아에서는 상대방의 입에 음식을 직접 넣어주는 '구르샤'가 우정과 사랑의 표현입니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Ethiopia, tự tay bón thức ăn cho người khác gọi là 'Gursha' — biểu hiện tình bạn và tình yêu.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในเอธิโอเปีย การป้อนอาหารให้คนอื่นด้วยมือเรียกว่า 'กุรชา' เป็นการแสดงมิตรภาพ",
      [TargetLanguage.French]: "Le saviez-vous ? En Éthiopie, nourrir quelqu'un à la main ('Gursha') est un geste d'amour et d'amitié.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Etiopía, darle comida a alguien en la boca ('Gursha') es un gesto de amistad y amor.",
      [TargetLanguage.Italian]: "Lo sapevi? In Etiopia, imboccare qualcuno ('Gursha') è un gesto di amicizia e amore."
    }
  },
  {
    countryCodes: ['PT'],
    countryName: "Portugal",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在葡萄牙的餐廳，桌上已經擺放好的麵包和橄欖是要另外收費的。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在葡萄牙的餐廳，桌上已經擺放好的麵包和橄欖是要另外收費的。",
      [TargetLanguage.English]: "Did you know? In Portugal, the bread and olives already on your table aren't free — they'll be charged if you eat them.",
      [TargetLanguage.Japanese]: "知っていますか？ポルトガルのレストランでは、テーブルに置いてあるパンやオリーブは食べると有料です。",
      [TargetLanguage.Korean]: "알고 계셨나요? 포르투갈 식당에서 테이블에 놓인 빵과 올리브는 먹으면 추가 요금이 부과됩니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Bồ Đào Nha, bánh mì và ô liu sẵn trên bàn không miễn phí — bạn sẽ bị tính tiền.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในโปรตุเกส ขนมปังและมะกอกที่วางบนโต๊ะไม่ฟรี จะถูกคิดเงินถ้ากิน",
      [TargetLanguage.French]: "Le saviez-vous ? Au Portugal, le pain et les olives déjà sur la table ne sont pas gratuits.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Portugal, el pan y las aceitunas ya en la mesa no son gratis — te los cobrarán.",
      [TargetLanguage.Italian]: "Lo sapevi? In Portogallo, il pane e le olive già sul tavolo non sono gratis — ti verranno addebitati."
    }
  },
  {
    countryCodes: ['PH'],
    countryName: "Philippines",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在菲律賓，吃飯時常用湯匙和叉子，筷子反而很少見。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在菲律賓，吃飯時常用湯匙和叉子，筷子反而很少見。",
      [TargetLanguage.English]: "Did you know? In the Philippines, people primarily eat with a spoon and fork — chopsticks are rarely used.",
      [TargetLanguage.Japanese]: "知っていますか？フィリピンでは主にスプーンとフォークで食事し、箸はほとんど使いません。",
      [TargetLanguage.Korean]: "알고 계셨나요? 필리핀에서는 주로 숟가락과 포크로 식사하며, 젓가락은 거의 사용하지 않습니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Ở Philippines, người ta chủ yếu ăn bằng thìa và nĩa — đũa rất ít khi được sử dụng.",
      [TargetLanguage.Thai]: "รู้หรือไม่? ในฟิลิปปินส์ คนส่วนใหญ่กินข้าวด้วยช้อนกับส้อม ไม่ค่อยใช้ตะเกียบ",
      [TargetLanguage.French]: "Le saviez-vous ? Aux Philippines, on mange avec une cuillère et une fourchette — les baguettes sont rares.",
      [TargetLanguage.Spanish]: "¿Sabías que? En Filipinas, se come con cuchara y tenedor — los palillos son muy poco comunes.",
      [TargetLanguage.Italian]: "Lo sapevi? Nelle Filippine, si mangia con cucchiaio e forchetta — le bacchette sono raramente usate."
    }
  },
  {
    countryCodes: ['SE'],
    countryName: "Sweden",
    content: {
      [TargetLanguage.ChineseTW]: "你知道嗎？在瑞典有一種叫做 Fika 的咖啡文化，每天至少要有兩次停下來喝咖啡配甜點的時間。",
      [TargetLanguage.ChineseHK]: "你知道嗎？在瑞典有一種叫做 Fika 的咖啡文化，每天至少要有兩次停下來喝咖啡配甜點的時間。",
      [TargetLanguage.English]: "Did you know? Sweden has a tradition called 'Fika' — a daily coffee-and-pastry break taken at least twice a day.",
      [TargetLanguage.Japanese]: "知っていますか？スウェーデンには「フィーカ」という伝統があり、毎日少なくとも2回コーヒーとお菓子を楽しむ時間があります。",
      [TargetLanguage.Korean]: "알고 계셨나요? 스웨덴에는 하루에 최소 두 번 커피와 빵을 먹는 '피카'라는 전통이 있습니다.",
      [TargetLanguage.Vietnamese]: "Bạn có biết? Thụy Điển có truyền thống 'Fika' — nghỉ uống cà phê ăn bánh ít nhất hai lần một ngày.",
      [TargetLanguage.Thai]: "รู้หรือไม่? สวีเดนมีวัฒนธรรม 'Fika' คือพักดื่มกาแฟคู่ขนมหวานอย่างน้อยวันละสองครั้ง",
      [TargetLanguage.French]: "Le saviez-vous ? En Suède, le 'Fika' est une tradition de pause café-pâtisserie au moins deux fois par jour.",
      [TargetLanguage.Spanish]: "¿Sabías que? Suecia tiene una tradición llamada 'Fika' — una pausa de café y pastelería al menos dos veces al día.",
      [TargetLanguage.Italian]: "Lo sapevi? In Svezia c'è il 'Fika' — una pausa caffè e dolcetti almeno due volte al giorno."
    }
  }
];
