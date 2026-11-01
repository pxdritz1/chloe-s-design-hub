import { mulberry32 } from "./scene";

export type Point = [number, number];

export const shapeIds = [
  "circle",
  "square",
  "pill",
  "oval",
  "triangle",
  "diamond",
  "pentagon",
  "hexagon",
  "arch",
  "semicircle",
  "heart",
  "star",
  "slanted",
  "sunny",
  "verySunny",
  "burst",
  "softBurst",
  "cookie4",
  "cookie6",
  "cookie9",
  "cookie12",
  "clover4",
  "clover8",
  "flower",
  "puffy",
  "gem",
  "cross",
  "plus",
  "chevron",
  "teardrop",
  "leaf",
  "crescent",
  "sparkle",
  "gear",
  "flower8",
  "petal"
] as const;

export type ShapeId = (typeof shapeIds)[number];
export type ShapeGroup = "basic" | "material" | "expressive";

export interface ShapeDef {
  id: ShapeId;
  group: ShapeGroup;
  points: Point[];
  hw: number;
  hh: number;
}

export interface Layer {
  id: number;
  shape: ShapeId;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
  outline: boolean;
}

const TAU = Math.PI * 2;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Point, k: number): Point => [a[0] * k, a[1] * k];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1];
const length = (a: Point) => Math.hypot(a[0], a[1]);
const unit = (a: Point): Point => mul(a, 1 / (length(a) || 1));

function fillet(vertices: Point[], radii: number | number[]): Point[] {
  const out: Point[] = [];
  const count = vertices.length;

  vertices.forEach((vertex, index) => {
    const prev = vertices[(index + count - 1) % count] ?? vertex;
    const next = vertices[(index + 1) % count] ?? vertex;
    const radius = Array.isArray(radii) ? (radii[index] ?? 0) : radii;
    const u1 = unit(sub(prev, vertex));
    const u2 = unit(sub(next, vertex));
    const angle = Math.acos(clamp(dot(u1, u2), -1, 1));

    if (radius <= 0 || angle < 1e-3 || angle > Math.PI - 0.02) {
      out.push(vertex);
      return;
    }

    let tangent = radius / Math.tan(angle / 2);
    let effective = radius;
    const limit = Math.min(length(sub(prev, vertex)), length(sub(next, vertex))) * 0.5;
    if (tangent > limit) {
      tangent = limit;
      effective = tangent * Math.tan(angle / 2);
    }

    const start = add(vertex, mul(u1, tangent));
    const end = add(vertex, mul(u2, tangent));
    const center = add(vertex, mul(unit(add(u1, u2)), effective / Math.sin(angle / 2)));
    const a1 = Math.atan2(start[1] - center[1], start[0] - center[0]);
    const a2 = Math.atan2(end[1] - center[1], end[0] - center[0]);
    let delta = a2 - a1;
    while (delta > Math.PI) delta -= TAU;
    while (delta < -Math.PI) delta += TAU;

    const steps = Math.max(4, Math.ceil(Math.abs(delta) / (Math.PI / 18)));
    for (let step = 0; step <= steps; step += 1) {
      const a = a1 + (delta * step) / steps;
      out.push([center[0] + Math.cos(a) * effective, center[1] + Math.sin(a) * effective]);
    }
  });

  return out;
}

function polar(samples: number, radius: (angle: number) => number): Point[] {
  return Array.from({ length: samples }, (_, index) => {
    const t = (index / samples) * TAU;
    const r = radius(t);
    return [Math.sin(t) * r, -Math.cos(t) * r];
  });
}

function regular(sides: number, rotation = 0): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const t = (index / sides) * TAU + rotation;
    return [Math.sin(t), -Math.cos(t)];
  });
}

function star(points: number, inner: number): Point[] {
  return Array.from({ length: points * 2 }, (_, index) => {
    const t = (index * Math.PI) / points;
    const r = index % 2 === 0 ? 1 : inner;
    return [Math.sin(t) * r, -Math.cos(t) * r];
  });
}

function starRadii(points: number, outer: number, inner: number) {
  return Array.from({ length: points * 2 }, (_, index) => (index % 2 === 0 ? outer : inner));
}

function arcTop(samples: number): Point[] {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const t = (index / samples) * Math.PI;
    return [Math.cos(t), -Math.sin(t)];
  });
}

function heart(): Point[] {
  return Array.from({ length: 160 }, (_, index) => {
    const t = (index / 160) * TAU;
    return [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
  });
}

function normalize(points: Point[]): { points: Point[]; hw: number; hh: number } {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const extent = Math.max(Math.max(...xs) - cx, Math.max(...ys) - cy, 1e-6);
  const scaled = points.map((point): Point => [(point[0] - cx) / extent, (point[1] - cy) / extent]);
  return { points: scaled, hw: (Math.max(...xs) - Math.min(...xs)) / 2 / extent, hh: (Math.max(...ys) - Math.min(...ys)) / 2 / extent };
}

const builders: Record<ShapeId, [ShapeGroup, () => Point[]]> = {
  circle: ["basic", () => polar(144, () => 1)],
  square: ["basic", () => fillet(regular(4, Math.PI / 4), 0.32)],
  pill: ["basic", () => fillet([[-1, -0.5], [1, -0.5], [1, 0.5], [-1, 0.5]], 0.5)],
  oval: ["basic", () => polar(144, (t) => 1 / Math.hypot(Math.sin(t) / 1, Math.cos(t) / 0.72))],
  triangle: ["basic", () => fillet(regular(3), 0.28)],
  diamond: ["basic", () => fillet(regular(4), 0.18)],
  pentagon: ["basic", () => fillet(regular(5), 0.22)],
  hexagon: ["basic", () => fillet(regular(6), 0.2)],
  arch: ["basic", () => fillet([[-1, 1], [1, 1], ...arcTop(28)], [0.14, 0.14, ...new Array<number>(29).fill(0)])],
  semicircle: ["basic", () => fillet([...arcTop(36), [-1, 0]].slice(0, -1).concat([[-1, 0]]), [0.08, ...new Array<number>(35).fill(0), 0.08])],
  heart: ["basic", heart],
  star: ["basic", () => fillet(star(5, 0.45), starRadii(5, 0.1, 0.05))],
  slanted: ["basic", () => fillet([[-1, -0.55], [0.55, -0.55], [1, 0.55], [-0.55, 0.55]], 0.22)],
  sunny: ["material", () => fillet(star(8, 0.8), starRadii(8, 0.2, 0.08))],
  verySunny: ["material", () => fillet(star(12, 0.84), starRadii(12, 0.16, 0.06))],
  burst: ["material", () => fillet(star(12, 0.6), starRadii(12, 0.1, 0.05))],
  softBurst: ["material", () => fillet(star(10, 0.72), starRadii(10, 0.34, 0.22))],
  cookie4: ["material", () => polar(200, (t) => 0.84 + 0.16 * Math.cos(4 * t))],
  cookie6: ["material", () => polar(200, (t) => 0.89 + 0.11 * Math.cos(6 * t))],
  cookie9: ["material", () => polar(240, (t) => 0.93 + 0.07 * Math.cos(9 * t))],
  cookie12: ["material", () => polar(280, (t) => 0.95 + 0.05 * Math.cos(12 * t))],
  clover4: ["material", () => polar(240, (t) => 0.58 + 0.42 * Math.cos(4 * t))],
  clover8: ["material", () => polar(300, (t) => 0.76 + 0.24 * Math.cos(8 * t))],
  flower: ["material", () => polar(300, (t) => 0.55 + 0.45 * Math.abs(Math.cos(3 * t)) ** 0.85)],
  puffy: ["material", () => polar(300, (t) => 0.72 + 0.28 * Math.abs(Math.cos(2.5 * t)))],
  gem: ["material", () => fillet([[0, -1], [0.95, -0.35], [0.6, 0.85], [-0.6, 0.85], [-0.95, -0.35]], 0.18)],
  cross: ["expressive", () => fillet([[-0.32, -1], [0.32, -1], [0.32, -0.32], [1, -0.32], [1, 0.32], [0.32, 0.32], [0.32, 1], [-0.32, 1], [-0.32, 0.32], [-1, 0.32], [-1, -0.32], [-0.32, -0.32]], 0.08)],
  plus: ["expressive", () => fillet([[-0.28, -1], [0.28, -1], [0.28, -0.28], [1, -0.28], [1, 0.28], [0.28, 0.28], [0.28, 1], [-0.28, 1], [-0.28, 0.28], [-1, 0.28], [-1, -0.28], [-0.28, -0.28]], 0.02)],
  chevron: ["expressive", () => fillet([[-1, -0.62], [-0.68, -1], [0, -0.32], [0.68, -1], [1, -0.62], [0, 0.42]], 0.08)],
  teardrop: ["expressive", () => polar(180, (t) => 0.55 + 0.45 * Math.cos(t))],
  leaf: ["expressive", () => polar(200, (t) => 0.2 + 0.8 * Math.abs(Math.cos(t)))],
  crescent: ["expressive", () => fillet([...arcTop(48), ...Array.from({ length: 48 }, (_, index): Point => { const angle = Math.PI + (index / 47) * Math.PI; return [0.42 + 0.58 * Math.cos(angle), -0.58 * Math.sin(angle)]; })], 0.015)],
  sparkle: ["expressive", () => fillet(star(4, 0.12), starRadii(4, 0.04, 0.02))],
  gear: ["expressive", () => polar(240, (t) => 0.84 + 0.16 * Math.cos(12 * t))],
  flower8: ["expressive", () => polar(280, (t) => 0.58 + 0.42 * Math.abs(Math.cos(4 * t)) ** 0.8)],
  petal: ["expressive", () => polar(240, (t) => 0.42 + 0.58 * Math.abs(Math.cos(t)) ** 0.75)]
};

export const shapeDefs: ShapeDef[] = shapeIds.map((id) => {
  const [group, build] = builders[id];
  return { id, group, ...normalize(build()) };
});

const byId = new Map(shapeDefs.map((shape) => [shape.id, shape]));

export function shapeById(id: ShapeId): ShapeDef {
  return byId.get(id) ?? (shapeDefs[0] as ShapeDef);
}

export function pathData(points: Point[]) {
  return `${points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(3)} ${y.toFixed(3)}`).join(" ")} Z`;
}

export function layerPolygon(layer: Layer, width: number, height: number): Point[] {
  const scale = layer.size * Math.max(width, height);
  const radians = (layer.rotation * Math.PI) / 180;
  const [cos, sin] = [Math.cos(radians), Math.sin(radians)];
  const [cx, cy] = [layer.x * width, layer.y * height];
  return shapeById(layer.shape).points.map(([x, y]) => [cx + (x * cos - y * sin) * scale, cy + (x * sin + y * cos) * scale]);
}

export function pointInPolygon([px, py]: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i] ?? [0, 0];
    const [xj, yj] = polygon[j] ?? [0, 0];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function hitLayer(layers: Layer[], point: Point, width: number, height: number): Layer | null {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index];
    if (layer && pointInPolygon(point, layerPolygon(layer, width, height))) return layer;
  }
  return null;
}

export function scatterLayers(seed: number, palette: string[], count: number, firstId: number): Layer[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, index) => ({
    id: firstId + index,
    shape: shapeIds[Math.floor(random() * shapeIds.length)] ?? "circle",
    x: 0.08 + random() * 0.84,
    y: 0.1 + random() * 0.8,
    size: 0.05 + random() * 0.13,
    rotation: Math.round(random() * 360 - 180),
    color: palette[Math.floor(random() * palette.length)] ?? "#888888",
    opacity: 0.7 + random() * 0.3,
    outline: random() < 0.15
  }));
}
