'use client';

import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Loader2, Minus, Plus, RotateCcw } from 'lucide-react';
import { ImageOverlayPage } from '../types';
import { CompareBounds, CompareTransform, INITIAL_TRANSFORM, constrainTransform, zoomAt } from '../lib/compareTransform';

interface Props {
  pages: ImageOverlayPage[]; activeIndex: number;
  onSelectPage: (index: number) => void; onRetry: (index: number) => void; onBack: () => void;
}

// SVG and image share the exact source-image coordinate space and parent transform.
type OverlayLayout = {
  region: ImageOverlayPage['regions'][number];
  x: number; y: number; width: number; height: number;
  fontSize: number; lines: string[]; vertical: boolean;
};

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// This is deliberately only a layout estimate. The actual browser still wraps
// the text; the estimate gives each foreignObject enough room to avoid clipping.
function glyphUnits(char: string) {
  if (/\s/.test(char)) return .34;
  if (char.charCodeAt(0) < 256) return /[A-Z0-9]/.test(char) ? .64 : .54;
  return 1;
}

function wrapOverlayText(text: string, maxUnits: number) {
  const lines: string[] = [];
  let line = '', units = 0;
  for (const char of text.replace(/\r\n/g, '\n')) {
    if (char === '\n') {
      if (line.trim()) lines.push(line.trim());
      line = ''; units = 0;
      continue;
    }
    const next = glyphUnits(char);
    if (line && units + next > maxUnits) {
      lines.push(line.trim());
      line = ''; units = 0;
    }
    line += char; units += next;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.length ? lines : [''];
}

function textUnits(text: string) {
  return Array.from(text).reduce((sum, char) => sum + glyphUnits(char), 0);
}

function intersects(a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function distanceFromAnchor(candidate: {x:number;y:number}, anchor: {x:number;y:number}) {
  return Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y);
}

function layoutOverlay(page: ImageOverlayPage): OverlayLayout[] {
  const placed: OverlayLayout[] = [];
  for (const region of page.regions) {
    const xs = region.polygon.map(p => p.x * page.width), ys = region.polygon.map(p => p.y * page.height);
    const sourceX = Math.min(...xs), sourceY = Math.min(...ys);
    const sourceW = Math.max(...xs) - sourceX, sourceH = Math.max(...ys) - sourceY;
    const vertical = region.orientation === 'vertical';
    const anchor = { x: sourceX + sourceW / 2, y: sourceY + sourceH / 2 };
    const padding = Math.max(4, sourceH * .16);
    const baseSize = clampNumber(sourceH * .68, 9, 34);
    let fontSize = baseSize;
    let lines = [region.translatedText.trim() || ''];
    let width = Math.max(sourceW, baseSize * 2 + padding * 2);
    let height = Math.max(sourceH, baseSize * 1.25 + padding * 2);

    if (vertical) {
      // Vertical source labels need extra height rather than a tiny fixed font.
      fontSize = clampNumber(sourceW * .64, 8, 30);
      const neededHeight = textUnits(region.translatedText) * fontSize * 1.04 + padding * 2;
      width = Math.max(sourceW, fontSize * 1.35 + padding * 2);
      height = Math.max(sourceH, neededHeight);
    } else {
      const widthCap = Math.min(page.width * .48, Math.max(sourceW * 3.2, baseSize * 8, 96));
      const minSize = Math.max(7, Math.min(baseSize, sourceH * .46));
      // Prefer a readable font and wrap naturally. If the translation is long,
      // expand the box before shrinking below the source text's visual height.
      for (let size = baseSize; size >= minSize - .01; size *= .9) {
        const maxUnits = Math.max(3, (widthCap - padding * 2) / size);
        const candidateLines = wrapOverlayText(region.translatedText, maxUnits);
        const widest = Math.max(...candidateLines.map(textUnits));
        const candidateWidth = Math.max(sourceW, Math.min(widthCap, widest * size + padding * 2));
        const candidateHeight = Math.max(sourceH, candidateLines.length * size * 1.18 + padding * 2);
        fontSize = size; lines = candidateLines; width = candidateWidth; height = candidateHeight;
        if (candidateLines.length <= 3 && candidateHeight <= Math.max(sourceH * 3, size * 4.2)) break;
      }
    }

    const original = { x: anchor.x - width / 2, y: anchor.y - height / 2, width, height };
    const candidates = [
      original,
      { ...original, y: original.y + height * .65 },
      { ...original, y: original.y - height * .65 },
      { ...original, x: original.x + width * .65 },
      { ...original, x: original.x - width * .65 },
    ].map(candidate => ({
      ...candidate,
      x: clampNumber(candidate.x, 0, Math.max(0, page.width - candidate.width)),
      y: clampNumber(candidate.y, 0, Math.max(0, page.height - candidate.height)),
    }));
    // Keep the label anchored to its source, but choose a nearby free position
    // when expanded text would cover an already-laid-out neighbouring label.
    const chosen = candidates.find(candidate => !placed.some(previous => intersects(candidate, previous)))
      || candidates.sort((a, b) => {
        const overlap = (candidate: typeof a) => placed.reduce((sum, previous) => {
          const x = Math.max(0, Math.min(candidate.x + candidate.width, previous.x + previous.width) - Math.max(candidate.x, previous.x));
          const y = Math.max(0, Math.min(candidate.y + candidate.height, previous.y + previous.height) - Math.max(candidate.y, previous.y));
          return sum + x * y;
        }, 0);
        return overlap(a) - overlap(b) || distanceFromAnchor(a, anchor) - distanceFromAnchor(b, anchor);
      })[0];
    placed.push({ region, x: chosen.x, y: chosen.y, width, height, fontSize, lines, vertical });
  }
  return placed;
}

const TranslationOverlay = memo(({ page }: { page: ImageOverlayPage }) => {
  const layouts = layoutOverlay(page);
  return <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
    viewBox={`0 0 ${page.width} ${page.height}`} aria-label="翻譯文字圖層">
    {layouts.map(({ region, x, y, width, height, fontSize, lines, vertical }) => (
      <foreignObject key={region.id} x={x} y={y} width={width} height={height}
        overflow="visible"
        transform={region.rotation ? `rotate(${region.rotation} ${x + width/2} ${y + height/2})` : undefined}>
        <div title={`${region.originalText} → ${region.translatedText}`} style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxSizing: 'border-box', padding: '4px 6px', borderRadius: 4,
          background: 'rgba(35, 24, 18, .88)', color: '#fff', fontWeight: 600,
          fontFamily: 'Arial, sans-serif', fontSize, lineHeight: 1.18,
          overflow: 'visible', overflowWrap: 'anywhere', wordBreak: 'break-word', textAlign: 'center',
          whiteSpace: 'pre-wrap', writingMode: vertical ? 'vertical-rl' : 'horizontal-tb',
        }}>{lines.join('\n')}</div>
      </foreignObject>
    ))}
  </svg>;
});
TranslationOverlay.displayName = 'TranslationOverlay';

function SyncedViewer({ page, onRetry }: {page: ImageOverlayPage; onRetry: () => void}) {
  const panes = useRef<Array<HTMLDivElement | null>>([]);
  const [bounds, setBounds] = useState<CompareBounds>({ width: 1, height: 1, imageWidth: 1, imageHeight: 1 });
  const boundsRef = useRef(bounds);
  const [transform, setTransform] = useState<CompareTransform>(INITIAL_TRANSFORM);
  const transformRef = useRef(transform);
  const frame = useRef<number>();
  const pointers = useRef(new Map<number, {x:number;y:number}>());
  const owner = useRef<HTMLElement | null>(null);
  const gesture = useRef<{ t:CompareTransform; center:{x:number;y:number}; distance:number }>();
  const apply = useCallback((value: CompareTransform) => {
    transformRef.current = constrainTransform(value, boundsRef.current);
    if (frame.current === undefined) frame.current = requestAnimationFrame(() => {
      frame.current = undefined; setTransform(transformRef.current);
    });
  }, []);
  useLayoutEffect(() => {
    const measure = () => {
      const rects = panes.current.map(p => p?.getBoundingClientRect()).filter(Boolean) as DOMRect[];
      if (rects.length !== 2) return;
      const width = Math.min(...rects.map(r => r.width)), height = Math.min(...rects.map(r => r.height));
      if (!width || !height) return;
      const fit = Math.min(width / page.width, height / page.height);
      const b = { width, height, imageWidth: page.width * fit, imageHeight: page.height * fit };
      boundsRef.current = b; setBounds(b); apply(transformRef.current);
      pointers.current.clear(); gesture.current = undefined; owner.current = null;
    };
    const observer = new ResizeObserver(measure);
    panes.current.forEach(p => p && observer.observe(p)); measure();
    return () => { observer.disconnect(); if (frame.current !== undefined) cancelAnimationFrame(frame.current); frame.current = undefined; };
  }, [page.width, page.height, apply]);
  const localPoint = (el: HTMLElement, x: number, y: number) => {
    const r = el.getBoundingClientRect(); return { x: x - r.left - r.width/2, y: y - r.top - r.height/2 };
  };
  const summary = () => {
    const [a,b] = [...pointers.current.values()];
    if (!a) return undefined;
    return { center: b ? {x:(a.x+b.x)/2, y:(a.y+b.y)/2} : a, distance: b ? Math.hypot(a.x-b.x,a.y-b.y) : 0 };
  };
  const rebase = () => { const s = summary(); gesture.current = s ? { ...s, t: transformRef.current } : undefined; };
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (owner.current && owner.current !== e.currentTarget) return;
    e.preventDefault(); owner.current = e.currentTarget;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, localPoint(e.currentTarget,e.clientX,e.clientY)); rebase();
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId,localPoint(e.currentTarget,e.clientX,e.clientY));
    const now = summary(), start = gesture.current;
    if (!now || !start) return;
    if (now.distance && start.distance) apply(zoomAt(start.t,start.t.scale * now.distance/start.distance,start.center,now.center));
    else apply({...start.t,translateX:start.t.translateX+now.center.x-start.center.x,translateY:start.t.translateY+now.center.y-start.center.y});
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!pointers.current.size) owner.current = null;
    rebase();
  };
  useEffect(() => {
    const listeners = panes.current.filter(Boolean).map(el => {
      const wheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? boundsRef.current.height : 1);
        apply(zoomAt(transformRef.current, transformRef.current.scale * Math.exp(-Math.max(-200,Math.min(200,delta))*.002), localPoint(el!,e.clientX,e.clientY)));
      };
      el!.addEventListener('wheel',wheel,{passive:false}); return () => el!.removeEventListener('wheel',wheel);
    });
    return () => listeners.forEach(remove => remove());
  }, [apply]);
  const reset = () => { pointers.current.clear(); owner.current = null; gesture.current = undefined; apply(INITIAL_TRANSFORM); };
  const layerStyle: React.CSSProperties = {
    width: bounds.imageWidth, height: bounds.imageHeight, position: 'absolute', left:'50%',top:'50%',
    marginLeft:-bounds.imageWidth/2, marginTop:-bounds.imageHeight/2,
    transform:`translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
    transformOrigin:'50% 50%',willChange:'transform',pointerEvents:'none',
  };
  const pane = (translated: boolean, index: number) => <section className="min-h-0 flex flex-col">
    <h2 className="text-xs font-bold px-3 py-1 shrink-0">{translated ? '翻譯菜單' : '原始菜單'}</h2>
    <div ref={el => {panes.current[index] = el;}} data-compare-viewport={index}
      className="relative flex-1 min-h-0 overflow-hidden rounded-xl select-none"
      style={{touchAction:'none',background:'var(--bg-secondary)',cursor:'grab'}}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}
      tabIndex={0} aria-label={`${translated ? '翻譯菜單' : '原始菜單'}，可拖曳與雙指縮放`}
      onKeyDown={e => {
        if (e.key === '0') reset();
        if (e.key === '+' || e.key === '=') apply(zoomAt(transformRef.current,transformRef.current.scale+.25,{x:0,y:0}));
        if (e.key === '-') apply(zoomAt(transformRef.current,transformRef.current.scale-.25,{x:0,y:0}));
        const delta: Record<string,[number,number]> = {ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
        if(delta[e.key]) {e.preventDefault();const [x,y]=delta[e.key];apply({...transformRef.current,translateX:transformRef.current.translateX+x,translateY:transformRef.current.translateY+y});}
      }}>
      <div data-transform-layer={index} style={layerStyle}>
        <img src={page.imageDataUrl} draggable={false} alt={translated ? '翻譯菜單底圖' : '原始菜單'} className="absolute inset-0 w-full h-full" />
        {translated && page.regions.length > 0 && <TranslationOverlay page={page} />}
      </div>
      {translated && page.status !== 'ready' && <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white pointer-events-none">
        <div className="text-center p-4 max-w-sm" aria-live="polite">
          {page.status === 'error' ? <AlertCircle className="mx-auto mb-2"/> : <Loader2 className="mx-auto mb-2 animate-spin"/>}
          <p className="text-sm">{page.status === 'error' ? page.error : page.status === 'queued' ? '等待辨識…' : '正在辨識與翻譯…'}</p>
          {page.status === 'error' && <button onPointerDown={e=>e.stopPropagation()} onClick={onRetry} className="pointer-events-auto mt-3 px-4 py-2 rounded-lg bg-orange-500">重試這張</button>}
        </div>
      </div>}
    </div>
  </section>;
  return <div className="min-h-0 flex-1 flex flex-col">
    <div className="flex items-center justify-between gap-2 px-2 pb-1 shrink-0">
      <p className="text-[11px] opacity-60">拖曳移動 · 雙指／滾輪縮放</p>
      <div className="flex items-center gap-2">
        <button aria-label="縮小" disabled={transform.scale<=1} className="p-2 disabled:opacity-30" onClick={()=>apply(zoomAt(transformRef.current,transformRef.current.scale-.25,{x:0,y:0}))}><Minus size={17}/></button>
        <span className="text-xs tabular-nums w-10 text-center">{Math.round(transform.scale*100)}%</span>
        <button aria-label="放大" disabled={transform.scale>=5} className="p-2 disabled:opacity-30" onClick={()=>apply(zoomAt(transformRef.current,transformRef.current.scale+.25,{x:0,y:0}))}><Plus size={17}/></button>
        <button onClick={reset} className="text-xs font-bold flex items-center gap-1 p-2 rounded-lg" style={{background:'var(--bg-secondary)'}}><RotateCcw size={14}/>重設</button>
      </div>
    </div>
    <div className="min-h-0 flex-1 grid" style={{gridTemplateRows:'minmax(0,1fr) 10px minmax(0,1fr)'}}>
      {pane(false,0)}
      <div aria-hidden="true" className="flex items-center px-2" data-compare-divider><div className="w-full" style={{height:2,background:'var(--brand-primary)',opacity:.65}}/></div>
      {pane(true,1)}
    </div>
    {page.partial && <p className="text-xs px-3 py-1 text-amber-600">部分文字未能確認，請對照原圖；可裁切該區域後再辨識。</p>}
  </div>;
}

export function ImageCompareTranslation({pages,activeIndex,onSelectPage,onRetry,onBack}: Props) {
  const page = pages[activeIndex] || pages[0];
  if (!page) return null;
  return <div className="h-full flex flex-col overflow-hidden" style={{background:'var(--bg-primary)',color:'var(--text-primary)'}}>
    <header className="flex items-center gap-3 px-3 py-2 shrink-0" style={{borderBottom:'1px solid var(--glass-border)'}}>
      <button onClick={onBack} aria-label="返回首頁" className="p-2 rounded-xl"><ArrowLeft size={22}/></button>
      <div><h1 className="font-extrabold text-base">原圖對照翻譯</h1><p className="text-xs opacity-60">{pages.filter(p=>p.status==='ready').length}/{pages.length} 張完成{page.status==='ready' ? ` · ${page.regions.length} 個文字區域` : ''}</p></div>
    </header>
    <main className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 p-2">
      <div className="order-1 md:order-2 min-h-0 min-w-0 flex-1 flex flex-col">
        <SyncedViewer key={page.id} page={page} onRetry={()=>onRetry(activeIndex)}/>
      </div>
      <nav aria-label="圖片列表" className="order-2 md:order-1 flex md:flex-col gap-2 shrink-0 overflow-auto p-1 md:w-20">
        {pages.map((p,i)=><button key={p.id} aria-label={`查看第 ${i+1} 張圖片`} aria-pressed={i===activeIndex} onClick={()=>onSelectPage(i)}
          className="relative w-12 h-14 md:w-16 md:h-20 rounded-lg overflow-hidden shrink-0" style={{border:i===activeIndex?'2px solid var(--brand-primary)':'2px solid transparent'}}>
          <img src={p.imageDataUrl} className="w-full h-full object-cover" alt=""/>
          <span className="absolute top-0 right-0 rounded-bl bg-black/80 p-1 text-white">{p.status==='ready'?<Check size={12}/>:p.status==='error'?<AlertCircle size={12}/>:<Loader2 size={12} className={p.status==='processing'?'animate-spin':''}/>}</span>
          <span className="absolute bottom-0 left-0 bg-black/70 text-white text-[10px] px-1">{i+1}</span>
        </button>)}
      </nav>
    </main>
  </div>;
}
