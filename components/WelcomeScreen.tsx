import React,{ useEffect,useRef,useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Bell,Camera,ChevronDown,Globe,HelpCircle,History,Home,ImagePlus,LogOut,MapPin,Menu,MessageCircle,Moon,Plus,Settings,Star,Sun,UserRound,Users,X } from 'lucide-react';
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
  const items=[{ id: 'home' as const,label: copy.home,icon: Home,onClick: onHome },{ id: 'records' as const,label: copy.records,icon: History,onClick: onRecords },{ id: 'favorites' as const,label: copy.favorites,icon: Star,onClick: onFavorites },{ id: 'my' as const,label: copy.my,icon: UserRound,onClick: onMy }];
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
  const quickLabel=isTraditionalChinese? '一拍即翻':imageTranslationUi.title;
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-32 top-48 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: 'var(--brand-glow)' }} /><div className="absolute -right-28 top-20 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--accent-green)' }} /></div>
    <header className="z-20 flex items-center justify-between border-b px-4 py-3" style={{ background: 'var(--header-bg)',borderColor: 'var(--glass-border)',backdropFilter: 'blur(18px)' }}><button type="button" aria-label={copy.menu} onClick={() => setShowDrawer(true)} className="rounded-2xl p-3" style={{ background: 'var(--glass-bg)',border: '1px solid var(--glass-border)',color: 'var(--text-secondary)' }}><Menu size={21} /></button><div className="relative"><button type="button" onClick={() => setShowLanguagePicker(value => !value)} className="flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold" style={{ background: 'var(--glass-bg)',border: '1px solid var(--glass-border)' }}><span className="text-xl">{currentLanguage?.flag||'🌐'}</span><ChevronDown size={17} /></button>{showLanguagePicker&&<><button type="button" aria-label="Close language picker" className="fixed inset-0 z-30 cursor-default" onClick={() => setShowLanguagePicker(false)} /><div className="absolute right-0 top-full z-40 mt-2 max-h-[55vh] w-64 overflow-y-auto rounded-2xl py-2 shadow-2xl" style={{ background: 'var(--bg-card)',border: '1px solid var(--glass-border)' }}>{UI_LANGUAGE_OPTIONS.map(option => <button type="button" key={option.value} onClick={() => chooseLanguage(option.value)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium" style={{ background: option.value===uiLanguage? 'var(--brand-bg)':'transparent',color: option.value===uiLanguage? 'var(--brand-primary)':'var(--text-secondary)' }}><span className="text-lg">{option.flag}</span><span>{getTranslatedLanguageName(option.value,uiLanguage)}</span></button>)}</div></>}</div><button type="button" aria-label={copy.notificationsComingSoon} onClick={onNotificationClick} className="rounded-2xl p-3" style={{ background: 'var(--glass-bg)',border: '1px solid var(--glass-border)',color: 'var(--text-secondary)' }}><Bell size={21} /></button></header>
    <main className="relative z-10 flex-1 overflow-y-auto px-5 pb-28 pt-5"><motion.section initial={{ opacity: 0,y: 14 }} animate={{ opacity: 1,y: 0 }} className="mx-auto max-w-md text-center"><img src="/homepage-dog-cutout.png" alt="Sausage Dog" className="mx-auto h-48 w-52 object-contain drop-shadow-2xl" /><button type="button" onClick={() => !isVerified&&onUpgradeClick()} className="mt-1 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold" style={{ background: isVerified? 'color-mix(in srgb, var(--accent-green) 13%, transparent)':'var(--brand-bg)',color: isVerified? 'var(--accent-green)':'var(--brand-primary)',border: `1px solid ${isVerified? 'color-mix(in srgb, var(--accent-green) 25%, transparent)':'var(--glass-border)'}` }}><Star size={16} fill={isVerified? 'currentColor':'none'} /> {isVerified? 'PRO':copy.upgrade}</button><button type="button" onClick={() => setShowUsage(true)} className="mt-2 block w-full text-center text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{isPro? (isTraditionalChinese? `今日剩餘翻譯次數：${remainingUses} 次`:`Translations remaining today: ${remainingUses}`):`${t.remainingUses} ${remainingUses}/${dailyLimit}`}</button></motion.section><section className="mx-auto mt-5 max-w-md space-y-3"><motion.button type="button" initial={{ opacity: 0,y: 12 }} animate={{ opacity: 1,y: 0 }} transition={{ delay: .08 }} onClick={onOpenQuickCamera} className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-[30px] text-white shadow-xl transition active:scale-[.985]" style={{ background: 'linear-gradient(135deg, var(--accent-green), color-mix(in srgb, var(--accent-green) 62%, #19281e))' }}><span className="absolute -bottom-8 -left-5 opacity-20"><Globe size={132} /></span><Camera size={38} /><span className="ml-3 text-2xl font-black">{quickLabel}</span><span className="absolute right-6 text-4xl font-light">›</span></motion.button><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setShowMenuSourcePicker(true)} className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-[26px] p-4 text-center font-extrabold transition active:scale-[.985]" style={{ background: 'var(--glass-bg)',border: '1px solid var(--glass-border)',color: 'var(--brand-primary)' }}><ImagePlus size={31} /><span>{menuSourceLabel}</span><span className="text-xl">›</span></button><button type="button" onClick={onOpenPhrases} className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-[26px] p-4 font-extrabold transition active:scale-[.985]" style={{ background: 'var(--glass-bg)',border: '1px solid var(--glass-border)',color: 'var(--accent-green)' }}><MessageCircle size={31} /><span>{phrasesLabel}</span><span className="text-xl">›</span></button></div><div className="flex items-center gap-3 rounded-3xl px-5 py-4" style={{ background: 'var(--glass-bg)',border: '1px solid var(--glass-border)' }}><Users size={25} style={{ color: 'var(--accent-green)' }} /><span className="flex-1 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{copy.totalPaidUsers}</span><strong className="text-2xl" style={{ color: 'var(--accent-green)' }}>{paidCountLabel}</strong></div></section></main>
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
