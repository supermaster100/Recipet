import * as ImageManipulator from "expo-image-manipulator";
import * as jpeg from "jpeg-js";

import { normalizeUri } from "./photoUtils";

export interface ReceiptBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

const FALLBACK: ReceiptBounds = { x: 0.06, y: 0.04, width: 0.88, height: 0.92, confidence: 0 };

/**
 * Automatically detects the receipt boundary within an image using
 * brightness-based edge detection on a downsampled thumbnail.
 *
 * Algorithm:
 * 1. Resize image to ~160px wide for fast pixel processing.
 * 2. Decode JPEG pixel data in JS using jpeg-js (pure JS, no native code).
 * 3. Estimate background brightness from the outer border pixels.
 * 4. Scan from each edge inward to find where content begins.
 * 5. Return detected bounds as ratios [0..1] of original image dimensions.
 *    (Ratios are aspect-ratio-invariant and valid for the full-size image.)
 */
export async function detectReceiptBounds(uri: string): Promise<ReceiptBounds> {
  try {
    // Resize to a small thumbnail (≈160px wide) for fast processing
    const resized = await ImageManipulator.manipulateAsync(
      normalizeUri(uri),
      [{ resize: { width: 160 } }],
      { format: ImageManipulator.SaveFormat.JPEG, compress: 0.85, base64: true }
    );

    const base64Data = resized.base64;
    if (!base64Data) return FALLBACK;

    // Decode base64 → Uint8Array using atob (available in Hermes/React Native)
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Decode JPEG to raw RGBA pixel data using jpeg-js (pure JavaScript)
    const decoded = jpeg.decode(bytes, { useTArray: true });
    const { data, width, height } = decoded;
    if (width < 4 || height < 4) return FALLBACK;

    function getBrightness(px: number, py: number): number {
      const idx = (py * width + px) * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Estimate background brightness from outer border pixels (≈3% of size)
    const BORDER = Math.max(2, Math.floor(Math.min(width, height) * 0.03));
    let bgSum = 0;
    let bgCount = 0;
    for (let x = 0; x < width; x++) {
      for (let d = 0; d < BORDER; d++) {
        bgSum += getBrightness(x, d);
        bgSum += getBrightness(x, height - 1 - d);
        bgCount += 2;
      }
    }
    for (let y = BORDER; y < height - BORDER; y++) {
      for (let d = 0; d < BORDER; d++) {
        bgSum += getBrightness(d, y);
        bgSum += getBrightness(width - 1 - d, y);
        bgCount += 2;
      }
    }
    const bgBrightness = bgCount > 0 ? bgSum / bgCount : 240;
    const THRESHOLD = 25; // brightness delta to count as "content"

    function isContentRow(y: number): boolean {
      for (let x = 0; x < width; x++) {
        if (Math.abs(getBrightness(x, y) - bgBrightness) > THRESHOLD) return true;
      }
      return false;
    }

    function isContentCol(x: number, yStart: number, yEnd: number): boolean {
      for (let y = yStart; y <= yEnd; y++) {
        if (Math.abs(getBrightness(x, y) - bgBrightness) > THRESHOLD) return true;
      }
      return false;
    }

    // Find top content edge
    let topEdge = 0;
    for (let y = 0; y < height; y++) {
      if (isContentRow(y)) { topEdge = y; break; }
    }

    // Find bottom content edge
    let bottomEdge = height - 1;
    for (let y = height - 1; y >= 0; y--) {
      if (isContentRow(y)) { bottomEdge = y; break; }
    }

    // Find left content edge
    let leftEdge = 0;
    for (let x = 0; x < width; x++) {
      if (isContentCol(x, topEdge, bottomEdge)) { leftEdge = x; break; }
    }

    // Find right content edge
    let rightEdge = width - 1;
    for (let x = width - 1; x >= 0; x--) {
      if (isContentCol(x, topEdge, bottomEdge)) { rightEdge = x; break; }
    }

    // Add 1% padding so border of receipt isn't clipped
    const padX = Math.max(1, Math.round(width * 0.01));
    const padY = Math.max(1, Math.round(height * 0.01));
    topEdge = Math.max(0, topEdge - padY);
    bottomEdge = Math.min(height - 1, bottomEdge + padY);
    leftEdge = Math.max(0, leftEdge - padX);
    rightEdge = Math.min(width - 1, rightEdge + padX);

    const detW = rightEdge - leftEdge;
    const detH = bottomEdge - topEdge;
    if (detW < 4 || detH < 4) return FALLBACK;

    // Confidence based on how much was cropped (more crop = more confident detection)
    const cropRatioX = 1 - detW / width;
    const cropRatioY = 1 - detH / height;
    const confidence = Math.min(1, (cropRatioX + cropRatioY) * 3);

    // Return as ratios [0..1] of image dimensions.
    // Since the thumbnail maintains aspect ratio of the original, these ratios
    // apply directly to the full-resolution image.
    return {
      x: leftEdge / width,
      y: topEdge / height,
      width: detW / width,
      height: detH / height,
      confidence,
    };
  } catch {
    return FALLBACK;
  }
}
