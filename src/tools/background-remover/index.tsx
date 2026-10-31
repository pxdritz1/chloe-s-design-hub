import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field } from "../../components/Field";
import { ImageDropzone, ImagePicker } from "../../components/ImageDropzone";
import { baseName, decodeImage, downloadCanvas } from "../../lib/image";
import { parseColor } from "../color-tools/color";
import { applyMask, modelSize, resizeBilinear, type MaskSettings } from "./mask";
import { useBackgroundWorker } from "./useBackgroundWorker";

const maxSide = 2000;

interface Source {
  name: string;
  width: number;
  height: number;
  data: ImageData;
  scaled: boolean;
  mask: Float32Array;
}

type Status = "idle" | "model" | "working" | "ready" | "error";

export default function BackgroundRemover() {
  const { t } = useTranslation();
  const { loadModel, predict } = useBackgroundWorker();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [cutoff, setCutoff] = useState(50);
  const [softness, setSoftness] = useState(20);
  const [solid, setSolid] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [showOriginal, setShowOriginal] = useState(false);

  const settings = useMemo<MaskSettings>(
    () => ({ threshold: cutoff / 100, softness: softness / 100, background: solid ? parseColor(color) : null }),
    [cutoff, softness, solid, color]
  );
  const deferred = useDeferredValue(settings);
  const result = useMemo(() => (source ? applyMask(source.data.data, source.mask, deferred) : null), [source, deferred]);
  const visible = showOriginal ? source?.data.data : result;
  const busy = status === "model" || status === "working";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source || !visible) return;
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext("2d")?.putImageData(new ImageData(visible, source.width, source.height), 0, 0);
  }, [source, visible]);

  async function load(file: File) {
    try {
      setStatus("model");
      const decoded = await decodeImage(file, maxSide);
      await loadModel();
      setStatus("working");
      const raw = await predict(decoded.data.data, decoded.width, decoded.height);
      const mask = resizeBilinear(raw, modelSize, modelSize, decoded.width, decoded.height);
      setSource({ name: file.name, mask, ...decoded });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function download() {
    if (!source || !result) return;
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext("2d")?.putImageData(new ImageData(result, source.width, source.height), 0, 0);
    downloadCanvas(canvas, `${baseName(source.name)}-cutout.png`);
  }

  const statusText = status === "model" ? t("removeBg.loadingModel") : status === "working" ? t("removeBg.working") : null;

  return (
    <div className="grid gap-3 lg:grid-cols-[23rem_minmax(0,1fr)]">
      <section className="panel space-y-6">
        <fieldset disabled={!source || busy} className="min-w-0 space-y-5 border-0 p-0 disabled:opacity-50">
          <h2 className="text-base font-semibold">{t("removeBg.settings")}</h2>
          <Field label={t("removeBg.cutoff")} value={`${cutoff}%`}>
            <input type="range" min={5} max={95} value={cutoff} onChange={(event) => setCutoff(Number(event.target.value))} className="w-full accent-accent" />
          </Field>
          <Field label={t("removeBg.softness")} value={`${softness}%`}>
            <input type="range" min={0} max={60} value={softness} onChange={(event) => setSoftness(Number(event.target.value))} className="w-full accent-accent" />
          </Field>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted">{t("removeBg.background")}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <div role="radiogroup" aria-label={t("removeBg.background")} className="flex gap-1.5">
                <button role="radio" aria-checked={!solid} onClick={() => setSolid(false)} className="chip">
                  {t("removeBg.transparent")}
                </button>
                <button role="radio" aria-checked={solid} onClick={() => setSolid(true)} className="chip">
                  {t("removeBg.color")}
                </button>
              </div>
              <input
                type="color"
                value={color}
                disabled={!solid}
                aria-label={t("removeBg.color")}
                onChange={(event) => setColor(event.target.value)}
                className="size-9 cursor-pointer rounded-full border border-border bg-transparent p-0.5 disabled:opacity-40"
              />
            </div>
          </div>
        </fieldset>
        <p className="text-xs leading-relaxed text-muted">{t("removeBg.note")}</p>
        <div className="space-y-2">
          {source && <ImagePicker onFile={(file) => void load(file)} />}
          <button
            onClick={download}
            disabled={!source || busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent transition-opacity disabled:opacity-40"
          >
            <Download size={16} />
            {t("image.download")}
          </button>
        </div>
      </section>
      <section className="panel min-h-[26rem]">
        {!source && <ImageDropzone onFile={(file) => void load(file)} busy={busy} label={statusText ?? undefined} />}
        {source && (
          <div className="space-y-3">
            <div className="flex min-h-9 items-center gap-2">
              <p aria-live="polite" className="text-sm text-muted">{statusText}</p>
              <button role="checkbox" aria-checked={showOriginal} onClick={() => setShowOriginal(!showOriginal)} className="chip ml-auto">
                {t("removeBg.original")}
              </button>
            </div>
            <div className={`checker flex justify-center rounded-2xl border border-border p-2 transition-opacity ${busy ? "opacity-50" : ""}`}>
              <canvas ref={canvasRef} role="img" aria-label={t("removeBg.preview")} className="max-h-[70vh] w-auto max-w-full rounded-xl" />
            </div>
            {source.scaled && <p className="text-xs text-muted">{t("image.scaled", { size: maxSide })}</p>}
          </div>
        )}
        {status === "error" && (
          <p role="alert" className="mt-3 text-sm text-clay">
            {t("removeBg.error")}
          </p>
        )}
      </section>
    </div>
  );
}
