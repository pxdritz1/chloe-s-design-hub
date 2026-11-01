import { mulberry32, type Scene, type Shape } from "./scene";

function rgba(hex: string, alpha: number) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, width: number, height: number) {
  const big = Math.max(width, height);

  if (shape.kind === "glow") {
    const [x, y, r] = [shape.x * width, shape.y * height, shape.r * big];
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, rgba(shape.color, shape.alpha));
    gradient.addColorStop(1, rgba(shape.color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (shape.kind === "orb") {
    const [x, y, r] = [shape.x * width, shape.y * height, shape.r * big];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (shape.ring) {
      ctx.lineWidth = big * 0.006;
      ctx.strokeStyle = rgba(shape.color, shape.alpha);
      ctx.stroke();
      return;
    }
    const gradient = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    gradient.addColorStop(0, rgba(shape.color, shape.alpha));
    gradient.addColorStop(1, rgba(shape.color, shape.alpha * 0.35));
    ctx.fillStyle = gradient;
    ctx.fill();
    return;
  }

  if (shape.kind === "wave") {
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += Math.max(2, width / 400)) {
      ctx.lineTo(x, shape.baseline * height + Math.sin((x / width) * shape.cycles * Math.PI * 2 + shape.phase) * shape.amplitude * height);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = rgba(shape.color, shape.alpha);
    ctx.fill();
    return;
  }

  const count = shape.radii.length;
  const points = shape.radii.map((radius, index) => {
    const angle = (index / count) * Math.PI * 2 + shape.rotation;
    return { x: shape.x * width + Math.cos(angle) * shape.r * big * radius, y: shape.y * height + Math.sin(angle) * shape.r * big * radius };
  });
  const first = points[0];
  const last = points[count - 1];
  if (!first || !last) return;
  ctx.beginPath();
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  points.forEach((point, index) => {
    const next = points[(index + 1) % count] ?? first;
    ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  });
  ctx.closePath();
  ctx.fillStyle = rgba(shape.color, shape.alpha);
  ctx.fill();
}

function drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number, seed: number) {
  const tile = document.createElement("canvas");
  tile.width = 256;
  tile.height = 256;
  const tileCtx = tile.getContext("2d");
  if (!tileCtx) return;

  const random = mulberry32(seed + 7919);
  const image = tileCtx.createImageData(256, 256);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.floor(random() * 256);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  tileCtx.putImageData(image, 0, 0);

  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = (amount / 100) * 0.55;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, width: number, height: number, grain: number, seed: number) {
  const radians = (scene.angle * Math.PI) / 180;
  const length = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const [dx, dy] = [(Math.cos(radians) * length) / 2, (Math.sin(radians) * length) / 2];
  const background = ctx.createLinearGradient(width / 2 - dx, height / 2 - dy, width / 2 + dx, height / 2 + dy);
  background.addColorStop(0, scene.from);
  background.addColorStop(1, scene.to);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  for (const shape of scene.shapes) drawShape(ctx, shape, width, height);
  if (grain > 0) drawGrain(ctx, width, height, grain, seed);
}
