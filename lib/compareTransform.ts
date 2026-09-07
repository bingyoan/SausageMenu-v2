export interface CompareTransform { scale: number; translateX: number; translateY: number }
export interface CompareBounds { width: number; height: number; imageWidth: number; imageHeight: number }
export const INITIAL_TRANSFORM: CompareTransform = { scale: 1, translateX: 0, translateY: 0 };
export function constrainTransform(t: CompareTransform, b: CompareBounds): CompareTransform {
  const scale = Math.min(5, Math.max(1, t.scale));
  const maxX = Math.max(0, (b.imageWidth * scale - b.width) / 2);
  const maxY = Math.max(0, (b.imageHeight * scale - b.height) / 2);
  return { scale, translateX: Math.max(-maxX, Math.min(maxX, t.translateX)),
    translateY: Math.max(-maxY, Math.min(maxY, t.translateY)) };
}
export function zoomAt(t: CompareTransform, scale: number, from: {x:number;y:number}, to = from): CompareTransform {
  scale = Math.max(1, Math.min(5, scale));
  const ratio = scale / t.scale;
  return { scale, translateX: to.x - (from.x - t.translateX) * ratio,
    translateY: to.y - (from.y - t.translateY) * ratio };
}
