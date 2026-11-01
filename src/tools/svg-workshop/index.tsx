import { useRef, useState } from "react";
import { Download, FileUp, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

const starter = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" role="img" aria-labelledby="title">
  <title id="title">A simple composition</title>
  <rect width="640" height="420" rx="28" fill="#eaddff"/>
  <circle cx="320" cy="210" r="112" fill="#6750a4"/>
  <path d="M250 230 320 105 390 230Z" fill="#ffdadf"/>
</svg>`;

function safePreview(source: string) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s+(href|xlink:href)\s*=\s*(["'])\s*(https?:|javascript:|data:text\/html).*?\2/gi, "");
}

export default function SvgWorkshop() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState(starter);
  const [error, setError] = useState("");

  function update(value: string) {
    setSource(value);
    setError("");
  }

  async function openFile(file?: File) {
    if (!file) return;
    if (!/\.svg$/i.test(file.name) && file.type !== "image/svg+xml") {
      setError(t("svg.invalidFile"));
      return;
    }
    update(await file.text());
  }

  function download() {
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "artwork.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function format() {
    const formatted = source
      .replace(/>\s*</g, ">\n  <")
      .replace(/\s+(xmlns|viewBox|width|height|fill|stroke)=/g, "\n  $1=");
    update(formatted);
  }

  const preview = safePreview(source);

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="panel min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">{t("svg.source")}</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-xs font-medium hover:border-accent">
              <FileUp size={14} aria-hidden="true" />{t("svg.import")}
            </button>
            <input ref={inputRef} type="file" accept=".svg,image/svg+xml" className="sr-only" onChange={(event) => void openFile(event.target.files?.[0])} aria-label={t("svg.import")} />
            <button type="button" onClick={format} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-xs font-medium hover:border-accent">
              <RotateCcw size={14} aria-hidden="true" />{t("svg.format")}
            </button>
          </div>
        </div>
        <label className="sr-only" htmlFor="svg-source">{t("svg.source")}</label>
        <textarea id="svg-source" value={source} onChange={(event) => update(event.target.value)} spellCheck={false} aria-describedby="svg-help" className="min-h-[28rem] w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        <p id="svg-help" className="text-xs leading-relaxed text-muted">{t("svg.help")}</p>
        {error && <p role="alert" className="text-xs text-clay">{error}</p>}
        <button type="button" onClick={download} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:opacity-90">
          <Download size={16} aria-hidden="true" />{t("svg.download")}
        </button>
      </section>
      <section className="panel min-w-0 space-y-4">
        <h2 className="text-base font-semibold">{t("svg.preview")}</h2>
        <div className="checker flex min-h-[28rem] items-center justify-center overflow-hidden rounded-2xl border border-border p-4">
          <iframe title={t("svg.previewTitle")} sandbox="" srcDoc={preview} className="h-full min-h-[26rem] w-full rounded-xl border-0 bg-transparent" />
        </div>
      </section>
    </div>
  );
}
