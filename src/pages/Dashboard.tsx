import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toneClasses, tools } from "../config/tools";

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-accent">chloe's design hub</p>
        <h1 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">{t("greeting")}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t("intro")}</p>
      </section>
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{t("allTools")}</h2>
            <p className="mt-1 text-sm text-muted">{t("pickTool")}</p>
          </div>
          <span className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted">
            {t("toolCount", { count: tools.length })}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                to={`/tools/${tool.id}`}
                className="group flex min-h-48 flex-col rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-elevated hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex size-11 items-center justify-center rounded-2xl ${toneClasses[tool.tone]}`}>
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <ArrowUpRight
                    size={17}
                    className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
                <div className="mt-auto pt-7">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-[.14em] text-muted">
                    {t(`category.${tool.category}`)}
                  </p>
                  <h3 className="text-base font-semibold tracking-tight">{t(`tools.${tool.key}.name`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`tools.${tool.key}.description`)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-elevated p-6 sm:p-7">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-lg font-semibold">{t("local")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("localDescription")}</p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-accent p-6 text-white sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/70">{t("creativeSpace")}</p>
          <div className="mt-8">
            <p className="text-2xl font-semibold tracking-tight">{t("greeting")}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{t("intro")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
