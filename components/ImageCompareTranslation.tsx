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

function glyphUnits(char: string) {
  if (/\s/.test(char)) return .34;
  if (char.charCodeAt(0) < 256) return /[A-Z0-9]/.test(char) ? .64 : .54;
  return 1;
}

function textUnits(text: string) {
  return Array.from(text).reduce((sum, char) => sum + glyphUnits(char), 0);
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

function compactOverlayLines(text: string, maxUnits: number, maxLines: number) {
  const wrapped = wrapOverlayText(text, maxUnits);
  if (wrapped.length <= maxLines) return wrapped;
  if (maxLines === 1) return [wrapped.join('')];
  // Keep the two displayed lines balanced. Joining every wrapped line into
  // the second line makes SVG textLength squeeze that line into an unreadable
  // stripe on long menu items.
  const target = textUnits(text) / 2;
  let split = 1, accumulated = textUnits(wrapped[0]);
  for (let index = 1; index < wrapped.length - 1; index++) {
    const next = accumulated + textUnits(wrapped[index]);
    if (Math.abs(next - target) < Math.abs(accumulated - target)) {
      accumulated = next; split = index + 1;
    } else break;
  }
  return [wrapped.slice(0, split).join(''), wrapped.slice(split).join('')];
}

function regionBox(page: ImageOverlayPage, region: ImageOverlayPage['regions'][number]) {
  const xs = region.polygon.map(p => p.x * page.width), ys = region.polygon.map(p => p.y * page.height);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function overlapRatio(a: ReturnType<typeof regionBox>, b: ReturnType<typeof regionBox>) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const intersection = width * height;
  return intersection / Math.max(1, Math.min(a.width * a.height, b.width * b.height));
}

function normalizeLabel(text: string) {
  return text.toLowerCase().replace(/[\s「」『』（）()【】[\]、，。．,.!?！？:：;；\-—_]/g, '');
}

function uniqueRegions(page: ImageOverlayPage) {
  const kept: ImageOverlayPage['regions'] = [];
  for (const region of page.regions) {
    const box = regionBox(page, region);
    const duplicate = kept.some(previous => normalizeLabel(previous.originalText) === normalizeLabel(region.originalText)
      && overlapRatio(box, regionBox(page, previous)) > .55);
    if (!duplicate) kept.push(region);
  }
  return kept;
}

function xOverlapRatio(a: ReturnType<typeof regionBox>, b: ReturnType<typeof regionBox>) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  return width / Math.max(1, Math.min(a.width, b.width));
}

function verticalGap(a: ReturnType<typeof regionBox>, b: ReturnType<typeof regionBox>) {
  return Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height));
}

function itemNumber(text: string) {
  return text.match(/(?:^|\s)(\d{1,3})(?:[.)、:：]|(?=\s))/)?.[1] || null;
}

function companionRegion(page: ImageOverlayPage, a: ImageOverlayPage['regions'][number], b: ImageOverlayPage['regions'][number]) {
  const boxA = regionBox(page, a), boxB = regionBox(page, b);
  if (a.orientation === 'vertical' || b.orientation === 'vertical') return false;
  if (xOverlapRatio(boxA, boxB) < .55 || verticalGap(boxA, boxB) > Math.max(10, Math.min(boxA.height, boxB.height) * 1.8)) return false;
  const numberA = itemNumber(a.originalText), numberB = itemNumber(b.originalText);
  if (numberA && numberB) return numberA === numberB;
  if (numberA !== numberB) return true;
  return normalizeLabel(a.translatedText) === normalizeLabel(b.translatedText);
}

function translationRegions(page: ImageOverlayPage) {
  const source = uniqueRegions(page).slice().sort((a, b) => regionBox(page, a).y - regionBox(page, b).y);
  const groups: Array<ImageOverlayPage['regions']> = [];
  for (const region of source) {
    const group = groups.find(candidate => candidate.some(previous => companionRegion(page, previous, region)));
    if (group) group.push(region); else groups.push([region]);
  }
  return groups.map(group => {
    if (group.length === 1) return group[0];
    const boxes = group.map(region => regionBox(page, region));
    const left = Math.min(...boxes.map(box => box.x)), top = Math.min(...boxes.map(box => box.y));
    const right = Math.max(...boxes.map(box => box.x + box.width)), bottom = Math.max(...boxes.map(box => box.y + box.height));
    const translations = group.map(region => region.translatedText.trim()).filter(Boolean)
      .filter((text, index, all) => all.findIndex(other => normalizeLabel(other) === normalizeLabel(text)) === index);
    const first = group[0];
    return {
      ...first,
      id: `${first.id}-group`,
      originalText: group.map(region => region.originalText).join('\n'),
      translatedText: translations.join('\n'),
      polygon: [{ x: left / page.width, y: top / page.height }, { x: right / page.width, y: top / page.height },
        { x: right / page.width, y: bottom / page.height }, { x: left / page.width, y: bottom / page.height }] as ImageOverlayPage['regions'][number]['polygon'],
      rotation: 0,
      confidence: Math.max(...group.map(region => region.confidence)),
    };
  });
}

function typicalRegionHeight(page: ImageOverlayPage) {
  const heights = uniqueRegions(page).map(region => regionBox(page, region).height)
    .filter(height => Number.isFinite(height) && height > 0).sort((a, b) => a - b);
  if (!heights.length) return Math.max(18, page.height * .025);
  return Math.max(12, heights[Math.floor(heights.length / 2)]);
}

function fitText(text: string, source: ReturnType<typeof regionBox>, page: ImageOverlayPage, vertical: boolean, displayScale: number) {
  const rowHeight = typicalRegionHeight(page);
  const readableSize = 11 / Math.max(.16, Math.min(1, displayScale));
  // OCR occasionally returns a very tall box for a dense paragraph. Size the
  // label from the page's typical line height so one bad box cannot become a
  // giant panel that covers the following menu items.
  const sizingHeight = clampNumber(source.height, rowHeight * .7, rowHeight * 2.2);
  const baseSize = clampNumber(Math.max(vertical ? source.width * .62 : sizingHeight * .68, readableSize), 5, 32);
  const paddingX = Math.max(3, Math.min(8, source.width * .05));
  const paddingY = Math.max(2, Math.min(6, source.height * .1));
  const maxWidth = Math.min(page.width * .68, Math.max(source.width * 1.8, rowHeight * 14, 140));
  const maxHeight = Math.min(page.height * .14, Math.max(rowHeight * 2.25, baseSize * 2.35 + paddingY * 2));
  const innerWidth = Math.max(2, maxWidth - paddingX * 2);
  // Never shrink below a readable on-screen size. The previous height-only
  // floor could reduce a label to a couple of pixels when the image was fit
  // into a phone viewport, which made the dark label look empty.
  const minSize = Math.max(5, Math.min(baseSize, Math.max(rowHeight * .34, readableSize * .82)));
  let fontSize = baseSize;
  let lines = [text.trim() || ''];
  let width = source.width;
  let height = source.height;
  if (!vertical) {
    for (let size = baseSize; size >= minSize - .01; size *= .88) {
      const capacity = Math.max(3, innerWidth / (size * 1.06));
      const maxLines = source.height >= rowHeight * 1.35 || text.includes('\n') ? 2 : 1;
      const candidate = compactOverlayLines(text, capacity, maxLines);
      const widest = Math.max(...candidate.map(textUnits));
      const estimatedWidth = widest * size * 1.05 + paddingX * 2;
      const candidateWidth = Math.max(source.width, Math.min(maxWidth, estimatedWidth));
      const candidateHeight = Math.max(Math.min(source.height, rowHeight * 1.65),
        Math.min(maxHeight, candidate.length * size * 1.1 + paddingY * 2));
      fontSize = size; lines = candidate; width = candidateWidth; height = candidateHeight;
      if (candidate.length <= maxLines && candidateHeight <= maxHeight && estimatedWidth <= maxWidth) break;
    }
  } else {
    fontSize = clampNumber(Math.max(source.width * .62, readableSize), 5, 30);
    width = Math.max(source.width, fontSize * 1.35 + paddingX * 2);
    height = Math.max(Math.min(source.height, rowHeight * 1.65), Math.min(maxHeight, textUnits(text) * fontSize * 1.02 + paddingY * 2));
  }
  const x = clampNumber(source.x - (width - source.width) / 2, 0, Math.max(0, page.width - width));
  const y = clampNumber(source.y - (height - source.height) / 2, 0, Math.max(0, page.height - height));
  return { x, y, width, height, fontSize, lines, paddingX, paddingY };
}

function textLengthFor(line: string, fontSize: number, maxWidth: number) {
  const estimated = textUnits(line) * fontSize * 1.05;
  // Most labels get their natural measured width. SVG textLength is only a
  // final safety net for unusually long mixed-script strings.
  return estimated > maxWidth * 1.08 ? maxWidth : undefined;
}

function horizontalOverlap(a: { x: number; width: number }, b: { x: number; width: number }) {
  const overlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  return overlap / Math.max(1, Math.min(a.width, b.width));
}

const SourceRegionOverlay = memo(({ page }: { page: ImageOverlayPage }) => (
  <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
    viewBox={`0 0 ${page.width} ${page.height}`} aria-label="原始文字區域">
    {uniqueRegions(page).map(region => {
      const points = region.polygon.map(point => `${point.x * page.width},${point.y * page.height}`).join(' ');
      return <polygon key={region.id} points={points} fill="none" stroke="rgba(255,255,255,.9)"
        strokeWidth={Math.max(2, page.width / 420)} strokeLinejoin="round" />;
    })}
  </svg>
));
SourceRegionOverlay.displayName = 'SourceRegionOverlay';

const TranslationOverlay = memo(({ page, displayScale }: { page: ImageOverlayPage; displayScale: number }) => {
  const rowHeight = typicalRegionHeight(page);
  const placed: Array<{ x: number; y: number; width: number; height: number; rotation: number }> = [];
  const layouts = translationRegions(page).map(region => {
    const source = regionBox(page, region);
    const vertical = region.orientation === 'vertical';
    const layout = fitText(region.translatedText, source, page, vertical, displayScale);
    // Keep labels aligned to their source row, but avoid putting two readable
    // text blocks on top of each other when OCR boxes are very close. The
    // background rectangles may still overlap slightly, like KULIKULI's UI.
    if (!vertical && !region.rotation) {
      const previous = placed.slice().reverse().find(item => !item.rotation && horizontalOverlap(item, layout) > .25
        && layout.y < item.y + item.height);
      if (previous) {
        const gap = Math.max(2, rowHeight * .12);
        const desiredY = previous.y + previous.height + gap;
        const anchorY = source.y + source.height / 2 - layout.height / 2;
        const maxShift = rowHeight * .8;
        layout.y = clampNumber(Math.max(layout.y, desiredY), anchorY - maxShift, anchorY + maxShift);
      }
    }
    placed.push({ x: layout.x, y: layout.y, width: layout.width, height: layout.height, rotation: region.rotation });
    return { region, vertical, ...layout };
  });
  return <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
    viewBox={`0 0 ${page.width} ${page.height}`} aria-label="翻譯文字圖層">
    {layouts.map(({ region, vertical, x, y, width, height, fontSize, lines, paddingX, paddingY }) => {
      const lineHeight = fontSize * 1.1;
      const totalHeight = lines.length * lineHeight;
      const firstY = y + height / 2 - totalHeight / 2 + lineHeight / 2;
      const maxTextWidth = Math.max(2, width - paddingX * 2);
      return <g key={region.id} transform={region.rotation ? `rotate(${region.rotation} ${x + width/2} ${y + height/2})` : undefined}>
        <rect x={x} y={y} width={width} height={height} rx={Math.max(2, height * .12)} fill="rgba(35,24,18,.86)" />
        <text x={x + width / 2} fill="#fff" fontFamily="Arial, sans-serif" fontSize={fontSize}
          fontWeight="600" textAnchor="middle" dominantBaseline="middle"
          style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb', paintOrder: 'stroke', stroke: 'rgba(0,0,0,.12)', strokeWidth: .4 }}>
          {lines.map((line, index) => <tspan key={`${region.id}-${index}`} x={x + width / 2}
            y={vertical ? y + height / 2 : firstY + index * lineHeight}
            textLength={vertical ? undefined : textLengthFor(line, fontSize, maxTextWidth)}
            lengthAdjust="spacingAndGlyphs">{line}</tspan>)}
        </text>
      </g>;
    })}
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
        {!translated && page.regions.length > 0 && <SourceRegionOverlay page={page} />}
        {translated && page.regions.length > 0 && <TranslationOverlay page={page} displayScale={bounds.imageWidth / Math.max(1, page.width)} />}
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
