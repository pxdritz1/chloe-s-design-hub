import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toneClasses, tools } from "../config/tools";

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-12">
      <section className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-[-.04em] sm:text-6xl">{t("greeting")}</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{t("intro")}</p>
      </section>
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-base font-semibold">{t("allTools")}</h2>
            <p className="mt-1 text-sm text-muted">{t("pickTool")}</p>
          </div>
          <span className="rounded-full border border-border bg-elevated px-3 py-1.5 font-mono text-xs text-muted">
            {t("toolCount", { count: tools.length })}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                to={`/tools/${tool.id}`}
                className="group flex min-h-44 flex-col rounded-2xl border border-border bg-elevated p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex size-10 items-center justify-center rounded-xl ${toneClasses[tool.tone]}`}>
                    <Icon size={19} strokeWidth={1.7} />
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
                <div className="mt-auto pt-6">
                  <p className="mb-1.5 font-mono text-[11px] text-muted">{t(`category.${tool.category}`)}</p>
                  <h3 className="font-mono text-sm font-semibold">{t(`tools.${tool.key}.name`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`tools.${tool.key}.description`)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="flex items-start gap-4 rounded-2xl border border-border bg-elevated p-5 sm:p-6">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <h2 className="font-mono text-sm font-semibold">{t("local")}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{t("localDescription")}</p>
        </div>
      </section>
    </div>
  );
}
