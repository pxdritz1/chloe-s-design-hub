export type Shape = "circle" | "square" | "line";

export interface HalftoneParams {
  size: number;
  angle: number;
  contrast: number;
  shape: Shape;
  invert: boolean;
  ink: string;
  paper: string | null;
}

export interface Dot {
  x: number;
  y: number;
  amount: number;
}

export type Point = [number, number];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function toLuma(rgba: Uint8ClampedArray): Float32Array {
  const luma = new Float32Array(rgba.length / 4);
  for (let index = 0; index < luma.length; index += 1) {
    const offset = index * 4;
    const alpha = (rgba[offset + 3] ?? 255) / 255;
    const value = 0.2126 * (rgba[offset] ?? 0) + 0.7152 * (rgba[offset + 1] ?? 0) + 0.0722 * (rgba[offset + 2] ?? 0);
    luma[index] = value * alpha + 255 * (1 - alpha);
  }
  return luma;
}

export function buildIntegral(luma: Float32Array, width: number, height: number): Float64Array {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let row = 0;
    for (let x = 0; x < width; x += 1) {
      row += luma[y * width + x] ?? 0;
      integral[(y + 1) * stride + x + 1] = (integral[y * stride + x + 1] ?? 0) + row;
    }
  }
  return integral;
}

export function averageLuma(integral: Float64Array, width: number, height: number, cx: number, cy: number, half: number): number {
  const x0 = clamp(Math.floor(cx - half), 0, width - 1);
  const y0 = clamp(Math.floor(cy - half), 0, height - 1);
  const x1 = clamp(Math.ceil(cx + half), x0 + 1, width);
  const y1 = clamp(Math.ceil(cy + half), y0 + 1, height);
  const stride = width + 1;
  const sum =
    (integral[y1 * stride + x1] ?? 0) - (integral[y0 * stride + x1] ?? 0) - (integral[y1 * stride + x0] ?? 0) + (integral[y0 * stride + x0] ?? 0);
  return sum / ((x1 - x0) * (y1 - y0));
}

export function coverageFromLuma(luma: number, contrast: number, invert: boolean): number {
  const dark = 1 - luma / 255;
  const adjusted = clamp((dark - 0.5) * contrast + 0.5, 0, 1);
  return invert ? 1 - adjusted : adjusted;
}

export function buildDots(integral: Float64Array, width: number, height: number, params: HalftoneParams): Dot[] {
  const { size, angle, contrast, invert } = params;
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const cx = width / 2;
  const cy = height / 2;
  const reach = Math.ceil(Math.hypot(width, height) / 2 / size) + 1;
  const dots: Dot[] = [];

  for (let j = -reach; j <= reach; j += 1) {
    for (let i = -reach; i <= reach; i += 1) {
      const u = i * size;
      const v = j * size;
      const x = cx + u * cos - v * sin;
      const y = cy + u * sin + v * cos;
      if (x < -size || x > width + size || y < -size || y > height + size) continue;

      const coverage = coverageFromLuma(averageLuma(integral, width, height, x, y, size / 2), contrast, invert);
      if (coverage < 0.02) continue;
      dots.push({ x, y, amount: Math.sqrt(coverage) });
    }
  }

  return dots;
}

export function dotRadius(dot: Dot, size: number) {
  return dot.amount * size * Math.SQRT1_2;
}

export function dotPolygon(dot: Dot, params: HalftoneParams): Point[] {
  const { size, angle, shape } = params;
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const halfU = shape === "line" ? (size + 1) / 2 : (dot.amount * size) / 2 + dot.amount * 0.5;
  const halfV = shape === "line" ? (dot.amount * size) / 2 : halfU;
  const corners: Point[] = [
    [-halfU, -halfV],
    [halfU, -halfV],
    [halfU, halfV],
    [-halfU, halfV]
  ];
  return corners.map(([u, v]) => [dot.x + u * cos - v * sin, dot.y + u * sin + v * cos]);
}

export function drawDots(ctx: OffscreenCanvasRenderingContext2D, dots: Dot[], width: number, height: number, params: HalftoneParams) {
  ctx.clearRect(0, 0, width, height);
  if (params.paper) {
    ctx.fillStyle = params.paper;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = params.ink;
  ctx.beginPath();

  for (const dot of dots) {
    if (params.shape === "circle") {
      const radius = dotRadius(dot, params.size);
      ctx.moveTo(dot.x + radius, dot.y);
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      continue;
    }

    const [first, ...rest] = dotPolygon(dot, params);
    if (!first) continue;
    ctx.moveTo(first[0], first[1]);
    for (const [x, y] of rest) ctx.lineTo(x, y);
    ctx.closePath();
  }

  ctx.fill();
}
