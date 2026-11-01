import { useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

function luminance(hex: string) {
  const channels = hex.replace("#", "").match(/[0-9a-f]{2}/gi)?.map((part) => parseInt(part, 16) / 255) ?? [0, 0, 0];
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

export default function Accessibility() {
  const { t } = useTranslation();
  const [foreground, setForeground] = useState("#1d1b20");
  const [background, setBackground] = useState("#fffbfe");
  const ratio = contrast(foreground, background);
  const pass = (minimum: number) => ratio >= minimum;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
      <section className="panel space-y-6">
        <h2 className="text-base font-semibold">{t("accessibility.colors")}</h2>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
          <span className="text-sm font-medium">{t("accessibility.foreground")}</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted">{foreground.toUpperCase()}</span>
            <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} aria-label={t("accessibility.foreground")} className="size-11 cursor-pointer rounded-xl border border-border bg-transparent p-1" />
          </span>
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
          <span className="text-sm font-medium">{t("accessibility.background")}</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted">{background.toUpperCase()}</span>
            <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} aria-label={t("accessibility.background")} className="size-11 cursor-pointer rounded-xl border border-border bg-transparent p-1" />
          </span>
        </label>
        <div className="rounded-2xl border border-border bg-surface p-4" aria-live="polite" aria-atomic="true">
          <p className="text-xs font-medium text-muted">{t("accessibility.ratio")}</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{ratio.toFixed(2)}:1</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {([{ label: t("accessibility.aaNormal"), value: 4.5 }, { label: t("accessibility.aaLarge"), value: 3 }, { label: t("accessibility.aaaNormal"), value: 7 }, { label: t("accessibility.aaaLarge"), value: 4.5 }]).map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-elevated px-3 py-2 text-xs">
                <span>{item.label}</span>
                <span className={pass(item.value) ? "inline-flex items-center gap-1 font-semibold text-accent" : "inline-flex items-center gap-1 font-semibold text-clay"}>
                  {pass(item.value) ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                  {pass(item.value) ? t("accessibility.pass") : t("accessibility.fail")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="panel space-y-4">
        <h2 className="text-base font-semibold">{t("accessibility.preview")}</h2>
        <div className="flex min-h-64 flex-col justify-center rounded-2xl p-6" style={{ color: foreground, backgroundColor: background }}>
          <p className="text-2xl font-semibold">{t("accessibility.sampleTitle")}</p>
          <p className="mt-3 text-sm leading-relaxed">{t("accessibility.sampleBody")}</p>
          <button type="button" className="mt-5 min-h-11 self-start rounded-full border-2 px-5 text-sm font-semibold" style={{ borderColor: foreground }}>{t("accessibility.sampleButton")}</button>
        </div>
        <p className="text-xs leading-relaxed text-muted">{t("accessibility.note")}</p>
      </section>
    </div>
  );
}
