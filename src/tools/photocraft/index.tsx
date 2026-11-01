import { ExternalLink, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PhotoCraft() {
  const { t } = useTranslation();
  const editorUrl = `${import.meta.env.BASE_URL}photocraft/`;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex min-w-0 items-start gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">{t("photocraft.localTitle")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{t("photocraft.localNote")}</p>
          </div>
        </div>
        <a href={editorUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-elevated px-4 text-xs font-semibold transition-colors hover:border-accent">
          {t("photocraft.openNew")}
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-[#202020]">
        <iframe
          src={editorUrl}
          title={t("photocraft.frameTitle")}
          loading="lazy"
          allow="fullscreen; clipboard-read; clipboard-write"
          allowFullScreen
          className="h-[min(78vh,900px)] min-h-[620px] w-full border-0 bg-white"
        />
      </div>
      <p className="text-xs leading-relaxed text-muted">{t("photocraft.saveNote")}</p>
    </section>
  );
}
