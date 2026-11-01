export const formats = ["png", "jpeg", "webp"] as const;
export type Format = (typeof formats)[number];

export const mimeTypes: Record<Format, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp"
};

const extensions: Record<Format, string> = { png: "png", jpeg: "jpg", webp: "webp" };

export function outputName(name: string, format: Format) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${extensions[format]}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} mb`;
}

export function changeLabel(before: number, after: number) {
  if (before <= 0) return "";
  const change = Math.round(((after - before) / before) * 100);
  if (change === 0) return "0%";
  return `${change > 0 ? "+" : "−"}${Math.abs(change)}%`;
}

export function frameTimes(start: number, length: number, fps: number): number[] {
  const count = Math.max(1, Math.round(length * fps));
  return Array.from({ length: count }, (_, index) => start + index / fps);
}

export function fitWidth(width: number, height: number, target: number) {
  const fitted = Math.min(width, Math.max(1, Math.round(target)));
  return { width: fitted, height: Math.max(1, Math.round((height * fitted) / width)) };
}

export function scaledSize(width: number, height: number, scale: number) {
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
