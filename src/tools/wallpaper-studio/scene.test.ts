import { describe, expect, it } from "vitest";
import { buildPalette, buildScene, mulberry32, styles, type SceneParams } from "./scene";

const params: SceneParams = {
  seed: 42,
  style: "mesh",
  base: { r: 92, g: 119, b: 90 },
  harmony: "analogous",
  mode: "light",
  count: 7
};

describe("random numbers", () => {
  it("repeats for the same seed and stays in range", () => {
    const [a, b] = [mulberry32(5), mulberry32(5)];
    const values = Array.from({ length: 50 }, () => a());
    expect(values).toEqual(Array.from({ length: 50 }, () => b()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(45);
  });
});

describe("palette", () => {
  it("builds hex colors from the harmony plus two tones", () => {
    const palette = buildPalette(params.base, "triadic");
    expect(palette).toHaveLength(5);
    expect(palette.every((color) => /^#[0-9a-f]{6}$/.test(color))).toBe(true);
  });
});

describe("scene", () => {
  it("is deterministic for a seed and changes with it", () => {
    expect(buildScene(params)).toEqual(buildScene(params));
    expect(buildScene({ ...params, seed: 43 })).not.toEqual(buildScene(params));
  });

  it.each(styles)("builds the requested number of %s shapes inside sensible bounds", (style) => {
    const scene = buildScene({ ...params, style, count: 9 });
    expect(scene.shapes).toHaveLength(9);
    for (const shape of scene.shapes) {
      expect(shape.alpha).toBeGreaterThan(0);
      expect(shape.alpha).toBeLessThanOrEqual(1);
      if (shape.kind !== "wave") {
        expect(shape.x).toBeGreaterThanOrEqual(0);
        expect(shape.x).toBeLessThanOrEqual(1);
        expect(shape.y).toBeGreaterThanOrEqual(0);
        expect(shape.y).toBeLessThanOrEqual(1);
      } else {
        expect(shape.baseline).toBeGreaterThan(0);
        expect(shape.baseline).toBeLessThan(1);
      }
    }
  });

  it("makes dark backgrounds darker than light ones", () => {
    const light = buildScene({ ...params, mode: "light" });
    const dark = buildScene({ ...params, mode: "dark" });
    const brightness = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    expect(brightness(dark.from)).toBeLessThan(brightness(light.from));
  });

  it("only uses palette colors for shapes", () => {
    const scene = buildScene({ ...params, style: "orbs" });
    for (const shape of scene.shapes) expect(scene.palette).toContain(shape.color);
  });
});
