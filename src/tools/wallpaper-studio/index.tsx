import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Shuffle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field } from "../../components/Field";
import { downloadCanvas } from "../../lib/image";
import { harmonies, parseColor, type HarmonyKind } from "../color-tools/color";
import { drawScene } from "./draw";
import { buildScene, sizes, styles, type Mode, type SizeId, type Style } from "./scene";

const harmonyKinds = Object.keys(harmonies) as HarmonyKind[];
const modes: Mode[] = ["light", "dark"];
const previewSide = 1100;

export default function WallpaperStudio() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sizeId, setSizeId] = useState<SizeId>("desktop");
  const [style, setStyle] = useState<Style>("mesh");
  const [mode, setMode] = useState<Mode>("light");
  const [baseHex, setBaseHex] = useState("#5c775a");
  const [harmony, setHarmony] = useState<HarmonyKind>("analogous");
  const [count, setCount] = useState(7);
  const [grain, setGrain] = useState(25);
  const [seed, setSeed] = useState(2024);

  const size = sizes.find((item) => item.id === sizeId) ?? sizes[0];
  const scene = useMemo(() => {
    const base = parseColor(baseHex) ?? { r: 92, g: 119, b: 90 };
    return buildScene({ seed, style, base, harmony, mode, count });
  }, [seed, style, baseHex, harmony, mode, count]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const scale = Math.min(1, previewSide / Math.max(size.width, size.height));
    canvas.width = Math.round(size.width * scale);
    canvas.height = Math.round(size.height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawScene(ctx, scene, size.width, size.height, grain, seed);
  }, [scene, size, grain, seed]);

  function download() {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawScene(ctx, scene, size.width, size.height, grain, seed);
    downloadCanvas(canvas, `wallpaper-${style}-${seed}.png`);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[23rem_minmax(0,1fr)]">
      <section className="panel space-y-5">
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">{t("wallpaper.size")}</span>
          <div role="radiogroup" aria-label={t("wallpaper.size")} className="flex flex-wrap gap-1.5">
            {sizes.map((option) => (
              <button key={option.id} role="radio" aria-checked={sizeId === option.id} onClick={() => setSizeId(option.id)} className="chip">
                {t(`wallpaper.sizes.${option.id}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">
            {size.width}×{size.height}
          </p>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">{t("wallpaper.style")}</span>
          <div role="radiogroup" aria-label={t("wallpaper.style")} className="flex flex-wrap gap-1.5">
            {styles.map((option) => (
              <button key={option} role="radio" aria-checked={style === option} onClick={() => setStyle(option)} className="chip">
                {t(`wallpaper.styles.${option}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">{t("wallpaper.tone")}</span>
          <div role="radiogroup" aria-label={t("wallpaper.tone")} className="flex gap-1.5">
            {modes.map((option) => (
              <button key={option} role="radio" aria-checked={mode === option} onClick={() => setMode(option)} className="chip">
                {t(option)}
              </button>
            ))}
          </div>
        </div>
        <Field label={t("wallpaper.base")}>
          <input type="color" value={baseHex} onChange={(event) => setBaseHex(event.target.value)} className="h-9 w-full cursor-pointer rounded-full border border-border bg-transparent p-0.5" />
        </Field>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">{t("wallpaper.harmony")}</span>
          <div role="radiogroup" aria-label={t("wallpaper.harmony")} className="flex flex-wrap gap-1.5">
            {harmonyKinds.map((option) => (
              <button key={option} role="radio" aria-checked={harmony === option} onClick={() => setHarmony(option)} className="chip">
                {t(`colorTools.harmonies.${option}`)}
              </button>
            ))}
          </div>
        </div>
        <Field label={t("wallpaper.complexity")} value={`${count}`}>
          <input type="range" min={2} max={14} value={count} onChange={(event) => setCount(Number(event.target.value))} className="w-full accent-accent" />
        </Field>
        <Field label={t("wallpaper.grain")} value={`${grain}%`}>
          <input type="range" min={0} max={100} value={grain} onChange={(event) => setGrain(Number(event.target.value))} className="w-full accent-accent" />
        </Field>
        <div className="space-y-2">
          <button
            onClick={() => setSeed(Math.floor(Math.random() * 1_000_000_000))}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface text-xs font-medium transition-colors hover:border-accent"
          >
            <Shuffle size={15} />
            {t("wallpaper.shuffle")}
          </button>
          <button onClick={download} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent">
            <Download size={16} />
            {t("image.download")}
          </button>
        </div>
      </section>
      <section className="panel space-y-3">
        <div className="flex justify-center rounded-2xl border border-border bg-surface p-2">
          <canvas ref={canvasRef} role="img" aria-label={t("wallpaper.preview")} className="max-h-[70vh] w-auto max-w-full rounded-xl" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ul aria-label={t("wallpaper.palette")} className="flex gap-1.5">
            {scene.palette.map((color, index) => (
              <li key={`${color}-${index}`} title={color} className="size-7 rounded-full border border-border" style={{ backgroundColor: color }} />
            ))}
          </ul>
          <p className="text-xs text-muted">
            {t("wallpaper.seed")} {seed}
          </p>
        </div>
      </section>
    </div>
  );
}
