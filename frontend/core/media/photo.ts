// Photo upload preparation (2.3).
//
// Captured photos used to upload as full-resolution PNG data URLs (MBs
// each, then re-served at 36px in list avatars). This module downsizes to
// a bounded dimension and re-encodes as JPEG before upload — typically a
// 10-20x payload reduction with no visible difference on ID cards.

export const PHOTO_MAX_DIMENSION = 720;
export const PHOTO_JPEG_QUALITY = 0.85;

/** Pure: scaled dimensions preserving aspect ratio, never upscaling. */
export function targetDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxDimension: number = PHOTO_MAX_DIMENSION,
): { width: number; height: number } {
  const w = Math.max(1, Math.floor(naturalWidth));
  const h = Math.max(1, Math.floor(naturalHeight));
  const scale = Math.min(1, maxDimension / Math.max(w, h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/** Pure: mime from a data URL, or null when it is not a data URL. */
export function mimeFromDataUrl(dataUrl: string): string | null {
  const match = /^data:([^;,]+)?(;base64)?,/.exec(dataUrl);
  return match?.[1] ?? null;
}

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Invalid image file.'));
    img.src = source;
  });

/**
 * Downscale + JPEG-encode a data-URL photo for upload. Resolves with the
 * original input when no work is needed (already a small-enough JPEG).
 * Rejects when canvas is unavailable — callers must fall back to uploading
 * the original so saves never break.
 */
export async function preparePhotoForUpload(
  dataUrl: string,
  maxDimension: number = PHOTO_MAX_DIMENSION,
): Promise<string> {
  const img = await loadImage(dataUrl);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const target = targetDimensions(width, height, maxDimension);
  const alreadyJpeg = mimeFromDataUrl(dataUrl) === 'image/jpeg';
  const needsResize = target.width !== Math.floor(width) || target.height !== Math.floor(height);

  if (alreadyJpeg && !needsResize) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable.');
  context.drawImage(img, 0, 0, target.width, target.height);
  return canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY);
}
