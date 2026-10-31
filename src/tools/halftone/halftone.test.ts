import { describe, expect, it } from "vitest";
import {
  averageLuma,
  buildDots,
  buildIntegral,
  coverageFromLuma,
  dotPolygon,
  dotRadius,
  toLuma,
  type HalftoneParams
} from "./halftone";

const params: HalftoneParams = { size: 10, angle: 0, contrast: 1, shape: "circle", invert: false, ink: "#000000", paper: "#ffffff" };

function flat(width: number, height: number, value: number) {
  const luma = new Float32Array(width * height).fill(value);
  return buildIntegral(luma, width, height);
}

describe("luma", () => {
  it("maps white, black and transparent pixels", () => {
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 0]);
    const [white, black, transparent] = toLuma(rgba);
    expect(white).toBeCloseTo(255, 3);
    expect(black).toBe(0);
    expect(transparent).toBe(255);
  });

  it("averages boxes with the integral image", () => {
    const luma = new Float32Array([0, 0, 255, 255, 0, 0, 255, 255]);
    const integral = buildIntegral(luma, 4, 2);
    expect(averageLuma(integral, 4, 2, 1, 1, 1)).toBeCloseTo(0, 5);
    expect(averageLuma(integral, 4, 2, 3, 1, 1)).toBeCloseTo(255, 5);
    expect(averageLuma(integral, 4, 2, 2, 1, 2)).toBeCloseTo(127.5, 5);
  });
});

describe("coverage", () => {
  it("is full for black and empty for white", () => {
    expect(coverageFromLuma(0, 1, false)).toBe(1);
    expect(coverageFromLuma(255, 1, false)).toBe(0);
  });

  it("pushes tones apart with contrast and flips with invert", () => {
    expect(coverageFromLuma(100, 2, false)).toBeGreaterThan(coverageFromLuma(100, 1, false));
    expect(coverageFromLuma(0, 1, true)).toBe(0);
    expect(coverageFromLuma(255, 1, true)).toBe(1);
  });
});

describe("buildDots", () => {
  it("draws nothing on a white image", () => {
    expect(buildDots(flat(60, 60, 255), 60, 60, params)).toHaveLength(0);
  });

  it("fills a black image with full dots on the grid", () => {
    const dots = buildDots(flat(60, 60, 0), 60, 60, params);
    expect(dots.length).toBeGreaterThanOrEqual(36);
    expect(dots.every((dot) => dot.amount === 1)).toBe(true);
    expect(new Set(dots.map((dot) => Math.round(dot.x * 100) % 1000)).size).toBe(1);
  });

  it("uses fewer dots for bigger cells", () => {
    const integral = flat(120, 120, 0);
    const small = buildDots(integral, 120, 120, { ...params, size: 8 });
    const large = buildDots(integral, 120, 120, { ...params, size: 24 });
    expect(large.length).toBeLessThan(small.length / 4);
  });

  it("makes darker areas bigger", () => {
    const luma = new Float32Array(40 * 20);
    for (let y = 0; y < 20; y += 1) for (let x = 0; x < 40; x += 1) luma[y * 40 + x] = x < 20 ? 40 : 200;
    const dots = buildDots(buildIntegral(luma, 40, 20), 40, 20, params);
    const left = dots.filter((dot) => dot.x < 15);
    const right = dots.filter((dot) => dot.x > 25);
    const mean = (items: typeof dots) => items.reduce((sum, dot) => sum + dot.amount, 0) / items.length;
    expect(mean(left)).toBeGreaterThan(mean(right));
  });

  it("rotates the grid", () => {
    const integral = flat(80, 80, 0);
    const flatGrid = buildDots(integral, 80, 80, params);
    const rotated = buildDots(integral, 80, 80, { ...params, angle: 45 });
    expect(rotated).not.toEqual(flatGrid);
  });
});

describe("shapes", () => {
  it("scales the circle radius with the dot amount", () => {
    expect(dotRadius({ x: 0, y: 0, amount: 1 }, 10)).toBeCloseTo(7.071, 3);
    expect(dotRadius({ x: 0, y: 0, amount: 0.5 }, 10)).toBeCloseTo(3.536, 3);
  });

  it("builds an axis aligned square at angle 0", () => {
    const polygon = dotPolygon({ x: 50, y: 50, amount: 1 }, { ...params, shape: "square" });
    const xs = polygon.map(([x]) => x);
    const ys = polygon.map(([, y]) => y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(Math.max(...ys) - Math.min(...ys), 5);
    expect(Math.min(...xs)).toBeLessThan(50);
    expect(Math.max(...xs)).toBeGreaterThan(50);
  });

  it("builds a thin line that follows the angle", () => {
    const horizontal = dotPolygon({ x: 0, y: 0, amount: 0.3 }, { ...params, shape: "line" });
    const width = Math.max(...horizontal.map(([x]) => x)) - Math.min(...horizontal.map(([x]) => x));
    const height = Math.max(...horizontal.map(([, y]) => y)) - Math.min(...horizontal.map(([, y]) => y));
    expect(width).toBeGreaterThan(height * 2);

    const vertical = dotPolygon({ x: 0, y: 0, amount: 0.3 }, { ...params, shape: "line", angle: 90 });
    const verticalHeight = Math.max(...vertical.map(([, y]) => y)) - Math.min(...vertical.map(([, y]) => y));
    expect(verticalHeight).toBeCloseTo(width, 5);
  });
});
