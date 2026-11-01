import { describe, expect, it } from "vitest";
import { hitLayer, layerPolygon, pathData, pointInPolygon, scatterLayers, shapeById, shapeDefs, shapeIds, type Layer } from "./shapes";

const layer = (change: Partial<Layer> = {}): Layer => ({
  id: 1,
  shape: "circle",
  x: 0.5,
  y: 0.5,
  size: 0.1,
  rotation: 0,
  color: "#336699",
  opacity: 1,
  outline: false,
  ...change
});

function area(points: [number, number][]) {
  let sum = 0;
  points.forEach(([x, y], index) => {
    const [nx, ny] = points[(index + 1) % points.length] ?? [0, 0];
    sum += x * ny - nx * y;
  });
  return Math.abs(sum) / 2;
}

describe("shape library", () => {
  it("has 26 shapes split between basic and material", () => {
    expect(shapeDefs).toHaveLength(26);
    expect(new Set(shapeIds).size).toBe(26);
    expect(shapeDefs.filter((shape) => shape.group === "material")).toHaveLength(13);
  });

  it.each(shapeDefs.map((shape) => shape.id))("keeps %s finite, smooth enough and inside the unit box", (id) => {
    const shape = shapeById(id);
    expect(shape.points.length).toBeGreaterThan(8);
    for (const [x, y] of shape.points) {
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(Math.abs(x)).toBeLessThanOrEqual(1.0001);
      expect(Math.abs(y)).toBeLessThanOrEqual(1.0001);
    }
    expect(Math.max(shape.hw, shape.hh)).toBeCloseTo(1, 3);
    expect(area(shape.points)).toBeGreaterThan(0.2);
  });

  it("builds a perfect circle and a wide pill", () => {
    expect(area(shapeById("circle").points)).toBeCloseTo(Math.PI, 1);
    const pill = shapeById("pill");
    expect(pill.hw).toBeCloseTo(1, 3);
    expect(pill.hh).toBeCloseTo(0.5, 2);
  });

  it("writes svg path data", () => {
    expect(pathData([[0, 0], [1, 0], [1, 1]])).toBe("M0.000 0.000 L1.000 0.000 L1.000 1.000 Z");
  });
});

describe("layers", () => {
  it("places a layer around its center in scene units", () => {
    const polygon = layerPolygon(layer(), 1000, 500);
    const xs = polygon.map(([x]) => x);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(500, 0);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(200, 0);
  });

  it("detects points inside and outside", () => {
    const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(pointInPolygon([5, 5], square)).toBe(true);
    expect(pointInPolygon([15, 5], square)).toBe(false);
  });

  it("hits the topmost layer and misses empty space", () => {
    const layers = [layer({ id: 1 }), layer({ id: 2, size: 0.05 })];
    expect(hitLayer(layers, [500, 250], 1000, 500)?.id).toBe(2);
    expect(hitLayer(layers, [500 + 90, 250], 1000, 500)?.id).toBe(1);
    expect(hitLayer(layers, [20, 20], 1000, 500)).toBeNull();
  });

  it("follows the rotation when hit testing", () => {
    const pill = layer({ shape: "pill", size: 0.1 });
    expect(hitLayer([pill], [500 + 80, 250], 1000, 500)).not.toBeNull();
    expect(hitLayer([pill], [500, 250 + 80], 1000, 500)).toBeNull();
    const turned = { ...pill, rotation: 90 };
    expect(hitLayer([turned], [500, 250 + 80], 1000, 500)).not.toBeNull();
    expect(hitLayer([turned], [500 + 80, 250], 1000, 500)).toBeNull();
  });

  it("scatters repeatable layers with palette colors", () => {
    const palette = ["#111111", "#222222"];
    const layers = scatterLayers(9, palette, 6, 10);
    expect(layers).toEqual(scatterLayers(9, palette, 6, 10));
    expect(layers.map((item) => item.id)).toEqual([10, 11, 12, 13, 14, 15]);
    expect(layers.every((item) => palette.includes(item.color) && item.x > 0 && item.x < 1)).toBe(true);
  });
});
