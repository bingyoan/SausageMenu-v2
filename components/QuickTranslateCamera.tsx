import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, History, ImagePlus, Loader2, Settings, Upload, X } from 'lucide-react';
import { TargetLanguage } from '../types';
import { LANGUAGE_OPTIONS } from '../constants';
import { getTranslatedLanguageName } from '../i18n';

interface QuickTranslateCameraProps {
  targetLanguage: TargetLanguage;
  onLanguageChange: (language: TargetLanguage) => void;
  onBack: () => void;
  onOpenHistory: () => void;
  onStartTranslation: (files: File[]) => void;
}

type CameraState = 'requesting' | 'ready' | 'denied' | 'unsupported';

/** Full-screen, camera-first entry point for the one-tap translation flow. */
export const QuickTranslateCamera: React.FC<QuickTranslateCameraProps> = ({
  targetLanguage,
  onLanguageChange,
  onBack,
  onOpenHistory,
  onStartTranslation,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const requestCamera = useCallback(async () => {
    stopCamera();
    setCameraState('requesting');

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraState('ready');
    } catch (error) {
      console.warn('[QuickTranslateCamera] Camera permission unavailable', error);
      setCameraState('denied');
    }
  }, [stopCamera]);

  useEffect(() => {
    void requestCamera();
    return stopCamera;
  }, [requestCamera, stopCamera]);

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = useCallback((incoming: File[]) => {
    const imageFiles = incoming.filter(file => file.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setFiles(current => [...current, ...imageFiles].slice(0, 4));
  }, []);

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || cameraState !== 'ready' || isCapturing) return;
    if (files.length >= 4) return;

    setIsCapturing(true);
    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to capture camera frame');
      context.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Unable to encode camera frame');
      addFiles([new File([blob], `quick-translate-${Date.now()}.jpg`, { type: 'image/jpeg' })]);
    } catch (error) {
      console.error('[QuickTranslateCamera] Capture failed', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(Array.from(event.target.files));
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(current => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const startTranslation = () => {
    if (!files.length) return;
    stopCamera();
    onStartTranslation(files);
  };

  const isCameraUnavailable = cameraState === 'denied' || cameraState === 'unsupported';

  return (
    <div className="h-full min-h-screen flex flex-col overflow-hidden" style={{ background: '#241708', color: '#fff' }}>
      <header className="flex items-center justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3">
        <button onClick={() => { stopCamera(); onBack(); }} className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 active:scale-95" aria-label="返回">
          <ArrowLeft size={23} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black tracking-wide">一拍即翻</p>
          <p className="text-xs text-white/60 truncate">拍下菜單，立即翻譯</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowLanguagePicker(open => !open)} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-[#6d3219] max-w-[150px] truncate">
            {getTranslatedLanguageName(targetLanguage, targetLanguage)}
          </button>
          {showLanguagePicker && (
            <>
              <button className="fixed inset-0 z-20 cursor-default" onClick={() => setShowLanguagePicker(false)} aria-label="關閉語言選單" />
              <div className="absolute right-0 top-full z-30 mt-2 max-h-[50vh] w-56 overflow-y-auto rounded-2xl border border-white/15 bg-[#2d1b0c] p-2 shadow-2xl">
                {LANGUAGE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { onLanguageChange(option.value); setShowLanguagePicker(false); }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-white/90 hover:bg-white/10"
                  >
                    <span>{getTranslatedLanguageName(option.value, targetLanguage)}</span>
                    {targetLanguage === option.value && <Check size={16} className="text-orange-300" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 active:scale-95" aria-label="相機設定">
          <Settings size={20} />
        </button>
      </header>

      <main className="relative mx-4 flex-1 min-h-0 overflow-hidden rounded-[34px] border border-white/10 bg-black shadow-2xl">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${cameraState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          aria-label="相機預覽"
        />
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/75">
            <Loader2 size={38} className="animate-spin text-orange-300" />
            <p>正在請求相機權限…</p>
          </div>
        )}
        {isCameraUnavailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Camera size={54} className="text-white/35" />
            <div>
              <p className="text-lg font-bold">無法開啟相機</p>
              <p className="mt-1 text-sm leading-6 text-white/60">請在系統設定允許相機權限，或改用相簿上傳圖片。</p>
            </div>
            {cameraState === 'denied' && (
              <button onClick={() => void requestCamera()} className="rounded-full bg-white px-5 py-3 font-bold text-[#6d3219] active:scale-95">重新請求權限</button>
            )}
            <button onClick={() => uploadInputRef.current?.click()} className="rounded-full bg-orange-400 px-5 py-3 font-bold text-black active:scale-95">從相簿選擇</button>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white/75">最多 4 張</div>

        {files.length > 0 && (
          <div className="absolute bottom-5 left-4 right-4 flex items-center gap-2 overflow-x-auto pb-1">
            {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-orange-300 bg-black shadow-lg">
                  {previewUrls[index] && <img src={previewUrls[index]} alt={`已選圖片 ${index + 1}`} className="h-full w-full object-cover" />}
                  <button onClick={() => removeFile(index)} className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5" aria-label={`移除第 ${index + 1} 張圖片`}><X size={12} /></button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[10px]">{index + 1}</span>
                </div>
            ))}
          </div>
        )}
      </main>

      <footer className="relative px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5">
        <div className="flex items-end justify-center gap-8">
          <button onClick={onOpenHistory} className="flex w-16 flex-col items-center gap-2 text-xs font-bold text-white/80 active:scale-95">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/10"><History size={27} /></span>
            歷史
          </button>

          <button onClick={captureFrame} disabled={cameraState !== 'ready' || isCapturing || files.length >= 4} className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full border-[6px] border-white bg-transparent shadow-[0_0_0_4px_rgba(255,255,255,0.25)] disabled:opacity-40 active:scale-95" aria-label="拍攝">
            <span className="h-[70px] w-[70px] rounded-full bg-white" />
            {isCapturing && <Loader2 size={28} className="absolute animate-spin text-orange-500" />}
          </button>

          <button onClick={() => uploadInputRef.current?.click()} className="flex w-16 flex-col items-center gap-2 text-xs font-bold text-white/80 active:scale-95">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/10"><ImagePlus size={27} /></span>
            上傳
          </button>
        </div>

        {files.length > 0 && (
          <button onClick={startTranslation} className="mx-auto mt-5 flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 py-3.5 text-base font-black text-[#4a250d] shadow-lg active:scale-[0.98]">
            <Upload size={19} />開始翻譯 {files.length} 張圖片
          </button>
        )}
      </footer>

      <input ref={uploadInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
    </div>
  );
};

export default QuickTranslateCamera;
