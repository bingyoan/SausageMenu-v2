'use client';

import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ClipboardList, Loader2, Trash2, X } from 'lucide-react';
import { ImageOverlayPage, ImageTranslationRegion, ImageTranslationSelection, TargetLanguage } from '../types';
import { CompareBounds, CompareTransform, INITIAL_TRANSFORM, constrainTransform, zoomAt } from '../lib/compareTransform';
import { getImageTranslationUIText } from '../i18n';

interface Props {
  pages: ImageOverlayPage[]; activeIndex: number;
  onSelectPage: (index: number) => void; onRetry: (index: number) => void; onBack: () => void;
  uiLanguage: TargetLanguage;
  selectedItems: ImageTranslationSelection[];
  onChangeQuantity: (pageId: string, region: ImageTranslationRegion, delta: number) => void;
  onAdjustSelection: (selectionId: string, delta: number) => void;
  onRemoveSelection: (selectionId: string) => void;
}

const selectionIdFor = (pageId: string, regionId: string) => `${pageId}:${regionId}`;

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

function compactVerticalColumns(text: string, maxUnits: number, maxColumns: number) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  const wrapped = wrapOverlayText(normalized, maxUnits);
  if (wrapped.length <= maxColumns) return wrapped;

  // Vertical menu labels need several neighbouring columns, not one endlessly
  // tall column. Rebalance the complete translation without truncating it.
  const characters = Array.from(normalized.replace(/\s*\n\s*/g, ''));
  const columns = Math.max(1, Math.min(maxColumns, Math.ceil(textUnits(characters.join('')) / maxUnits)));
  const targetUnits = textUnits(characters.join('')) / columns;
  const result: string[] = [];
  let column = '', units = 0;
  for (const char of characters) {
    const next = glyphUnits(char);
    if (column && result.length < columns - 1 && units + next > targetUnits) {
      result.push(column.trim());
      column = ''; units = 0;
    }
    column += char; units += next;
  }
  if (column.trim()) result.push(column.trim());
  return result.length ? result : [''];
}

function regionBox(page: ImageOverlayPage, region: ImageOverlayPage['regions'][number]) {
  const xs = region.polygon.map(p => p.x * page.width), ys = region.polygon.map(p => p.y * page.height);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function isVerticalRegion(page: ImageOverlayPage, region: ImageOverlayPage['regions'][number]) {
  if (region.orientation === 'vertical') return true;
  const box = regionBox(page, region);
  // Gemini's compact schema does not always return orientation. Infer it from
  // the source box so Japanese/CJK vertical labels are laid out vertically.
  return box.height > box.width * 1.45 && box.height > page.height * .035;
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
  if (isVerticalRegion(page, a) || isVerticalRegion(page, b)) return false;
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
  // Labels live in image coordinates and zoom with the image. A small overview
  // size is intentional: forcing every label to 14 CSS pixels makes dense
  // vertical menus collide. This compact floor stays visible at overview and
  // becomes naturally readable as the shared image layer is enlarged.
  const compactScreenSize = 5.5 / Math.max(.16, Math.min(1, displayScale));
  // OCR occasionally returns a very tall box for a dense paragraph. Size the
  // label from the page's typical line height so one bad box cannot become a
  // giant panel that covers the following menu items.
  const sizingHeight = clampNumber(source.height, rowHeight * .7, rowHeight * 2.2);
  const baseSize = clampNumber(Math.max(vertical ? source.width * .46 : sizingHeight * .62, compactScreenSize), 6, 42);
  const paddingX = Math.max(3, Math.min(8, source.width * .05));
  const paddingY = Math.max(2, Math.min(6, source.height * .1));
  const maxWidth = Math.min(page.width * .72, Math.max(source.width * 1.85, rowHeight * 14, 140));
  const maxHeight = Math.min(page.height * .15, Math.max(rowHeight * 2.3, baseSize * 2.35 + paddingY * 2));
  const innerWidth = Math.max(2, maxWidth - paddingX * 2);
  const minSize = Math.max(5, Math.min(baseSize, Math.max(rowHeight * .28, compactScreenSize * .78)));
  let fontSize = baseSize;
  let lines = [text.trim() || ''];
  let width = source.width;
  let height = source.height;
  if (!vertical) {
    for (let size = baseSize; size >= minSize - .01; size *= .88) {
      const capacity = Math.max(3, innerWidth / (size * 1.06));
      const maxLines = source.height >= rowHeight * 1.3 || text.includes('\n') ? 2 : 1;
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
    // Keep the same footprint as the source vertical column. Long translations
    // are distributed over up to three adjacent columns, which is how the
    // reference app avoids both microscopic type and one huge overlapping box.
    const maxVerticalHeight = Math.min(page.height * .58,
      Math.max(source.height * 1.08, rowHeight * 4.5));
    const maxColumns = 4;
    const verticalMinSize = Math.max(5, Math.min(baseSize, Math.max(rowHeight * .22, compactScreenSize * .72)));
    fontSize = baseSize;
    for (let size = baseSize; size >= verticalMinSize - .01; size *= .9) {
      const capacity = Math.max(2, (maxVerticalHeight - paddingY * 2) / (size * 1.04));
      const candidate = compactVerticalColumns(text, capacity, maxColumns);
      fontSize = size; lines = candidate;
      if (candidate.length <= maxColumns && Math.max(...candidate.map(textUnits)) <= capacity * 1.04) break;
    }
    const longest = Math.max(1, ...lines.map(textUnits));
    const columnAdvance = fontSize * 1.12;
    const desiredWidth = lines.length * columnAdvance + paddingX * 2;
    const maxVerticalWidth = Math.min(page.width * .2, Math.max(source.width * 2.5, rowHeight * 4.2));
    width = Math.max(source.width, Math.min(maxVerticalWidth, desiredWidth));
    height = Math.max(Math.min(source.height, maxVerticalHeight),
      Math.min(maxVerticalHeight, longest * fontSize * 1.04 + paddingY * 2));
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

const TranslationOverlay = memo(({ page, displayScale, selectedItems, onChangeQuantity, uiLanguage }: {
  page: ImageOverlayPage;
  displayScale: number;
  selectedItems: ImageTranslationSelection[];
  onChangeQuantity: (pageId: string, region: ImageTranslationRegion, delta: number) => void;
  uiLanguage: TargetLanguage;
}) => {
  const imageTranslationUi = getImageTranslationUIText(uiLanguage);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rowHeight = typicalRegionHeight(page);
  const placed: Array<{ x: number; y: number; width: number; height: number; rotation: number }> = [];
  const layouts = translationRegions(page).map(region => {
    const source = regionBox(page, region);
    const vertical = isVerticalRegion(page, region);
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
  const selected = selectedId ? layouts.find(layout => layout.region.id === selectedId) : undefined;
  const orderedLayouts = selected
    ? [...layouts.filter(layout => layout.region.id !== selectedId), selected]
    : layouts;
  return <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
    viewBox={`0 0 ${page.width} ${page.height}`} aria-label="翻譯文字圖層">
    {orderedLayouts.map(({ region, vertical, x, y, width, height, fontSize, lines, paddingX, paddingY }) => {
      const lineHeight = fontSize * 1.1;
      const totalHeight = lines.length * lineHeight;
      const firstY = y + height / 2 - totalHeight / 2 + lineHeight / 2;
      const maxTextWidth = Math.max(2, width - paddingX * 2);
      const quantity = selectedItems.find(item => item.id === selectionIdFor(page.id, region.id))?.quantity || 0;
      // Quantity persists in the receipt, but only the last clicked region is
      // visually active. This keeps the overlay readable when moving to the
      // next item while still allowing its saved quantity to be adjusted later.
      const active = region.id === selectedId;
      const controlHeight = Math.max(22, Math.min(44, Math.max(height * .82, rowHeight * .9)));
      const controlWidth = controlHeight * 2.95;
      const controlGap = Math.max(4, controlHeight * .16);
      const hasRightSpace = page.width - (x + width) >= controlWidth + controlGap;
      const controlX = hasRightSpace ? x + width + controlGap : Math.max(0, x - controlWidth - controlGap);
      const controlY = clampNumber(y + height / 2 - controlHeight / 2, 0, Math.max(0, page.height - controlHeight));
      const controlButtonWidth = controlHeight * .84;
      const changeQuantity = (event: React.MouseEvent | React.PointerEvent, delta: number) => {
        event.stopPropagation();
        onChangeQuantity(page.id, region, delta);
      };
      return <g key={region.id} transform={region.rotation ? `rotate(${region.rotation} ${x + width/2} ${y + height/2})` : undefined}
        data-overlay-region={region.id}
        style={{pointerEvents:'auto',cursor:'pointer'}}
        onClick={event => { event.stopPropagation(); setSelectedId(region.id); }}
        aria-label={`${imageTranslationUi.translatedMenu}: ${region.translatedText}`}>
        <rect x={x} y={y} width={width} height={height} rx={Math.max(2, height * .12)} fill={active ? 'rgba(35,24,18,.92)' : 'rgba(35,24,18,.52)'}
          stroke={active ? '#ffb04a' : 'rgba(255,255,255,.18)'} strokeWidth={active ? Math.max(3, page.width / 260) : Math.max(1, page.width / 900)} />
        <text x={x + width / 2} fill="#fff" fontFamily="Arial, sans-serif" fontSize={fontSize}
          fontWeight="600" textAnchor="middle" dominantBaseline="middle"
          style={{ writingMode: vertical ? 'vertical-rl' : 'horizontal-tb', paintOrder: 'stroke', stroke: 'rgba(0,0,0,.12)', strokeWidth: .4 }}>
          {lines.map((line, index) => <tspan key={`${region.id}-${index}`}
            x={vertical ? x + width - paddingX - fontSize * .56 - index * fontSize * 1.12 : x + width / 2}
            y={vertical ? y + height / 2 : firstY + index * lineHeight}
            textLength={vertical ? undefined : textLengthFor(line, fontSize, maxTextWidth)}
            lengthAdjust="spacingAndGlyphs">{line}</tspan>)}
        </text>
        {active && <g data-overlay-control="quantity" aria-label={`調整 ${region.translatedText} 數量`}>
          <rect x={controlX} y={controlY} width={controlWidth} height={controlHeight} rx={controlHeight * .22}
            fill={quantity > 0 ? 'rgba(35,24,18,.94)' : 'rgba(35,24,18,.78)'} stroke="rgba(255,255,255,.45)" strokeWidth={Math.max(1, page.width / 700)} />
          <g role="button" tabIndex={0} aria-label={imageTranslationUi.decrease} onClick={event => changeQuantity(event, -1)} onPointerDown={event => event.stopPropagation()}>
            <rect x={controlX} y={controlY} width={controlButtonWidth} height={controlHeight} fill="transparent" />
            <text x={controlX + controlButtonWidth / 2} y={controlY + controlHeight / 2 + controlHeight * .28} fill="#fff" fontSize={controlHeight * .68} textAnchor="middle">−</text>
          </g>
          <text x={controlX + controlButtonWidth + (controlWidth - controlButtonWidth * 2) / 2} y={controlY + controlHeight / 2 + controlHeight * .2}
            fill="#fff" fontSize={controlHeight * .42} fontWeight="700" textAnchor="middle">{quantity}</text>
          <g role="button" tabIndex={0} aria-label={imageTranslationUi.increase} onClick={event => changeQuantity(event, 1)} onPointerDown={event => event.stopPropagation()}>
            <rect x={controlX + controlWidth - controlButtonWidth} y={controlY} width={controlButtonWidth} height={controlHeight} fill="transparent" />
            <text x={controlX + controlWidth - controlButtonWidth / 2} y={controlY + controlHeight / 2 + controlHeight * .28} fill="#fff" fontSize={controlHeight * .68} textAnchor="middle">+</text>
          </g>
        </g>}
      </g>;
    })}
  </svg>;
});
TranslationOverlay.displayName = 'TranslationOverlay';

function SyncedViewer({ page, onRetry, selectedItems, onChangeQuantity, uiLanguage }: {
  page: ImageOverlayPage;
  onRetry: () => void;
  selectedItems: ImageTranslationSelection[];
  onChangeQuantity: (pageId: string, region: ImageTranslationRegion, delta: number) => void;
  uiLanguage: TargetLanguage;
}) {
  const imageTranslationUi = getImageTranslationUIText(uiLanguage);
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
      // Fill the viewport like KULIKULI. A cover-sized base image removes the
      // letterboxing while preserving the shared transform for both panes.
      const fit = Math.max(width / page.width, height / page.height);
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
    owner.current = e.currentTarget;
    // Let a single pointer on a label reach its click handler. Once a second
    // pointer appears, capture it at the viewport so pinch wins even when one
    // finger started on a translation label or its quantity control.
    const target = e.target as Element | null;
    const startedOnOverlay = Boolean(target?.closest?.('[data-overlay-region]'));
    if (!startedOnOverlay || pointers.current.size > 0) e.currentTarget.setPointerCapture(e.pointerId);
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
    <h2 className="text-xs font-bold px-3 py-1 shrink-0">{translated ? imageTranslationUi.translatedMenu : imageTranslationUi.originalMenu}</h2>
    <div ref={el => {panes.current[index] = el;}} data-compare-viewport={index}
      className="relative flex-1 min-h-0 overflow-hidden rounded-xl select-none"
      style={{touchAction:'none',background:'var(--bg-secondary)',cursor:'grab'}}
      onPointerDownCapture={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}
      tabIndex={0} aria-label={`${translated ? imageTranslationUi.translatedMenu : imageTranslationUi.originalMenu} · ${imageTranslationUi.panZoomHint}`}
      onKeyDown={e => {
        if (e.key === '0') reset();
        if (e.key === '+' || e.key === '=') apply(zoomAt(transformRef.current,transformRef.current.scale+.25,{x:0,y:0}));
        if (e.key === '-') apply(zoomAt(transformRef.current,transformRef.current.scale-.25,{x:0,y:0}));
        const delta: Record<string,[number,number]> = {ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
        if(delta[e.key]) {e.preventDefault();const [x,y]=delta[e.key];apply({...transformRef.current,translateX:transformRef.current.translateX+x,translateY:transformRef.current.translateY+y});}
      }}>
      <div data-transform-layer={index} style={layerStyle}>
        <img src={page.imageDataUrl} draggable={false} alt={translated ? imageTranslationUi.translatedMenu : imageTranslationUi.originalMenu} className="absolute inset-0 w-full h-full" />
        {!translated && page.regions.length > 0 && <SourceRegionOverlay page={page} />}
        {translated && page.regions.length > 0 && <TranslationOverlay
          page={page}
          displayScale={bounds.imageWidth / Math.max(1, page.width)}
          selectedItems={selectedItems}
          onChangeQuantity={onChangeQuantity}
          uiLanguage={uiLanguage}
        />}
      </div>
      {translated && page.status !== 'ready' && <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white pointer-events-none">
        <div className="text-center p-4 max-w-sm" aria-live="polite">
          {page.status === 'error' ? <AlertCircle className="mx-auto mb-2"/> : <Loader2 className="mx-auto mb-2 animate-spin"/>}
          <p className="text-sm">{page.status === 'error' ? page.error : page.status === 'queued' ? imageTranslationUi.queued : imageTranslationUi.recognizing}</p>
          {page.status === 'error' && <button onPointerDown={e=>e.stopPropagation()} onClick={onRetry} className="pointer-events-auto mt-3 px-4 py-2 rounded-lg bg-orange-500">{imageTranslationUi.retryImage}</button>}
        </div>
      </div>}
    </div>
  </section>;
  return <div className="min-h-0 flex-1 flex flex-col">
    <div className="min-h-0 flex-1 grid" style={{gridTemplateRows:'minmax(0,1fr) 8px minmax(0,1fr)'}}>
      {pane(false,0)}
      <div aria-hidden="true" className="flex items-center px-2" data-compare-divider><div className="w-full" style={{height:2,background:'var(--brand-primary)',opacity:.65}}/></div>
      {pane(true,1)}
    </div>
    {page.partial && <p className="text-xs px-3 py-1 text-amber-600">{imageTranslationUi.partialNotice}</p>}
  </div>;
}

export function ImageCompareTranslation({pages,activeIndex,onSelectPage,onRetry,onBack,uiLanguage,selectedItems,onChangeQuantity,onAdjustSelection,onRemoveSelection}: Props) {
  const page = pages[activeIndex] || pages[0];
  const [showReceipt, setShowReceipt] = useState(false);
  const imageTranslationUi = getImageTranslationUIText(uiLanguage);
  if (!page) return null;
  return <div className="relative h-full flex flex-col overflow-hidden" style={{background:'var(--bg-primary)',color:'var(--text-primary)'}}>
    <header className="flex items-center gap-3 px-3 py-2 shrink-0" style={{borderBottom:'1px solid var(--glass-border)'}}>
      <button onClick={onBack} aria-label={imageTranslationUi.back} className="p-2 rounded-xl"><ArrowLeft size={22}/></button>
      <div><h1 className="font-extrabold text-base">{imageTranslationUi.title}</h1><p className="text-xs opacity-60">{pages.filter(p=>p.status==='ready').length}/{pages.length} · {imageTranslationUi.completedImages}{page.status==='ready' ? ` · ${page.regions.length}` : ''}</p></div>
    </header>
    <main className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 p-2">
      <div className="order-1 md:order-2 min-h-0 min-w-0 flex-1 flex flex-col">
        <SyncedViewer
          key={page.id}
          page={page}
          onRetry={()=>onRetry(activeIndex)}
          selectedItems={selectedItems}
          onChangeQuantity={onChangeQuantity}
          uiLanguage={uiLanguage}
        />
      </div>
      <nav aria-label={imageTranslationUi.originalMenu} className="order-2 md:order-1 flex md:flex-col gap-2 shrink-0 overflow-auto p-1 md:w-20">
        {pages.map((p,i)=><button key={p.id} aria-label={`${imageTranslationUi.translationPreview} ${i+1}`} aria-pressed={i===activeIndex} onClick={()=>onSelectPage(i)}
          className="relative w-12 h-14 md:w-16 md:h-20 rounded-lg overflow-hidden shrink-0" style={{border:i===activeIndex?'2px solid var(--brand-primary)':'2px solid transparent'}}>
          <img src={p.imageDataUrl} className="w-full h-full object-cover" alt=""/>
          <span className="absolute top-0 right-0 rounded-bl bg-black/80 p-1 text-white">{p.status==='ready'?<Check size={12}/>:p.status==='error'?<AlertCircle size={12}/>:<Loader2 size={12} className={p.status==='processing'?'animate-spin':''}/>}</span>
          <span className="absolute bottom-0 left-0 bg-black/70 text-white text-[10px] px-1">{i+1}</span>
        </button>)}
      </nav>
    </main>

    <div className="shrink-0 border-t px-3 py-2" style={{borderColor:'var(--glass-border)',background:'var(--bg-primary)'}}>
      <button
        type="button"
        onClick={() => setShowReceipt(true)}
        className="mx-auto flex min-h-11 w-full max-w-md items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition active:scale-[.98]"
        style={{background:selectedItems.length ? 'var(--brand-primary)' : 'var(--bg-secondary)',color:selectedItems.length ? '#fff' : 'var(--text-primary)'}}
      >
        <ClipboardList size={18} />
        {selectedItems.length ? `${imageTranslationUi.orderList} · ${selectedItems.length}` : imageTranslationUi.orderListHint}
      </button>
    </div>

    {showReceipt && <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/45 p-2 sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={imageTranslationUi.orderListTitle}
        className="flex max-h-[90%] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{background:'var(--bg-primary)',color:'var(--text-primary)'}}
      >
        <header className="flex items-center justify-between border-b px-4 py-3" style={{borderColor:'var(--glass-border)'}}>
          <div>
            <h2 className="text-lg font-extrabold">{imageTranslationUi.orderListTitle}</h2>
            <p className="text-xs opacity-60">{selectedItems.length} · {imageTranslationUi.orderList}</p>
          </div>
          <button type="button" onClick={() => setShowReceipt(false)} className="rounded-full p-2" aria-label={imageTranslationUi.closeOrderList}><X size={20}/></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {selectedItems.length === 0 ? (
            <div className="py-12 text-center text-sm opacity-60">{imageTranslationUi.emptyOrderList}</div>
          ) : (
            <div className="space-y-2">
              {selectedItems.map(selection => {
                const original = selection.originalText.trim() || selection.translatedText.trim();
                const translated = selection.translatedText.trim();
                return <article key={selection.id} className="relative rounded-xl border px-3 py-3 pr-36" style={{borderColor:'var(--glass-border)',background:'var(--bg-secondary)'}}>
                  <p className="text-base font-bold leading-snug whitespace-pre-line">{original || '未命名品項'}</p>
                  {translated && translated !== original && <p className="mt-1 text-xs opacity-60 whitespace-pre-line">{translated}</p>}
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    <button type="button" onClick={() => onAdjustSelection(selection.id, -1)} className="flex h-9 w-8 items-center justify-center rounded-lg text-lg font-bold" style={{background:'var(--bg-primary)'}} aria-label={`${imageTranslationUi.decrease} ${original}`}>&minus;</button>
                    <span className="min-w-6 text-center text-sm font-bold" aria-label={`${imageTranslationUi.adjustQuantity} ${selection.quantity}`}>{selection.quantity}</span>
                    <button type="button" onClick={() => onAdjustSelection(selection.id, 1)} className="flex h-9 w-8 items-center justify-center rounded-lg text-lg font-bold" style={{background:'var(--brand-primary)',color:'#fff'}} aria-label={`${imageTranslationUi.increase} ${original}`}>+</button>
                    <button type="button" onClick={() => onRemoveSelection(selection.id)} className="rounded-lg p-2 opacity-65 hover:opacity-100" aria-label={`${imageTranslationUi.removeImage} ${original}`}><Trash2 size={17}/></button>
                  </div>
                </article>;
              })}
            </div>
          )}
        </div>
        <footer className="border-t px-4 py-3" style={{borderColor:'var(--glass-border)'}}>
          <button type="button" onClick={() => setShowReceipt(false)} className="w-full rounded-xl bg-black px-4 py-3 text-sm font-bold text-white">{imageTranslationUi.backToTranslation}</button>
        </footer>
      </section>
    </div>}
  </div>;
}
