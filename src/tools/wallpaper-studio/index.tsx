import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

type Size = "desktop" | "phone" | "square";
type Style = "organic" | "geometric" | "minimal";

const palettes = [
  ["#e9e4d8", "#7b8f76", "#d49a82", "#b3a8cf", "#d7bd8e"],
  ["#171c2b", "#8c9fca", "#e5a5a0", "#e7d9c6", "#617b83"],
  ["#f4d6d0", "#ad6f73", "#e8a65c", "#687b68", "#f4e9d2"],
  ["#e7e5ef", "#71678e", "#b8abc9", "#d19c9a", "#a3b4a0"]
];

export default function WallpaperStudio() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<Size>("desktop");
  const [style, setStyle] = useState<Style>("organic");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [seed, setSeed] = useState(1);

  useEffect(() => { draw(); }, [size, style, paletteIndex, seed]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dimensions = size === "desktop" ? [1920, 1080] : size === "phone" ? [1080, 1920] : [1200, 1200];
    canvas.width = dimensions[0];
    canvas.height = dimensions[1];
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = palettes[paletteIndex];
    const [w, h] = dimensions;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[4]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    let state = seed * 9301 + 49297;
    const random = () => { state = (state * 233280 + 49297) % 233280; return state / 233280; };
    const count = style === "minimal" ? 7 : 19;
    for (let i = 0; i < count; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const radius = (0.08 + random() * 0.25) * Math.min(w, h);
      ctx.save();
      ctx.globalAlpha = style === "minimal" ? 0.24 + random() * 0.22 : 0.3 + random() * 0.42;
      ctx.fillStyle = colors[1 + Math.floor(random() * 4)];
      ctx.translate(x, y);
      ctx.rotate(random() * Math.PI * 2);
      if (style === "organic") {
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * (0.55 + random()), radius * (0.45 + random()), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === "geometric") {
        ctx.fillRect(-radius / 2, -radius / 2, radius, radius);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (style !== "minimal") {
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2;
      const step = 48;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "wallpaper.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const panel = "rounded-2xl border border-border bg-elevated p-5";
  const buttonClass = (active: boolean) => `rounded-lg border px-3 py-2 font-mono text-xs transition-colors ${active ? "border-accent bg-surface text-foreground" : "border-border text-muted hover:text-foreground"}`;
  return (
    <div className="grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]">
      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted">{size === "desktop" ? "1920 × 1080" : size === "phone" ? "1080 × 1920" : "1200 × 1200"} · png</span>
          <button onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 font-mono text-xs text-on-accent"><Download size={15} />{t("wallpaperStudio.download")}</button>
        </div>
        <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface p-3">
          <canvas ref={canvasRef} className="h-auto max-h-[34rem] max-w-full rounded-lg object-contain shadow-sm" />
        </div>
      </section>
      <section className={panel}>
        <h2 className="mb-3 font-mono text-sm font-semibold">{t("wallpaperStudio.size")}</h2>
        <div className="flex flex-wrap gap-2">
          {(["desktop", "phone", "square"] as Size[]).map((item) => <button key={item} onClick={() => setSize(item)} className={buttonClass(size === item)}>{t(`wallpaperStudio.${item}`)}</button>)}
        </div>
        <h2 className="mb-3 mt-6 font-mono text-sm font-semibold">{t("wallpaperStudio.style")}</h2>
        <div className="flex flex-wrap gap-2">
          {(["organic", "geometric", "minimal"] as Style[]).map((item) => <button key={item} onClick={() => setStyle(item)} className={buttonClass(style === item)}>{t(`wallpaperStudio.${item}`)}</button>)}
        </div>
        <h2 className="mb-3 mt-6 font-mono text-sm font-semibold">{t("wallpaperStudio.palette")}</h2>
        <div className="grid grid-cols-4 gap-2">
          {palettes.map((colors, index) => <button key={colors[0]} onClick={() => setPaletteIndex(index)} aria-label={`palette ${index + 1}`} aria-pressed={paletteIndex === index} className="rounded-xl border border-border p-1.5 aria-pressed:border-accent">{colors.map((color) => <span key={color} className="block h-5 first:rounded-t-md last:rounded-b-md" style={{ backgroundColor: color }} />)}</button>)}
        </div>
        <button onClick={() => setSeed((value) => value + 1)} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-xs text-muted hover:text-foreground"><RefreshCw size={14} />{t("wallpaperStudio.generate")}</button>
      </section>
    </div>
  );
}
