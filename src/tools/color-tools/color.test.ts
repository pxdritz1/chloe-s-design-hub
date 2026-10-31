import { describe, expect, it } from "vitest";
import {
  formatHsl,
  formatOklch,
  formatRgb,
  harmonies,
  harmony,
  oklchToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToOklch,
  toneScale,
  type HarmonyKind
} from "./color";

describe("parseColor", () => {
  it("reads hex with and without hash, short and long", () => {
    expect(parseColor("#7b8f76")).toEqual({ r: 123, g: 143, b: 118 });
    expect(parseColor("7B8F76")).toEqual({ r: 123, g: 143, b: 118 });
    expect(parseColor("#fa0")).toEqual({ r: 255, g: 170, b: 0 });
  });

  it("reads rgb, hsl and oklch", () => {
    expect(parseColor("rgb(12, 34, 56)")).toEqual({ r: 12, g: 34, b: 56 });
    expect(parseColor("rgb(12 34 56)")).toEqual({ r: 12, g: 34, b: 56 });
    expect(parseColor("hsl(0 100% 50%)")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor("hsl(120, 100%, 25%)")).toEqual({ r: 0, g: 128, b: 0 });
    expect(parseColor("oklch(70% 0.1 150)")).toEqual(oklchToRgb({ l: 0.7, c: 0.1, h: 150 }));
    expect(parseColor("oklch(0.7 0.1 150)")).toEqual(parseColor("oklch(70% 0.1 150)"));
  });

  it("rejects invalid input", () => {
    for (const input of ["", "banana", "#12", "#gggggg", "rgb(300, 0, 0)", "hsl(10 120% 50%)", "oklch(2 0.1 10)"]) {
      expect(parseColor(input)).toBeNull();
    }
  });
});

describe("conversions", () => {
  it("converts red to hsl and oklch", () => {
    const red = { r: 255, g: 0, b: 0 };
    expect(rgbToHsl(red)).toEqual({ h: 0, s: 100, l: 50 });
    const oklch = rgbToOklch(red);
    expect(oklch.l).toBeCloseTo(0.628, 3);
    expect(oklch.c).toBeCloseTo(0.2577, 3);
    expect(oklch.h).toBeCloseTo(29.23, 1);
  });

  it("keeps white and black neutral", () => {
    expect(rgbToOklch({ r: 255, g: 255, b: 255 }).l).toBeCloseTo(1, 3);
    expect(rgbToOklch({ r: 255, g: 255, b: 255 }).c).toBeLessThan(0.001);
    expect(rgbToOklch({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 3);
  });

  it("round-trips through oklch", () => {
    for (const hex of ["#7b8f76", "#d49a82", "#131713", "#b3a8cf", "#ffffff", "#000000", "#00ff7f"]) {
      const rgb = parseColor(hex);
      expect(rgb).not.toBeNull();
      if (!rgb) continue;
      const back = oklchToRgb(rgbToOklch(rgb));
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
    }
  });

  it("formats values for display", () => {
    const rgb = { r: 123, g: 143, b: 118 };
    expect(rgbToHex(rgb)).toBe("#7b8f76");
    expect(formatRgb(rgb)).toBe("rgb(123 143 118)");
    expect(formatHsl(rgb)).toMatch(/^hsl\(\d+ \d+% \d+%\)$/);
    expect(formatOklch(rgb)).toMatch(/^oklch\([\d.]+% [\d.]+ [\d.]+\)$/);
  });

  it("pulls out-of-gamut colors back into range", () => {
    const rgb = oklchToRgb({ l: 0.9, c: 0.4, h: 200 });
    for (const value of [rgb.r, rgb.g, rgb.b]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    }
  });
});

describe("palettes", () => {
  const base = { r: 123, g: 143, b: 118 };

  it.each(Object.keys(harmonies) as HarmonyKind[])("builds the %s harmony around the base", (kind) => {
    const colors = harmony(base, kind);
    expect(colors).toHaveLength(harmonies[kind].length);
    expect(colors).toContainEqual(base);
  });

  it("puts complementary colors on opposite hues", () => {
    const [first, second] = harmony({ r: 200, g: 120, b: 90 }, "complementary");
    if (!first || !second) throw new Error("expected two colors");
    const distance = Math.abs(rgbToOklch(first).h - rgbToOklch(second).h);
    expect(Math.min(distance, 360 - distance)).toBeGreaterThan(170);
  });

  it("builds a tone scale from light to dark", () => {
    const scale = toneScale(base);
    expect(scale).toHaveLength(9);
    const lightness = scale.map((color) => rgbToOklch(color).l);
    expect([...lightness].sort((a, b) => b - a)).toEqual(lightness);
  });
});
