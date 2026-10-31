import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Download, ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toLuma, type HalftoneParams, type Shape } from "./halftone";
import { useHalftoneWorker } from "./useHalftoneWorker";

const maxSide = 2400;
const shapes: Shape[] = ["circle", "square", "line"];

interface Settings {
  size: number;
  angle: number;
  contrast: number;
  shape: Shape;
  invert: boolean;
  ink: string;
  paper: string;
  transparent: boolean;
}

interface Loaded {
  name: string;
  scaled: boolean;
  version: number;
}

type Status = "idle" | "loading" | "ready" | "error";

const defaults: Settings = {
  size: 10,
  angle: 45,
  contrast: 1,
  shape: "circle",
  invert: false,
  ink: "#2f352f",
  paper: "#f3f1ea",
  transparent: false
};

async function decode(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("2d canvas is not available");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { width, height, luma: toLuma(ctx.getImageData(0, 0, width, height).data), scaled: scale < 1 };
}

function Field({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between font-mono text-xs text-muted">
        {label}
        {value && <span className="text-foreground">{value}</span>}
      </span>
      {children}
    </label>
  );
}

export default function Halftone() {
  const { t } = useTranslation();
  const { setImage: sendImage, render } = useHalftoneWorker();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [dragging, setDragging] = useState(false);

  const params = useMemo<HalftoneParams>(
    () => ({
      size: settings.size,
      angle: settings.angle,
      contrast: settings.contrast,
      shape: settings.shape,
      invert: settings.invert,
      ink: settings.ink,
      paper: settings.transparent ? null : settings.paper
    }),
    [settings]
  );

  const patch = (change: Partial<Settings>) => setSettings((previous) => ({ ...previous, ...change }));

  const load = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setStatus("loading");
      try {
        const decoded = await decode(file);
        await sendImage(decoded.width, decoded.height, decoded.luma);
        setLoaded((previous) => ({ name: file.name, scaled: decoded.scaled, version: (previous?.version ?? 0) + 1 }));
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    },
    [sendImage]
  );

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;

    render(params)
      .then((bitmap) => {
        if (!bitmap) return;
        const canvas = canvasRef.current;
        if (cancelled || !canvas) {
          bitmap.close();
          return;
        }
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
        bitmap.close();
        setStatus("ready");
      })
      .catch(() => setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, [loaded, params, render]);

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void load(event.dataTransfer.files[0]);
  }

  function download() {
    const name = loaded?.name.replace(/\.[^.]+$/, "") ?? "image";
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}-halftone.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  const panel = "rounded-2xl border border-border bg-elevated p-5";
  const inputClass = "h-9 w-full cursor-pointer rounded-lg border border-border bg-transparent p-0.5";

  return (
    <div className="grid gap-2 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <section className={`${panel} space-y-5`}>
        <h2 className="font-mono text-sm font-semibold">{t("halftone.settings")}</h2>
        <fieldset disabled={!loaded} className="m-0 min-w-0 space-y-4 border-0 p-0 disabled:opacity-50">
          <Field label={t("halftone.size")} value={`${settings.size}px`}>
            <input type="range" min={3} max={40} step={1} value={settings.size} onChange={(event) => patch({ size: Number(event.target.value) })} className="w-full accent-accent" />
          </Field>
          <Field label={t("halftone.angle")} value={`${settings.angle}°`}>
            <input type="range" min={0} max={90} step={1} value={settings.angle} onChange={(event) => patch({ angle: Number(event.target.value) })} className="w-full accent-accent" />
          </Field>
          <Field label={t("halftone.contrast")} value={`${Math.round(settings.contrast * 100)}%`}>
            <input type="range" min={0.5} max={2} step={0.05} value={settings.contrast} onChange={(event) => patch({ contrast: Number(event.target.value) })} className="w-full accent-accent" />
          </Field>
          <div role="radiogroup" aria-label={t("halftone.shape")} className="flex flex-wrap gap-1.5">
            {shapes.map((shape) => (
              <button
                key={shape}
                role="radio"
                aria-checked={settings.shape === shape}
                onClick={() => patch({ shape })}
                className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground aria-checked:border-accent aria-checked:bg-surface aria-checked:text-foreground"
              >
                {t(`halftone.shapes.${shape}`)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("halftone.ink")}>
              <input type="color" value={settings.ink} onChange={(event) => patch({ ink: event.target.value })} className={inputClass} />
            </Field>
            <Field label={t("halftone.paper")}>
              <input type="color" value={settings.paper} disabled={settings.transparent} onChange={(event) => patch({ paper: event.target.value })} className={`${inputClass} disabled:opacity-40`} />
            </Field>
          </div>
          <label className="flex items-center gap-2 font-mono text-xs">
            <input type="checkbox" checked={settings.transparent} onChange={(event) => patch({ transparent: event.target.checked })} className="size-4 accent-accent" />
            {t("halftone.transparent")}
          </label>
          <label className="flex items-center gap-2 font-mono text-xs">
            <input type="checkbox" checked={settings.invert} onChange={(event) => patch({ invert: event.target.checked })} className="size-4 accent-accent" />
            {t("halftone.invert")}
          </label>
        </fieldset>
        <div className="space-y-2">
          {loaded && (
            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface font-mono text-xs transition-colors hover:border-accent has-focus-visible:outline-2 has-focus-visible:outline-accent">
              <ImagePlus size={15} />
              {t("halftone.another")}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void load(file);
                }}
              />
            </label>
          )}
          <button
            onClick={download}
            disabled={!loaded || status !== "ready"}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent font-mono text-xs font-semibold text-on-accent transition-opacity disabled:opacity-40"
          >
            <Download size={15} />
            {t("halftone.download")}
          </button>
        </div>
      </section>
      <section className={`${panel} min-h-[24rem]`}>
        {!loaded && (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex h-full min-h-[20rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent ${dragging ? "border-accent bg-surface" : "border-border"}`}
          >
            <ImagePlus size={28} className="text-muted" />
            <span className="font-mono text-sm font-semibold">{status === "loading" ? t("halftone.loading") : t("halftone.choose")}</span>
            <span className="text-sm text-muted">{t("halftone.drop")}</span>
            <span className="max-w-xs text-xs text-muted">{t("halftone.hint")}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void load(file);
              }}
            />
          </label>
        )}
        <div className={loaded ? "space-y-3" : "hidden"}>
          <div className={`flex justify-center rounded-xl border border-border p-2 ${settings.transparent ? "checker" : "bg-surface"}`}>
            <canvas ref={canvasRef} role="img" aria-label={t("halftone.preview")} className="max-h-[70vh] w-auto max-w-full rounded-lg" />
          </div>
          {loaded?.scaled && <p className="text-xs text-muted">{t("halftone.scaled", { size: maxSide })}</p>}
        </div>
        {status === "error" && <p role="alert" className="mt-3 text-sm text-clay">{t("halftone.error")}</p>}
      </section>
    </div>
  );
}
