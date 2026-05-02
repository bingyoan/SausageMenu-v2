import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { MenuData } from '../types';
import toast from 'react-hot-toast';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  '繁體中文': {
    title: '分享至地圖', subtitle: '幫助其他旅客找到這份菜單', restaurantName: '餐廳名稱 *', restaurantPlaceholder: '例如：一蘭拉麵 渋谷店', address: '地址 *', addressPlaceholder: '例如：東京都渋谷區神南1-22-7', uploaderName: '您的名字 (選填)', anonymous: '匿名', location: '位置', gpsDetected: '座標已偵測：', willUseCurrent: '將使用您目前的位置上傳', menuItems: '菜單品項', dishes: '道菜', btnShare: '分享至地圖', btnUploading: '上傳中...', uploadedTitle: '上傳成功！ 🎉', uploadedDesc: '其他旅客現在可以在地圖上找到這份菜單了。', btnDone: '完成', errName: '請輸入餐廳名稱', errAddress: '請輸入餐廳地址', errLocation: '無法取得位置，請允許定位存取。', succUpdate: '地圖上的菜單已更新！', succShare: '菜單已分享至地圖！', errUpload: '上傳失敗', errNetwork: '網路錯誤'
  },
  '繁體中文-HK': {
    title: '分享至地圖', subtitle: '幫助其他旅客找到呢份餐牌', restaurantName: '餐廳名稱 *', restaurantPlaceholder: '例如：一蘭拉麵 渋谷店', address: '地址 *', addressPlaceholder: '例如：東京都渋谷區神南1-22-7', uploaderName: '您的名字 (選填)', anonymous: '匿名', location: '位置', gpsDetected: '座標已偵測：', willUseCurrent: '將使用您目前的位置上傳', menuItems: '餐牌品項', dishes: '道菜', btnShare: '分享至地圖', btnUploading: '上傳中...', uploadedTitle: '上傳成功！ 🎉', uploadedDesc: '其他旅客依家可以喺地圖上找到呢份餐牌啦。', btnDone: '完成', errName: '請輸入餐廳名稱', errAddress: '請輸入餐廳地址', errLocation: '無法取得位置，請允許定位存取。', succUpdate: '地圖上的餐牌已更新！', succShare: '餐牌已分享至地圖！', errUpload: '上傳失敗', errNetwork: '網路錯誤'
  },
  'English': {
   title: 'Share to Map', subtitle: 'Help other travelers find this menu', restaurantName: 'RESTAURANT NAME *', restaurantPlaceholder: 'e.g. Ichiran Ramen Shibuya', address: 'ADDRESS *', addressPlaceholder: 'e.g. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'YOUR NAME (OPTIONAL)', anonymous: 'Anonymous', location: 'Location', gpsDetected: 'GPS detected: ', willUseCurrent: 'Will use your current location on upload', menuItems: 'Menu Items', dishes: 'dishes', btnShare: 'Share to Map', btnUploading: 'Uploading...', uploadedTitle: 'Uploaded! 🎉', uploadedDesc: 'Other travelers can now find this menu on the map.', btnDone: 'Done', errName: 'Please enter the restaurant name', errAddress: 'Please enter the restaurant address', errLocation: 'Unable to get location. Please allow location access.', succUpdate: 'Menu updated on map!', succShare: 'Menu shared to map!', errUpload: 'Upload failed', errNetwork: 'Network error'
  },
  '日本語': {
    title: '地図に共有', subtitle: '他の旅行者がこのメニューを見つけられるようにする', restaurantName: 'レストラン名 *', restaurantPlaceholder: '例：一蘭 渋谷店', address: '住所 *', addressPlaceholder: '例：東京都渋谷区神南1-22-7', uploaderName: 'お名前 (任意)', anonymous: '匿名', location: '位置情報', gpsDetected: 'GPS 取得完了：', willUseCurrent: '現在の位置情報を使用してアップロードします', menuItems: 'メニュー一覧', dishes: '品', btnShare: '地図に共有', btnUploading: 'アップロード中...', uploadedTitle: 'アップロード完了！ 🎉', uploadedDesc: '他の旅行者が地図上でこのメニューを見つけることができます。', btnDone: '完了', errName: 'レストラン名を入力してください', errAddress: '住所を入力してください', errLocation: '位置情報を取得できません。アクセスを許可してください。', succUpdate: 'メニューが更新されました！', succShare: 'メニューが地図に共有されました！', errUpload: 'アップロード失敗', errNetwork: 'ネットワークエラー'
  },
  '한국어': {
    title: '지도에 공유하기', subtitle: '다른 여행자들이 이 메뉴를 찾을 수 있도록 돕기', restaurantName: '식당 이름 *', restaurantPlaceholder: '예: 이치란 라멘 시부야점', address: '주소 *', addressPlaceholder: '예: 도쿄도 시부야구 진난 1-22-7', uploaderName: '이름 (선택)', anonymous: '익명', location: '위치', gpsDetected: 'GPS 감지됨: ', willUseCurrent: '업로드 시 현재 위치를 사용합니다', menuItems: '메뉴 항목', dishes: '개 요리', btnShare: '지도에 공유하기', btnUploading: '업로드 중...', uploadedTitle: '업로드 완료! 🎉', uploadedDesc: '이제 다른 여행자들이 지도에서 이 메뉴를 찾을 수 있습니다.', btnDone: '완료', errName: '식당 이름을 입력해주세요', errAddress: '주소를 입력해주세요', errLocation: '위치를 가져올 수 없습니다. 위치 접근을 허용해주세요.', succUpdate: '지도에서 메뉴가 업데이트되었습니다!', succShare: '메뉴가 지도에 공유되었습니다!', errUpload: '업로드 실패', errNetwork: '네트워크 오류'
  },
  'Français': {
    title: 'Partager sur la carte', subtitle: 'Aidez d\'autres voyageurs à trouver ce menu', restaurantName: 'NOM DU RESTAURANT *', restaurantPlaceholder: 'ex. Ichiran Ramen Shibuya', address: 'ADRESSE *', addressPlaceholder: 'ex. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'VOTRE NOM (FACULTATIF)', anonymous: 'Anonyme', location: 'Emplacement', gpsDetected: 'GPS détecté: ', willUseCurrent: 'Utilisera votre position actuelle', menuItems: 'Articles du Menu', dishes: 'plats', btnShare: 'Partager sur la carte', btnUploading: 'Téléchargement...', uploadedTitle: 'Téléchargé! 🎉', uploadedDesc: 'D\'autres voyageurs peuvent maintenant trouver ce menu sur la carte.', btnDone: 'Terminé', errName: 'Veuillez entrer le nom du restaurant', errAddress: 'Veuillez entrer l\'adresse', errLocation: 'Impossible d\'obtenir l\'emplacement. Veuillez autoriser l\'accès.', succUpdate: 'Menu mis à jour !', succShare: 'Menu partagé sur la carte !', errUpload: 'Échec du téléchargement', errNetwork: 'Erreur réseau'
  },
  'Español': {
    title: 'Compartir en el Mapa', subtitle: 'Ayuda a otros viajeros a encontrar este menú', restaurantName: 'NOMBRE DEL RESTAURANTE *', restaurantPlaceholder: 'ej. Ichiran Ramen Shibuya', address: 'DIRECCIÓN *', addressPlaceholder: 'ej. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'TU NOMBRE (OPCIONAL)', anonymous: 'Anónimo', location: 'Ubicación', gpsDetected: 'GPS detectado: ', willUseCurrent: 'Usará tu ubicación actual', menuItems: 'Artículos del Menú', dishes: 'platillos', btnShare: 'Compartir en el Mapa', btnUploading: 'Subiendo...', uploadedTitle: '¡Subido! 🎉', uploadedDesc: 'Otros viajeros ahora pueden encontrar este menú en el mapa.', btnDone: 'Hecho', errName: 'Por favor ingresa el nombre del restaurante', errAddress: 'Por favor ingresa la dirección', errLocation: 'No se pudo obtener la ubicación. Permita el acceso.', succUpdate: '¡Menú actualizado en el mapa!', succShare: '¡Menú compartido en el mapa!', errUpload: 'Error al subir', errNetwork: 'Error de red'
  },
  'ไทย': {
     title: 'แชร์ลงแผนที่', subtitle: 'ช่วยให้นักเดินทางคนอื่นค้นพบเมนูนี้', restaurantName: 'ชื่อร้านอาหาร *', restaurantPlaceholder: 'เช่น Ichiran Ramen Shibuya', address: 'ที่อยู่ *', addressPlaceholder: 'เช่น 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'ชื่อของคุณ (ไม่บังคับ)', anonymous: 'ไม่ระบุชื่อ', location: 'ตำแหน่งที่ตั้ง', gpsDetected: 'ตรวจพบ GPS: ', willUseCurrent: 'จะใช้ตำแหน่งปัจจุบันของคุณในการอัปโหลด', menuItems: 'รายการเมนู', dishes: 'เมนู', btnShare: 'แชร์ลงแผนที่', btnUploading: 'กำลังอัปโหลด...', uploadedTitle: 'อัปโหลดสำเร็จ! 🎉', uploadedDesc: 'ตอนนี้นักเดินทางคนอื่นสามารถค้นพบเมนูนี้บนแผนที่ได้แล้ว', btnDone: 'เสร็จสิ้น', errName: 'กรุณาระบุชื่อร้านอาหาร', errAddress: 'กรุณาระบุที่อยู่ร้านอาหาร', errLocation: 'ไม่สามารถรับตำแหน่งที่ตั้งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง', succUpdate: 'อัปเดตเมนูบนแผนที่แล้ว!', succShare: 'แชร์เมนูลงแผนที่แล้ว!', errUpload: 'อัปโหลดล้มเหลว', errNetwork: 'เกิดข้อผิดพลาดด้านเครือข่าย'
  },
  'Tagalog': {
    title: 'Ibahagi sa Mapa', subtitle: 'Tulungan ang ibang manlalakbay na mahanap ang menu na ito', restaurantName: 'PANGALAN NG RESTAURANT *', restaurantPlaceholder: 'hal. Ichiran Ramen Shibuya', address: 'ADDRESS *', addressPlaceholder: 'hal. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'IYONG PANGALAN (OPTIONAL)', anonymous: 'Anonymous', location: 'Lokasyon', gpsDetected: 'Na-detect ang GPS: ', willUseCurrent: 'Gagamitin ang iyong kasalukuyang lokasyon', menuItems: 'Mga Item sa Menu', dishes: 'putahe', btnShare: 'Ibahagi sa Mapa', btnUploading: 'Ina-upload...', uploadedTitle: 'Na-upload na! 🎉', uploadedDesc: 'Maaari na ngayong mahanap ng ibang manlalakbay ang menu na ito sa mapa.', btnDone: 'Tapos na', errName: 'Pakilagay ang pangalan ng restaurant', errAddress: 'Pakilagay ang address', errLocation: 'Hindi makuha ang lokasyon. Pakipayagan ang pag-access sa lokasyon.', succUpdate: 'Na-update ang menu sa mapa!', succShare: 'Naibahagi na sa mapa ang menu!', errUpload: 'Nabigo ang mismong pag-upload', errNetwork: 'Error sa network'
  },
  'Tiếng Việt': {
    title: 'Chia sẻ lên Bản đồ', subtitle: 'Giúp những du khách khác tìm thấy thực đơn này', restaurantName: 'TÊN NHÀ HÀNG *', restaurantPlaceholder: 'vd: Ichiran Ramen Shibuya', address: 'ĐỊA CHỈ *', addressPlaceholder: 'vd: 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'TÊN CỦA BẠN (TÙY CHỌN)', anonymous: 'Ẩn danh', location: 'Vị trí', gpsDetected: 'Đã phát hiện GPS: ', willUseCurrent: 'Sẽ sử dụng vị trí hiện tại của bạn khi tải lên', menuItems: 'Thực Đơn', dishes: 'món', btnShare: 'Chia sẻ lên Bản đồ', btnUploading: 'Đang tải lên...', uploadedTitle: 'Đã tải lên! 🎉', uploadedDesc: 'Những du khách khác hiện có thể tìm thấy thực đơn này trên bản đồ.', btnDone: 'Hoàn tất', errName: 'Vui lòng nhập tên nhà hàng', errAddress: 'Vui lòng nhập địa chỉ nhà hàng', errLocation: 'Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí.', succUpdate: 'Thực đơn đã được cập nhật trên bản đồ!', succShare: 'Thực đơn đã được chia sẻ lên bản đồ!', errUpload: 'Tải lên thất bại', errNetwork: 'Lỗi mạng'
  },
  'Deutsch': {
    title: 'Auf Karte teilen', subtitle: 'Helfen Sie anderen Reisenden, dieses Menü zu finden', restaurantName: 'RESTAURANTNAME *', restaurantPlaceholder: 'z. B. Ichiran Ramen Shibuya', address: 'ADRESSE *', addressPlaceholder: 'z. B. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'IHR NAME (OPTIONAL)', anonymous: 'Anonym', location: 'Ort', gpsDetected: 'GPS erkannt: ', willUseCurrent: 'Verwendet Ihren aktuellen Standort beim Hochladen', menuItems: 'Menüpunkte', dishes: 'Gerichte', btnShare: 'Auf Karte teilen', btnUploading: 'Wird hochgeladen...', uploadedTitle: 'Hochgeladen! 🎉', uploadedDesc: 'Andere Reisende können dieses Menü nun auf der Karte finden.', btnDone: 'Fertig', errName: 'Bitte geben Sie den Namen des Restaurants ein', errAddress: 'Bitte geben Sie die Adresse des Restaurants ein', errLocation: 'Standort konnte nicht ermittelt werden. Bitte erlauben Sie den Zugriff auf den Standort.', succUpdate: 'Menü auf der Karte aktualisiert!', succShare: 'Menü auf der Karte geteilt!', errUpload: 'Hochladen fehlgeschlagen', errNetwork: 'Netzwerkfehler'
  },
  'Русский': {
    title: 'Поделиться на карте', subtitle: 'Помогите другим путешественникам найти это меню', restaurantName: 'НАЗВАНИЕ РЕСТОРАНА *', restaurantPlaceholder: 'например, Ичиран Рамен Сибуя', address: 'АДРЕС *', addressPlaceholder: 'например, 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'ВАШЕ ИМЯ (НЕОБЯЗАТЕЛЬНО)', anonymous: 'Анонимно', location: 'Расположение', gpsDetected: 'GPS обнаружен: ', willUseCurrent: 'Будет использовано ваше текущее местоположение', menuItems: 'Пункты меню', dishes: 'блюд(а)', btnShare: 'Поделиться на карте', btnUploading: 'Загрузка...', uploadedTitle: 'Загружено! 🎉', uploadedDesc: 'Другие путешественники теперь могут найти это меню на карте.', btnDone: 'Готово', errName: 'Пожалуйста, введите название ресторана', errAddress: 'Пожалуйста, введите адрес', errLocation: 'Не удалось получить местоположение. Разрешите доступ к местоположению.', succUpdate: 'Меню на карте обновлено!', succShare: 'Меню успешно поделено на карте!', errUpload: 'Ошибка загрузки', errNetwork: 'Ошибка сети'
  },
  'Bahasa Indonesia': {
     title: 'Bagikan ke Peta', subtitle: 'Bantu wisatawan lain menemukan menu ini', restaurantName: 'NAMA RESTORAN *', restaurantPlaceholder: 'misal: Ichiran Ramen Shibuya', address: 'ALAMAT *', addressPlaceholder: 'misal: 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'NAMA ANDA (OPSIONAL)', anonymous: 'Anonim', location: 'Lokasi', gpsDetected: 'GPS terdeteksi: ', willUseCurrent: 'Akan menggunakan lokasi Anda saat ini', menuItems: 'Daftar Menu', dishes: 'hidangan', btnShare: 'Bagikan ke Peta', btnUploading: 'Mengunggah...', uploadedTitle: 'Berhasil diunggah! 🎉', uploadedDesc: 'Wisatawan lain sekarang dapat menemukan menu ini di peta.', btnDone: 'Selesai', errName: 'Silakan masukkan nama restoran', errAddress: 'Silakan masukkan alamat restoran', errLocation: 'Tidak bisa mendapatkan lokasi. Harap izinkan akses lokasi.', succUpdate: 'Menu diperbarui di peta!', succShare: 'Menu berhasil dibagikan ke peta!', errUpload: 'Gagal mengunggah', errNetwork: 'Kesalahan jaringan'
  },
  'Polski': {
    title: 'Udostępnij na Mapie', subtitle: 'Pomóż innym podróżnikom znaleźć to menu', restaurantName: 'NAZWA RESTAURACJI *', restaurantPlaceholder: 'np. Ichiran Ramen Shibuya', address: 'ADRES *', addressPlaceholder: 'np. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'TWÓJ NAZWA (OPCJONALNIE)', anonymous: 'Anonimowy', location: 'Lokalizacja', gpsDetected: 'Wykryto GPS: ', willUseCurrent: 'Użyje Twojej obecnej lokalizacji', menuItems: 'Pozycje w Menu', dishes: 'dań', btnShare: 'Udostępnij na Mapie', btnUploading: 'Przesyłanie...', uploadedTitle: 'Przesłano! 🎉', uploadedDesc: 'Inni podróżnicy mogą teraz znaleźć to menu na mapie.', btnDone: 'Gotowe', errName: 'Podaj nazwę restauracji', errAddress: 'Podaj adres restauracji', errLocation: 'Nie można uzyskać lokalizacji. Zezwól na dostęp.', succUpdate: 'Menu zaktualizowane na mapie!', succShare: 'Menu udostępnione na mapie!', errUpload: 'Przesyłanie nie powiodło się', errNetwork: 'Błąd sieci'
  },
  'Bahasa Melayu': {
    title: 'Kongsi di Peta', subtitle: 'Bantu pelancong lain mencari menu ini', restaurantName: 'NAMA RESTORAN *', restaurantPlaceholder: 'cth. Ichiran Ramen Shibuya', address: 'ALAMAT *', addressPlaceholder: 'cth. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'NAMA ANDA (PILIHAN)', anonymous: 'Tanpa nama', location: 'Lokasi', gpsDetected: 'GPS dikesan: ', willUseCurrent: 'Akan menggunakan lokasi semasa anda', menuItems: 'Item Menu', dishes: 'hidangan', btnShare: 'Kongsi di Peta', btnUploading: 'Sedang memuat naik...', uploadedTitle: 'Dimuat naik! 🎉', uploadedDesc: 'Kini, pelancong lain boleh mencari menu ini di peta.', btnDone: 'Selesai', errName: 'Sila masukkan nama restoran', errAddress: 'Sila masukkan alamat restoran', errLocation: 'Gagal mendapatkan lokasi. Sila izinkan akses.', succUpdate: 'Menu dikemas kini di peta!', succShare: 'Menu dikongsi di peta!', errUpload: 'Gagal memuat naik', errNetwork: 'Ralat Rangkaian'
  },
  'Italiano': {
    title: 'Condividi su Mappa', subtitle: 'Aiuta altri viaggiatori a trovare questo menu', restaurantName: 'NOME RISTORANTE *', restaurantPlaceholder: 'es. Ichiran Ramen Shibuya', address: 'INDIRIZZO *', addressPlaceholder: 'es. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'IL TUO NOME (OPZIONALE)', anonymous: 'Anonimo', location: 'Posizione', gpsDetected: 'GPS rilevato: ', willUseCurrent: 'Verrà usata la tua posizione attuale', menuItems: 'Voci del Menu', dishes: 'piatti', btnShare: 'Condividi su Mappa', btnUploading: 'Caricamento...', uploadedTitle: 'Caricato! 🎉', uploadedDesc: 'Ora altri viaggiatori possono trovare questo menu sulla mappa.', btnDone: 'Fatto', errName: 'Inserisci il nome del ristorante', errAddress: 'Inserisci l\'indirizzo', errLocation: 'Impossibile ottenere la posizione. Consenti l\'accesso.', succUpdate: 'Menu aggiornato sulla mappa!', succShare: 'Menu condiviso sulla mappa!', errUpload: 'Caricamento fallito', errNetwork: 'Errore di rete'
  },
  'Português': {
    title: 'Partilhar no Mapa', subtitle: 'Ajude outros viajantes a encontrar este menu', restaurantName: 'NOME DO RESTAURANTE *', restaurantPlaceholder: 'ex. Ichiran Ramen Shibuya', address: 'ENDEREÇO *', addressPlaceholder: 'ex. 1-22-7 Jinnan, Shibuya City, Tokyo', uploaderName: 'SEU NOME (OPCIONAL)', anonymous: 'Anônimo', location: 'Localização', gpsDetected: 'GPS detectado: ', willUseCurrent: 'Usará sua localização atual', menuItems: 'Itens do Menu', dishes: 'pratos', btnShare: 'Partilhar no Mapa', btnUploading: 'A carregar...', uploadedTitle: 'Carregado! 🎉', uploadedDesc: 'Outros viajantes podem agora encontrar este menu no mapa.', btnDone: 'Feito', errName: 'Por favor introduza o nome do restaurante', errAddress: 'Por favor introduza o endereço', errLocation: 'Não foi possível obter a localização. Permita o acesso.', succUpdate: 'Menu atualizado no mapa!', succShare: 'Menu partilhado no mapa!', errUpload: 'Falha no carregamento', errNetwork: 'Erro de rede'
  }
};

interface ShareToMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuData: MenuData;
  targetLanguage: string;
  thumbnailBase64?: string;
  scanLocation?: { lat: number; lng: number };
}

export const ShareToMapModal: React.FC<ShareToMapModalProps> = ({
  isOpen, onClose, menuData, targetLanguage, thumbnailBase64, scanLocation
}) => {
  const [restaurantName, setRestaurantName] = useState(menuData.restaurantName || '');
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [uploaderName, setUploaderName] = useState('');

    // Debounced Address Search
    useEffect(() => {
        if (!address.trim() || address.length < 2) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (selectedLocation) return; // Prevent searching if they just selected from dropdown

        // Try to parse direct coordinates (e.g. "33.5855, 130.3927" or from Google Maps)
        const coordMatch = address.trim().match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            setAddressSuggestions([{ 
                display_name: `📍 座標定位: ${lat}, ${lng} (您可以直接點擊使用此座標)`, 
                lat: lat, 
                lon: lng 
            }]);
            setShowSuggestions(true);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearchingAddress(true);
            try {
                const res = await fetch(`/api/places?action=autocomplete&q=${encodeURIComponent(address)}`);
                const data = await res.json();
                if (data.predictions) {
                    const formatted = data.predictions.map((p: any) => ({
                        display_name: p.description,
                        place_id: p.place_id
                    }));
                    setAddressSuggestions(formatted);
                } else {
                    setAddressSuggestions([]);
                }
                setShowSuggestions(true);
            } catch (err) {
                console.error(err);
            }
            setIsSearchingAddress(false);
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [address, selectedLocation]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const langKey = targetLanguage || 'English';
  const t = TRANSLATIONS[langKey] || TRANSLATIONS['English'];

  const handleUpload = async () => {
    if (!restaurantName.trim()) {
      toast.error(t.errName);
      return;
    }
    if (!address.trim()) {
      toast.error(t.errAddress);
      return;
    }

    setIsUploading(true);
    let lat = selectedLocation?.lat || 0;
    let lng = selectedLocation?.lng || 0;

    // Use Address Geocoding if not selected from suggestion
    if (!lat || !lng) {
      // Check if address is directly a coordinate
      const coordMatch = address.trim().match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
      if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
      } else {
          try {
            const geoRes = await fetch(`/api/places?action=findPlace&q=${encodeURIComponent(address.trim())}`);
            const geoData = await geoRes.json();
            if (geoData.candidates && geoData.candidates.length > 0) {
              lat = parseFloat(geoData.candidates[0].geometry.location.lat);
              lng = parseFloat(geoData.candidates[0].geometry.location.lng);
            } else {
              toast.error('無法精準定位此地址。請嘗試從下拉選單選擇，或直接輸入「緯度, 經度」。');
              setIsUploading(false);
              return;
            }
          } catch (err) {
            console.error(err);
            toast.error('地址解析網路錯誤，請稍後再試。');
            setIsUploading(false);
            return;
          }
      }
    }

    try {
      const res = await fetch('/api/menu-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: restaurantName.trim(),
          restaurantCategory: menuData.restaurantCategory || '餐廳',
          address: address.trim(),
          lat,
          lng,
          menuData: {
            items: menuData.items,
            restaurantName: restaurantName.trim(),
            detectedLanguage: menuData.detectedLanguage,
          },
          thumbnail: thumbnailBase64 || null,
          targetLanguage,
          originalCurrency: menuData.originalCurrency,
          targetCurrency: menuData.targetCurrency,
          exchangeRate: menuData.exchangeRate,
          detectedLanguage: menuData.detectedLanguage,
          uploaderName: uploaderName.trim() || t.anonymous,
          userId: localStorage.getItem('smp_user_email') || null,
          itemCount: menuData.items.length,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        toast.success(data.action === 'updated' ? t.succUpdate : t.succShare);
      } else {
        toast.error(data.error || t.errUpload);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.errNetwork);
    }
    setIsUploading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/40">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black">{t.title}</h3>
                <p className="text-xs opacity-80">{t.subtitle}</p>
              </div>
            </div>
          </div>

          {isSuccess ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-black text-gray-800 mb-2">{t.uploadedTitle}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {t.uploadedDesc}
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
              >
                {t.btnDone}
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Restaurant Name */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.restaurantName}</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder={t.restaurantPlaceholder}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Address */}
              <div className="relative z-40">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.address}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setSelectedLocation(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                       if (addressSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                       setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder={t.addressPlaceholder}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-10"
                  />
                  {isSearchingAddress && (
                    <Loader2 size={16} className="animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                <AnimatePresence>
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto z-50 origin-top"
                    >
                      {addressSuggestions.map((sug, i) => (
                        <div 
                          key={i}
                          className="px-3 py-2.5 text-[12px] md:text-sm text-gray-700 hover:bg-emerald-50 cursor-pointer"
                          onClick={async () => {
                                                                        setAddress(sug.display_name);
                                                                        setShowSuggestions(false);
                                                                        if (sug.place_id) {
                                                                            try {
                                                                                const res = await fetch(`/api/places?action=details&place_id=${sug.place_id}`);
                                                                                const data = await res.json();
                                                                                if (data.result?.geometry?.location) {
                                                                                    setSelectedLocation({ lat: data.result.geometry.location.lat, lng: data.result.geometry.location.lng });
                                                                                }
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                            }
                                                                        } else if (sug.lat !== undefined && sug.lon !== undefined) {
                                                                            setSelectedLocation({ lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) });
                                                                        }
                                                                    }}
                        >
                           <MapPin size={14} className="inline-block mr-1 text-emerald-500 shrink-0 align-text-bottom" />
                           <span className="align-middle">{sug.display_name}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-bold">
                  <MapPin size={12} /> 系統將根據地址，自動將菜單釘定在這張地圖位置上。
                </p>
              </div>

              {/* Uploader Name */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.uploaderName}</label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder={t.anonymous}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Menu Preview */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">{t.menuItems}</span>
                  <span className="text-xs font-black text-emerald-600">{menuData.items.length} {t.dishes}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {menuData.originalCurrency} → {menuData.targetCurrency} • {menuData.detectedLanguage}
                </p>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold
                  hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isUploading ? (
                  <><Loader2 size={18} className="animate-spin" /> {t.btnUploading}</>
                ) : (
                  <><Upload size={18} /> {t.btnShare}</>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
