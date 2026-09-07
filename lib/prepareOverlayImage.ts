// Keep the same prepared image for display AND OCR, so coordinates do not drift.
// Avoid enlarging low-resolution uploads: interpolation cannot recover missing text.
export async function prepareOverlayImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve(); img.onerror = () => reject(new Error('圖片無法讀取')); img.src = url;
    });
    const ratio = Math.min(1, 1920 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('圖片處理不可用');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // High-quality JPEG preserves small strokes. Geometry stays untouched.
    return canvas.toDataURL('image/jpeg', .9).split(',')[1];
  } finally { URL.revokeObjectURL(url); }
}
