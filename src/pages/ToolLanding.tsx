import { ArrowLeft, Hourglass } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toneClasses, tools } from "../config/tools";

export default function ToolLanding() {
  const { toolId } = useParams();
  const { t } = useTranslation();
  const tool = tools.find((item) => item.id === toolId);

  if (!tool) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-mono text-2xl font-semibold">404</h1>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 font-mono text-sm underline underline-offset-4">
          <ArrowLeft size={15} />
          {t("back")}
        </Link>
      </div>
    );
  }

  const Icon = tool.icon;

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Link to="/dashboard" className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} />
        {t("back")}
      </Link>
      <div className="mt-8 rounded-3xl border border-border bg-elevated p-8 sm:p-10">
        <span className={`flex size-12 items-center justify-center rounded-2xl ${toneClasses[tool.tone]}`}>
          <Icon size={24} strokeWidth={1.7} />
        </span>
        <p className="mt-7 font-mono text-xs text-muted">{t(`category.${tool.category}`)}</p>
        <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight">{t(`tools.${tool.key}.name`)}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t(`tools.${tool.key}.description`)}</p>
        <div className="mt-8 flex gap-3 rounded-2xl border border-border bg-surface p-4">
          <Hourglass size={18} className="mt-0.5 shrink-0 text-muted" />
          <div>
            <p className="font-mono text-sm font-medium">{t("coming")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("comingDescription")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
