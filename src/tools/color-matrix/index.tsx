import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ColorMatrix() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("#ffffff");
  const [replacement, setReplacement] = useState("#7b8f76");
  const [tolerance, setTolerance] = useState(24);
  const [saturation, setSaturation] = useState(100);
  const [invert, setInvert] = useState(false);

  useEffect(() => {
    if (!source) return;
    const image = new window.Image();
    image.onload = () => { imageRef.current = image; render(); };
    image.src = source;
    return () => { imageRef.current = null; };
  }, [source]);

  useEffect(() => { render(); }, [target, replacement, tolerance, saturation, invert]);

  function render() {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    const from = [1, 3, 5].map((offset) => parseInt(target.slice(offset, offset + 2), 16));
    const to = [1, 3, 5].map((offset) => parseInt(replacement.slice(offset, offset + 2), 16));
    const factor = saturation / 100;
    for (let i = 0; i < pixels.length; i += 4) {
      const distance = Math.hypot(pixels[i] - from[0], pixels[i + 1] - from[1], pixels[i + 2] - from[2]) / Math.sqrt(3);
      if (distance <= tolerance) {
        const blend = tolerance === 0 ? 1 : Math.max(0, 1 - distance / Math.max(1, tolerance));
        for (let channel = 0; channel < 3; channel += 1) pixels[i + channel] = Math.round(pixels[i + channel] * (1 - blend) + to[channel] * blend);
      }
      const gray = pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
      for (let channel = 0; channel < 3; channel += 1) {
        let value = gray + (pixels[i + channel] - gray) * factor;
        if (invert) value = 255 - value;
        pixels[i + channel] = Math.max(0, Math.min(255, Math.round(value)));
      }
    }
    context.putImageData(frame, 0, 0);
  }

  function loadFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setSource(String(reader.result));
    reader.readAsDataURL(file);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "color-matrix.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function reset() {
    setTarget("#ffffff");
    setReplacement("#7b8f76");
    setTolerance(24);
    setSaturation(100);
    setInvert(false);
  }

  const panel = "rounded-2xl border border-border bg-elevated p-5";
  return (
    <div className="grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]">
      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs hover:border-accent">
            <ImagePlus size={16} /> {t("colorMatrix.upload")}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => loadFile(event.target.files?.[0])} />
          </label>
          {source && <button onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 font-mono text-xs text-on-accent"><Download size={15} />{t("colorMatrix.download")}</button>}
        </div>
        <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
          {source ? <canvas ref={canvasRef} className="h-auto max-h-[32rem] max-w-full object-contain" /> : <div className="flex flex-col items-center gap-2 text-sm text-muted"><ImagePlus size={28} strokeWidth={1.4} /><span>{t("colorMatrix.empty")}</span></div>}
        </div>
      </section>
      <section className={panel}>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2 font-mono text-xs text-muted"><span>{t("colorMatrix.target")}</span><input type="color" value={target} onChange={(event) => setTarget(event.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-surface p-1" /></label>
          <label className="space-y-2 font-mono text-xs text-muted"><span>{t("colorMatrix.replacement")}</span><input type="color" value={replacement} onChange={(event) => setReplacement(event.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-surface p-1" /></label>
        </div>
        <label className="mb-2 mt-6 flex justify-between font-mono text-xs text-muted"><span>{t("colorMatrix.tolerance")}</span><output>{tolerance}</output></label>
        <input type="range" min="0" max="180" value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} className="w-full accent-[var(--accent)]" />
        <label className="mb-2 mt-6 flex justify-between font-mono text-xs text-muted"><span>{t("colorMatrix.saturation")}</span><output>{saturation}%</output></label>
        <input type="range" min="0" max="200" value={saturation} onChange={(event) => setSaturation(Number(event.target.value))} className="w-full accent-[var(--accent)]" />
        <label className="mt-6 flex items-center gap-2 font-mono text-xs text-muted"><input type="checkbox" checked={invert} onChange={(event) => setInvert(event.target.checked)} className="accent-[var(--accent)]" />{t("colorMatrix.invert")}</label>
        <button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-xs text-muted hover:text-foreground"><RotateCcw size={14} />{t("colorMatrix.reset")}</button>
      </section>
    </div>
  );
}
