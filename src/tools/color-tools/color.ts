export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

type Triple = [number, number, number];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mod360 = (value: number) => ((value % 360) + 360) % 360;
const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

const toLinear = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
const fromLinear = (value: number) => (value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055);
const toByte = (linear: number) => Math.round(fromLinear(clamp(linear, 0, 1)) * 255);

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  let sector = 0;
  if (delta !== 0) {
    if (max === rn) sector = ((gn - bn) / delta) % 6;
    else if (max === gn) sector = (bn - rn) / delta + 2;
    else sector = (rn - gn) / delta + 4;
  }

  return { h: mod360(sector * 60), s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const [sn, ln] = [clamp(s, 0, 100) / 100, clamp(l, 0, 100) / 100];
  const chroma = (1 - Math.abs(2 * ln - 1)) * sn;
  const hue = mod360(h) / 60;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  const offset = ln - chroma / 2;
  const sectors: Triple[] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x]
  ];
  const [r, g, b] = sectors[Math.floor(hue) % 6] ?? [0, 0, 0];
  return { r: Math.round((r + offset) * 255), g: Math.round((g + offset) * 255), b: Math.round((b + offset) * 255) };
}

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const [lr, lg, lb] = [toLinear(r / 255), toLinear(g / 255), toLinear(b / 255)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bb);
  return { l: lightness, c: chroma, h: chroma < 1e-4 ? 0 : mod360((Math.atan2(bb, a) * 180) / Math.PI) };
}

function oklchToLinear({ l, c, h }: Oklch): Triple {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const lp = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mp = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sp = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp,
    -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp,
    -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp
  ];
}

const inGamut = (linear: Triple) => linear.every((value) => value >= -0.0001 && value <= 1.0001);

export function oklchToRgb(color: Oklch): Rgb {
  const base = { ...color, l: clamp(color.l, 0, 1), c: Math.max(0, color.c) };
  let linear = oklchToLinear(base);

  if (!inGamut(linear)) {
    let low = 0;
    let high = base.c;
    for (let step = 0; step < 24; step += 1) {
      const middle = (low + high) / 2;
      if (inGamut(oklchToLinear({ ...base, c: middle }))) low = middle;
      else high = middle;
    }
    linear = oklchToLinear({ ...base, c: low });
  }

  const [r, g, b] = linear;
  return { r: toByte(r), g: toByte(g), b: toByte(b) };
}

const number = "(-?\\d+(?:\\.\\d+)?)";
const hexPattern = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const rgbPattern = new RegExp(`^rgba?\\(\\s*${number}\\s*[,\\s]\\s*${number}\\s*[,\\s]\\s*${number}\\s*\\)$`, "i");
const hslPattern = new RegExp(`^hsla?\\(\\s*${number}(?:deg)?\\s*[,\\s]\\s*${number}%\\s*[,\\s]\\s*${number}%\\s*\\)$`, "i");
const oklchPattern = new RegExp(`^oklch\\(\\s*${number}(%?)\\s+${number}\\s+${number}(?:deg)?\\s*\\)$`, "i");

export function parseColor(input: string): Rgb | null {
  const text = input.trim();

  const hex = hexPattern.exec(text)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((char) => char + char).join("") : hex;
    return { r: parseInt(full.slice(0, 2), 16), g: parseInt(full.slice(2, 4), 16), b: parseInt(full.slice(4, 6), 16) };
  }

  const rgb = rgbPattern.exec(text);
  if (rgb) {
    const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    return [r, g, b].every((value) => value >= 0 && value <= 255) ? { r: Math.round(r), g: Math.round(g), b: Math.round(b) } : null;
  }

  const hsl = hslPattern.exec(text);
  if (hsl) {
    const [h, s, l] = [Number(hsl[1]), Number(hsl[2]), Number(hsl[3])];
    return s <= 100 && l <= 100 && s >= 0 && l >= 0 ? hslToRgb({ h, s, l }) : null;
  }

  const oklch = oklchPattern.exec(text);
  if (oklch) {
    const lightness = Number(oklch[1]) / (oklch[2] === "%" ? 100 : 1);
    const [c, h] = [Number(oklch[3]), Number(oklch[4])];
    return lightness >= 0 && lightness <= 1 && c >= 0 ? oklchToRgb({ l: lightness, c, h }) : null;
  }

  return null;
}

export function formatRgb({ r, g, b }: Rgb) {
  return `rgb(${r} ${g} ${b})`;
}

export function formatHsl(rgb: Rgb) {
  const { h, s, l } = rgbToHsl(rgb);
  return `hsl(${round(h, 0)} ${round(s, 0)}% ${round(l, 0)}%)`;
}

export function formatOklch(rgb: Rgb) {
  const { l, c, h } = rgbToOklch(rgb);
  return `oklch(${round(l * 100, 1)}% ${round(c, 3)} ${round(h, 1)})`;
}

export const harmonies = {
  analogous: [-30, 0, 30],
  complementary: [0, 180],
  triadic: [0, 120, 240],
  split: [0, 150, 210],
  tetradic: [0, 90, 180, 270]
} as const;

export type HarmonyKind = keyof typeof harmonies;

export function harmony(base: Rgb, kind: HarmonyKind): Rgb[] {
  const { l, c, h } = rgbToOklch(base);
  return harmonies[kind].map((offset) => (offset === 0 ? base : oklchToRgb({ l, c, h: mod360(h + offset) })));
}

export function toneScale(base: Rgb, steps = 9): Rgb[] {
  const { c, h } = rgbToOklch(base);
  return Array.from({ length: steps }, (_, index) => oklchToRgb({ l: 0.96 - (0.68 * index) / (steps - 1), c, h }));
}

export function isLight(rgb: Rgb) {
  return rgbToOklch(rgb).l > 0.65;
}
