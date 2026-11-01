import { harmony, oklchToRgb, rgbToHex, rgbToOklch, toneScale, type HarmonyKind, type Rgb } from "../color-tools/color";

export const styles = ["mesh", "orbs", "waves", "blobs", "aurora", "rings", "ribbons", "geometry"] as const;
export const patterns = ["none", "dots", "grid", "contours", "diagonal"] as const;
export type Pattern = (typeof patterns)[number];
export type PaletteKind = "harmony" | "material";
export type Style = (typeof styles)[number];

export const sizes = [
  { id: "desktop", width: 1920, height: 1080 },
  { id: "qhd", width: 2560, height: 1440 },
  { id: "uhd", width: 3840, height: 2160 },
  { id: "phone", width: 1170, height: 2532 },
  { id: "square", width: 2048, height: 2048 }
] as const;
export type SizeId = (typeof sizes)[number]["id"];

export type Mode = "light" | "dark";

export interface SceneParams {
  seed: number;
  style: Style;
  base: Rgb;
  harmony: HarmonyKind;
  paletteKind?: PaletteKind;
  pattern?: Pattern;
  mode: Mode;
  count: number;
}

export type Shape =
  | { kind: "glow"; x: number; y: number; r: number; color: string; alpha: number }
  | { kind: "orb"; x: number; y: number; r: number; color: string; alpha: number; ring: boolean }
  | { kind: "wave"; baseline: number; amplitude: number; cycles: number; phase: number; color: string; alpha: number }
  | { kind: "blob"; x: number; y: number; r: number; rotation: number; radii: number[]; color: string; alpha: number };

export interface Scene {
  from: string;
  to: string;
  angle: number;
  palette: string[];
  pattern: Pattern;
  shapes: Shape[];
}

export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildPalette(base: Rgb, harmonyKind: HarmonyKind, paletteKind: PaletteKind = "harmony"): string[] {
  if (paletteKind === "material") return toneScale(base).map(rgbToHex);
  const tones = toneScale(base);
  return [...harmony(base, harmonyKind), tones[2] ?? base, tones[5] ?? base].map(rgbToHex);
}

export function buildScene(params: SceneParams): Scene {
  const random = mulberry32(params.seed);
  const range = (min: number, max: number) => min + random() * (max - min);
  const palette = buildPalette(params.base, params.harmony, params.paletteKind ?? "harmony");
  const color = () => palette[Math.floor(random() * palette.length)] ?? "#888888";

  const { c, h } = rgbToOklch(params.base);
  const [from, to] =
    params.mode === "dark"
      ? [oklchToRgb({ l: 0.2, c: c * 0.5, h }), oklchToRgb({ l: 0.3, c: c * 0.6, h: h + 20 })]
      : [oklchToRgb({ l: 0.97, c: c * 0.25, h }), oklchToRgb({ l: 0.9, c: c * 0.4, h: h - 20 })];

  const shapes: Shape[] = [];
  const count = Math.max(1, Math.round(params.count));

  for (let index = 0; index < count; index += 1) {
    if (params.style === "mesh" || params.style === "aurora") {
      const aurora = params.style === "aurora";
      shapes.push({ kind: "glow", x: random(), y: aurora ? range(0.15, 0.85) : random(), r: range(aurora ? 0.42 : 0.3, aurora ? 0.9 : 0.75), color: color(), alpha: range(aurora ? 0.28 : 0.55, aurora ? 0.58 : 0.95) });
    } else if (params.style === "orbs" || params.style === "rings") {
      const rings = params.style === "rings";
      shapes.push({ kind: "orb", x: random(), y: random(), r: range(0.04, rings ? 0.3 : 0.26), color: color(), alpha: range(0.45, 0.9), ring: rings || random() < 0.3 });
    } else if (params.style === "waves" || params.style === "ribbons") {
      shapes.push({
        kind: "wave",
        baseline: ((index + 0.6) / (count + 0.3)) * 0.9 + range(-0.04, 0.04),
        amplitude: params.style === "ribbons" ? range(0.07, 0.16) : range(0.025, 0.11),
        cycles: params.style === "ribbons" ? range(0.35, 1.1) : range(0.6, 2.4),
        phase: range(0, Math.PI * 2),
        color: palette[index % palette.length] ?? "#888888",
        alpha: range(0.7, 0.95)
      });
    } else {
      const points = params.style === "geometry" ? 3 + Math.floor(random() * 5) : 7 + Math.floor(random() * 4);
      shapes.push({
        kind: "blob",
        x: random(),
        y: random(),
        r: range(0.1, 0.34),
        rotation: range(0, Math.PI * 2),
        radii: Array.from({ length: points }, () => range(0.65, 1.15)),
        color: color(),
        alpha: range(0.6, 0.92)
      });
    }
  }

  if (params.style === "orbs" || params.style === "rings") shapes.sort((a, b) => (b.kind === "orb" && a.kind === "orb" ? b.r - a.r : 0));

  return { from: rgbToHex(from), to: rgbToHex(to), angle: range(20, 160), palette, pattern: params.pattern ?? "none", shapes };
}
