import { describe, expect, it } from "vitest";
import { colorDistance, identityMatrix, processPixels, samplePixel, type ProcessOptions, type SwapRule } from "./matrix";

const px = (...values: number[]) => new Uint8ClampedArray(values);
const none: ProcessOptions = { swaps: [], matrix: identityMatrix };
const rule = (change: Partial<SwapRule> = {}): SwapRule => ({
  id: 1,
  from: { r: 200, g: 40, b: 40 },
  to: { r: 40, g: 80, b: 200 },
  tolerance: 0,
  keepShading: false,
  ...change
});

describe("swaps", () => {
  it("replaces an exact color and leaves the rest alone", () => {
    const out = processPixels(px(200, 40, 40, 255, 10, 10, 10, 255), { ...none, swaps: [rule()] });
    expect([...out]).toEqual([40, 80, 200, 255, 10, 10, 10, 255]);
  });

  it("catches near colors only within the tolerance", () => {
    const source = px(205, 45, 45, 255, 120, 120, 120, 255);
    const out = processPixels(source, { ...none, swaps: [rule({ tolerance: 15 })] });
    expect([...out.slice(0, 3)]).toEqual([40, 80, 200]);
    expect([...out.slice(4, 7)]).toEqual([120, 120, 120]);
  });

  it("blends softly near the edge of the tolerance", () => {
    const tolerance = 50;
    const edge = px(200, 40 + 0.9 * 110, 40, 255);
    const out = processPixels(edge, { ...none, swaps: [rule({ tolerance })] });
    expect(out[0]).toBeGreaterThan(40);
    expect(out[0]).toBeLessThan(200);
  });

  it("keeps shading when asked", () => {
    const lighter = px(235, 90, 90, 255);
    const plain = processPixels(lighter, { ...none, swaps: [rule({ tolerance: 60 })] });
    const shaded = processPixels(lighter, { ...none, swaps: [rule({ tolerance: 60, keepShading: true })] });
    const sum = (data: Uint8ClampedArray) => (data[0] ?? 0) + (data[1] ?? 0) + (data[2] ?? 0);
    expect(sum(shaded)).toBeGreaterThan(sum(plain));
  });

  it("keeps alpha and skips transparent pixels", () => {
    const out = processPixels(px(200, 40, 40, 128, 200, 40, 40, 0), { ...none, swaps: [rule()] });
    expect(out[3]).toBe(128);
    expect([...out.slice(4, 8)]).toEqual([200, 40, 40, 0]);
  });
});

describe("matrix", () => {
  it("returns an untouched copy for the identity", () => {
    const source = px(1, 2, 3, 255);
    const out = processPixels(source, none);
    expect(out).not.toBe(source);
    expect([...out]).toEqual([1, 2, 3, 255]);
  });

  it("reorders channels", () => {
    const out = processPixels(px(10, 20, 30, 255), { swaps: [], matrix: { ...identityMatrix, order: "gbr" } });
    expect([...out]).toEqual([20, 30, 10, 255]);
  });

  it("inverts selected channels", () => {
    const out = processPixels(px(10, 20, 30, 255), { swaps: [], matrix: { ...identityMatrix, invert: [true, false, true] } });
    expect([...out]).toEqual([245, 20, 225, 255]);
  });

  it("desaturates to gray and over-saturates with clamping", () => {
    const gray = processPixels(px(200, 100, 50, 255), { swaps: [], matrix: { ...identityMatrix, saturation: 0 } });
    expect(gray[0]).toBe(gray[1]);
    expect(gray[1]).toBe(gray[2]);
    const vivid = processPixels(px(200, 100, 50, 255), { swaps: [], matrix: { ...identityMatrix, saturation: 2 } });
    expect(vivid[0]).toBeGreaterThan(200);
    expect(vivid[2]).toBeLessThan(50);
  });

  it("applies swaps before the matrix", () => {
    const out = processPixels(px(200, 40, 40, 255), {
      swaps: [rule({ to: { r: 10, g: 20, b: 30 } })],
      matrix: { ...identityMatrix, order: "bgr" }
    });
    expect([...out]).toEqual([30, 20, 10, 255]);
  });
});

describe("helpers", () => {
  it("measures distance and samples pixels", () => {
    expect(colorDistance({ r: 0, g: 0, b: 0 }, { r: 3, g: 4, b: 0 })).toBe(5);
    expect(samplePixel(px(1, 2, 3, 255, 4, 5, 6, 255), 2, 1, 0)).toEqual({ r: 4, g: 5, b: 6 });
  });
});
