import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  formatHsl,
  formatOklch,
  formatRgb,
  harmonies,
  harmony,
  isLight,
  parseColor,
  rgbToHex,
  toneScale,
  type HarmonyKind,
  type Rgb
} from "./color";

const initialText = "#7b8f76";
const initialColor: Rgb = { r: 123, g: 143, b: 118 };
const harmonyKinds = Object.keys(harmonies) as HarmonyKind[];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
    } catch {
      setCopied(null);
    }
  }

  return { copied, copy };
}

interface SwatchesProps {
  colors: Rgb[];
  copied: string | null;
  onCopy: (value: string) => void;
}

function Swatches({ colors, copied, onCopy }: SwatchesProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
      {colors.map((color, index) => {
        const hex = rgbToHex(color);
        return (
          <button
            key={`${hex}-${index}`}
            onClick={() => onCopy(hex)}
            aria-label={`${t("colorTools.copy")} ${hex}`}
            style={{ backgroundColor: hex, color: isLight(color) ? "#1b201b" : "#f3f1ea" }}
            className="flex h-20 items-end rounded-xl border border-border p-2.5 font-mono text-xs transition-transform hover:-translate-y-0.5"
          >
            {copied === hex ? t("colorTools.copied") : hex}
          </button>
        );
      })}
    </div>
  );
}

export default function ColorTools() {
  const { t } = useTranslation();
  const { copied, copy } = useCopy();
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState<Rgb>(initialColor);
  const [kind, setKind] = useState<HarmonyKind>("analogous");

  const hex = rgbToHex(color);
  const invalid = parseColor(text) === null;
  const formats = [
    ["hex", hex],
    ["rgb", formatRgb(color)],
    ["hsl", formatHsl(color)],
    ["oklch", formatOklch(color)]
  ] as const;

  function update(value: string) {
    setText(value);
    const parsed = parseColor(value);
    if (parsed) setColor(parsed);
  }

  const panel = "rounded-2xl border border-border bg-elevated p-5";

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <section className={panel}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={hex}
            onChange={(event) => update(event.target.value)}
            aria-label={t("colorTools.pick")}
            className="size-10 shrink-0 cursor-pointer rounded-xl border border-border bg-transparent p-0.5"
          />
          <input
            value={text}
            onChange={(event) => update(event.target.value)}
            aria-label={t("colorTools.input")}
            aria-invalid={invalid}
            aria-describedby={invalid ? "color-error" : undefined}
            spellCheck={false}
            className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 font-mono text-sm aria-[invalid=true]:border-clay"
          />
        </div>
        {invalid && (
          <p id="color-error" className="mt-2 text-xs text-clay">
            {t("colorTools.invalid")}
          </p>
        )}
        <div className="mt-4 h-32 rounded-xl border border-border" style={{ backgroundColor: hex }} />
      </section>
      <section className={panel}>
        <h2 className="mb-3 font-mono text-sm font-semibold">{t("colorTools.formats")}</h2>
        <ul className="space-y-2">
          {formats.map(([name, value]) => (
            <li key={name} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2">
              <span className="w-12 shrink-0 font-mono text-xs text-muted">{name}</span>
              <code className="min-w-0 flex-1 truncate font-mono text-sm">{value}</code>
              <button
                onClick={() => void copy(value)}
                aria-label={`${t("colorTools.copy")} ${name}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-foreground"
              >
                {copied === value ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className={`${panel} lg:col-span-2`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-sm font-semibold">{t("colorTools.harmony")}</h2>
          <div role="radiogroup" aria-label={t("colorTools.harmony")} className="flex flex-wrap gap-1.5">
            {harmonyKinds.map((option) => (
              <button
                key={option}
                role="radio"
                aria-checked={kind === option}
                onClick={() => setKind(option)}
                className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground aria-checked:border-accent aria-checked:bg-surface aria-checked:text-foreground"
              >
                {t(`colorTools.harmonies.${option}`)}
              </button>
            ))}
          </div>
        </div>
        <Swatches colors={harmony(color, kind)} copied={copied} onCopy={(value) => void copy(value)} />
      </section>
      <section className={`${panel} lg:col-span-2`}>
        <h2 className="mb-4 font-mono text-sm font-semibold">{t("colorTools.scale")}</h2>
        <Swatches colors={toneScale(color)} copied={copied} onCopy={(value) => void copy(value)} />
      </section>
    </div>
  );
}
