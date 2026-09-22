import React,{ useEffect,useRef,useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Bell, Camera, ChevronDown, Crown, FileText, HelpCircle, History, Home, Image as ImageIcon, ImagePlus, LogOut, MapPin, Menu, MessageCircle, Moon, Plus, Settings, Sprout, Star, Sun, UserRound, Users, X } from 'lucide-react';
import { TargetLanguage } from '../types';
import { MENU_UPLOAD_BATCH_SIZE,MENU_UPLOAD_MAX_PHOTOS } from '../constants';
import { UI_LANGUAGE_OPTIONS,getImageTranslationUIText,getTranslatedLanguageName,getUIText } from '../i18n';
import { getHomeCopy } from './homeCopy';
interface WelcomeScreenProps {
  onLanguageChange: (lang: TargetLanguage) => void;
  selectedLanguage: TargetLanguage;
  onImagesSelected: (files: File[]) => void;
  onImageCompareSelected: (files: File[]) => void;
  onOpenQuickCamera: () => void;
  onViewHistory: () => void;
  onOpenSettings: () => void;
  isVerified: boolean;
  isLoggedIn?: boolean;
  onUpgradeClick: () => void;
  uiLanguage: TargetLanguage;
  onUILanguageChange: (lang: TargetLanguage) => void;
  onLogout: () => void;


  onOpenPhrases: () => void;
  onOpenOnboarding: () => void;
  remainingUses: number;
  dailyLimit: number;
  monthlyRemaining: number;
  isPro: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenMap?: () => void;
  onNotificationClick: () => void;
  paidUserCount?: number|null;
}
export interface AppBottomNavProps {
  activeTab: 'home'|'records'|'favorites';
  uiLanguage: TargetLanguage;
  onHome: () => void;
  onRecords: () => void;
  onFavorites: () => void;
  onMy: () => void;
}
export const AppBottomNav: React.FC<AppBottomNavProps>=({ activeTab,uiLanguage,onHome,onRecords,onFavorites,onMy }) => {
  const copy=getHomeCopy(uiLanguage);
  const items=[{ id: 'home' as const,label: copy.home,icon: Home,onClick: onHome },{ id: 'records' as const,label: copy.records,icon: FileText,onClick: onRecords },{ id: 'favorites' as const,label: copy.favorites,icon: Star,onClick: onFavorites },{ id: 'my' as const,label: copy.my,icon: UserRound,onClick: onMy }];
  return <nav className="absolute inset-x-0 bottom-0 z-40 border-t px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2" style={{ background: 'color-mix(in srgb, var(--header-bg) 92%, transparent)',borderColor: 'var(--glass-border)',backdropFilter: 'blur(18px)' }}><div className="mx-auto grid max-w-xl grid-cols-4">{items.map(({ id,label,icon: Icon,onClick }) => { const active=activeTab===id; return <button key={id} type="button" onClick={onClick} className="relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition active:scale-95" style={{ color: active? 'var(--accent-green)':'var(--text-tertiary)' }}><Icon size={22} strokeWidth={active? 2.7:2} fill={active&&id==='home'? 'currentColor':'none'} /><span className="max-w-[82px] truncate">{label}</span>{active&&<span className="absolute bottom-0 h-1 w-1 rounded-full" style={{ background: 'var(--accent-green)' }} />}</button>; })}</div></nav>;
};
export const WelcomeScreen: React.FC<WelcomeScreenProps>=({ onLanguageChange,onImagesSelected,onImageCompareSelected,onOpenQuickCamera,onViewHistory,onOpenSettings,isVerified,isLoggedIn=false,onUpgradeClick,uiLanguage,onUILanguageChange,onLogout,onOpenPhrases,onOpenOnboarding,remainingUses,dailyLimit,monthlyRemaining,isPro,isDarkMode,onToggleTheme,onOpenMap,onNotificationClick,paidUserCount=null }) => {
  const fileInputRef=useRef<HTMLInputElement>(null);
  const cameraInputRef=useRef<HTMLInputElement>(null);
  const compareInputRef=useRef<HTMLInputElement>(null);
  const [selectionMode,setSelectionMode]=useState<'menu'|'compare'>('menu');
  const [showLanguagePicker,setShowLanguagePicker]=useState(false);
  const [showDrawer,setShowDrawer]=useState(false);
  const [showMenuSourcePicker,setShowMenuSourcePicker]=useState(false);
  const [showPreview,setShowPreview]=useState(false);
  const [showUsage,setShowUsage]=useState(false);
  const [selectedFiles,setSelectedFiles]=useState<File[]>([]);
  const [previewUrls,setPreviewUrls]=useState<string[]>([]);
  const t=getUIText(uiLanguage);
  const imageTranslationUi=getImageTranslationUIText(uiLanguage);
  const copy=getHomeCopy(uiLanguage);
  const currentLanguage=UI_LANGUAGE_OPTIONS.find(option => option.value===uiLanguage);
  const maxSelectablePhotos=selectionMode==='compare'? MENU_UPLOAD_BATCH_SIZE:MENU_UPLOAD_MAX_PHOTOS;
  const isTraditionalChinese=uiLanguage===TargetLanguage.ChineseTW||uiLanguage===TargetLanguage.ChineseHK;
  const menuSourceLabel=copy.menuSource || (isTraditionalChinese? (uiLanguage===TargetLanguage.ChineseHK? '拍攝／上載餐牌':'拍攝／上傳菜單'):uiLanguage===TargetLanguage.English? 'Take / Upload Menu':uiLanguage===TargetLanguage.Japanese? 'メニューを撮影／アップロード':uiLanguage===TargetLanguage.Korean? '메뉴 촬영／업로드':'Take / Upload Menu');
  const quickLabel=isTraditionalChinese? '—拍即翻':imageTranslationUi.title;
  const phrasesLabel=isTraditionalChinese? '常用語':(t.phrasesBtn||'Useful phrases');
  useEffect(() => {
    try {
      (screen.orientation as any)?.lock?.('portrait').catch(() => undefined);
    }
    catch { /* Orientation lock unavailable. */ }
  },[]);
  useEffect(() => { const urls=selectedFiles.map(file => URL.createObjectURL(file)); setPreviewUrls(urls); return () => urls.forEach(URL.revokeObjectURL); },[selectedFiles]);
  const openMenuCamera=() => { setSelectionMode('menu'); setShowMenuSourcePicker(false); requestAnimationFrame(() => cameraInputRef.current?.click()); };
  const openMenuGallery=() => { setSelectionMode('menu'); setShowMenuSourcePicker(false); setShowPreview(true); };
  const handleFileChange=(event: React.ChangeEvent<HTMLInputElement>) => {
    if(!event.target.files?.length)
      return; setSelectedFiles(previous => [...previous,...Array.from(event.target.files!)].slice(0,maxSelectablePhotos)); setShowPreview(true); event.target.value='';
  };
  const removeFile=(index: number) => setSelectedFiles(previous => {
    const next=previous.filter((_,fileIndex) => fileIndex!==index); if(!next.length)
      setShowPreview(false); return next;
  });
  const startScanning=() => {
    if(!selectedFiles.length)
      return; if(selectionMode==='compare')
      onImageCompareSelected(selectedFiles);
    else
      onImagesSelected(selectedFiles); setShowPreview(false); setSelectedFiles([]);
  };
  const chooseLanguage=(language: TargetLanguage) => { onUILanguageChange(language); onLanguageChange(language); setShowLanguagePicker(false); };
  const closeDrawerThen=(action: () => void) => { setShowDrawer(false); action(); };
  const paidCountLabel=typeof paidUserCount==='number'? paidUserCount.toLocaleString():'—';
  return <div className="relative flex h-full flex-col overflow-hidden" style={{ background: 'var(--bg-primary)',color: 'var(--text-primary)' }}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 bottom-10 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: isDarkMode ? '#35463a' : '#dfe6d9' }} />
      <svg className="absolute -left-7 bottom-20 h-44 w-36 opacity-[0.16]" viewBox="0 0 144 176" fill="none">
        <path d="M22 170C56 135 54 96 93 55M51 128C30 125 19 112 12 91C34 91 51 101 58 118M67 92C60 70 66 51 82 34C94 56 91 75 77 93M91 58C94 37 108 23 131 17C130 39 117 55 97 63" stroke="#788a72" strokeWidth="5" strokeLinecap="round" />
        <path d="M12 91C31 91 48 101 58 118C37 121 20 111 12 91ZM82 34C94 56 91 75 77 93C64 72 67 51 82 34ZM131 17C130 39 117 55 97 63C99 41 111 25 131 17Z" fill="#788a72" />
      </svg>
      <svg className="absolute -right-8 top-[34%] h-36 w-28 rotate-12 opacity-[0.12]" viewBox="0 0 112 144" fill="none">
        <path d="M9 137C38 107 48 76 91 12M38 100C22 99 11 87 6 70C24 70 39 78 44 93M58 67C54 49 60 34 74 21C83 39 80 54 68 68M81 33C84 19 94 9 109 4" stroke="#788a72" strokeWidth="4" strokeLinecap="round" />
        <path d="M6 70C24 70 39 78 44 93C27 95 13 86 6 70ZM74 21C83 39 80 54 68 68C57 51 60 35 74 21Z" fill="#788a72" />
      </svg>
    </div>
    <header className="z-20 flex shrink-0 items-center gap-3 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
      <button type="button" aria-label={copy.menu} onClick={() => setShowDrawer(true)} className="flex h-11 w-11 items-center justify-center rounded-full shadow-sm" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
        <Menu size={23} />
      </button>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <button type="button" onClick={() => setShowLanguagePicker(value => !value)} className="flex h-11 min-w-[118px] items-center justify-center gap-3 rounded-full px-5 font-semibold shadow-sm" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <span className="text-2xl leading-none">{currentLanguage?.flag || '🌐'}</span>
            <ChevronDown size={17} />
          </button>
          {showLanguagePicker && <>
            <button type="button" aria-label="Close language picker" className="fixed inset-0 z-30 cursor-default" onClick={() => setShowLanguagePicker(false)} />
            <div className="absolute right-0 top-full z-40 mt-2 max-h-[55vh] w-64 overflow-y-auto rounded-2xl py-2 shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
              {UI_LANGUAGE_OPTIONS.map(option => <button type="button" key={option.value} onClick={() => chooseLanguage(option.value)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium" style={{ background: option.value === uiLanguage ? 'var(--brand-bg)' : 'transparent', color: option.value === uiLanguage ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                <span className="text-lg">{option.flag}</span><span>{getTranslatedLanguageName(option.value, uiLanguage)}</span>
              </button>)}
            </div>
          </>}
        </div>
        <button type="button" aria-label={copy.notificationsComingSoon} onClick={onNotificationClick} className="relative flex h-11 w-11 items-center justify-center rounded-full shadow-sm" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
          <Bell size={22} />
        </button>
      </div>
    </header>
    <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-none px-9 pb-28 pt-1">
      <div className="mx-auto w-full max-w-md">
        <section className="relative mx-auto flex h-[clamp(238px,25vh,290px)] w-full items-start justify-center" aria-label="Sausage dog welcome">
          <img src="/homepage-dog-cutout.png" alt="Sausage Dog" className="h-[clamp(225px,24vh,280px)] w-auto max-w-[82%] object-contain drop-shadow-sm" />
        </section>
        <div className="flex justify-center">
          <button type="button" onClick={() => isVerified ? setShowUsage(true) : onUpgradeClick()} className="inline-flex min-h-11 items-center gap-3 rounded-full px-7 py-2.5 text-base font-extrabold shadow-sm" style={{ background: isVerified ? (isDarkMode ? '#29382e' : '#e5eadf') : 'var(--brand-bg)', color: isVerified ? (isDarkMode ? '#b5c7ae' : '#71856f') : 'var(--brand-primary)', border: `1px solid ${isVerified ? (isDarkMode ? '#465746' : '#d8e0d2') : 'var(--glass-border)'}` }}>
            <Crown size={23} fill={isVerified ? 'currentColor' : 'none'} />{isVerified ? 'PRO' : copy.upgrade}
          </button>
        </div>
        <section className="mt-4 space-y-3.5">
          <motion.button type="button" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} onClick={onOpenQuickCamera} className="relative flex h-[130px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[30px] text-white shadow-md transition active:scale-[.985]" style={{ background: isDarkMode ? '#566b59' : '#82947d' }}>
            <svg aria-hidden="true" className="absolute -bottom-3 left-2 h-28 w-24 opacity-25" viewBox="0 0 96 112" fill="none"><path d="M9 106C29 80 30 54 64 17M31 72C18 71 10 62 6 49C21 49 32 55 37 66M48 49C44 36 49 25 59 16C66 30 64 41 55 50M65 27C70 17 78 11 91 8" stroke="white" strokeWidth="4" strokeLinecap="round"/><path d="M6 49C21 49 32 55 37 66C23 68 12 61 6 49ZM59 16C66 30 64 41 55 50C46 37 49 25 59 16Z" fill="white"/></svg>
            <Camera size={38} strokeWidth={2.4} />
            <span className="text-[22px] font-extrabold">{quickLabel}</span>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-4xl font-light">›</span>
          </motion.button>
          <div className="grid grid-cols-2 gap-3.5">
            <button type="button" onClick={() => setShowMenuSourcePicker(true)} className="flex min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-[28px] px-3 py-4 text-center font-extrabold transition active:scale-[.985]" style={{ background: isDarkMode ? '#302a25' : '#faf0e6', border: `1px solid ${isDarkMode ? '#493d34' : '#efe1d3'}`, color: isDarkMode ? '#d6b89f' : '#85684f' }}>
              <ImageIcon size={34} strokeWidth={2.2} /><span className="text-[15px] leading-snug">{menuSourceLabel}</span><span className="text-xl leading-none">›</span>
            </button>
            <button type="button" onClick={onOpenPhrases} className="flex min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-[28px] px-3 py-4 text-center font-extrabold transition active:scale-[.985]" style={{ background: isDarkMode ? '#292e2a' : '#fffdf9', border: `1px solid ${isDarkMode ? '#3c453e' : '#f0eee8'}`, color: isDarkMode ? '#b5c7ae' : '#748879' }}>
              <MessageCircle size={34} strokeWidth={2.2} /><span className="text-[15px] leading-snug">{phrasesLabel}</span><span className="text-xl leading-none">›</span>
            </button>
          </div>
          <div className="flex min-h-[70px] items-center gap-3.5 rounded-[26px] px-5 py-3 shadow-sm" style={{ background: isDarkMode ? '#272c28' : 'rgba(255,255,255,.62)', border: `1px solid ${isDarkMode ? '#384039' : '#f0eee8'}` }}>
            <Sprout size={32} style={{ color: isDarkMode ? '#aab99f' : '#7d907a' }} />
            <span className="flex-1 text-[14px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{copy.totalPaidUsers}</span>
            <strong className="text-2xl font-bold" style={{ color: isDarkMode ? '#aab99f' : '#7d907a' }}>{paidCountLabel}</strong>
          </div>
        </section>
      </div>
    </main>
    {showDrawer&&<div className="absolute inset-0 z-50" style={{ background: 'rgba(0,0,0,.5)',backdropFilter: 'blur(6px)' }} onClick={() => setShowDrawer(false)}><aside className="h-full w-[82%] max-w-sm p-5 shadow-2xl" onClick={event => event.stopPropagation()} style={{ background: 'var(--bg-card)',borderRight: '1px solid var(--glass-border)' }}><div className="mb-8 flex items-center justify-between"><strong className="text-lg">{copy.menu}</strong><button type="button" onClick={() => setShowDrawer(false)} className="rounded-full p-2" style={{ background: 'var(--glass-bg)' }}><X size={20} /></button></div><div className="space-y-2"><DrawerItem icon={Settings} label={copy.settings} onClick={() => closeDrawerThen(onOpenSettings)} /><DrawerItem icon={HelpCircle} label={copy.help} onClick={() => closeDrawerThen(onOpenOnboarding)} />{onOpenMap&&<DrawerItem icon={MapPin} label={copy.map} onClick={() => closeDrawerThen(onOpenMap)} />}<DrawerItem icon={History} label={copy.records} onClick={() => closeDrawerThen(onViewHistory)} /><DrawerItem icon={isDarkMode? Sun:Moon} label={copy.theme} onClick={() => { onToggleTheme(); setShowDrawer(false); }} />{isLoggedIn&&<DrawerItem icon={LogOut} label={copy.logout} danger onClick={() => {
      if(window.confirm(`${copy.logout}?`))
        closeDrawerThen(onLogout);
    }} />}</div></aside></div>}
    {showMenuSourcePicker&&<div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 p-5 backdrop-blur" onClick={event => event.currentTarget===event.target&&setShowMenuSourcePicker(false)}><div className="w-full max-w-sm rounded-3xl p-5" style={{ background: 'var(--bg-card)',border: '1px solid var(--glass-border)' }}><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">{menuSourceLabel}</h2><button type="button" onClick={() => setShowMenuSourcePicker(false)}><X /></button></div><div className="grid grid-cols-2 gap-3"><button type="button" onClick={openMenuCamera} className="flex flex-col items-center gap-2 rounded-2xl py-6 font-bold text-white" style={{ background: 'var(--brand-gradient)' }}><Camera size={27} />{t.takePhoto}</button><button type="button" onClick={openMenuGallery} className="flex flex-col items-center gap-2 rounded-2xl py-6 font-bold" style={{ background: 'var(--glass-bg)',border: '1px solid var(--glass-border)' }}><ImagePlus size={27} />{t.uploadGallery}</button></div></div></div>}
    {showPreview&&<div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 p-5 backdrop-blur"><div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl p-5" style={{ background: 'var(--bg-card)',border: '1px solid var(--glass-border)' }}><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{selectionMode==='compare'? imageTranslationUi.title:t.selectedMenus}</h2><button type="button" onClick={() => { setShowPreview(false); setSelectedFiles([]); }}><X /></button></div><div className="grid grid-cols-2 gap-3">{Array.from({ length: Math.max(2,Math.min(maxSelectablePhotos,selectedFiles.length+1)) },(_,index) => <div key={index} className="relative aspect-[3/4] overflow-hidden rounded-2xl" style={{ background: 'var(--glass-bg)',border: '1px dashed var(--glass-border)' }}>{previewUrls[index]? <><img src={previewUrls[index]} alt={`Selected menu ${index+1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removeFile(index)} className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white"><X size={15} /></button></>:<button type="button" disabled={selectedFiles.length>=maxSelectablePhotos} onClick={() => (selectionMode==='compare'? compareInputRef:fileInputRef).current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 disabled:opacity-40"><Plus /><span className="text-xs">{t.addPhoto}</span></button>}</div>)}</div><p className="my-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedFiles.length} / {maxSelectablePhotos}</p>{selectionMode==='menu'&&selectedFiles.length>MENU_UPLOAD_BATCH_SIZE&&<p className="mb-3 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>{isTraditionalChinese? `超過 ${MENU_UPLOAD_BATCH_SIZE} 張會分批處理並自動合併。`:`More than ${MENU_UPLOAD_BATCH_SIZE} pages are processed in batches and merged automatically.`}</p>}<button type="button" onClick={startScanning} disabled={!selectedFiles.length} className="w-full rounded-2xl py-4 font-bold text-white disabled:opacity-40" style={{ background: 'var(--brand-gradient)' }}>{t.startScanning}</button></div></div>}
    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} /><input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} /><input type="file" accept="image/*" multiple ref={compareInputRef} className="hidden" onChange={handleFileChange} />
    {showUsage&&typeof document!=='undefined'&&ReactDOM.createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5" onClick={() => setShowUsage(false)}><div className="w-full max-w-sm rounded-3xl p-6" onClick={event => event.stopPropagation()} style={{ background: 'var(--bg-card)',border: '1px solid var(--glass-border)' }}><div className="mb-4 flex items-center justify-between"><strong>{isTraditionalChinese? '翻譯使用次數':'Translation usage'}</strong><button type="button" onClick={() => setShowUsage(false)}><X /></button></div><div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}><p className="flex justify-between"><span>{isTraditionalChinese? '本月剩餘翻譯次數':'Remaining this month'}</span><strong style={{ color: 'var(--accent-green)' }}>{monthlyRemaining}</strong></p><p className="flex justify-between"><span>{isTraditionalChinese? '今日剩餘翻譯次數':'Remaining today'}</span><strong style={{ color: 'var(--accent-green)' }}>{remainingUses}</strong></p></div></div></div>,document.body)}
  </div>;
};
const DrawerItem: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}>=({ icon: Icon,label,onClick,danger=false }) => <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold" style={{ background: danger? 'var(--danger-bg)':'var(--glass-bg)',color: danger? 'var(--danger-color)':'var(--text-secondary)',border: '1px solid var(--glass-border)' }}><Icon size={20} />{label}</button>;
