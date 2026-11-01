import { describe, expect, it } from "vitest";
import { buildScale, cssFamily, cssVariables, familyFromFile, isGenericFamily, lineHeightFor, round } from "./type";

describe("type scale", () => {
  it("grows and shrinks by the ratio around the base", () => {
    const scale = buildScale(16, 1.25, 2, 3);
    expect(scale.map((item) => item.step)).toEqual([-2, -1, 0, 1, 2, 3]);
    expect(scale.find((item) => item.step === 0)?.px).toBe(16);
    expect(scale.find((item) => item.step === 2)?.px).toBe(25);
    expect(scale.find((item) => item.step === -1)?.px).toBe(12.8);
  });

  it("converts to rem against 16px", () => {
    expect(buildScale(20, 1.5, 0, 1).map((item) => item.rem)).toEqual([1.25, 1.875]);
  });

  it("tightens line height as text grows", () => {
    expect(lineHeightFor(16)).toBeGreaterThan(lineHeightFor(32));
    expect(lineHeightFor(32)).toBeGreaterThan(lineHeightFor(48));
  });

  it("writes css variables with readable names", () => {
    const css = cssVariables(buildScale(16, 1.25, 1, 1));
    expect(css).toContain("--step-m1: 0.8rem;");
    expect(css).toContain("--step-0: 1rem;");
    expect(css).toContain("--step-1: 1.25rem;");
    expect(css.startsWith(":root {")).toBe(true);
  });

  it("rounds to the requested digits", () => {
    expect(round(1.23456, 2)).toBe(1.23);
  });
});

describe("font families", () => {
  it("quotes names but not generic keywords", () => {
    expect(cssFamily("SF Pro Display")).toBe('"SF Pro Display", sans-serif');
    expect(cssFamily("serif", "serif")).toBe("serif, serif");
    expect(cssFamily("")).toBe("sans-serif");
    expect(cssFamily('Bad"Name')).toBe('"BadName", sans-serif');
  });

  it("recognizes generic families", () => {
    expect(isGenericFamily(" System-UI ")).toBe(true);
    expect(isGenericFamily("Georgia")).toBe(false);
  });

  it("derives a family name from a file name", () => {
    expect(familyFromFile("My_Font-Bold.woff2")).toBe("My_Font-Bold");
    expect(familyFromFile("fancy (v2).ttf")).toBe("fancy v2");
    expect(familyFromFile(".ttf")).toBe("custom font");
  });
});
