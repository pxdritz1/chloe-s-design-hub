import { describe, expect, it } from "vitest";
import { applyMask, modelSize, normalizeMask, resizeArea, resizeBilinear, toModelInput } from "./mask";

describe("resizing", () => {
  it("keeps the data when the size does not change", () => {
    const source = new Float32Array([1, 2, 3, 4]);
    expect([...resizeArea(source, 2, 2, 2, 2, 1)]).toEqual([1, 2, 3, 4]);
  });

  it("averages blocks when shrinking", () => {
    const source = new Float32Array([0, 10, 20, 30]);
    expect([...resizeArea(source, 2, 2, 1, 1, 1)]).toEqual([15]);
  });

  it("keeps channels apart", () => {
    const source = new Uint8ClampedArray([10, 100, 20, 200]);
    expect([...resizeArea(source, 2, 1, 1, 1, 2)]).toEqual([15, 150]);
  });

  it("smoothly grows a mask", () => {
    const grown = resizeBilinear(new Float32Array([0, 1]), 2, 1, 6, 1);
    expect(grown[0]).toBe(0);
    expect(grown[5]).toBe(1);
    for (let index = 1; index < grown.length; index += 1) expect(grown[index]).toBeGreaterThanOrEqual(grown[index - 1] ?? 0);
  });
});

describe("model input", () => {
  it("builds a planar normalized tensor", () => {
    const white = new Uint8ClampedArray(8 * 8 * 4).fill(255);
    const input = toModelInput(white, 8, 8);
    const pixels = modelSize * modelSize;
    expect(input).toHaveLength(pixels * 3);
    expect(input[0]).toBeCloseTo((1 - 0.485) / 0.229, 4);
    expect(input[pixels]).toBeCloseTo((1 - 0.456) / 0.224, 4);
    expect(input[pixels * 2]).toBeCloseTo((1 - 0.406) / 0.225, 4);
  });

  it("treats transparent pixels as white", () => {
    const clear = new Uint8ClampedArray(4 * 4 * 4);
    const opaque = new Uint8ClampedArray(4 * 4 * 4).fill(255);
    expect(toModelInput(clear, 4, 4)[0]).toBeCloseTo(toModelInput(opaque, 4, 4)[0] ?? 0, 4);
  });
});

describe("masks", () => {
  it("stretches raw values to 0..1", () => {
    expect([...normalizeMask(new Float32Array([2, 4, 6]))]).toEqual([0, 0.5, 1]);
    expect([...normalizeMask(new Float32Array([3, 3]))]).toEqual([0, 0]);
  });

  const pixels = new Uint8ClampedArray([200, 100, 50, 255, 200, 100, 50, 255, 200, 100, 50, 128]);
  const mask = new Float32Array([0.1, 0.9, 0.9]);

  it("cuts by threshold and keeps source alpha", () => {
    const out = applyMask(pixels, mask, { threshold: 0.5, softness: 0, background: null });
    expect([out[3], out[7], out[11]]).toEqual([0, 255, 128]);
    expect([...out.slice(0, 3)]).toEqual([200, 100, 50]);
  });

  it("softens the edge with a gradient", () => {
    const edge = applyMask(pixels, new Float32Array([0.5, 0.5, 0.5]), { threshold: 0.5, softness: 0.4, background: null });
    expect(edge[3]).toBeGreaterThan(100);
    expect(edge[3]).toBeLessThan(155);
  });

  it("composites over a solid background", () => {
    const out = applyMask(pixels, mask, { threshold: 0.5, softness: 0, background: { r: 0, g: 0, b: 255 } });
    expect([...out.slice(0, 4)]).toEqual([0, 0, 255, 255]);
    expect([...out.slice(4, 8)]).toEqual([200, 100, 50, 255]);
  });
});
