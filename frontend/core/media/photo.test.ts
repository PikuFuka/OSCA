import { describe, it, expect } from 'vitest';
import { targetDimensions, mimeFromDataUrl, PHOTO_MAX_DIMENSION } from './photo';

describe('targetDimensions', () => {
  it('leaves small photos untouched (never upscales)', () => {
    expect(targetDimensions(400, 300)).toEqual({ width: 400, height: 300 });
  });

  it('bounds the long edge and preserves aspect ratio', () => {
    expect(targetDimensions(2160, 1080)).toEqual({ width: PHOTO_MAX_DIMENSION, height: 360 });
    expect(targetDimensions(800, 1600)).toEqual({ width: 360, height: PHOTO_MAX_DIMENSION });
  });

  it('clamps degenerate inputs to 1px', () => {
    expect(targetDimensions(0, -5)).toEqual({ width: 1, height: 1 });
  });
});

describe('mimeFromDataUrl', () => {
  it('extracts the mime type', () => {
    expect(mimeFromDataUrl('data:image/png;base64,AAA')).toBe('image/png');
    expect(mimeFromDataUrl('data:image/jpeg;base64,AAA')).toBe('image/jpeg');
  });

  it('returns null for non-data URLs', () => {
    expect(mimeFromDataUrl('https://x/y.jpg')).toBeNull();
    expect(mimeFromDataUrl('')).toBeNull();
  });
});
