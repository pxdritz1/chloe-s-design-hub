import { oklchToRgb, rgbToOklch, type Oklch, type Rgb } from "../color-tools/color";

export const channelOrders = ["rgb", "rbg", "grb", "gbr", "brg", "bgr"] as const;
export type ChannelOrder = (typeof channelOrders)[number];

export interface SwapRule {
  id: number;
  from: Rgb;
  to: Rgb;
  tolerance: number;
  keepShading: boolean;
}

export interface MatrixSettings {
  order: ChannelOrder;
  invert: [boolean, boolean, boolean];
  saturation: number;
}

export interface ProcessOptions {
  swaps: SwapRule[];
  matrix: MatrixSettings;
}

export const identityMatrix: MatrixSettings = { order: "rgb", invert: [false, false, false], saturation: 1 };

const maxDistance = 220;
const softStart = 0.6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function colorDistance(a: Rgb, b: Rgb) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

export function isIdentity({ swaps, matrix }: ProcessOptions) {
  return swaps.length === 0 && matrix.order === "rgb" && matrix.saturation === 1 && !matrix.invert.some(Boolean);
}

interface PreparedRule {
  from: Rgb;
  to: Rgb;
  fromOklch: Oklch;
  toOklch: Oklch;
  limit: number;
  keepShading: boolean;
}

function prepare(rule: SwapRule): PreparedRule {
  return {
    from: rule.from,
    to: rule.to,
    fromOklch: rgbToOklch(rule.from),
    toOklch: rgbToOklch(rule.to),
    limit: (clamp(rule.tolerance, 0, 100) / 100) * maxDistance,
    keepShading: rule.keepShading
  };
}

function weight(distance: number, limit: number) {
  if (limit === 0) return distance === 0 ? 1 : 0;
  const ratio = distance / limit;
  if (ratio > 1) return 0;
  return ratio <= softStart ? 1 : 1 - (ratio - softStart) / (1 - softStart);
}

function replacement(pixel: Rgb, rule: PreparedRule): Rgb {
  if (!rule.keepShading) return rule.to;
  const current = rgbToOklch(pixel);
  const ratio = rule.fromOklch.c > 0.01 ? clamp(current.c / rule.fromOklch.c, 0, 2) : 1;
  return oklchToRgb({
    l: clamp(rule.toOklch.l + (current.l - rule.fromOklch.l), 0, 1),
    c: rule.toOklch.c * ratio,
    h: rule.toOklch.h
  });
}

export function processPixels(source: Uint8ClampedArray, options: ProcessOptions): Uint8ClampedArray<ArrayBuffer> {
  const output = new Uint8ClampedArray(source);
  if (isIdentity(options)) return output;

  const rules = options.swaps.map(prepare);
  const { order, invert, saturation } = options.matrix;
  const [i0, i1, i2] = [...order].map((channel) => "rgb".indexOf(channel)) as [number, number, number];
  const matrixActive = options.matrix.order !== "rgb" || invert.some(Boolean) || saturation !== 1;

  for (let offset = 0; offset < output.length; offset += 4) {
    if ((output[offset + 3] ?? 0) === 0) continue;

    let pixel: Rgb = { r: output[offset] ?? 0, g: output[offset + 1] ?? 0, b: output[offset + 2] ?? 0 };

    for (const rule of rules) {
      const amount = weight(colorDistance(pixel, rule.from), rule.limit);
      if (amount === 0) continue;
      const next = replacement(pixel, rule);
      pixel = {
        r: pixel.r + (next.r - pixel.r) * amount,
        g: pixel.g + (next.g - pixel.g) * amount,
        b: pixel.b + (next.b - pixel.b) * amount
      };
      break;
    }

    if (matrixActive) {
      const pick = (index: number) => (index === 0 ? pixel.r : index === 1 ? pixel.g : pixel.b);
      let r = pick(i0);
      let g = pick(i1);
      let b = pick(i2);
      if (invert[0]) r = 255 - r;
      if (invert[1]) g = 255 - g;
      if (invert[2]) b = 255 - b;
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      pixel = { r: gray + (r - gray) * saturation, g: gray + (g - gray) * saturation, b: gray + (b - gray) * saturation };
    }

    output[offset] = pixel.r;
    output[offset + 1] = pixel.g;
    output[offset + 2] = pixel.b;
  }

  return output;
}

export function samplePixel(data: Uint8ClampedArray, width: number, x: number, y: number): Rgb {
  const offset = (y * width + x) * 4;
  return { r: data[offset] ?? 0, g: data[offset + 1] ?? 0, b: data[offset + 2] ?? 0 };
}
