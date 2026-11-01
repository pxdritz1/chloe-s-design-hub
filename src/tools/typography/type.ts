export const ratios = [
  { id: "minorSecond", value: 1.067 },
  { id: "majorSecond", value: 1.125 },
  { id: "minorThird", value: 1.2 },
  { id: "majorThird", value: 1.25 },
  { id: "perfectFourth", value: 1.333 },
  { id: "augmentedFourth", value: 1.414 },
  { id: "perfectFifth", value: 1.5 },
  { id: "golden", value: 1.618 }
] as const;

export type RatioId = (typeof ratios)[number]["id"];

export interface ScaleStep {
  step: number;
  px: number;
  rem: number;
  lineHeight: number;
}

export function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function lineHeightFor(px: number) {
  if (px >= 40) return 1.1;
  if (px >= 28) return 1.2;
  if (px >= 20) return 1.35;
  return 1.5;
}

export function buildScale(base: number, ratio: number, down: number, up: number): ScaleStep[] {
  return Array.from({ length: down + up + 1 }, (_, index) => {
    const step = index - down;
    const px = base * ratio ** step;
    return { step, px: round(px, 2), rem: round(px / 16, 3), lineHeight: lineHeightFor(px) };
  });
}

export function cssVariables(steps: ScaleStep[]) {
  const lines = steps.map((item) => `  --step-${item.step < 0 ? `m${Math.abs(item.step)}` : item.step}: ${item.rem}rem;`);
  return `:root {\n${lines.join("\n")}\n}`;
}

const generic = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded"]);

export function isGenericFamily(name: string) {
  return generic.has(name.trim().toLowerCase());
}

export function cssFamily(name: string, fallback = "sans-serif") {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const family = isGenericFamily(trimmed) ? trimmed : `"${trimmed.replace(/["\\]/g, "")}"`;
  return `${family}, ${fallback}`;
}

export function familyFromFile(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N} _-]/gu, " ").replace(/\s+/g, " ").trim();
  return base || "custom font";
}
