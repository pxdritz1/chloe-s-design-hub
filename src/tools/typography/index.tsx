import { useMemo, useState, type CSSProperties } from "react";
import { Check, Copy, FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field } from "../../components/Field";
import { useCopy } from "../../hooks/useCopy";
import { isFontInstalled } from "./detect";
import { buildScale, cssFamily, cssVariables, familyFromFile, ratios, type RatioId } from "./type";

const suggestions = [
  "SF Pro Display",
  "SF Pro Text",
  "SF Pro Rounded",
  "SF Mono",
  "Inter",
  "Helvetica Neue",
  "Arial",
  "Georgia",
  "Palatino",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
  "system-ui",
  "ui-serif",
  "ui-rounded",
  "ui-monospace"
];

const modes = ["specimen", "scale"] as const;

interface SlotProps {
  label: string;
  value: string;
  installed: boolean;
  onChange: (value: string) => void;
  onFile: (file: File) => void;
}

function FontSlot({ label, value, installed, onChange, onFile }: SlotProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Field label={label}>
        <input
          list="font-suggestions"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm"
        />
      </Field>
      <div className="flex items-center justify-between gap-2">
        <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium transition-colors hover:border-accent has-focus-visible:outline-2 has-focus-visible:outline-accent">
          <FileUp size={14} />
          {t("typography.load")}
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onFile(file);
            }}
          />
        </label>
        {!installed && <span className="text-xs text-clay">{t("typography.missing")}</span>}
      </div>
    </div>
  );
}

export default function Typography() {
  const { t } = useTranslation();
  const { copied, copy } = useCopy();
  const [mode, setMode] = useState<(typeof modes)[number]>("specimen");
  const [fonts, setFonts] = useState<[string, string]>(["SF Pro Display", "Georgia"]);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [sample, setSample] = useState<string | null>(null);
  const [size, setSize] = useState(40);
  const [weight, setWeight] = useState(400);
  const [leading, setLeading] = useState(1.3);
  const [tracking, setTracking] = useState(0);
  const [italic, setItalic] = useState(false);
  const [base, setBase] = useState(16);
  const [ratioId, setRatioId] = useState<RatioId>("majorThird");
  const [down, setDown] = useState(2);
  const [up, setUp] = useState(6);

  const text = sample ?? t("typography.sampleText");
  const installed = fonts.map((font) => loaded.includes(font) || isFontInstalled(font));
  const ratio = ratios.find((item) => item.id === ratioId)?.value ?? 1.25;
  const scale = useMemo(() => buildScale(base, ratio, down, up), [base, ratio, down, up]);
  const css = useMemo(() => cssVariables(scale), [scale]);

  const textStyle = (font: string): CSSProperties => ({
    fontFamily: cssFamily(font),
    fontSize: size,
    fontWeight: weight,
    lineHeight: leading,
    letterSpacing: `${tracking}em`,
    fontStyle: italic ? "italic" : "normal"
  });

  async function loadFont(index: 0 | 1, file: File) {
    setLoadError(false);
    try {
      const family = familyFromFile(file.name);
      const face = new FontFace(family, await file.arrayBuffer(), { weight: "100 900" });
      await face.load();
      document.fonts.add(face);
      setLoaded((previous) => [...previous, family]);
      setFonts((previous) => (index === 0 ? [family, previous[1]] : [previous[0], family]));
    } catch {
      setLoadError(true);
    }
  }

  return (
    <div className="space-y-3">
      <datalist id="font-suggestions">
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div role="radiogroup" aria-label={t("typography.mode")} className="flex gap-1.5">
        {modes.map((option) => (
          <button key={option} role="radio" aria-checked={mode === option} onClick={() => setMode(option)} className="chip">
            {t(`typography.${option}`)}
          </button>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[23rem_minmax(0,1fr)]">
        {mode === "specimen" ? (
          <>
            <section className="panel space-y-5">
              <FontSlot label={t("typography.fontA")} value={fonts[0]} installed={installed[0] ?? true} onChange={(value) => setFonts([value, fonts[1]])} onFile={(file) => void loadFont(0, file)} />
              <FontSlot label={t("typography.fontB")} value={fonts[1]} installed={installed[1] ?? true} onChange={(value) => setFonts([fonts[0], value])} onFile={(file) => void loadFont(1, file)} />
              {loadError && <p role="alert" className="text-xs text-clay">{t("typography.loadError")}</p>}
              <Field label={t("typography.sample")}>
                <textarea value={text} onChange={(event) => setSample(event.target.value)} rows={3} className="w-full resize-y rounded-2xl border border-border bg-surface p-3 text-sm" />
              </Field>
              <Field label={t("typography.size")} value={`${size}px`}>
                <input type="range" min={12} max={96} value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-full accent-accent" />
              </Field>
              <Field label={t("typography.weight")} value={`${weight}`}>
                <input type="range" min={100} max={900} step={100} value={weight} onChange={(event) => setWeight(Number(event.target.value))} className="w-full accent-accent" />
              </Field>
              <Field label={t("typography.leading")} value={leading.toFixed(2)}>
                <input type="range" min={1} max={2} step={0.05} value={leading} onChange={(event) => setLeading(Number(event.target.value))} className="w-full accent-accent" />
              </Field>
              <Field label={t("typography.tracking")} value={`${tracking.toFixed(2)}em`}>
                <input type="range" min={-0.05} max={0.2} step={0.005} value={tracking} onChange={(event) => setTracking(Number(event.target.value))} className="w-full accent-accent" />
              </Field>
              <label className="flex items-center gap-2 text-xs font-medium">
                <input type="checkbox" checked={italic} onChange={(event) => setItalic(event.target.checked)} className="size-4 accent-accent" />
                {t("typography.italic")}
              </label>
            </section>
            <section className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {fonts.map((font, index) => (
                  <article key={index} className="panel min-w-0">
                    <p className="mb-3 truncate text-xs font-medium text-muted">{font || "—"}</p>
                    <p style={textStyle(font)} className="break-words">
                      {text}
                    </p>
                  </article>
                ))}
              </div>
              <article className="panel">
                <p className="mb-4 text-xs font-medium text-muted">{t("typography.pairing")}</p>
                <h3 style={{ fontFamily: cssFamily(fonts[0]), fontSize: Math.min(64, Math.round(size * 1.4)), fontWeight: Math.max(weight, 600), lineHeight: 1.1, letterSpacing: "-0.02em" }} className="text-balance">
                  {t("typography.pairingTitle")}
                </h3>
                <p style={{ fontFamily: cssFamily(fonts[1], "serif"), fontSize: 18, lineHeight: 1.6 }} className="mt-4 max-w-xl text-pretty text-muted">
                  {t("typography.pairingBody")}
                </p>
              </article>
            </section>
          </>
        ) : (
          <>
            <section className="panel space-y-5">
              <Field label={t("typography.base")} value={`${base}px`}>
                <input type="range" min={12} max={24} value={base} onChange={(event) => setBase(Number(event.target.value))} className="w-full accent-accent" />
              </Field>
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted">{t("typography.ratio")}</span>
                <div role="radiogroup" aria-label={t("typography.ratio")} className="flex flex-wrap gap-1.5">
                  {ratios.map((option) => (
                    <button key={option.id} role="radio" aria-checked={ratioId === option.id} onClick={() => setRatioId(option.id)} className="chip">
                      {t(`typography.ratios.${option.id}`)} · {option.value}
                    </button>
                  ))}
                </div>
              </div>
              <Field label={t("typography.stepsDown")} value={`${down}`}>
                <input type="range" min={0} max={3} value={down} onChange={(event) => setDown(Number(event.target.value))} className="w-full accent-accent" />
              </Field>
              <Field label={t("typography.stepsUp")} value={`${up}`}>
                <input type="range" min={1} max={9} value={up} onChange={(event) => setUp(Number(event.target.value))} className="w-full accent-accent" />
              </Field>
              <FontSlot label={t("typography.fontA")} value={fonts[0]} installed={installed[0] ?? true} onChange={(value) => setFonts([value, fonts[1]])} onFile={(file) => void loadFont(0, file)} />
              <button onClick={() => void copy(css)} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent">
                {copied === css ? <Check size={16} /> : <Copy size={16} />}
                {copied === css ? t("typography.copied") : t("typography.copyCss")}
              </button>
            </section>
            <section className="panel">
              <ul className="divide-y divide-border">
                {[...scale].reverse().map((item) => (
                  <li key={item.step} className="grid grid-cols-[4.5rem_7rem_minmax(0,1fr)] items-center gap-3 py-3">
                    <span className="text-xs font-medium text-muted">
                      {t("typography.step")} {item.step}
                    </span>
                    <span className="text-xs text-muted">
                      {item.px}px · {item.rem}rem
                    </span>
                    <span style={{ fontFamily: cssFamily(fonts[0]), fontSize: item.px, lineHeight: item.lineHeight }} className="truncate">
                      {t("typography.scaleSample")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
