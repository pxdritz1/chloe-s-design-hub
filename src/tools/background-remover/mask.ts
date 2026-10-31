import type { Rgb } from "../color-tools/color";

export const modelSize = 320;

const mean = [0.485, 0.456, 0.406] as const;
const std = [0.229, 0.224, 0.225] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function resizeArea(
  source: Uint8ClampedArray | Float32Array,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  channels: number
): Float32Array {
  const output = new Float32Array(width * height * channels);
  const scaleX = sourceWidth / width;
  const scaleY = sourceHeight / height;

  for (let y = 0; y < height; y += 1) {
    const y0 = y * scaleY;
    const y1 = (y + 1) * scaleY;
    for (let x = 0; x < width; x += 1) {
      const x0 = x * scaleX;
      const x1 = (x + 1) * scaleX;
      const sums = new Array<number>(channels).fill(0);
      let total = 0;

      for (let sy = Math.floor(y0); sy < Math.min(sourceHeight, Math.ceil(y1)); sy += 1) {
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.min(sourceWidth, Math.ceil(x1)); sx += 1) {
          const w = wy * (Math.min(sx + 1, x1) - Math.max(sx, x0));
          const offset = (sy * sourceWidth + sx) * channels;
          for (let c = 0; c < channels; c += 1) sums[c] = (sums[c] ?? 0) + (source[offset + c] ?? 0) * w;
          total += w;
        }
      }

      const base = (y * width + x) * channels;
      for (let c = 0; c < channels; c += 1) output[base + c] = total > 0 ? (sums[c] ?? 0) / total : 0;
    }
  }

  return output;
}

export function resizeBilinear(source: Float32Array, sourceWidth: number, sourceHeight: number, width: number, height: number): Float32Array {
  const output = new Float32Array(width * height);
  const scaleX = sourceWidth / width;
  const scaleY = sourceHeight / height;

  for (let y = 0; y < height; y += 1) {
    const fy = clamp((y + 0.5) * scaleY - 0.5, 0, sourceHeight - 1);
    const y0 = Math.floor(fy);
    const y1 = Math.min(sourceHeight - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < width; x += 1) {
      const fx = clamp((x + 0.5) * scaleX - 0.5, 0, sourceWidth - 1);
      const x0 = Math.floor(fx);
      const x1 = Math.min(sourceWidth - 1, x0 + 1);
      const tx = fx - x0;
      const top = (source[y0 * sourceWidth + x0] ?? 0) * (1 - tx) + (source[y0 * sourceWidth + x1] ?? 0) * tx;
      const bottom = (source[y1 * sourceWidth + x0] ?? 0) * (1 - tx) + (source[y1 * sourceWidth + x1] ?? 0) * tx;
      output[y * width + x] = top * (1 - ty) + bottom * ty;
    }
  }

  return output;
}

export function toModelInput(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const resized = resizeArea(rgba, width, height, modelSize, modelSize, 4);
  const pixels = modelSize * modelSize;
  const planar = new Float32Array(pixels * 3);
  let max = 1;

  for (let index = 0; index < pixels; index += 1) {
    const alpha = (resized[index * 4 + 3] ?? 255) / 255;
    for (let c = 0; c < 3; c += 1) {
      const value = (resized[index * 4 + c] ?? 0) * alpha + 255 * (1 - alpha);
      planar[c * pixels + index] = value;
      if (value > max) max = value;
    }
  }

  for (let c = 0; c < 3; c += 1) {
    for (let index = 0; index < pixels; index += 1) {
      planar[c * pixels + index] = ((planar[c * pixels + index] ?? 0) / max - (mean[c] ?? 0)) / (std[c] ?? 1);
    }
  }

  return planar;
}

export function normalizeMask(raw: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (const value of raw) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const range = max - min;
  return raw.map((value) => (range > 1e-6 ? (value - min) / range : 0));
}

export interface MaskSettings {
  threshold: number;
  softness: number;
  background: Rgb | null;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge1 - edge0 < 1e-3) return value >= edge0 ? 1 : 0;
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function applyMask(source: Uint8ClampedArray, mask: Float32Array, settings: MaskSettings): Uint8ClampedArray<ArrayBuffer> {
  const output = new Uint8ClampedArray(source);
  const edge0 = clamp(settings.threshold - settings.softness / 2, 0, 1);
  const edge1 = clamp(settings.threshold + settings.softness / 2, 0, 1);
  const { background } = settings;

  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    const alpha = smoothstep(edge0, edge1, mask[index] ?? 0) * ((source[offset + 3] ?? 255) / 255);

    if (background) {
      output[offset] = (source[offset] ?? 0) * alpha + background.r * (1 - alpha);
      output[offset + 1] = (source[offset + 1] ?? 0) * alpha + background.g * (1 - alpha);
      output[offset + 2] = (source[offset + 2] ?? 0) * alpha + background.b * (1 - alpha);
      output[offset + 3] = 255;
    } else {
      output[offset + 3] = Math.round(alpha * 255);
    }
  }

  return output;
}
