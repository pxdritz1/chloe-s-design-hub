import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toneClasses, tools } from "../config/tools";

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-14">
      <section className="rise max-w-3xl">
        <h1 className="bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text pb-1 text-5xl font-semibold tracking-[-0.04em] text-balance text-transparent sm:text-7xl">
          {t("greeting")}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">{t("intro")}</p>
      </section>
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("allTools")}</h2>
            <p className="mt-1 text-sm text-muted">{t("pickTool")}</p>
          </div>
          <span className="rounded-full border border-border bg-elevated px-3.5 py-1.5 text-xs font-medium text-muted">
            {t("toolCount", { count: tools.length })}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                to={`/tools/${tool.id}`}
                style={{ animationDelay: `${index * 40}ms` }}
                className="rise group flex min-h-48 flex-col rounded-3xl border border-border bg-elevated p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex size-12 items-center justify-center rounded-2xl ${toneClasses[tool.tone]}`}>
                    <Icon size={22} strokeWidth={1.7} />
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-surface text-muted transition-colors group-hover:bg-sage-soft group-hover:text-foreground">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <div className="mt-auto pt-7">
                  <p className="mb-2 inline-block rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted">
                    {t(`category.${tool.category}`)}
                  </p>
                  <h3 className="text-[17px] font-semibold tracking-tight">{t(`tools.${tool.key}.name`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`tools.${tool.key}.description`)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="panel flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-accent">
          <ShieldCheck size={21} />
        </span>
        <div>
          <h2 className="text-base font-semibold">{t("local")}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{t("localDescription")}</p>
        </div>
      </section>
    </div>
  );
}
