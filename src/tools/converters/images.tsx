import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field } from "../../components/Field";
import { ImageDropzone } from "../../components/ImageDropzone";
import { changeLabel, formatBytes, formats, mimeTypes, outputName, scaledSize, type Format } from "./convert";

const scales = [1, 0.75, 0.5, 0.25] as const;

interface Entry {
  id: number;
  file: File;
}

interface Result {
  blob: Blob;
  width: number;
  height: number;
}

interface Settings {
  format: Format;
  quality: number;
  scale: number;
  background: string;
}

let nextId = 1;

async function convertFile(file: File, settings: Settings): Promise<Result> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = scaledSize(bitmap.width, bitmap.height, settings.scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("2d canvas is not available");
  }
  if (settings.format === "jpeg") {
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = mimeTypes[settings.format];
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, settings.quality / 100));
  if (!blob || blob.type !== mime) throw new Error(`${settings.format} is not supported here`);
  return { blob, width, height };
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Thumb({ blob }: { blob: Blob | undefined }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  return (
    <span className="checker size-14 shrink-0 overflow-hidden rounded-xl border border-border">
      {url && <img src={url} alt="" className="size-full object-cover" />}
    </span>
  );
}

export function ImageConverter() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [results, setResults] = useState<Map<number, Result | "error">>(new Map());
  const [format, setFormat] = useState<Format>("webp");
  const [quality, setQuality] = useState(85);
  const [scale, setScale] = useState(1);
  const [background, setBackground] = useState("#ffffff");

  const settings = useMemo<Settings>(() => ({ format, quality, scale, background }), [format, quality, scale, background]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (const entry of entries) {
        if (cancelled) return;
        let outcome: Result | "error";
        try {
          outcome = await convertFile(entry.file, settings);
        } catch {
          outcome = "error";
        }
        if (cancelled) return;
        setResults((previous) => new Map(previous).set(entry.id, outcome));
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [entries, settings]);

  function addFile(file: File) {
    setEntries((previous) => [...previous, { id: nextId++, file }]);
  }

  function remove(id: number) {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  }

  function downloadAll() {
    entries.forEach((entry, index) => {
      const result = results.get(entry.id);
      if (result && result !== "error") window.setTimeout(() => save(result.blob, outputName(entry.file.name, format)), index * 250);
    });
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[23rem_minmax(0,1fr)]">
      <section className="panel space-y-5">
        <h2 className="text-base font-semibold">{t("converters.format")}</h2>
        <div role="radiogroup" aria-label={t("converters.format")} className="flex gap-1.5">
          {formats.map((option) => (
            <button key={option} role="radio" aria-checked={format === option} onClick={() => setFormat(option)} className="chip">
              {option === "jpeg" ? "jpg" : option}
            </button>
          ))}
        </div>
        <Field label={t("converters.quality")} value={format === "png" ? "—" : `${quality}%`}>
          <input type="range" min={10} max={100} value={quality} disabled={format === "png"} onChange={(event) => setQuality(Number(event.target.value))} className="w-full accent-accent disabled:opacity-40" />
        </Field>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">{t("converters.scale")}</span>
          <div role="radiogroup" aria-label={t("converters.scale")} className="flex flex-wrap gap-1.5">
            {scales.map((option) => (
              <button key={option} role="radio" aria-checked={scale === option} onClick={() => setScale(option)} className="chip">
                {option * 100}%
              </button>
            ))}
          </div>
        </div>
        {format === "jpeg" && (
          <Field label={t("converters.background")}>
            <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-9 w-full cursor-pointer rounded-full border border-border bg-transparent p-0.5" />
          </Field>
        )}
        {entries.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={downloadAll}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent"
            >
              <Download size={16} />
              {entries.length > 1 ? t("converters.downloadAll") : t("converters.download")}
            </button>
            <button
              onClick={() => {
                setEntries([]);
                setResults(new Map());
              }}
              className="h-10 w-full rounded-full border border-border bg-surface text-xs font-medium transition-colors hover:border-accent"
            >
              {t("converters.clear")}
            </button>
          </div>
        )}
      </section>
      <section className="panel min-h-[22rem] space-y-3">
        <ImageDropzone onFile={addFile} multiple compact label={entries.length ? t("converters.addMore") : undefined} hint={t("converters.imagesHint")} />
        <ul className="space-y-2">
          {entries.map((entry) => {
            const result = results.get(entry.id);
            const done = result && result !== "error" ? result : undefined;
            return (
              <li key={entry.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-2.5">
                <Thumb blob={done?.blob} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{outputName(entry.file.name, format)}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {result === "error"
                      ? t("converters.failed")
                      : done
                        ? `${done.width}×${done.height} · ${formatBytes(entry.file.size)} → ${formatBytes(done.blob.size)} (${changeLabel(entry.file.size, done.blob.size)})`
                        : t("converters.converting")}
                  </p>
                </div>
                {done && (
                  <button onClick={() => save(done.blob, outputName(entry.file.name, format))} aria-label={t("converters.download")} className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-foreground">
                    <Download size={16} />
                  </button>
                )}
                <button onClick={() => remove(entry.id)} aria-label={t("converters.remove")} className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-elevated hover:text-foreground">
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
