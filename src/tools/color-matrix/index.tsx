import { useDeferredValue, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowRight, Check, Copy, Download, Pipette, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field } from "../../components/Field";
import { ImageDropzone, ImagePicker } from "../../components/ImageDropzone";
import { useCopy } from "../../hooks/useCopy";
import { baseName, decodeImage, downloadCanvas } from "../../lib/image";
import { parseColor, rgbToHex, type Rgb } from "../color-tools/color";
import {
  channelOrders,
  identityMatrix,
  isIdentity,
  processPixels,
  samplePixel,
  type MatrixSettings,
  type SwapRule
} from "./matrix";

const maxSide = 2400;
const maxSwaps = 6;
const channels = ["r", "g", "b"] as const;

interface Source {
  name: string;
  width: number;
  height: number;
  data: ImageData;
  scaled: boolean;
}

type Status = "idle" | "loading" | "ready" | "error";

let nextId = 1;

export default function ColorMatrix() {
  const { t } = useTranslation();
  const { copied, copy } = useCopy();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [swaps, setSwaps] = useState<SwapRule[]>([]);
  const [matrix, setMatrix] = useState<MatrixSettings>(identityMatrix);
  const [pickTarget, setPickTarget] = useState<number | null>(null);
  const [picked, setPicked] = useState<Rgb | null>(null);
  const [hover, setHover] = useState<Rgb | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const options = useMemo(() => ({ swaps, matrix }), [swaps, matrix]);
  const deferred = useDeferredValue(options);
  const processed = useMemo(() => (source ? processPixels(source.data.data, deferred) : null), [source, deferred]);

  const visible = showOriginal ? source?.data.data : processed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source || !visible) return;
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext("2d")?.putImageData(new ImageData(visible, source.width, source.height), 0, 0);
  }, [source, visible]);

  async function load(file: File) {
    setStatus("loading");
    try {
      const decoded = await decodeImage(file, maxSide);
      setSource({ name: file.name, ...decoded });
      setSwaps([]);
      setMatrix(identityMatrix);
      setPickTarget(null);
      setPicked(null);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function locate(event: PointerEvent<HTMLCanvasElement>): Rgb | null {
    if (!source) return null;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(source.width - 1, Math.max(0, Math.floor(((event.clientX - rect.left) * source.width) / rect.width)));
    const y = Math.min(source.height - 1, Math.max(0, Math.floor(((event.clientY - rect.top) * source.height) / rect.height)));
    return samplePixel(source.data.data, source.width, x, y);
  }

  function updateSwap(id: number, change: Partial<SwapRule>) {
    setSwaps((rules) => rules.map((rule) => (rule.id === id ? { ...rule, ...change } : rule)));
  }

  function addSwap(from: Rgb = { r: 200, g: 80, b: 80 }, pick = false) {
    if (swaps.length >= maxSwaps) return;
    const id = nextId++;
    setSwaps((rules) => [...rules, { id, from, to: from, tolerance: 12, keepShading: true }]);
    setPickTarget(pick ? id : null);
  }

  function onCanvasClick(event: PointerEvent<HTMLCanvasElement>) {
    const color = locate(event);
    if (!color) return;
    setPicked(color);
    if (pickTarget !== null) {
      updateSwap(pickTarget, { from: color });
      setPickTarget(null);
    }
  }

  function download() {
    if (!source || !processed) return;
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext("2d")?.putImageData(new ImageData(processed, source.width, source.height), 0, 0);
    downloadCanvas(canvas, `${baseName(source.name)}-recolor.png`);
  }

  const pickedHex = picked ? rgbToHex(picked) : null;
  const hoverHex = hover ? rgbToHex(hover) : null;
  const changed = !isIdentity(options);

  return (
    <div className="grid gap-3 lg:grid-cols-[23rem_minmax(0,1fr)]">
      <section className="panel space-y-6">
        <fieldset disabled={!source} className="min-w-0 space-y-6 border-0 p-0 disabled:opacity-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{t("colorMatrix.swaps")}</h2>
              <button
                onClick={() => addSwap(picked ?? undefined, !picked)}
                disabled={swaps.length >= maxSwaps}
                className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-medium transition-colors hover:border-accent disabled:opacity-40"
              >
                <Plus size={14} />
                {t("colorMatrix.addSwap")}
              </button>
            </div>
            <ul className="space-y-2">
              {swaps.map((rule) => {
                const picking = pickTarget === rule.id;
                return (
                  <li key={rule.id} className="space-y-3 rounded-2xl border border-border bg-surface p-3">
                    <div className="flex items-center gap-2">
                      <button
                        aria-pressed={picking}
                        aria-label={t("colorMatrix.pickFromImage")}
                        onClick={() => setPickTarget(picking ? null : rule.id)}
                        className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-elevated px-3 text-xs font-medium transition-colors aria-pressed:border-accent aria-pressed:bg-sage-soft"
                      >
                        <span className="size-5 shrink-0 rounded-full border border-border" style={{ backgroundColor: rgbToHex(rule.from) }} />
                        <span className="truncate">{picking ? t("colorMatrix.picking") : rgbToHex(rule.from)}</span>
                        <Pipette size={14} className="ml-auto shrink-0 text-muted" />
                      </button>
                      <ArrowRight size={16} className="shrink-0 text-muted" />
                      <input
                        type="color"
                        value={rgbToHex(rule.to)}
                        aria-label={t("colorMatrix.to")}
                        onChange={(event) => {
                          const color = parseColor(event.target.value);
                          if (color) updateSwap(rule.id, { to: color });
                        }}
                        className="size-10 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
                      />
                      <button
                        onClick={() => setSwaps((rules) => rules.filter((item) => item.id !== rule.id))}
                        aria-label={t("colorMatrix.remove")}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-foreground"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <Field label={t("colorMatrix.tolerance")} value={`${rule.tolerance}%`}>
                      <input type="range" min={0} max={100} value={rule.tolerance} onChange={(event) => updateSwap(rule.id, { tolerance: Number(event.target.value) })} className="w-full accent-accent" />
                    </Field>
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <input type="checkbox" checked={rule.keepShading} onChange={(event) => updateSwap(rule.id, { keepShading: event.target.checked })} className="size-4 accent-accent" />
                      {t("colorMatrix.keepShading")}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="text-base font-semibold">{t("colorMatrix.channels")}</h2>
            <div role="radiogroup" aria-label={t("colorMatrix.order")} className="flex flex-wrap gap-1.5">
              {channelOrders.map((order) => (
                <button key={order} role="radio" aria-checked={matrix.order === order} onClick={() => setMatrix({ ...matrix, order })} className="chip">
                  {order}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted">{t("colorMatrix.invert")}</span>
              {channels.map((channel, index) => (
                <button
                  key={channel}
                  role="checkbox"
                  aria-checked={matrix.invert[index]}
                  aria-label={`${t("colorMatrix.invert")} ${t(`colorMatrix.${channel}`)}`}
                  onClick={() => {
                    const invert: MatrixSettings["invert"] = [...matrix.invert];
                    invert[index] = !invert[index];
                    setMatrix({ ...matrix, invert });
                  }}
                  className="chip"
                >
                  {channel}
                </button>
              ))}
            </div>
            <Field label={t("colorMatrix.saturation")} value={`${Math.round(matrix.saturation * 100)}%`}>
              <input type="range" min={0} max={2} step={0.05} value={matrix.saturation} onChange={(event) => setMatrix({ ...matrix, saturation: Number(event.target.value) })} className="w-full accent-accent" />
            </Field>
          </div>
        </fieldset>
        <div className="space-y-2">
          {source && <ImagePicker onFile={(file) => void load(file)} />}
          <button
            onClick={() => {
              setSwaps([]);
              setMatrix(identityMatrix);
              setPickTarget(null);
            }}
            disabled={!source || !changed}
            className="h-10 w-full rounded-full border border-border bg-surface text-xs font-medium transition-colors hover:border-accent disabled:opacity-40"
          >
            {t("colorMatrix.reset")}
          </button>
          <button
            onClick={download}
            disabled={!source}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent transition-opacity disabled:opacity-40"
          >
            <Download size={16} />
            {t("image.download")}
          </button>
        </div>
      </section>
      <section className="panel min-h-[26rem]">
        {!source && <ImageDropzone onFile={(file) => void load(file)} busy={status === "loading"} />}
        {source && (
          <div className="space-y-3">
            <div className="flex min-h-9 flex-wrap items-center gap-2">
              {pickedHex && picked && (
                <span className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1.5 pr-1 text-xs font-medium">
                  <span className="size-5 rounded-full border border-border" style={{ backgroundColor: pickedHex }} />
                  {pickedHex}
                  <button onClick={() => void copy(pickedHex)} aria-label={`${t("colorMatrix.copy")} ${pickedHex}`} className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-elevated hover:text-foreground">
                    {copied === pickedHex ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => addSwap(picked)} className="rounded-full bg-sage-soft px-2.5 py-1 text-[11px]">
                    {t("colorMatrix.swapThis")}
                  </button>
                </span>
              )}
              {hoverHex && hover && (
                <span className="flex items-center gap-2 text-xs text-muted">
                  <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: hoverHex }} />
                  {hoverHex}
                </span>
              )}
              <button role="checkbox" aria-checked={showOriginal} onClick={() => setShowOriginal(!showOriginal)} className="chip ml-auto">
                {t("colorMatrix.original")}
              </button>
            </div>
            <div className="checker flex justify-center rounded-2xl border border-border p-2">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={t("colorMatrix.preview")}
                onPointerMove={(event) => setHover(locate(event))}
                onPointerLeave={() => setHover(null)}
                onClick={onCanvasClick}
                className="max-h-[70vh] w-auto max-w-full cursor-crosshair rounded-xl"
              />
            </div>
            {pickTarget !== null && <p className="text-xs text-muted">{t("colorMatrix.picking")}</p>}
            {source.scaled && <p className="text-xs text-muted">{t("image.scaled", { size: maxSide })}</p>}
          </div>
        )}
        {status === "error" && (
          <p role="alert" className="mt-3 text-sm text-clay">
            {t("image.error")}
          </p>
        )}
      </section>
    </div>
  );
}
