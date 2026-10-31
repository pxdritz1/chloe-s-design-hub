import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Download, ImagePlus, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BackgroundRemover() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [source, setSource] = useState("");
  const [sample, setSample] = useState<[number, number, number]>([255, 255, 255]);
  const [tolerance, setTolerance] = useState(38);
  const [softness, setSoftness] = useState(18);

  useEffect(() => {
    if (!source) return;
    const image = new window.Image();
    image.onload = () => {
      imageRef.current = image;
      render();
    };
    image.src = source;
    return () => { imageRef.current = null; };
  }, [source]);

  useEffect(() => { render(); }, [sample, tolerance, softness]);

  function render() {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    const edge = Math.max(1, softness);
    for (let i = 0; i < pixels.length; i += 4) {
      const distance = Math.hypot(pixels[i] - sample[0], pixels[i + 1] - sample[1], pixels[i + 2] - sample[2]) / Math.sqrt(3);
      const alpha = Math.max(0, Math.min(1, (distance - tolerance) / edge));
      pixels[i + 3] = Math.round(pixels[i + 3] * alpha);
    }
    context.putImageData(frame, 0, 0);
  }

  function loadFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setSource(String(reader.result));
    reader.readAsDataURL(file);
  }

  function pickColor(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * canvas.width / rect.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const pixel = context.getImageData(x, y, 1, 1).data;
    setSample([pixel[0], pixel[1], pixel[2]]);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "recorte.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function reset() {
    setSample([255, 255, 255]);
    setTolerance(38);
    setSoftness(18);
  }

  const panel = "rounded-2xl border border-border bg-elevated p-5";
  return (
    <div className="grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]">
      <section className={panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs hover:border-accent">
            <ImagePlus size={16} /> {t("backgroundRemover.upload")}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => loadFile(event.target.files?.[0])} />
          </label>
          {source && <button onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 font-mono text-xs text-on-accent"><Download size={15} />{t("backgroundRemover.download")}</button>}
        </div>
        <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-border bg-[linear-gradient(45deg,var(--border)_25%,transparent_25%,transparent_75%,var(--border)_75%),linear-gradient(45deg,var(--border)_25%,var(--elevated)_25%,var(--elevated)_75%,var(--border)_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
          {source ? <canvas ref={canvasRef} onClick={pickColor} className="h-auto max-h-[32rem] max-w-full cursor-crosshair object-contain" /> : <div className="flex flex-col items-center gap-2 text-sm text-muted"><ImagePlus size={28} strokeWidth={1.4} /><span>{t("backgroundRemover.empty")}</span></div>}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("backgroundRemover.hint")}</p>
      </section>
      <section className={panel}>
        <div className="mb-5 flex items-center justify-between gap-2">
          <h2 className="font-mono text-sm font-semibold">{t("backgroundRemover.sample")}</h2>
          <span className="size-7 rounded-lg border border-border" style={{ backgroundColor: `rgb(${sample.join(",")})` }} />
        </div>
        <label className="mb-2 flex justify-between font-mono text-xs text-muted"><span>{t("backgroundRemover.tolerance")}</span><output>{tolerance}</output></label>
        <input type="range" min="0" max="150" value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} className="mb-6 w-full accent-[var(--accent)]" />
        <label className="mb-2 flex justify-between font-mono text-xs text-muted"><span>{t("backgroundRemover.softness")}</span><output>{softness}</output></label>
        <input type="range" min="1" max="80" value={softness} onChange={(event) => setSoftness(Number(event.target.value))} className="mb-6 w-full accent-[var(--accent)]" />
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-xs text-muted hover:text-foreground"><RotateCcw size={14} />{t("backgroundRemover.reset")}</button>
        <p className="mt-6 rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">{t("backgroundRemover.note")}</p>
      </section>
    </div>
  );
}
