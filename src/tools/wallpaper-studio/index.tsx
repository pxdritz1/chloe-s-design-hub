import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDown, ArrowUp, Copy, Download, Shuffle, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field } from "../../components/Field";
import { downloadCanvas } from "../../lib/image";
import { harmonies, parseColor, type HarmonyKind } from "../color-tools/color";
import { drawScene } from "./draw";
import { buildScene, sizes, styles, type Mode, type PaletteKind, type SizeId, type Style } from "./scene";
import { hitLayer, pathData, scatterLayers, shapeById, shapeDefs, type Layer, type Point, type ShapeId } from "./shapes";

const harmonyKinds = Object.keys(harmonies) as HarmonyKind[];
const modes: Mode[] = ["light", "dark"];
const paletteKinds: PaletteKind[] = ["harmony", "material"];
const previewSide = 1100;
const groups = ["basic", "material"] as const;

type Drag =
  | { kind: "move"; start: Point; origin: Layer }
  | { kind: "scale"; origin: Layer }
  | { kind: "rotate"; origin: Layer };

let nextLayerId = 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function WallpaperStudio() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [sizeId, setSizeId] = useState<SizeId>("desktop");
  const [style, setStyle] = useState<Style>("mesh");
  const [mode, setMode] = useState<Mode>("light");
  const [paletteKind, setPaletteKind] = useState<PaletteKind>("harmony");
  const [baseHex, setBaseHex] = useState("#5c775a");
  const [harmony, setHarmony] = useState<HarmonyKind>("analogous");
  const [count, setCount] = useState(7);
  const [grain, setGrain] = useState(25);
  const [seed, setSeed] = useState(2024);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [unit, setUnit] = useState(1);

  const size = sizes.find((item) => item.id === sizeId) ?? sizes[0];
  const big = Math.max(size.width, size.height);
  const scene = useMemo(() => {
    const base = parseColor(baseHex) ?? { r: 92, g: 119, b: 90 };
    return buildScene({ seed, style, base, harmony, paletteKind, mode, count });
  }, [seed, style, baseHex, harmony, paletteKind, mode, count]);
  const selected = layers.find((layer) => layer.id === selectedId) ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const scale = Math.min(1, previewSide / Math.max(size.width, size.height));
    canvas.width = Math.round(size.width * scale);
    canvas.height = Math.round(size.height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawScene(ctx, scene, size.width, size.height, grain, seed, layers);
  }, [scene, size, grain, seed, layers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => setUnit(size.width / Math.max(1, canvas.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [size]);

  function update(id: number, change: Partial<Layer>) {
    setLayers((previous) => previous.map((layer) => (layer.id === id ? { ...layer, ...change } : layer)));
  }

  function addLayer(shape: ShapeId) {
    const offset = ((layers.length % 5) - 2) * 0.05;
    const layer: Layer = {
      id: nextLayerId++,
      shape,
      x: 0.5 + offset,
      y: 0.5 + offset,
      size: 0.14,
      rotation: 0,
      color: scene.palette[layers.length % scene.palette.length] ?? "#888888",
      opacity: 1,
      outline: false
    };
    setLayers((previous) => [...previous, layer]);
    setSelectedId(layer.id);
  }

  function scatter() {
    const created = scatterLayers(Math.floor(Math.random() * 1_000_000_000), scene.palette, 6, nextLayerId);
    nextLayerId += created.length;
    setLayers((previous) => [...previous, ...created]);
    setSelectedId(null);
  }

  function duplicate(layer: Layer) {
    const copy = { ...layer, id: nextLayerId++, x: clamp(layer.x + 0.04, 0, 1), y: clamp(layer.y + 0.04, 0, 1) };
    setLayers((previous) => [...previous, copy]);
    setSelectedId(copy.id);
  }

  function remove(id: number) {
    setLayers((previous) => previous.filter((layer) => layer.id !== id));
    setSelectedId(null);
  }

  function move(id: number, direction: -1 | 1) {
    setLayers((previous) => {
      const index = previous.findIndex((layer) => layer.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target] as Layer, next[index] as Layer];
      return next;
    });
  }

  function toScene(event: { clientX: number; clientY: number }): Point {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [((event.clientX - rect.left) / rect.width) * size.width, ((event.clientY - rect.top) / rect.height) * size.height];
  }

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const point = toScene(event);
    const hit = hitLayer(layers, point, size.width, size.height);
    setSelectedId(hit?.id ?? null);
    if (hit) {
      dragRef.current = { kind: "move", start: point, origin: hit };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function startHandle(event: ReactPointerEvent<SVGElement>, kind: "scale" | "rotate") {
    event.stopPropagation();
    if (!selected) return;
    dragRef.current = { kind, origin: selected };
    overlayRef.current?.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const [px, py] = toScene(event);
    const { origin } = drag;

    if (drag.kind === "move") {
      update(origin.id, {
        x: clamp(origin.x + (px - drag.start[0]) / size.width, -0.1, 1.1),
        y: clamp(origin.y + (py - drag.start[1]) / size.height, -0.1, 1.1)
      });
      return;
    }

    const [cx, cy] = [origin.x * size.width, origin.y * size.height];
    if (drag.kind === "scale") {
      const def = shapeById(origin.shape);
      update(origin.id, { size: clamp(Math.hypot(px - cx, py - cy) / (Math.hypot(def.hw, def.hh) * big), 0.015, 1) });
      return;
    }

    const degrees = (Math.atan2(py - cy, px - cx) * 180) / Math.PI + 90;
    update(origin.id, { rotation: Math.round(((degrees + 540) % 360) - 180) });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!selected) return;
    const step = event.shiftKey ? 0.02 : 0.005;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const delta = arrows[event.key];
    if (delta) {
      event.preventDefault();
      update(selected.id, { x: selected.x + delta[0], y: selected.y + delta[1] });
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      remove(selected.id);
    } else if (event.key === "Escape") {
      setSelectedId(null);
    }
  }

  function download() {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawScene(ctx, scene, size.width, size.height, grain, seed, layers);
    downloadCanvas(canvas, `wallpaper-${style}-${seed}.png`);
  }

  const def = selected ? shapeById(selected.shape) : null;
  const handle = 7 * unit;
  const armLength = 30 * unit;

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
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">{t("wallpaper.paletteKind")}</span>
          <div role="radiogroup" aria-label={t("wallpaper.paletteKind")} className="flex gap-1.5">
            {paletteKinds.map((option) => (
              <button key={option} role="radio" aria-checked={paletteKind === option} onClick={() => setPaletteKind(option)} className="chip">
                {t(`wallpaper.paletteKinds.${option}`)}
              </button>
            ))}
          </div>
        </div>
        <Field label={t("wallpaper.base")}>
          <input type="color" value={baseHex} onChange={(event) => setBaseHex(event.target.value)} className="h-9 w-full cursor-pointer rounded-full border border-border bg-transparent p-0.5" />
        </Field>
        {paletteKind === "harmony" && (
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
        )}
        <Field label={t("wallpaper.complexity")} value={style === "plain" ? "—" : `${count}`}>
          <input type="range" min={2} max={14} value={count} disabled={style === "plain"} onChange={(event) => setCount(Number(event.target.value))} className="w-full accent-accent disabled:opacity-40" />
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
      <div className="min-w-0 space-y-3">
        <section className="panel space-y-3">
          <div className="flex justify-center rounded-2xl border border-border bg-surface p-2">
            <div
              tabIndex={0}
              role="application"
              aria-label={t("wallpaper.editHint")}
              onKeyDown={onKeyDown}
              className="relative inline-block max-w-full rounded-xl outline-offset-4"
            >
              <canvas ref={canvasRef} role="img" aria-label={t("wallpaper.preview")} className="block max-h-[70vh] w-auto max-w-full rounded-xl" />
              <svg
                ref={overlayRef}
                viewBox={`0 0 ${size.width} ${size.height}`}
                preserveAspectRatio="none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => (dragRef.current = null)}
                onPointerCancel={() => (dragRef.current = null)}
                className="absolute inset-0 size-full touch-none"
              >
                {selected && def && (
                  <g transform={`translate(${selected.x * size.width} ${selected.y * size.height}) rotate(${selected.rotation})`}>
                    {[0, 1].map((pass) => (
                      <rect
                        key={pass}
                        x={-def.hw * selected.size * big}
                        y={-def.hh * selected.size * big}
                        width={2 * def.hw * selected.size * big}
                        height={2 * def.hh * selected.size * big}
                        fill="none"
                        stroke={pass === 0 ? "white" : "var(--accent)"}
                        strokeWidth={pass === 0 ? 3.5 : 1.5}
                        strokeDasharray={pass === 0 ? undefined : "6 4"}
                        opacity={pass === 0 ? 0.7 : 1}
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <line x1={0} y1={-def.hh * selected.size * big} x2={0} y2={-def.hh * selected.size * big - armLength} stroke="var(--accent)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                    <circle
                      cx={0}
                      cy={-def.hh * selected.size * big - armLength}
                      r={handle}
                      fill="var(--accent)"
                      stroke="white"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      className="cursor-grab"
                      data-handle="rotate"
                      onPointerDown={(event) => startHandle(event, "rotate")}
                    />
                    {([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sy]) => (
                      <circle
                        key={`${sx}${sy}`}
                        cx={sx * def.hw * selected.size * big}
                        cy={sy * def.hh * selected.size * big}
                        r={handle}
                        fill="white"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        className="cursor-nwse-resize"
                        data-handle="scale"
                        onPointerDown={(event) => startHandle(event, "scale")}
                      />
                    ))}
                  </g>
                )}
              </svg>
            </div>
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
        <section className="panel space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{t("wallpaper.shapesTitle")}</h2>
            <div className="flex gap-1.5">
              <button onClick={scatter} className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-medium transition-colors hover:border-accent">
                <Sparkles size={14} />
                {t("wallpaper.scatter")}
              </button>
              <button
                onClick={() => {
                  setLayers([]);
                  setSelectedId(null);
                }}
                disabled={layers.length === 0}
                className="h-9 rounded-full border border-border bg-surface px-3.5 text-xs font-medium transition-colors hover:border-accent disabled:opacity-40"
              >
                {t("wallpaper.clearShapes")}
              </button>
            </div>
          </div>
          {groups.map((group) => (
            <div key={group} className="space-y-2">
              <p className="text-xs font-medium text-muted">{t(`wallpaper.groups.${group}`)}</p>
              <div className="flex flex-wrap gap-1.5">
                {shapeDefs
                  .filter((shape) => shape.group === group)
                  .map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => addLayer(shape.id)}
                      aria-label={`${t("wallpaper.addShape")}: ${t(`wallpaper.shapeNames.${shape.id}`)}`}
                      title={t(`wallpaper.shapeNames.${shape.id}`)}
                      className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface transition-colors hover:border-accent hover:bg-sage-soft"
                    >
                      <svg viewBox="-1.1 -1.1 2.2 2.2" className="size-7" aria-hidden="true">
                        <path d={pathData(shape.points)} fill="currentColor" />
                      </svg>
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {!selected && <p className="text-xs text-muted">{t("wallpaper.emptyShapes")}</p>}
          {selected && (
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t(`wallpaper.shapeNames.${selected.shape}`)}</h3>
                <div className="flex gap-1">
                  {[
                    { label: t("wallpaper.backward"), icon: ArrowDown, run: () => move(selected.id, -1) },
                    { label: t("wallpaper.forward"), icon: ArrowUp, run: () => move(selected.id, 1) },
                    { label: t("wallpaper.duplicate"), icon: Copy, run: () => duplicate(selected) },
                    { label: t("wallpaper.delete"), icon: Trash2, run: () => remove(selected.id) }
                  ].map(({ label, icon: Icon, run }) => (
                    <button key={label} onClick={run} aria-label={label} title={label} className="flex size-9 items-center justify-center rounded-full border border-border bg-elevated text-muted transition-colors hover:text-foreground">
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted">{t("wallpaper.color")}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {scene.palette.map((color, index) => (
                    <button
                      key={`${color}-${index}`}
                      onClick={() => update(selected.id, { color })}
                      aria-label={color}
                      aria-pressed={selected.color === color}
                      className="size-8 rounded-full border border-border aria-pressed:ring-2 aria-pressed:ring-accent aria-pressed:ring-offset-2 aria-pressed:ring-offset-surface"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input type="color" value={selected.color} aria-label={t("wallpaper.color")} onChange={(event) => update(selected.id, { color: event.target.value })} className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0.5" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={t("wallpaper.shapeSize")} value={`${Math.round(selected.size * 100)}%`}>
                  <input type="range" min={2} max={100} value={Math.round(selected.size * 100)} onChange={(event) => update(selected.id, { size: Number(event.target.value) / 100 })} className="w-full accent-accent" />
                </Field>
                <Field label={t("wallpaper.rotation")} value={`${selected.rotation}°`}>
                  <input type="range" min={-180} max={180} value={selected.rotation} onChange={(event) => update(selected.id, { rotation: Number(event.target.value) })} className="w-full accent-accent" />
                </Field>
                <Field label={t("wallpaper.opacity")} value={`${Math.round(selected.opacity * 100)}%`}>
                  <input type="range" min={5} max={100} value={Math.round(selected.opacity * 100)} onChange={(event) => update(selected.id, { opacity: Number(event.target.value) / 100 })} className="w-full accent-accent" />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium">
                <input type="checkbox" checked={selected.outline} onChange={(event) => update(selected.id, { outline: event.target.checked })} className="size-4 accent-accent" />
                {t("wallpaper.outline")}
              </label>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
