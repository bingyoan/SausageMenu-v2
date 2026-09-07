'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  GripHorizontal,
  Images,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { ImageOverlayPage, ImageTranslationRegion } from '../types';

interface ImageCompareTranslationProps {
  pages: ImageOverlayPage[];
  activeIndex: number;
  onSelectPage: (index: number) => void;
  onSliderChange: (index: number, value: number) => void;
  onRetry: (index: number) => void;
  onBack: () => void;
}

const clampSlider = (value: number) => Math.min(100, Math.max(0, value));

const getRegionBox = (region: ImageTranslationRegion) => {
  const xs = region.polygon.map(point => point.x);
  const ys = region.polygon.map(point => point.y);
  const left = Math.min(...xs) * 100;
  const top = Math.min(...ys) * 100;
  const right = Math.max(...xs) * 100;
  const bottom = Math.max(...ys) * 100;
  return {
    left,
    top,
    width: Math.max(2.5, right - left),
    height: Math.max(2.2, bottom - top),
  };
};

const TranslationOverlay: React.FC<{ regions: ImageTranslationRegion[] }> = ({ regions }) => (
  <div className="absolute inset-0 overflow-hidden" aria-label="翻譯圖層">
    {regions.map(region => {
      const box = getRegionBox(region);
      const isLowConfidence = region.confidence > 0 && region.confidence < 0.65;
      const background = region.kind === 'category'
        ? 'rgba(79, 46, 22, 0.94)'
        : region.kind === 'description'
          ? 'rgba(39, 31, 27, 0.90)'
          : 'rgba(54, 35, 23, 0.94)';
      const responsiveFontSize = Math.min(4.2, Math.max(1.35, box.height * 0.36));

      return (
        <div
          key={region.id}
          title={`${region.originalText} → ${region.translatedText}`}
          className="absolute flex items-center justify-center text-center font-bold"
          style={{
            left: `${box.left}%`,
            top: `${box.top}%`,
            width: `${box.width}%`,
            minHeight: `${box.height}%`,
            maxHeight: `${Math.max(box.height * 1.8, box.height + 2)}%`,
            padding: '0.12em 0.2em',
            borderRadius: '0.3em',
            background,
            border: isLowConfidence ? '2px dashed #fbbf24' : '1px solid rgba(255,255,255,0.72)',
            color: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.55)',
            textShadow: '0 1px 2px rgba(0,0,0,0.85)',
            fontSize: `clamp(8px, ${responsiveFontSize}vw, 22px)`,
            lineHeight: 1.08,
            letterSpacing: '0.01em',
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            writingMode: region.orientation === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
            transform: `rotate(${region.rotation}deg)`,
            transformOrigin: 'center',
          }}
        >
          {region.translatedText}
        </div>
      );
    })}
  </div>
);

const PageStatusIcon: React.FC<{ status: ImageOverlayPage['status'] }> = ({ status }) => {
  if (status === 'ready') return <Check size={14} strokeWidth={3} />;
  if (status === 'error') return <AlertCircle size={14} />;
  return <Loader2 size={14} className={status === 'processing' ? 'animate-spin' : ''} />;
};

export const ImageCompareTranslation: React.FC<ImageCompareTranslationProps> = ({
  pages,
  activeIndex,
  onSelectPage,
  onSliderChange,
  onRetry,
  onBack,
}) => {
  const currentPage = pages[activeIndex] || pages[0];
  const viewerRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number>();
  const [zoom, setZoom] = useState(1);
  const readyCount = pages.filter(page => page.status === 'ready').length;

  useEffect(() => {
    setZoom(1);
  }, [activeIndex]);

  useEffect(() => () => {
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
  }, []);

  const updateSliderFromPointer = (clientY: number) => {
    const rect = viewerRef.current?.getBoundingClientRect();
    if (!rect || rect.height <= 0) return;
    const value = clampSlider(((clientY - rect.top) / rect.height) * 100);
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(() => onSliderChange(activeIndex, value));
  };

  const statusText = useMemo(() => {
    if (!currentPage) return '';
    if (currentPage.status === 'processing') return '正在辨識文字位置並翻譯…';
    if (currentPage.status === 'queued') return '等待處理…';
    if (currentPage.status === 'error') return currentPage.error || '這張圖片處理失敗';
    return `已辨識 ${currentPage.regions.length} 個文字區域`;
  }, [currentPage]);

  if (!currentPage) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <button onClick={onBack} className="px-5 py-3 rounded-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
          返回首頁
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header
        className="shrink-0 flex items-center gap-3 px-3 py-3 sm:px-5"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          aria-label="返回首頁"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-extrabold truncate">原圖對照翻譯</h1>
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
            {statusText} · {readyCount}/{pages.length} 張完成
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(value => Math.max(1, Number((value - 0.25).toFixed(2))))}
            disabled={zoom <= 1}
            className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-35"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            aria-label="縮小"
          >
            <Minus size={17} />
          </button>
          <button
            onClick={() => setZoom(value => Math.min(3, Number((value + 0.25).toFixed(2))))}
            disabled={zoom >= 3}
            className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-35"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            aria-label="放大"
          >
            <Plus size={17} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 flex flex-col md:flex-row gap-2 p-2 sm:p-3">
        <nav
          className="order-2 md:order-1 shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-[88px] p-1"
          aria-label="圖片列表"
        >
          {pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => onSelectPage(index)}
              className="relative shrink-0 w-[66px] h-[78px] md:w-[78px] md:h-[92px] overflow-hidden rounded-xl transition-all active:scale-95"
              style={{
                border: index === activeIndex ? '3px solid var(--brand-primary)' : '1px solid var(--glass-border)',
                boxShadow: index === activeIndex ? '0 0 0 2px var(--brand-glow)' : 'none',
                background: 'var(--bg-tertiary)',
              }}
              aria-label={`查看第 ${index + 1} 張圖片`}
            >
              <img src={page.imageDataUrl} alt="" className="w-full h-full object-cover" />
              <span
                className="absolute right-1 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white"
                style={{
                  background: page.status === 'ready' ? '#16a34a' : page.status === 'error' ? '#dc2626' : '#f97316',
                }}
              >
                <PageStatusIcon status={page.status} />
              </span>
              <span className="absolute left-1 bottom-1 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                {index + 1}
              </span>
            </button>
          ))}
        </nav>

        <main
          className="order-1 md:order-2 min-w-0 min-h-0 flex-1 rounded-2xl overflow-auto flex items-center justify-center p-2 sm:p-4"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
        >
          {currentPage.status === 'error' ? (
            <div className="max-w-sm text-center px-6">
              <AlertCircle size={44} className="mx-auto mb-3 text-red-500" />
              <h2 className="font-extrabold text-lg mb-2">這張圖片辨識失敗</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{currentPage.error}</p>
              <button
                onClick={() => onRetry(activeIndex)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold active:scale-95"
                style={{ background: 'var(--brand-gradient)' }}
              >
                <RefreshCw size={18} /> 重試這張
              </button>
            </div>
          ) : (
            <div
              ref={viewerRef}
              className="relative inline-block select-none origin-center transition-transform duration-150"
              style={{ transform: `scale(${zoom})`, lineHeight: 0, maxWidth: '100%' }}
            >
              <img
                src={currentPage.imageDataUrl}
                alt="菜單翻譯對照"
                draggable={false}
                className="block max-w-full object-contain rounded-xl shadow-2xl"
                style={{ maxHeight: 'calc(100vh - 210px)' }}
              />

              {currentPage.status === 'ready' && (
                <>
                  <TranslationOverlay regions={currentPage.regions} />
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl"
                    style={{ clipPath: `inset(0 0 ${100 - currentPage.sliderPosition}% 0)` }}
                  >
                    <img src={currentPage.imageDataUrl} alt="" draggable={false} className="w-full h-full object-fill" />
                  </div>

                  <span className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-white/95 text-black text-xs font-black leading-none shadow-lg pointer-events-none">
                    原圖
                  </span>
                  <span className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/95 text-black text-xs font-black leading-none shadow-lg pointer-events-none">
                    翻譯
                  </span>

                  <div
                    className="absolute left-0 right-0 z-20 -translate-y-1/2 cursor-row-resize"
                    style={{ top: `${currentPage.sliderPosition}%`, height: 44, touchAction: 'none' }}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      updateSliderFromPointer(event.clientY);
                    }}
                    onPointerMove={(event) => {
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSliderFromPointer(event.clientY);
                    }}
                    onPointerUp={(event) => {
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                    }}
                  >
                    <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.8)]" />
                    <button
                      type="button"
                      role="slider"
                      aria-label="原圖與翻譯圖顯示比例"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(currentPage.sliderPosition)}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowUp') onSliderChange(activeIndex, clampSlider(currentPage.sliderPosition - 5));
                        if (event.key === 'ArrowDown') onSliderChange(activeIndex, clampSlider(currentPage.sliderPosition + 5));
                      }}
                      className="absolute left-1/2 top-1/2 w-12 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white text-orange-600 flex items-center justify-center shadow-xl"
                    >
                      <GripHorizontal size={24} />
                    </button>
                  </div>
                </>
              )}

              {(currentPage.status === 'processing' || currentPage.status === 'queued') && (
                <div className="absolute inset-0 rounded-xl bg-black/65 flex flex-col items-center justify-center text-white">
                  {currentPage.status === 'processing'
                    ? <Loader2 size={38} className="animate-spin mb-3 text-orange-400" />
                    : <Images size={38} className="mb-3 text-white/70" />}
                  <p className="text-sm font-bold leading-normal">{statusText}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {currentPage.status === 'ready' && (
        <footer
          className="shrink-0 flex items-center justify-center gap-2 px-3 py-2"
          style={{ borderTop: '1px solid var(--glass-border)', background: 'var(--header-bg)' }}
        >
          <button onClick={() => onSliderChange(activeIndex, 100)} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>原圖</button>
          <button onClick={() => onSliderChange(activeIndex, 50)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'var(--brand-gradient)' }}>對照</button>
          <button onClick={() => onSliderChange(activeIndex, 0)} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>翻譯</button>
        </footer>
      )}
    </div>
  );
};
